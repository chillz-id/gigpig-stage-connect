async function run() {
  const readEnv = async (key) => {
    if (typeof $env !== 'undefined' && $env && Object.prototype.hasOwnProperty.call($env, key)) {
      const value = $env[key];
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        return String(value).trim();
      }
    }
    if (typeof process !== 'undefined' && process.env && Object.prototype.hasOwnProperty.call(process.env, key)) {
      const value = process.env[key];
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        return String(value).trim();
      }
    }
    return '';
  };

  const FALLBACK_EVENTBRITE_TOKEN = 'KPGTS46ZFV2ECF7QUZKE';
  const FALLBACK_EVENTBRITE_ORG_ID = '276710097137';
  const FALLBACK_SUPABASE_URL = 'https://pdikjpfulhhpqpxzpgtu.supabase.co';
  const FALLBACK_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI2Njg2MSwiZXhwIjoyMDY1ODQyODYxfQ.RS6RG0nbmxEqtO99dnpGnd7WV7C_uI0l_XJugKqOzPE';

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const requestWithRetry = async (options, attempt = 0) => {
    try {
      return await this.helpers.httpRequest({ ...options, json: true });
    } catch (error) {
      const status = Number(error.statusCode ?? error.response?.status ?? error.response?.statusCode ?? error.code ?? 0);
      const isRetryable = [408, 429, 500, 502, 503, 504].includes(status);
      if (attempt < 4 && isRetryable) {
        const delay = Math.min(2000 * (attempt + 1), 10000);
        await sleep(delay);
        return requestWithRetry(options, attempt + 1);
      }
      throw error;
    }
  };

  const loadEventbriteToken = async () => {
    const envKeys = ['EVENTBRITE_PRIVATE_TOKEN', 'EVENTBRITE_OAUTH_TOKEN', 'EVENTBRITE_API_KEY', 'EVENTBRITE_TOKEN'];
    for (const envKey of envKeys) {
      const value = await readEnv(envKey);
      if (value) {
        return value;
      }
    }

    const credentialCandidates = ['eventbriteApi', 'eventbriteOAuth2Api', 'eventbriteOAuth2', 'httpHeaderAuth'];
    for (const name of credentialCandidates) {
      try {
        const creds = await this.getCredentials(name);
        if (!creds) continue;
        const candidate = creds.accessToken ?? creds.apiKey ?? creds.token ?? creds.headerValue ?? creds.key ?? null;
        if (candidate && String(candidate).trim() !== '') {
          return String(candidate).trim();
        }
      } catch (error) {
        const message = error?.message ?? '';
        if (!/not set/i.test(message) && !/does not exist/i.test(message)) {
          console.warn('Eventbrite credential ' + name + ' lookup failed:', message || error);
        }
      }
    }

    if (FALLBACK_EVENTBRITE_TOKEN) {
      const fallback = String(FALLBACK_EVENTBRITE_TOKEN).trim();
      if (fallback) {
        console.warn('Using fallback Eventbrite token from workflow.');
        return fallback;
      }
    }

    throw new Error('Missing Eventbrite credentials (set EVENTBRITE_API_KEY or attach an Eventbrite credential in n8n).');
  };

    const loadSupabaseConfig = async () => {
    let url = await readEnv('SUPABASE_URL');
    if (!url) {
      url = await readEnv('SUPABASE_REST_URL');
    }
    let key = await readEnv('SUPABASE_SERVICE_ROLE_KEY');
    if (!key) {
      key = await readEnv('SUPABASE_SERVICE_KEY');
    }

    if (!url || !key) {
      const credentialCandidates = ['supabaseApi', 'supabaseDatabase', 'supabaseServiceRole', 'httpHeaderAuth'];
      for (const name of credentialCandidates) {
        try {
          const creds = await this.getCredentials(name);
          if (!creds) continue;
          if (!url) {
            const candidateUrl = creds.url ?? creds.host ?? creds.restUrl ?? creds.restApiUrl ?? creds.endpoint ?? creds.baseUrl ?? '';
            if (candidateUrl && String(candidateUrl).trim() !== '') {
              url = String(candidateUrl).trim();
            }
          }
          if (!key) {
            const candidateKey = creds.serviceRoleKey ?? creds.apiKey ?? creds.serviceRoleSecret ?? creds.token ?? creds.key ?? creds.headerValue ?? '';
            if (candidateKey && String(candidateKey).trim() !== '') {
              key = String(candidateKey).trim();
            }
          }
          if (url && key) {
            break;
          }
        } catch (error) {
          const message = error?.message ?? '';
          if (!/not set/i.test(message) && !/does not exist/i.test(message)) {
            console.warn('Supabase credential ' + name + ' lookup failed:', message || error);
          }
        }
      }
    }

    if (!url && FALLBACK_SUPABASE_URL) {
      url = FALLBACK_SUPABASE_URL;
      console.warn('Using fallback Supabase URL from workflow.');
    }
    if (!key && FALLBACK_SUPABASE_KEY) {
      key = FALLBACK_SUPABASE_KEY;
      console.warn('Using fallback Supabase key from workflow.');
    }

    if (!url || !key) {
      throw new Error('Missing Supabase credentials (set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in n8n or attach a Supabase credential).');
    }

    return {
      url: String(url).trim().replace(/\/$/, ''),
      key: String(key).trim(),
    };
  };

  const parseCents = (value) => {
    if (value === undefined || value === null || value === '') return null;
    const num = Number(value);
    if (Number.isNaN(num)) {
      const parsed = Number.parseFloat(String(value));
      if (Number.isNaN(parsed)) return null;
      return Math.round(parsed);
    }
    return Math.round(num);
  };

  const centsOrZero = (value) => {
    const result = parseCents(value);
    return result === null ? 0 : result;
  };

  const toIso = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
  };

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

      // Event columns (NEW)
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

      raw: order,
      ingested_at: ingestedAt,
      updated_at_api: toIso(order.changed),
    };
  };

  const normalizeStatus = (attendee) => {
    if (!attendee) return null;
    if (attendee.checked_in === true) return 'checked_in';
    if (attendee.cancelled) return 'cancelled';
    if (attendee.refunded) return 'refunded';
    return attendee.status ?? null;
  };

  const mapAttendeeRecord = (attendee, ingestedAt) => {
    if (!attendee?.id) return null;
    const costs = attendee.costs ?? {};
    const gross = parseCents(costs.gross?.value);
    const base = parseCents(costs.base_price?.value);
    const taxes = parseCents(costs.tax?.value);
    const fees = centsOrZero(costs.eventbrite_fee?.value) + centsOrZero(costs.payment_fee?.value);
    const discount = parseCents(costs.discount?.value);
    const passed = parseCents(costs.passed_on_fee?.value);
    const absorbed = parseCents(costs.absorbed_fee?.value);
    const donation = parseCents(costs.donation?.value ?? costs.dgr_donation?.value);
    const currency = costs.gross?.currency ?? costs.base_price?.currency ?? null;
    const profile = attendee.profile ?? {};
    const eventId = attendee.event_id ?? attendee.event?.id ?? null;
    const profileNameParts = typeof profile.name === 'string' ? profile.name.trim().split(/\s+/) : [];
    const fallbackFirstName = profileNameParts.length ? profileNameParts[0] : null;
    const fallbackLastNamePart = profileNameParts.length > 1 ? profileNameParts.slice(1).join(' ').trim() : null;

    return {
      source: 'eventbrite',
      source_id: attendee.id,
      order_source_id: attendee.order_id ?? null,
      event_source_id: eventId,
      session_source_id: eventId,
      ticket_type_id: attendee.ticket_class_id ?? null,
      ticket_type_name: attendee.ticket_class_name ?? null,
      status: normalizeStatus(attendee),
      total_cents: gross,
      net_price_cents: base,
      price_cents: base,
      discount_cents: discount,
      taxes_cents: taxes,
      fee_cents: fees || null,
      passed_on_fee_cents: passed,
      absorbed_fee_cents: absorbed,
      dgr_donation_cents: donation,
      currency,
      first_name: profile.first_name ?? (fallbackFirstName ?? null),
      last_name: profile.last_name ?? (fallbackLastNamePart ?? null),
      email: profile.email ?? attendee.email ?? null,
      created_at: toIso(attendee.created),
      updated_at: toIso(attendee.changed),
      raw: attendee,
      ingested_at: ingestedAt,
      updated_at_api: toIso(attendee.changed),
    };
  };

  const upsertSupabaseRows = async (supabase, table, rows) => {
    const payload = rows.filter(Boolean);
    if (!payload.length) return;
    await requestWithRetry({
      method: 'POST',
      url: `${supabase.url}/rest/v1/${table}?on_conflict=source_id`,
      headers: {
        apikey: supabase.key,
        Authorization: `Bearer ${supabase.key}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: payload,
    });
  };

  const fetchOrder = async (token, url, fallbackOrderId) => {
    let endpoint = url ?? '';
    if (!endpoint && fallbackOrderId) {
      endpoint = `https://www.eventbriteapi.com/v3/orders/${fallbackOrderId}/`;
    }
    if (!endpoint) {
      throw new Error('Unable to resolve Eventbrite order API URL.');
    }
    return requestWithRetry({
      method: 'GET',
      url: endpoint,
      qs: { expand: 'attendees,attendees.profile,attendees.costs,attendees.promotional_code,event,event.ticket_classes,event.venue,event.category,event.subcategory,event.format,event.organizer' },
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  };

  const fetchAttendee = async (token, url, attendeeId, eventId) => {
    let endpoint = url ?? '';
    if (!endpoint && attendeeId && eventId) {
      endpoint = `https://www.eventbriteapi.com/v3/events/${eventId}/attendees/${attendeeId}/`;
    }
    if (!endpoint) {
      throw new Error('Unable to resolve Eventbrite attendee API URL.');
    }
    return requestWithRetry({
      method: 'GET',
      url: endpoint,
      qs: { expand: 'profile,costs,promotional_code,event,event.ticket_classes,event.venue' },
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  };

  const fetchEvent = async (token, url, fallbackEventId) => {
    let endpoint = url ?? '';
    if (!endpoint && fallbackEventId) {
      endpoint = `https://www.eventbriteapi.com/v3/events/${fallbackEventId}/`;
    }
    if (!endpoint) {
      throw new Error('Unable to resolve Eventbrite event API URL.');
    }
    return requestWithRetry({
      method: 'GET',
      url: endpoint,
      qs: { expand: 'ticket_classes,venue,category,subcategory,format,organizer,series' },
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  };

  const fetchEventOrders = async (token, eventId) => {
    if (!eventId) return [];
    try {
      const response = await requestWithRetry({
        method: 'GET',
        url: `https://www.eventbriteapi.com/v3/events/${eventId}/orders/`,
        qs: { expand: 'attendees,attendees.profile,attendees.costs,event,event.ticket_classes,event.venue,event.category,event.format' },
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.orders ?? [];
    } catch (error) {
      console.warn(`Failed to fetch orders for event ${eventId}:`, error.message);
      return [];
    }
  };

  // ========================================
  // EVENT HANDLERS
  // ========================================

  const handleOrderEvent = async (token, supabase, payload, ingestedAt) => {
    const order = await fetchOrder(token, payload.api_url, payload.resource?.order_id ?? payload.order_id ?? payload.id ?? null);
    const orderRecord = mapOrderRecord(order, ingestedAt);
    const attendeeRecords = Array.isArray(order.attendees)
      ? order.attendees.map((att) => mapAttendeeRecord(att, ingestedAt)).filter(Boolean)
      : [];

    await upsertSupabaseRows(supabase, 'orders_eventbrite', orderRecord ? [orderRecord] : []);
    if (attendeeRecords.length) {
      await upsertSupabaseRows(supabase, 'tickets_eventbrite', attendeeRecords);
    }

    return {
      processedOrders: orderRecord ? 1 : 0,
      processedTickets: attendeeRecords.length,
      eventName: order.event?.name?.text ?? null,
      eventStart: order.event?.start?.utc ?? null,
      venueName: order.event?.venue?.name ?? null,
      eventCategory: order.event?.category?.name ?? null,
      eventFormat: order.event?.format?.name ?? null,
      ticketClassCount: Array.isArray(order.event?.ticket_classes) ? order.event.ticket_classes.length : 0,
      rawEventData: order.event,
    };
  };

  const handleAttendeeEvent = async (token, supabase, payload, ingestedAt) => {
    const attendee = await fetchAttendee(
      token,
      payload.api_url,
      payload.resource?.attendee_id ?? payload.attendee_id ?? payload.id ?? null,
      payload.resource?.event_id ?? payload.event_id ?? payload.config?.event_id ?? null,
    );

    const attendeeRecord = mapAttendeeRecord(attendee, ingestedAt);
    if (attendeeRecord) {
      await upsertSupabaseRows(supabase, 'tickets_eventbrite', [attendeeRecord]);
    }

    const result = {
      processedOrders: 0,
      processedTickets: attendeeRecord ? 1 : 0,
    };

    // Also refresh the parent order
    if (attendee.order_id) {
      try {
        const order = await fetchOrder(token, null, attendee.order_id);
        const orderRecord = mapOrderRecord(order, ingestedAt);
        const ticketRecords = Array.isArray(order.attendees)
          ? order.attendees.map((att) => mapAttendeeRecord(att, ingestedAt)).filter(Boolean)
          : [];

        await upsertSupabaseRows(supabase, 'orders_eventbrite', orderRecord ? [orderRecord] : []);
        if (ticketRecords.length) {
          await upsertSupabaseRows(supabase, 'tickets_eventbrite', ticketRecords);
        }

        result.processedOrders = orderRecord ? 1 : 0;
        result.processedTickets += ticketRecords.length;
        result.eventName = order.event?.name?.text ?? null;
        result.eventStart = order.event?.start?.utc ?? null;
        result.venueName = order.event?.venue?.name ?? null;
        result.rawEventData = order.event;
      } catch (error) {
        result.orderRefreshError = error.message ?? String(error);
      }
    }

    return result;
  };

  const handleEventUpdate = async (token, supabase, payload, ingestedAt) => {
    const eventId = payload.resource?.event_id ?? payload.event_id ?? payload.id ?? null;
    const event = await fetchEvent(token, payload.api_url, eventId);

    // Fetch all orders for this event and update them with latest event data
    const orders = await fetchEventOrders(token, event.id);

    const orderRecords = orders.map((order) => mapOrderRecord(order, ingestedAt)).filter(Boolean);
    const ticketRecords = orders
      .flatMap((order) => Array.isArray(order.attendees) ? order.attendees : [])
      .map((att) => mapAttendeeRecord(att, ingestedAt))
      .filter(Boolean);

    if (orderRecords.length) {
      await upsertSupabaseRows(supabase, 'orders_eventbrite', orderRecords);
    }
    if (ticketRecords.length) {
      await upsertSupabaseRows(supabase, 'tickets_eventbrite', ticketRecords);
    }

    return {
      processedOrders: orderRecords.length,
      processedTickets: ticketRecords.length,
      eventId: event.id,
      eventName: event.name?.text ?? null,
      eventStatus: event.status ?? null,
      venueName: event.venue?.name ?? null,
      ticketClassCount: Array.isArray(event.ticket_classes) ? event.ticket_classes.length : 0,
      rawEventData: event,
    };
  };

  const handleTicketClassUpdate = async (token, supabase, payload, ingestedAt) => {
    // Extract event ID from API URL (format: /v3/events/{event_id}/ticket_classes/{tc_id}/)
    const apiUrl = payload.api_url ?? '';
    const eventIdMatch = apiUrl.match(/events\/(\d+)\//)?.[1];
    const eventId = eventIdMatch ?? payload.resource?.event_id ?? payload.event_id ?? null;

    if (!eventId) {
      return {
        processedOrders: 0,
        processedTickets: 0,
        skipped: true,
        reason: 'no_event_id',
      };
    }

    // Fetch complete event with ticket classes
    const event = await fetchEvent(token, null, eventId);

    // Fetch all orders for this event to update with latest ticket class data
    const orders = await fetchEventOrders(token, eventId);

    const orderRecords = orders.map((order) => mapOrderRecord(order, ingestedAt)).filter(Boolean);
    const ticketRecords = orders
      .flatMap((order) => Array.isArray(order.attendees) ? order.attendees : [])
      .map((att) => mapAttendeeRecord(att, ingestedAt))
      .filter(Boolean);

    if (orderRecords.length) {
      await upsertSupabaseRows(supabase, 'orders_eventbrite', orderRecords);
    }
    if (ticketRecords.length) {
      await upsertSupabaseRows(supabase, 'tickets_eventbrite', ticketRecords);
    }

    return {
      processedOrders: orderRecords.length,
      processedTickets: ticketRecords.length,
      eventId,
      eventName: event.name?.text ?? null,
      ticketClassCount: Array.isArray(event.ticket_classes) ? event.ticket_classes.length : 0,
      rawEventData: event,
      rawTicketClasses: event.ticket_classes,
    };
  };

  const handleVenueUpdate = async (token, supabase, payload, ingestedAt) => {
    try {
      const venue = await requestWithRetry({
        method: 'GET',
        url: payload.api_url,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return {
        processedOrders: 0,
        processedTickets: 0,
        venueId: venue.id ?? null,
        venueName: venue.name ?? null,
        rawVenueData: venue,
        note: 'Venue data captured - associated orders will update on next event/order webhook',
      };
    } catch (error) {
      return {
        processedOrders: 0,
        processedTickets: 0,
        error: error.message ?? String(error),
      };
    }
  };

  const handleOrganizerUpdate = async (token, supabase, payload, ingestedAt) => {
    try {
      const organizer = await requestWithRetry({
        method: 'GET',
        url: payload.api_url,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return {
        processedOrders: 0,
        processedTickets: 0,
        organizerId: organizer.id ?? null,
        organizerName: organizer.name ?? null,
        rawOrganizerData: organizer,
        note: 'Organizer data captured - associated orders will update on next event/order webhook',
      };
    } catch (error) {
      return {
        processedOrders: 0,
        processedTickets: 0,
        error: error.message ?? String(error),
      };
    }
  };

  // ========================================
  // MAIN EXECUTION
  // ========================================

  const payload = $json.body ?? $json;
  if (!payload) {
    throw new Error('Webhook payload is empty.');
  }

  const action = String(payload.config?.action ?? payload.action ?? '').toLowerCase();
  const ingestedAt = new Date().toISOString();

  const summary = {
    action,
    apiUrl: payload.api_url ?? null,
    webhookTimestamp: new Date().toISOString(),
    completeVersion: true,
    expandedFields: 'ALL (order, event, attendee, ticket_class, venue, organizer)',
  };

  const eventbriteToken = await loadEventbriteToken();
  const supabase = await loadSupabaseConfig();

  // Route to appropriate handler based on event type
  const eventType = action.split('.')[0];
  let handlerResult = {};

  try {
    switch (eventType) {
      case 'order':
        handlerResult = await handleOrderEvent(eventbriteToken, supabase, payload, ingestedAt);
        break;

      case 'attendee':
      case 'barcode':
        handlerResult = await handleAttendeeEvent(eventbriteToken, supabase, payload, ingestedAt);
        break;

      case 'event':
        handlerResult = await handleEventUpdate(eventbriteToken, supabase, payload, ingestedAt);
        break;

      case 'ticket_class':
        handlerResult = await handleTicketClassUpdate(eventbriteToken, supabase, payload, ingestedAt);
        break;

      case 'venue':
        handlerResult = await handleVenueUpdate(eventbriteToken, supabase, payload, ingestedAt);
        break;

      case 'organizer':
        handlerResult = await handleOrganizerUpdate(eventbriteToken, supabase, payload, ingestedAt);
        break;

      default:
        handlerResult = {
          processedOrders: 0,
          processedTickets: 0,
          skipped: true,
          reason: `unknown_event_type: ${eventType}`,
        };
    }
  } catch (error) {
    handlerResult = {
      processedOrders: 0,
      processedTickets: 0,
      error: error.message ?? String(error),
      stack: error.stack,
    };
  }

  return [{ json: { ...summary, ...handlerResult } }];
}

return run.call(this);
