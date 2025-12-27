# CRM Import System: CSV Customer Import with Auto-Mapping

Created: 2025-11-24
Status: Completed (2025-11-24)

## Overview

A comprehensive CSV import system for the CRM that allows bulk importing of customer data with intelligent column auto-detection, validation, and upsert logic. The system matches customers by email address, creating new records or updating existing ones.

## Changes Overview

### 1. Database Layer
**Files**: Supabase migration

New PostgreSQL functions for customer import:
- `upsert_customer_from_import()` - Single customer upsert with email matching
- `batch_import_customers()` - Batch processing with progress tracking

### 2. Service Layer
**Files**: `src/services/crm/import-service.ts`

TypeScript service providing:
- CSV parsing with quoted value handling
- Column auto-detection from common header variations
- Row validation with error/warning collection
- Batch import with progress callbacks

### 3. UI Layer
**Files**: `src/pages/crm/ImportExportPage.tsx`

Multi-step import wizard with:
- Drag & drop file upload
- Column mapping interface
- Validation preview
- Import progress tracking
- Results summary

### 4. Routing
**Files**: `src/App.tsx`, `src/config/crmSidebar.tsx`

Integration into CRM module routing at `/crm/import-export`

## Files Created/Modified

1. **Migration: `add_upsert_customer_import_function`**
   - Database functions for import operations

2. **`src/services/crm/import-service.ts`** (NEW)
   - CSV parsing and validation service

3. **`src/pages/crm/ImportExportPage.tsx`** (NEW)
   - Import/Export page component

4. **`src/config/crmSidebar.tsx`**
   - Added `'import-export'` to route component type
   - Updated route config to use new component

5. **`src/App.tsx`**
   - Added lazy import for ImportExportPage
   - Added route within CRM routes

## Detailed Implementation

### Database Functions

#### `upsert_customer_from_import()`

```sql
-- Parameters:
p_email TEXT,
p_first_name TEXT DEFAULT NULL,
p_last_name TEXT DEFAULT NULL,
p_phone TEXT DEFAULT NULL,
p_company TEXT DEFAULT NULL,
p_address_line1 TEXT DEFAULT NULL,
p_address_line2 TEXT DEFAULT NULL,
p_suburb TEXT DEFAULT NULL,
p_city TEXT DEFAULT NULL,
p_state TEXT DEFAULT NULL,
p_postcode TEXT DEFAULT NULL,
p_country TEXT DEFAULT NULL,
p_date_of_birth DATE DEFAULT NULL,
p_marketing_opt_in BOOLEAN DEFAULT NULL,
p_source TEXT DEFAULT 'csv_import',
p_notes TEXT DEFAULT NULL

-- Returns JSON: {success, is_new, customer_id, error}
```

**Logic:**
1. Looks up existing customer by email in `customer_emails` table
2. If found: Updates `customer_profiles` with non-null values (preserves existing data)
3. If not found: Creates new `customer_profiles` record and `customer_emails` record
4. Phone numbers handled via `customer_phones` table with E.164 format normalization

#### `batch_import_customers()`

```sql
-- Parameters:
p_customers JSONB  -- Array of customer objects

-- Returns JSON: {created, updated, failed, errors[]}
```

**Logic:**
- Iterates through JSONB array
- Calls `upsert_customer_from_import()` for each record
- Aggregates results and collects errors

### Service Layer

#### Type Definitions

```typescript
interface ImportCustomerRow {
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  company?: string;
  address_line1?: string;
  address_line2?: string;
  suburb?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  date_of_birth?: string;
  marketing_opt_in?: boolean;
  source?: string;
  notes?: string;
}

interface ParsedCSV {
  headers: string[];
  rows: Record<string, string>[];
  rawRows: string[][];
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  mappedRows: ImportCustomerRow[];
}

interface ImportResult {
  created: number;
  updated: number;
  failed: number;
  errors: Array<{ email: string; error: string }>;
}
```

#### Column Auto-Detection

The service auto-detects common CSV header variations:

