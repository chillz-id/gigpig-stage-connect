# CRM: Segments Page with EDM, Import, and Custom Columns

**Status**: IN PROGRESS
**Updated**: 2025-11-28

## Overview

Build a full Segments management page at `/crm/segments` with:
1. Segment management (list, create, edit, delete)
2. EDM integration (Brevo + AWS SES, extensible for future providers)
3. Import to segment (also populates All Customers)
4. Per-user custom columns (stored server-side, synced across devices)

---

## Part 1: Database Schema

### Table: `user_custom_fields`
Per-user custom columns for their CRM view.
```sql
CREATE TABLE user_custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,           -- e.g., 'loyalty_points'
  display_name TEXT NOT NULL,        -- e.g., 'Loyalty Points'
  field_type TEXT DEFAULT 'text',    -- 'text', 'number', 'date', 'boolean'
  sort_order INT DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, field_key)
);
```

### Table: `customer_custom_values`
Store values for custom fields per customer.
```sql
CREATE TABLE customer_custom_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES user_custom_fields(id) ON DELETE CASCADE,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(customer_id, field_id)
);
```

### Table: `user_column_preferences`
Server-side column display settings (replaces localStorage).
```sql
CREATE TABLE user_column_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  column_configs JSONB NOT NULL DEFAULT '[]',
  active_template_id TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);
```

### Table: `edm_providers`
User's configured EDM providers.
```sql
CREATE TABLE edm_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_type TEXT NOT NULL,       -- 'brevo', 'aws_ses', 'mailchimp', etc.
  provider_name TEXT NOT NULL,       -- User-friendly name
  config JSONB NOT NULL DEFAULT '{}', -- API keys, settings (encrypted at rest)
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: `edm_campaigns`
Track email campaigns sent to segments.
```sql
CREATE TABLE edm_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  segment_id UUID REFERENCES segments(id),
  provider_id UUID REFERENCES edm_providers(id),
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'draft',       -- 'draft', 'scheduled', 'sent', 'failed'
  recipient_count INT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Part 2: Segments Page UI

### Route: `/crm/segments`

