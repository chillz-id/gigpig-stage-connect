/**
 * Meta Marketing API Service
 *
 * Handles integration with Meta/Facebook Marketing APIs for:
 * - Custom Audiences: Upload customer lists for retargeting and lookalike audiences
 * - Conversions API: Server-side event tracking for better attribution
 *
 * All PII data is hashed with SHA256 before being sent to Meta (required by Meta).
 */

import { supabase } from '@/integrations/supabase/client';

// Configuration interface
export interface MetaMarketingConfig {
  accessToken: string;
  pixelId: string;
  adAccountId: string;
  customAudienceId?: string;
}

// Customer data for Custom Audiences
export interface CustomerData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

// Order data for Conversions API
export interface OrderData {
  orderId: string;
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  value: number;
  currency: string;
  eventId?: string;
  eventName?: string;
  eventSourceUrl?: string;
}

// API response types
export interface MetaApiResponse {
  success: boolean;
  audienceId?: string;
  numReceived?: number;
  numInvalidEntries?: number;
  invalidEntrySamples?: string[];
  error?: {
    message: string;
    type: string;
    code: number;
  };
}

export interface ConversionEventResponse {
  events_received: number;
  messages: string[];
  fbtrace_id: string;
}

export interface CustomAudienceInfo {
  id: string;
  name: string;
  description?: string;
  subtype: string;
  approximate_count_lower_bound: number;
  approximate_count_upper_bound: number;
  operation_status?: {
    code: number;
    description: string;
  };
}

// Batch upload progress callback
export type ProgressCallback = (uploaded: number, total: number, failed: number) => void;

class MetaMarketingService {
  private config: MetaMarketingConfig | null = null;
  private baseUrl = 'https://graph.facebook.com/v19.0';

  /**
   * Initialize the service with configuration
   */
  initialize(config: MetaMarketingConfig): void {
    this.config = config;
  }

  /**
   * Check if service is configured
   */
  isConfigured(): boolean {
    return !!(this.config?.accessToken && this.config?.pixelId);
  }

  /**
   * Get current configuration (for debugging)
   */
  getConfig(): Partial<MetaMarketingConfig> | null {
    if (!this.config) return null;
    return {
      pixelId: this.config.pixelId,
      adAccountId: this.config.adAccountId,
      customAudienceId: this.config.customAudienceId,
      // Don't expose access token
    };
  }

  // ==================== HASHING UTILITIES ====================

  /**
   * SHA256 hash a string (Meta requirement for PII)
   * Uses Web Crypto API for browser compatibility
   */
  async hashSHA256(value: string): Promise<string> {
    const normalized = value.toLowerCase().trim();
    const encoder = new TextEncoder();
    const data = encoder.encode(normalized);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Normalize and hash email
   */
  async hashEmail(email: string): Promise<string> {
    return this.hashSHA256(email.toLowerCase().trim());
  }

  /**
   * Normalize and hash phone (convert to E.164 if not already)
   */
  async hashPhone(phone: string): Promise<string> {
    // Remove all non-numeric characters except leading +
    let normalized = phone.replace(/[^\d+]/g, '');

    // If it doesn't start with +, assume Australian
    if (!normalized.startsWith('+')) {
      if (normalized.startsWith('0')) {
        normalized = '+61' + normalized.slice(1);
      } else if (normalized.startsWith('61')) {
        normalized = '+' + normalized;
      } else {
        normalized = '+61' + normalized;
      }
    }

    return this.hashSHA256(normalized);
  }

  /**
   * Normalize and hash name (lowercase, trim, remove special chars)
   */
  async hashName(name: string): Promise<string> {
    const normalized = name.toLowerCase().trim().replace(/[^a-z]/g, '');
    return this.hashSHA256(normalized);
  }

  /**
   * Hash all customer fields for Custom Audiences
   */
  async hashCustomerData(customer: CustomerData): Promise<string[]> {
    const hashed: string[] = [];

    // Order matches schema: EMAIL, PHONE, FN, LN, CT, ST, ZIP, COUNTRY
    hashed.push(customer.email ? await this.hashEmail(customer.email) : '');
    hashed.push(customer.phone ? await this.hashPhone(customer.phone) : '');
    hashed.push(customer.firstName ? await this.hashName(customer.firstName) : '');
    hashed.push(customer.lastName ? await this.hashName(customer.lastName) : '');
    hashed.push(customer.city ? await this.hashSHA256(customer.city.toLowerCase().replace(/\s/g, '')) : '');
    hashed.push(customer.state ? await this.hashSHA256(customer.state.toLowerCase().replace(/\s/g, '')) : '');
    hashed.push(customer.postcode ? await this.hashSHA256(customer.postcode.replace(/\s/g, '')) : '');
    hashed.push(customer.country ? await this.hashSHA256(customer.country.toLowerCase()) : '');

    return hashed;
  }

  // ==================== CUSTOM AUDIENCES API ====================

  /**
   * Create a new Custom Audience
   */
  async createCustomAudience(
    name: string,
    description?: string
  ): Promise<{ id: string; success: boolean; error?: string }> {
    this.validateConfig();

    try {
      const response = await fetch(
        `${this.baseUrl}/act_${this.config!.adAccountId}/customaudiences`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: this.config!.accessToken,
            name,
            description: description || `Created via Stand Up Sydney CRM on ${new Date().toISOString()}`,
            subtype: 'CUSTOM',
            customer_file_source: 'USER_PROVIDED_ONLY',
          }),
        }
      );

