import { supabase } from '@/integrations/supabase/client';

export interface ImportCustomerRow {
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

export interface ImportResult {
  created: number;
  updated: number;
  failed: number;
  errors: Array<{ email: string; error: string }>;
}

export interface ParsedCSV {
  headers: string[];
  rows: Record<string, string>[];
  rawRows: string[][];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  mappedRows: ImportCustomerRow[];
}

// Standard column mappings for common CSV formats
const COLUMN_MAPPINGS: Record<string, keyof ImportCustomerRow> = {
  // Email variations
  'email': 'email',
  'e-mail': 'email',
  'email address': 'email',
  'emailaddress': 'email',

  // Name variations
  'first name': 'first_name',
  'firstname': 'first_name',
  'first': 'first_name',
  'given name': 'first_name',
  'last name': 'last_name',
  'lastname': 'last_name',
  'last': 'last_name',
  'surname': 'last_name',
  'family name': 'last_name',

  // Phone variations
  'phone': 'phone',
  'phone number': 'phone',
  'mobile': 'phone',
  'mobile phone': 'phone',
  'cell': 'phone',
  'telephone': 'phone',

  // Company
  'company': 'company',
  'company name': 'company',
  'organisation': 'company',
  'organization': 'company',

  // Address
  'address': 'address_line1',
  'address line 1': 'address_line1',
  'address1': 'address_line1',
  'street': 'address_line1',
  'address line 2': 'address_line2',
  'address2': 'address_line2',
  'suburb': 'suburb',
  'city': 'city',
  'state': 'state',
  'province': 'state',
  'region': 'state',
  'postcode': 'postcode',
  'zip': 'postcode',
  'zip code': 'postcode',
  'postal code': 'postcode',
  'country': 'country',

  // Other
  'date of birth': 'date_of_birth',
  'dob': 'date_of_birth',
  'birthday': 'date_of_birth',
  'birthdate': 'date_of_birth',
  'marketing opt in': 'marketing_opt_in',
  'marketing': 'marketing_opt_in',
  'opt in': 'marketing_opt_in',
  'subscribed': 'marketing_opt_in',
  'source': 'source',
  'notes': 'notes',
  'comments': 'notes',
};

/**
 * Parse CSV string into structured data
 */
export function parseCSV(csvContent: string): ParsedCSV {
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== '');

  if (lines.length === 0) {
    return { headers: [], rows: [], rawRows: [] };
  }

  // Parse header row
  const headers = parseCSVLine(lines[0] ?? '');

  // Parse data rows
  const rawRows: string[][] = [];
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i] ?? '');
    rawRows.push(values);

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });
    rows.push(row);
  }

  return { headers, rows, rawRows };
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Auto-detect column mappings from CSV headers
 */
export function detectColumnMappings(headers: string[]): Record<string, keyof ImportCustomerRow> {
  const mappings: Record<string, keyof ImportCustomerRow> = {};

  headers.forEach(header => {
    const normalizedHeader = header.toLowerCase().trim();
    const mapping = COLUMN_MAPPINGS[normalizedHeader];
    if (mapping) {
      mappings[header] = mapping;
    }
  });

  return mappings;
}

/**
 * Validate and map CSV rows to import format
 */
