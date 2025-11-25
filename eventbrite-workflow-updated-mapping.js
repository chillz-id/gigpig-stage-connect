// Updated mapOrderRecord function with event column mapping
// Replace this function in the N8N workflow

const mapOrderRecord = (order, ingestedAt) => {
  if (!order?.id) return null;

  const costs = order.costs ?? {};
  const gross = parseCents(costs.gross?.value);
  const fees = centsOrZero(costs.eventbrite_fee?.value) + centsOrZero(costs.payment_fee?.value);
  const taxes = centsOrZero(costs.tax?.value);
  const net = gross === null ? null : Math.max(gross - fees - taxes, 0);
  const base = parseCents(costs.base_price?.value);
  const discount = parseCents(costs.discount?.value);
  const currency = costs.gross?.currency ?? costs.base_price?.currency ?? null;

  const fallbackPurchaserName = [order.first_name, order.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();
  const purchaserNameRaw = order.name ?? (fallbackPurchaserName.length ? fallbackPurchaserName : null);
  const purchaserName = purchaserNameRaw && purchaserNameRaw.length ? purchaserNameRaw : null;
  const eventId = order.event_id ?? order.event?.id ?? null;

  // Extract event data
  const event = order.event ?? {};
  const venue = event.venue ?? {};
  const venueAddress = venue.address ?? {};
  const category = event.category ?? {};
  const format = event.format ?? {};

  return {
    source: 'eventbrite',
    source_id: order.id,
    event_source_id: eventId,
    session_source_id: eventId,
    status: order.status ?? null,
    financial_status: order.payment_status ?? order.status ?? null,
    total_cents: gross,
    subtotal_cents: base,
    net_sales_cents: net,
    gross_sales_cents: gross,
    discounts_cents: discount,
    taxes_cents: taxes,
    fees_cents: fees || null,
    purchaser_email: order.email ?? order.profile?.email ?? null,
    purchaser_name: purchaserName,
    ordered_at: toIso(order.created),
    updated_at: toIso(order.changed),
    currency,
    additional_fields: Array.isArray(order.attendees) && order.attendees.length ? order.attendees : null,

    // NEW: Event columns
    event_name: event.name?.text ?? null,
    event_description: event.description?.text ?? null,
    event_status: event.status ?? null,
    event_start_date: toIso(event.start?.local),
    event_end_date: toIso(event.end?.local),
    event_timezone: event.start?.timezone ?? null,
    event_capacity: event.capacity ?? null,
    capacity_is_custom: event.capacity_is_custom ?? null,
    venue_name: venue.name ?? null,
    venue_city: venueAddress.city ?? null,
    venue_region: venueAddress.region ?? null,
    venue_country: venueAddress.country ?? null,
    online_event: event.online_event ?? null,
    category_name: category.name ?? null,
    format_name: format.name ?? null,
    is_free: event.is_free ?? null,
    event_published_at: toIso(event.published),
    listed: event.listed ?? null,
    invite_only: event.invite_only ?? null,
    shareable: event.shareable ?? null,
    event_created_at: toIso(event.created),
    event_changed_at: toIso(event.changed),

    // Keep raw data
    raw: order,
    ingested_at: ingestedAt,
    updated_at_api: toIso(order.changed),
  };
};
