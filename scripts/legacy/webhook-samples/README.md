# Webhook Sample Payloads

This directory contains sample webhook payloads for testing the ticket sync webhook handlers.

## Usage

To test with these sample payloads:

```bash
# Test Humanitix order created
node ../test-webhooks.js --platform humanitix --event order.created --file humanitix-order-created.json

# Test Humanitix order refunded
node ../test-webhooks.js --platform humanitix --event order.refunded --file humanitix-order-refunded.json

# Test Eventbrite order placed
node ../test-webhooks.js --platform eventbrite --event order.placed --file eventbrite-order-placed.json
```

## Sample Files

- **humanitix-order-created.json**: Sample payload for a new Humanitix ticket order
- **humanitix-order-refunded.json**: Sample payload for a refunded Humanitix order
- **eventbrite-order-placed.json**: Sample Eventbrite webhook notification
- **eventbrite-order-response.json**: Sample Eventbrite API response for order details

## Notes

- These are simplified examples based on typical webhook payloads
- Actual payloads may contain additional fields
- Always validate against the latest platform documentation