      const data = await response.json();

      if (data.error) {
        return { id: '', success: false, error: data.error.message };
      }

      return { id: data.id, success: true };
    } catch (error) {
      return {
        id: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get Custom Audience info
   */
  async getCustomAudience(audienceId: string): Promise<CustomAudienceInfo | null> {
    this.validateConfig();

    try {
      const response = await fetch(
        `${this.baseUrl}/${audienceId}?fields=id,name,description,subtype,approximate_count_lower_bound,approximate_count_upper_bound,operation_status&access_token=${this.config!.accessToken}`
      );

      const data = await response.json();

      if (data.error) {
        console.error('Error getting audience:', data.error);
        return null;
      }

      return data as CustomAudienceInfo;
    } catch (error) {
      console.error('Error getting audience:', error);
      return null;
    }
  }

  /**
   * Add customers to a Custom Audience
   * @param customers Array of customer data
   * @param audienceId Optional audience ID (uses config default if not provided)
   */
  async addCustomersToAudience(
    customers: CustomerData[],
    audienceId?: string
  ): Promise<MetaApiResponse> {
    this.validateConfig();

    const targetAudienceId = audienceId || this.config!.customAudienceId;
    if (!targetAudienceId) {
      return {
        success: false,
        error: { message: 'No audience ID provided', type: 'ConfigError', code: 0 },
      };
    }

    try {
      // Hash all customer data
      const hashedData = await Promise.all(
        customers.map(customer => this.hashCustomerData(customer))
      );

      const payload = {
        payload: {
          schema: ['EMAIL', 'PHONE', 'FN', 'LN', 'CT', 'ST', 'ZIP', 'COUNTRY'],
          data: hashedData,
        },
        access_token: this.config!.accessToken,
      };

      const response = await fetch(`${this.baseUrl}/${targetAudienceId}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.error) {
        return {
          success: false,
          error: {
            message: data.error.message,
            type: data.error.type,
            code: data.error.code,
          },
        };
      }

      return {
        success: true,
        audienceId: targetAudienceId,
        numReceived: data.num_received,
        numInvalidEntries: data.num_invalid_entries,
        invalidEntrySamples: data.invalid_entry_samples,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          type: 'NetworkError',
          code: 0,
        },
      };
    }
  }

  /**
   * Remove customers from a Custom Audience
   */
  async removeCustomersFromAudience(
    emails: string[],
    audienceId?: string
  ): Promise<MetaApiResponse> {
    this.validateConfig();

    const targetAudienceId = audienceId || this.config!.customAudienceId;
    if (!targetAudienceId) {
      return {
        success: false,
        error: { message: 'No audience ID provided', type: 'ConfigError', code: 0 },
      };
    }

    try {
      // Hash emails
      const hashedEmails = await Promise.all(
        emails.map(email => this.hashEmail(email))
      );

      const payload = {
        payload: {
          schema: ['EMAIL'],
          data: hashedEmails.map(hash => [hash]),
        },
        access_token: this.config!.accessToken,
      };

      const response = await fetch(`${this.baseUrl}/${targetAudienceId}/users`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.error) {
        return {
          success: false,
          error: {
            message: data.error.message,
            type: data.error.type,
            code: data.error.code,
          },
        };
      }

      return {
        success: true,
        audienceId: targetAudienceId,
        numReceived: data.num_received,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          type: 'NetworkError',
          code: 0,
        },
      };
    }
  }

  /**
   * Bulk upload customers in batches (for large datasets like 17k+ customers)
   * Meta allows up to 10,000 records per request
   */
  async bulkUploadCustomers(
    customers: CustomerData[],
    audienceId?: string,
    onProgress?: ProgressCallback,
    batchSize: number = 10000
  ): Promise<{
    success: boolean;
    totalUploaded: number;
    totalFailed: number;
    errors: string[];
  }> {
    const targetAudienceId = audienceId || this.config!.customAudienceId;
    if (!targetAudienceId) {
      return {
        success: false,
        totalUploaded: 0,
        totalFailed: customers.length,
        errors: ['No audience ID provided'],
      };
    }

    let totalUploaded = 0;
    let totalFailed = 0;
    const errors: string[] = [];

    // Split into batches
    for (let i = 0; i < customers.length; i += batchSize) {
      const batch = customers.slice(i, i + batchSize);

      const result = await this.addCustomersToAudience(batch, targetAudienceId);

      if (result.success) {
        totalUploaded += result.numReceived || batch.length;
        totalFailed += result.numInvalidEntries || 0;
      } else {
        totalFailed += batch.length;
        errors.push(result.error?.message || 'Unknown batch error');
      }

      // Report progress
      if (onProgress) {
        onProgress(totalUploaded, customers.length, totalFailed);
      }

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < customers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return {
      success: totalFailed === 0,
      totalUploaded,
      totalFailed,
      errors,
    };
  }

  // ==================== CONVERSIONS API ====================

  /**
   * Send a purchase event to Conversions API
   */
  async sendPurchaseEvent(order: OrderData): Promise<ConversionEventResponse | null> {
    this.validateConfig();

    try {
      // Build user data with hashed PII
      const userData: Record<string, string[]> = {};

      if (order.email) {
        userData.em = [await this.hashEmail(order.email)];
      }
      if (order.phone) {
        userData.ph = [await this.hashPhone(order.phone)];
      }
      if (order.firstName) {
        userData.fn = [await this.hashName(order.firstName)];
      }
      if (order.lastName) {
        userData.ln = [await this.hashName(order.lastName)];
      }

      const eventData = {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        event_id: order.orderId, // For deduplication
        action_source: 'system_generated',
        user_data: userData,
        custom_data: {
          currency: order.currency || 'AUD',
          value: order.value,
          content_ids: order.eventId ? [order.eventId] : undefined,
          content_type: 'product',
          content_name: order.eventName,
        },
        event_source_url: order.eventSourceUrl,
      };

      const response = await fetch(
        `${this.baseUrl}/${this.config!.pixelId}/events`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: [eventData],
            access_token: this.config!.accessToken,
          }),
        }
      );

      const data = await response.json();

      if (data.error) {
        console.error('Conversions API error:', data.error);
        return null;
      }

      return data as ConversionEventResponse;
    } catch (error) {
      console.error('Error sending purchase event:', error);
      return null;
    }
  }

  /**
   * Send a custom event to Conversions API
   */
  async sendEvent(
    eventName: string,
    userData: {
      email?: string;
      phone?: string;
      firstName?: string;
      lastName?: string;
      externalId?: string;
    },
    customData?: Record<string, unknown>,
    eventId?: string
  ): Promise<ConversionEventResponse | null> {
    this.validateConfig();

    try {
      // Build hashed user data
      const hashedUserData: Record<string, string[]> = {};

      if (userData.email) {
        hashedUserData.em = [await this.hashEmail(userData.email)];
      }
      if (userData.phone) {
        hashedUserData.ph = [await this.hashPhone(userData.phone)];
      }
      if (userData.firstName) {
        hashedUserData.fn = [await this.hashName(userData.firstName)];
      }
      if (userData.lastName) {
        hashedUserData.ln = [await this.hashName(userData.lastName)];
      }
      if (userData.externalId) {
        hashedUserData.external_id = [await this.hashSHA256(userData.externalId)];
      }

      const eventData = {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId || `${eventName}_${Date.now()}`,
        action_source: 'system_generated',
        user_data: hashedUserData,
        custom_data: customData,
      };

      const response = await fetch(
        `${this.baseUrl}/${this.config!.pixelId}/events`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: [eventData],
            access_token: this.config!.accessToken,
          }),
        }
      );

      const data = await response.json();

      if (data.error) {
        console.error('Conversions API error:', data.error);
        return null;
      }

      return data as ConversionEventResponse;
    } catch (error) {
      console.error('Error sending event:', error);
      return null;
    }
  }

  /**
   * Send batch of events to Conversions API
   * Useful for historical data upload
   */
  async sendBatchEvents(
    events: Array<{
      eventName: string;
      eventTime: number; // Unix timestamp
      userData: { email?: string; phone?: string };
      customData?: Record<string, unknown>;
      eventId?: string;
    }>
  ): Promise<ConversionEventResponse | null> {
    this.validateConfig();

    try {
      const eventData = await Promise.all(
        events.map(async (event) => {
          const hashedUserData: Record<string, string[]> = {};

          if (event.userData.email) {
            hashedUserData.em = [await this.hashEmail(event.userData.email)];
          }
          if (event.userData.phone) {
            hashedUserData.ph = [await this.hashPhone(event.userData.phone)];
          }

          return {
            event_name: event.eventName,
            event_time: event.eventTime,
            event_id: event.eventId || `${event.eventName}_${event.eventTime}`,
            action_source: 'system_generated',
            user_data: hashedUserData,
            custom_data: event.customData,
          };
        })
      );

      const response = await fetch(
        `${this.baseUrl}/${this.config!.pixelId}/events`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: eventData,
            access_token: this.config!.accessToken,
          }),
        }
      );

      const data = await response.json();

      if (data.error) {
        console.error('Conversions API error:', data.error);
        return null;
      }

      return data as ConversionEventResponse;
    } catch (error) {
      console.error('Error sending batch events:', error);
      return null;
    }
  }

  // ==================== SYNC LOGGING ====================

  /**
   * Log a sync operation to the database
   */
  async logSync(
    customerId: string | null,
    syncType: 'audience' | 'conversion',
    status: 'success' | 'failed',
    response?: unknown
  ): Promise<void> {
    try {
      await supabase.from('meta_sync_log').insert({
        customer_id: customerId,
        sync_type: syncType,
        status,
        meta_response: response as Record<string, unknown>,
      });
    } catch (error) {
      console.error('Error logging sync:', error);
    }
  }

  // ==================== HELPERS ====================

  private validateConfig(): void {
    if (!this.isConfigured()) {
      throw new Error('Meta Marketing service not configured. Call initialize() first.');
    }
  }
}

// Export singleton instance
export const metaMarketingService = new MetaMarketingService();

// Initialize from environment if available
const envConfig: Partial<MetaMarketingConfig> = {
  accessToken: import.meta.env.VITE_META_ACCESS_TOKEN,
  pixelId: import.meta.env.VITE_META_PIXEL_ID,
  adAccountId: import.meta.env.VITE_META_AD_ACCOUNT_ID,
  customAudienceId: import.meta.env.VITE_META_CUSTOM_AUDIENCE_ID,
};

if (envConfig.accessToken && envConfig.pixelId) {
  metaMarketingService.initialize(envConfig as MetaMarketingConfig);
}