**Page Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Segments                                    [+ New Segment] │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │ VIP            │ │ Newsletter      │ │ Merch Buyers    │ │
│ │ 1,234 customers │ │ 5,678 customers │ │ 892 customers   │ │
│ │ [Send EDM] [⋮] │ │ [Send EDM] [⋮] │ │ [Send EDM] [⋮] │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
│                                                             │
│ Each card has actions menu (⋮):                             │
│ - View Customers                                            │
│ - Import to Segment                                         │
│ - Export CSV                                                │
│ - Edit Segment                                              │
│ - Delete Segment                                            │
└─────────────────────────────────────────────────────────────┘
```

**Components:**
- `SegmentsPage.tsx` - Main page
- `SegmentCard.tsx` - Individual segment card
- `CreateSegmentDialog.tsx` - Already exists, reuse
- `SendEDMDialog.tsx` - Select provider, compose email
- `ImportToSegmentDialog.tsx` - CSV import with segment assignment

---

## Part 3: Import to Segment

**Enhanced Import Flow:**
1. Upload CSV
2. **NEW: Select target segment** (optional, can create new)
3. Map columns (including custom fields)
4. Preview & import
5. Customers added to both All Customers AND selected segment

**Column Mapping Enhancement:**
- Show locked core fields (see Core Fields section below)
- Show user's existing custom fields
- Option to "Create new field" for unmapped columns
- Auto-suggest field names based on CSV headers

---

## Part 4: EDM Integration

**Abstract Provider Interface:**
```typescript
interface EDMProvider {
  id: string;
  name: string;
  sendCampaign(recipients: Customer[], subject: string, content: string): Promise<SendResult>;
  validateConfig(config: Record<string, string>): boolean;
  getRequiredFields(): FieldDefinition[];
}
```

**Implemented Providers:**
1. **Brevo** - Use existing schema fields, implement API calls
2. **AWS SES** - Direct SES API integration

**Send EDM Dialog:**
1. Select segment (pre-selected if opened from segment card)
2. Choose EDM provider (or configure one)
3. Compose email (subject, content)
4. Preview recipients
5. Send / Schedule

---

## Part 5: Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `src/pages/crm/SegmentsPage.tsx` | Main segments page |
| `src/components/crm/segments/SegmentCard.tsx` | Segment card component |
| `src/components/crm/segments/SendEDMDialog.tsx` | Email composition dialog |
| `src/components/crm/segments/ImportToSegmentDialog.tsx` | Import with segment |
| `src/services/crm/edm-service.ts` | EDM provider abstraction |
| `src/services/crm/edm-providers/brevo.ts` | Brevo implementation |
| `src/services/crm/edm-providers/aws-ses.ts` | AWS SES implementation |
| `src/services/crm/custom-fields-service.ts` | Custom fields CRUD |
| `src/services/crm/column-preferences-service.ts` | Server-side column prefs |
| `src/hooks/crm/useCustomFields.ts` | React Query hooks |
| `src/hooks/crm/useEDMProviders.ts` | EDM provider hooks |

### Modify
| File | Change |
|------|--------|
| `src/App.tsx` | Add SegmentsPage route |
| `src/config/crmSidebar.tsx` | Update segments nav item |
| `src/pages/crm/ImportExportPage.tsx` | Add segment selection |
| `src/services/crm/import-service.ts` | Support segment assignment |
| `src/hooks/useColumnSettings.ts` | Sync with server |
| `src/services/crm/segment-service.ts` | Add update/delete methods |

---

## Implementation Order

### Phase 1: Foundation (Database + Basic Segments Page)
- [ ] Database migration for all new tables
- [ ] Create `SegmentsPage.tsx` with segment cards
- [ ] Add segment CRUD operations (update/delete)
- [ ] Wire up routes

### Phase 2: Custom Fields System
- [ ] Custom fields service + hooks
- [ ] Column preferences server sync
- [ ] Update customer table to show custom fields

### Phase 3: Import Enhancement
- [ ] Update import to support segment assignment
- [ ] Add custom field mapping in import flow
- [ ] "Create new field" option during import

### Phase 4: EDM Integration
- [ ] EDM provider abstraction layer
- [ ] Brevo implementation
- [ ] AWS SES implementation
- [ ] Send EDM dialog
- [ ] Campaign tracking

---

## Core Fields (Locked)

These are universal and cannot be customized. Users can import a single "address" field which will be stored in `address_full`, but the platform encourages structured address data for better filtering and data management.

### Identity Fields
| Field Key | Display Name | Type | Required |
|-----------|--------------|------|----------|
| `first_name` | First Name | text | Yes |
| `last_name` | Last Name | text | Yes |
| `email` | Email | email | Yes |
| `mobile` | Mobile | phone | No |
| `date_of_birth` | Date of Birth | date | No |

### Address Fields (Structured)
| Field Key | Display Name | Type | Required | Notes |
|-----------|--------------|------|----------|-------|
| `address_full` | Address | text | No | Single-line full address (for simple imports) |
| `address_line_1` | Address Line 1 | text | No | Street number & name |
| `address_line_2` | Address Line 2 | text | No | Unit, suite, building |
| `suburb` | Suburb | text | No | Suburb/neighborhood |
| `city` | City | text | No | City name |
| `state` | State | text | No | State/province/region |
| `postcode` | Postcode | text | No | Postal/ZIP code |
| `country` | Country | text | No | Country name or code |

### Import Handling for Address
When importing:
1. If CSV has single "Address" column → map to `address_full`
2. If CSV has separate address fields → map to individual structured fields
3. Platform can auto-parse `address_full` into components (Phase 3 enhancement)
4. Display shows structured fields if available, falls back to `address_full`

Everything else beyond these core fields is customizable per user via `user_custom_fields`.

---

## Progress Log

### 2025-11-28
- Plan created and approved
- Starting Phase 1 implementation
