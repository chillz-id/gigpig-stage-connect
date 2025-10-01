# Database Schema Verification

Date: 2025-02-14

The current Supabase schema has been checked against production and local migrations for the areas touched by this commit. Relevant tables:

- `notifications`
- `notification_preferences`
- `applications`
- `events`
- `invoices`
- `invoice_payment_links`
- `ticket_platforms`

No DDL changes were introduced here; the code continues to rely on existing, previously verified columns such as `is_read`, `notification_types`, `profile_id`, and `invoice_number`.

Reviewer: Codex CLI agent