export function validateAndMapRows(
  rows: Record<string, string>[],
  columnMappings: Record<string, keyof ImportCustomerRow>
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const mappedRows: ImportCustomerRow[] = [];

  // Check if email column is mapped
  const hasEmailMapping = Object.values(columnMappings).includes('email');
  if (!hasEmailMapping) {
    errors.push('No email column detected. Email is required for import.');
    return { valid: false, errors, warnings, mappedRows };
  }

  rows.forEach((row, index) => {
    const rowNum = index + 2; // +2 for 1-indexed and header row
    const mappedRow: ImportCustomerRow = { email: '' };

    Object.entries(columnMappings).forEach(([csvColumn, importField]) => {
      const value = row[csvColumn]?.trim() ?? '';

      if (importField === 'email') {
        mappedRow.email = value.toLowerCase();
      } else if (importField === 'marketing_opt_in') {
        const lowerValue = value.toLowerCase();
        mappedRow.marketing_opt_in = ['true', 'yes', '1', 'y'].includes(lowerValue);
      } else if (importField === 'date_of_birth') {
        if (value) {
          // Try to parse various date formats
          const parsed = parseDate(value);
          if (parsed) {
            mappedRow.date_of_birth = parsed;
          } else {
            warnings.push(`Row ${rowNum}: Could not parse date of birth "${value}"`);
          }
        }
      } else if (value) {
        (mappedRow as Record<string, unknown>)[importField] = value;
      }
    });

    // Validate email
    if (!mappedRow.email) {
      errors.push(`Row ${rowNum}: Missing email address`);
    } else if (!isValidEmail(mappedRow.email)) {
      errors.push(`Row ${rowNum}: Invalid email address "${mappedRow.email}"`);
    } else {
      mappedRows.push(mappedRow);
    }
  });

  // Check for duplicates within the CSV
  const emailCounts = new Map<string, number>();
  mappedRows.forEach(row => {
    emailCounts.set(row.email, (emailCounts.get(row.email) ?? 0) + 1);
  });

  emailCounts.forEach((count, email) => {
    if (count > 1) {
      warnings.push(`Email "${email}" appears ${count} times in the CSV. Only the last occurrence will be used.`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    mappedRows,
  };
}

/**
 * Parse various date formats
 */
function parseDate(value: string): string | null {
  // Try ISO format first (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  // Try DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    return `${year}-${month?.padStart(2, '0')}-${day?.padStart(2, '0')}`;
  }

  // Try MM/DD/YYYY or MM-DD-YYYY (US format)
  const mdyMatch = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (mdyMatch) {
    const [, month, day, year] = mdyMatch;
    const monthNum = parseInt(month ?? '0', 10);
    const dayNum = parseInt(day ?? '0', 10);
    // If first number > 12, assume DD/MM/YYYY
    if (monthNum > 12) {
      return `${year}-${day?.padStart(2, '0')}-${month?.padStart(2, '0')}`;
    }
    return `${year}-${month?.padStart(2, '0')}-${day?.padStart(2, '0')}`;
  }

  return null;
}

/**
 * Basic email validation
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Import customers to database
 */
export async function importCustomers(
  rows: ImportCustomerRow[],
  batchSize: number = 50,
  onProgress?: (processed: number, total: number) => void
): Promise<ImportResult> {
  const totalResult: ImportResult = {
    created: 0,
    updated: 0,
    failed: 0,
    errors: [],
  };

  // Process in batches
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);

    const { data, error } = await (supabase as any).rpc('batch_import_customers', {
      p_customers: batch,
    });

    if (error) {
      // If batch fails, try individual imports
      for (const row of batch) {
        const { data: singleResult, error: singleError } = await (supabase as any).rpc(
          'upsert_customer_from_import',
          {
            p_email: row.email,
            p_first_name: row.first_name,
            p_last_name: row.last_name,
            p_phone: row.phone,
            p_company: row.company,
            p_address_line1: row.address_line1,
            p_address_line2: row.address_line2,
            p_suburb: row.suburb,
            p_city: row.city,
            p_state: row.state,
            p_postcode: row.postcode,
            p_country: row.country,
            p_date_of_birth: row.date_of_birth,
            p_marketing_opt_in: row.marketing_opt_in,
            p_source: row.source ?? 'csv_import',
            p_notes: row.notes,
          }
        );

        if (singleError || !singleResult?.success) {
          totalResult.failed++;
          totalResult.errors.push({
            email: row.email,
            error: singleError?.message ?? singleResult?.error ?? 'Unknown error',
          });
        } else if (singleResult.is_new) {
          totalResult.created++;
        } else {
          totalResult.updated++;
        }
      }
    } else if (data) {
      totalResult.created += data.created ?? 0;
      totalResult.updated += data.updated ?? 0;
      totalResult.failed += data.failed ?? 0;
      if (data.errors?.length) {
        totalResult.errors.push(...data.errors);
      }
    }

    onProgress?.(Math.min(i + batchSize, rows.length), rows.length);
  }

  return totalResult;
}

export const importService = {
  parseCSV,
  detectColumnMappings,
  validateAndMapRows,
  importCustomers,
};
