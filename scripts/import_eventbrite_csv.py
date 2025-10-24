#!/usr/bin/env python3
"""
Import Eventbrite CSV exports (Orders, Attendees, Sales) into Supabase.

The script performs a one-time backfill that mirrors the structure produced by
the n8n Eventbrite → Supabase workflow. It upserts rows into:
  - events_htx
  - sessions_htx
  - session_sources
  - orders_eventbrite
  - tickets_eventbrite
and refreshes the sync_state entry used by the workflow for incremental runs.

Usage:
  python agents/scripts/import_eventbrite_csv.py \
      --orders "/path/EVENTBRITE - ORDERS.csv" \
      --attendees "/path/EVENTBRITE - ATTENDEES.csv" \
      --sales "/path/EVENTBRITE - SALES.csv" \
      --supabase-url https://your-project.supabase.co \
      --supabase-key YOUR_SERVICE_ROLE_KEY

Environment variables SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are read if
the CLI flags are omitted. Pass --dry-run to validate parsing without writing.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import sys
import time
import urllib.error
import urllib.request
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple

try:
  from zoneinfo import ZoneInfo  # Python 3.9+
except ImportError:  # pragma: no cover
  ZoneInfo = None  # type: ignore

DEFAULT_CHUNK_SIZE = 200
SYNC_STATE_KEY = "eventbrite:lastSync"


def parse_args() -> argparse.Namespace:
  parser = argparse.ArgumentParser(description="Import Eventbrite CSV exports into Supabase.")
  parser.add_argument("--orders", type=Path, default=Path("/root/EVENTBRITE - ORDERS.csv"),
                      help="Path to the Eventbrite Orders export CSV.")
  parser.add_argument("--attendees", type=Path, default=Path("/root/EVENTBRITE - ATTENDEES.csv"),
                      help="Path to the Eventbrite Attendees export CSV.")
  parser.add_argument("--sales", type=Path, default=Path("/root/EVENTBRITE - SALES.csv"),
                      help="Path to the Eventbrite Sales summary CSV (optional).")
  parser.add_argument("--supabase-url", dest="supabase_url",
                      default=os.getenv("SUPABASE_URL") or os.getenv("SUPABASE_PROJECT_URL"),
                      help="Supabase project URL (env SUPABASE_URL fallback).")
  parser.add_argument("--supabase-key", dest="supabase_key",
                      default=os.getenv("SUPABASE_SERVICE_ROLE_KEY"),
                      help="Supabase service role key (env SUPABASE_SERVICE_ROLE_KEY fallback).")
  parser.add_argument("--chunk-size", type=int, default=DEFAULT_CHUNK_SIZE,
                      help="Rows per Supabase upsert batch (default: 200).")
  parser.add_argument("--dry-run", action="store_true", help="Parse and summarise without writing.")
  return parser.parse_args()


def decimal_to_cents(value: Optional[str]) -> int:
  if value is None:
    return 0
  cleaned = value.replace(",", "").strip()
  if not cleaned:
    return 0
  try:
    dec_value = Decimal(cleaned)
  except InvalidOperation:
    return 0
  cents = (dec_value * Decimal("100")).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
  return int(cents)


def safe_int(value: Optional[str]) -> Optional[int]:
  if value is None:
    return None
  stripped = value.strip()
  if not stripped:
    return None
  try:
    return int(stripped)
  except ValueError:
    return None


def normalize_str(value: Optional[str]) -> Optional[str]:
  if value is None:
    return None
  stripped = value.strip()
  return stripped or None


def parse_datetime(
    date_str: Optional[str],
    time_str: Optional[str],
    timezone_name: Optional[str],
) -> Tuple[Optional[str], Optional[str]]:
  if not date_str:
    return None, None
  time_component = time_str or "00:00:00"
  try:
    naive = datetime.strptime(f"{date_str} {time_component}", "%Y-%m-%d %H:%M:%S")
  except ValueError:
    return None, None

  if timezone_name and ZoneInfo is not None:
    tz_name = timezone_name.strip()
    if tz_name:
      try:
        tz = ZoneInfo(tz_name)
        local_dt = naive.replace(tzinfo=tz)
        utc_dt = local_dt.astimezone(timezone.utc)
        return (
            utc_dt.isoformat().replace("+00:00", "Z"),
            local_dt.isoformat(),
        )
      except Exception:
        pass

  # Fall back to treating the timestamp as UTC.
  utc_dt = naive.replace(tzinfo=timezone.utc)
  iso_value = utc_dt.isoformat().replace("+00:00", "Z")
  return iso_value, iso_value


def chunked(items: Iterable[dict], size: int) -> Iterable[List[dict]]:
  batch: List[dict] = []
  for item in items:
    batch.append(item)
    if len(batch) >= size:
      yield batch
      batch = []
  if batch:
    yield batch


def supabase_upsert(
    table: str,
    rows: List[dict],
    *,
    supabase_url: str,
    supabase_key: str,
    on_conflict: str,
    chunk_size: int,
    dry_run: bool = False,
) -> None:
  if not rows:
    return

  url = f"{supabase_url}/rest/v1/{table}?on_conflict={on_conflict}"
  headers = {
      "apikey": supabase_key,
      "Authorization": f"Bearer {supabase_key}",
      "Content-Type": "application/json",
      "Prefer": "resolution=merge-duplicates,return=minimal",
  }

  if dry_run:
    print(f"[dry-run] Would upsert {len(rows)} rows into {table}")
    return

  total = len(rows)
  sent = 0
  for batch in chunked(rows, chunk_size):
    req = urllib.request.Request(
        url,
        data=json.dumps(batch).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    try:
      with urllib.request.urlopen(req, timeout=60) as response:
        # Consume body to avoid ResourceWarning.
        response.read()
    except urllib.error.HTTPError as error:
      raise RuntimeError(
          f"Supabase upsert failed for {table}: {error.code} {error.reason} "
          f"{error.read().decode('utf-8', errors='ignore')}"
      ) from error
    sent += len(batch)
    time.sleep(0.1)
  print(f"Upserted {sent}/{total} rows into {table}")


def load_csv(path: Path) -> List[Dict[str, str]]:
  if not path.exists():
    raise FileNotFoundError(f"CSV not found: {path}")
  with path.open("r", encoding="utf-8-sig", newline="") as handle:
    reader = csv.DictReader(handle)
    rows = [dict(row) for row in reader]
  return rows


def build_event_records(order_rows: List[Dict[str, str]], now_iso: str) -> Tuple[List[dict], List[dict], List[dict]]:
  events: Dict[str, dict] = {}
  sessions: Dict[str, dict] = {}
  session_sources: Dict[str, dict] = {}

  for row in order_rows:
    event_id = normalize_str(row.get("Event ID"))
    if not event_id:
      continue

    event_name = normalize_str(row.get("Event name")) or ""
    start_date_utc, start_date_local = parse_datetime(
        normalize_str(row.get("Event start date")),
        normalize_str(row.get("Event start time")),
        normalize_str(row.get("Event timezone")),
    )
    venue_name = normalize_str(row.get("Event location"))
    timezone_name = normalize_str(row.get("Event timezone"))

    if event_id not in events:
      events[event_id] = {
          "source": "eventbrite",
          "source_id": event_id,
          "name": event_name,
          "description": None,
          "slug": None,
          "url": None,
          "start_date": start_date_utc,
          "end_date": None,
          "timezone": timezone_name,
          "status": None,
          "total_capacity": safe_int(row.get("Ticket quantity")),
          "public": None,
          "published": None,
          "venue_name": venue_name,
          "venue_address": None,
          "venue_city": None,
          "venue_country": normalize_str(row.get("Purchaser country")),
          "currency": normalize_str(row.get("Currency")),
          "created_at": start_date_utc,
          "updated_at": start_date_utc,
          "ingested_at": now_iso,
          "updated_at_api": start_date_utc,
          "raw": row,
      }

    if event_id not in sessions:
      sessions[event_id] = {
          "source": "eventbrite",
          "source_id": event_id,
          "event_source_id": event_id,
          "name": event_name,
          "start_date": start_date_utc,
          "end_date": None,
          "start_date_local": start_date_local,
          "end_date_local": start_date_local,
          "timezone": timezone_name,
          "venue_name": venue_name,
          "created_at": start_date_utc,
          "updated_at": start_date_utc,
          "ingested_at": now_iso,
          "updated_at_api": start_date_utc,
          "raw": row,
      }

    if event_id not in session_sources:
      session_sources[event_id] = {
          "canonical_source": "eventbrite",
          "canonical_session_source_id": event_id,
          "source": "eventbrite",
          "source_session_id": event_id,
          "source_event_id": event_id,
      }

  return list(events.values()), list(sessions.values()), list(session_sources.values())


def build_order_records(
    order_rows: List[Dict[str, str]],
    now_iso: str,
) -> Tuple[List[dict], Dict[str, dict], Optional[datetime]]:
  orders: List[dict] = []
  order_lookup: Dict[str, dict] = {}
  latest_order_dt: Optional[datetime] = None

  for row in order_rows:
    order_id = normalize_str(row.get("Order ID"))
    event_id = normalize_str(row.get("Event ID"))
    if not order_id or not event_id:
      continue

    status = normalize_str(row.get("Payment status"))
    payment_type = normalize_str(row.get("Payment type"))
    currency = normalize_str(row.get("Currency"))
    order_date_str = normalize_str(row.get("Order date"))
    event_tz = normalize_str(row.get("Event timezone"))
    order_dt_utc, _ = parse_datetime(order_date_str.split(" ")[0] if order_date_str else None,
                                     order_date_str.split(" ")[1] if order_date_str and " " in order_date_str else None,
                                     event_tz)
    if order_dt_utc:
      dt_obj = datetime.fromisoformat(order_dt_utc.replace("Z", "+00:00"))
      if latest_order_dt is None or dt_obj > latest_order_dt:
        latest_order_dt = dt_obj

    gross_cents = decimal_to_cents(row.get("Gross sales"))
    net_cents = decimal_to_cents(row.get("Net sales"))
    subtotal_cents = decimal_to_cents(row.get("Ticket + add-ons revenue") or row.get("Ticket revenue"))
    service_fee_cents = decimal_to_cents(row.get("Eventbrite service fee"))
    processing_fee_cents = decimal_to_cents(row.get("Eventbrite payment processing fee"))
    royalty_cents = decimal_to_cents(row.get("Royalty"))
    taxes_cents = decimal_to_cents(row.get("Eventbrite tax")) + decimal_to_cents(row.get("Organiser tax"))
    fees_cents = service_fee_cents + processing_fee_cents + royalty_cents

    purchaser_name = " ".join(
        part for part in [
            normalize_str(row.get("Buyer first name")),
            normalize_str(row.get("Buyer last name")),
        ] if part
    ) or None

    order_payload = {
        "source": "eventbrite",
        "source_id": order_id,
        "event_source_id": event_id,
        "session_source_id": event_id,
        "status": status,
        "financial_status": payment_type,
        "total_cents": gross_cents,
        "subtotal_cents": subtotal_cents,
        "net_sales_cents": net_cents,
        "gross_sales_cents": gross_cents,
        "discounts_cents": max(0, gross_cents - subtotal_cents - taxes_cents - fees_cents),
        "taxes_cents": taxes_cents,
        "fees_cents": fees_cents,
        "purchaser_email": normalize_str(row.get("Buyer email")),
        "purchaser_name": purchaser_name,
        "ordered_at": order_dt_utc,
        "updated_at": order_dt_utc,
        "currency": currency,
        "additional_fields": None,
        "raw": row,
        "ingested_at": now_iso,
        "updated_at_api": order_dt_utc,
    }

    orders.append(order_payload)
    order_lookup[order_id] = {
        "event_id": event_id,
        "currency": currency,
        "order_dt": order_dt_utc,
    }

  return orders, order_lookup, latest_order_dt


def build_ticket_records(
    attendee_rows: List[Dict[str, str]],
    order_lookup: Dict[str, dict],
    now_iso: str,
) -> List[dict]:
  tickets: List[dict] = []

  for index, row in enumerate(attendee_rows):
    order_id = normalize_str(row.get("Order ID"))
    event_id = normalize_str(row.get("Event ID"))
    if not order_id or order_id not in order_lookup or not event_id:
      continue

    order_info = order_lookup[order_id]
    ticket_id = normalize_str(row.get("Barcode number")) or f"{order_id}-ticket-{index}"
    ticket_price_cents = decimal_to_cents(row.get("Ticket price"))
    attendee_email = normalize_str(row.get("Attendee email"))
    first_name = normalize_str(row.get("Attendee first name"))
    last_name = normalize_str(row.get("Attendee last name"))
    currency = order_info.get("currency")
    order_dt = order_info.get("order_dt")

    ticket_payload = {
        "source": "eventbrite",
        "source_id": ticket_id,
        "event_source_id": event_id,
        "session_source_id": event_id,
        "order_source_id": order_id,
        "ticket_type_id": normalize_str(row.get("Ticket tier")),
        "ticket_type_name": normalize_str(row.get("Ticket type")),
        "status": None,
        "price_cents": ticket_price_cents,
        "net_price_cents": ticket_price_cents,
        "total_cents": ticket_price_cents,
        "discount_cents": 0,
        "taxes_cents": 0,
        "fee_cents": 0,
        "passed_on_fee_cents": 0,
        "absorbed_fee_cents": 0,
        "dgr_donation_cents": 0,
        "currency": currency,
        "first_name": first_name,
        "last_name": last_name,
        "email": attendee_email,
        "created_at": order_dt,
        "updated_at": order_dt,
        "raw": row,
        "ingested_at": now_iso,
        "updated_at_api": order_dt,
    }

    tickets.append(ticket_payload)

  return tickets


def update_sync_state(
    value_iso: str,
    *,
    supabase_url: str,
    supabase_key: str,
    dry_run: bool = False,
) -> None:
  payload = [{
      "key": SYNC_STATE_KEY,
      "value": value_iso,
      "updated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
  }]
  supabase_upsert(
      "sync_state",
      payload,
      supabase_url=supabase_url,
      supabase_key=supabase_key,
      on_conflict="key",
      chunk_size=1,
      dry_run=dry_run,
  )


def main() -> None:
  args = parse_args()
  supabase_url = args.supabase_url.rstrip("/") if args.supabase_url else None
  supabase_key = args.supabase_key

  if not supabase_url or not supabase_key:
    print("Supabase URL and service role key are required (use CLI flags or environment variables).", file=sys.stderr)
    sys.exit(1)

  now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

  orders_rows = load_csv(args.orders)
  attendees_rows = load_csv(args.attendees)

  print(f"Loaded {len(orders_rows)} order rows and {len(attendees_rows)} attendee rows.")

  events, sessions, session_sources = build_event_records(orders_rows, now_iso)
  orders, order_lookup, latest_order_dt = build_order_records(orders_rows, now_iso)
  tickets = build_ticket_records(attendees_rows, order_lookup, now_iso)

  print(f"Prepared {len(events)} events, {len(sessions)} sessions, {len(session_sources)} session links, "
        f"{len(orders)} orders, {len(tickets)} tickets.")

  supabase_upsert(
      "events_htx",
      events,
      supabase_url=supabase_url,
      supabase_key=supabase_key,
      on_conflict="source,source_id",
      chunk_size=args.chunk_size,
      dry_run=args.dry_run,
  )
  supabase_upsert(
      "sessions_htx",
      sessions,
      supabase_url=supabase_url,
      supabase_key=supabase_key,
      on_conflict="source,source_id",
      chunk_size=args.chunk_size,
      dry_run=args.dry_run,
  )
  supabase_upsert(
      "session_sources",
      session_sources,
      supabase_url=supabase_url,
      supabase_key=supabase_key,
      on_conflict="source,source_session_id",
      chunk_size=args.chunk_size,
      dry_run=args.dry_run,
  )
  supabase_upsert(
      "orders_eventbrite",
      orders,
      supabase_url=supabase_url,
      supabase_key=supabase_key,
      on_conflict="source_id",
      chunk_size=args.chunk_size,
      dry_run=args.dry_run,
  )
  supabase_upsert(
      "tickets_eventbrite",
      tickets,
      supabase_url=supabase_url,
      supabase_key=supabase_key,
      on_conflict="source_id",
      chunk_size=args.chunk_size,
      dry_run=args.dry_run,
  )

  if latest_order_dt:
    last_sync_iso = latest_order_dt.isoformat().replace("+00:00", "Z")
    update_sync_state(
        last_sync_iso,
        supabase_url=supabase_url,
        supabase_key=supabase_key,
        dry_run=args.dry_run,
    )
    print(f"Updated sync_state to {last_sync_iso}")
  else:
    print("Warning: no order timestamps detected; sync_state not updated.")

  if args.dry_run:
    print("Dry run complete – no changes were written to Supabase.")


if __name__ == "__main__":
  try:
    main()
  except Exception as exc:  # pragma: no cover
    print(f"Import failed: {exc}", file=sys.stderr)
    sys.exit(1)