| Import Field | Detected Headers |
|-------------|------------------|
| `email` | email, e-mail, email address, emailaddress |
| `first_name` | first name, firstname, first, given name |
| `last_name` | last name, lastname, last, surname, family name |
| `phone` | phone, phone number, mobile, mobile phone, cell, telephone |
| `company` | company, company name, organisation, organization |
| `address_line1` | address, address line 1, address1, street |
| `suburb` | suburb |
| `city` | city |
| `state` | state, province, region |
| `postcode` | postcode, zip, zip code, postal code |
| `country` | country |
| `date_of_birth` | date of birth, dob, birthday, birthdate |
| `marketing_opt_in` | marketing opt in, marketing, opt in, subscribed |
| `notes` | notes, comments |

#### CSV Parsing

- Handles quoted values with escaped quotes (`""`)
- Supports both `\r\n` and `\n` line endings
- Trims whitespace from values
- Normalizes emails to lowercase

#### Validation Rules

**Errors (block import):**
- Missing email column mapping
- Empty email address
- Invalid email format

**Warnings (allow import):**
- Unparseable date of birth
- Duplicate emails in CSV (last occurrence used)

### UI Components

#### Import Wizard Steps

1. **Upload** (`step === 'upload'`)
   - Drag & drop zone using react-dropzone
   - Accepts `.csv` files only
   - Reads file as text and parses

2. **Mapping** (`step === 'mapping'`)
   - Shows all CSV columns with auto-detected mappings
   - Dropdown to map each column to import field
   - Option to skip columns
   - Sample data preview

3. **Preview** (`step === 'preview'`)
   - Validation summary with error/warning counts
   - Error list with row numbers
   - Warning list
   - "Ready to Import" confirmation

4. **Importing** (`step === 'importing'`)
   - Progress bar with percentage
   - "Please don't close this page" message
   - Spinner animation

5. **Complete** (`step === 'complete'`)
   - Results grid: Created / Updated / Failed counts
   - Error list for failed records
   - "Import Another File" button

#### Export Feature

- "Export All Customers" button in header
- Uses `useExportCustomers()` hook
- Downloads CSV with all customer data

### Routing Configuration

**CRM Sidebar (`crmSidebar.tsx`):**
```typescript
{
  path: 'import-export',
  component: 'import-export',  // Changed from 'customer-list'
  navItemId: 'crm.customers.import',
}
```

**App Routes (`App.tsx`):**
```typescript
// Within CRM routes
<Route path="import-export" element={<ImportExportPage />} />
```

## Database Schema Context

The import system works with the normalized customer data model:

- **`customer_profiles`**: Core customer data (name, DOB, marketing, notes, etc.)
- **`customer_emails`**: Email addresses linked to profiles (supports multiple per customer)
- **`customer_phones`**: Phone numbers in E.164 format
- **`customers_crm_v`**: View joining all tables for display

## Key Behaviors

- Email is the only required field
- Existing customers matched by email address
- Non-empty import values update existing data
- Empty import values preserve existing data (no overwrites)
- Duplicate emails in CSV: last row wins
- Phone numbers normalized to E.164 format
- Marketing opt-in parsed from: true/false, yes/no, 1/0, y/n
- Date of birth parsed from: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY
- Import source defaults to 'csv_import'
- Batch size: 50 records per database call

## Dependencies

- `react-dropzone` - File upload handling
- `sonner` - Toast notifications
- shadcn/ui components: Card, Table, Select, Badge, Alert, Progress, Button

## Testing Checklist

- [x] CSV with all columns maps correctly
- [x] CSV with partial columns imports successfully
- [x] Email validation rejects invalid formats
- [x] Duplicate emails show warning
- [x] Date parsing handles multiple formats
- [x] Marketing opt-in parsing handles variations
- [x] Progress updates during batch import
- [x] Error display for failed records
- [x] Export downloads CSV file
- [x] TypeScript compilation passes

## Access Control

Import/Export page restricted to roles:
- `admin`
- `agency_manager`
- `venue_manager`

(Same as all CRM routes per `ProtectedRoute` wrapper)

## Notes

- The batch import function falls back to individual imports if batch RPC fails
- Large imports (1000+ rows) may take several minutes
- Import results show exact counts of created vs updated records
- Failed records include email and error message for debugging
