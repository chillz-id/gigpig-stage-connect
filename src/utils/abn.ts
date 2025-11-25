/**
 * Format ABN with spaces (XX XXX XXX XXX)
 */
export function formatABN(abn: string): string {
  const cleaned = abn.replace(/\s/g, '');
  if (cleaned.length !== 11) return abn;

  return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 11)}`;
}

/**
 * Remove all spaces from ABN
 */
export function cleanABN(abn: string): string {
  return abn.replace(/\s/g, '');
}

/**
 * Validate ABN format (11 digits)
 */
export function isValidABNFormat(abn: string): boolean {
  const cleaned = cleanABN(abn);
  return /^\d{11}$/.test(cleaned);
}

/**
 * Validate ABN using checksum algorithm
 * https://abr.business.gov.au/Help/AbnFormat
 */
export function validateABNChecksum(abn: string): boolean {
  const cleaned = cleanABN(abn);

  if (!isValidABNFormat(cleaned)) {
    return false;
  }

  // ABN checksum algorithm:
  // 1. Subtract 1 from first digit
  // 2. Multiply each digit by its weight (10,1,3,5,7,9,11,13,15,17,19)
  // 3. Sum all products
  // 4. Divide by 89 - if remainder is 0, ABN is valid

  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  const digits = cleaned.split('').map(Number);

  // Subtract 1 from first digit
  digits[0] -= 1;

  // Calculate weighted sum
  const sum = digits.reduce((acc, digit, index) => {
    return acc + (digit * weights[index]!);
  }, 0);

  // Check if divisible by 89
  return sum % 89 === 0;
}

/**
 * Lookup ABN details from ABR web service
 */
export async function lookupABN(abn: string): Promise<{
  abn: string;
  isActive: boolean;
  entityName: string | null;
  entityType: string | null;
  gstRegistered: boolean;
  gstEffectiveDate: string | null;
  address: string | null;
  stateCode: string | null;
  postcode: string | null;
} | null> {
  try {
    const cleaned = cleanABN(abn);

    if (!isValidABNFormat(cleaned)) {
      throw new Error('Invalid ABN format');
    }

    // Import supabase client dynamically to avoid circular dependencies
    const { supabase } = await import('@/integrations/supabase/client');

    const { data, error } = await supabase.functions.invoke('abn-lookup', {
      body: { abn: cleaned },
    });

    if (error) {
      console.error('ABN lookup error:', error);
      throw new Error(error.message || 'Failed to lookup ABN');
    }

    return data;
  } catch (error) {
    console.error('ABN lookup error:', error);
    return null;
  }
}
