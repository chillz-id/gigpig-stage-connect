/**
 * Metricool API Client
 *
 * Frontend client that proxies all Metricool API calls through the
 * social-api Edge Function to keep credentials server-side.
 */

import { supabase } from '@/integrations/supabase/client';
import type { SocialApiProxyRequest } from '@/types/social';

interface MetricoolProxyResponse<T = unknown> {
  ok: boolean;
  status: number;
  data: T;
}

export class MetricoolClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'MetricoolClientError';
  }
}

/**
 * Send a request to the Metricool API via the social-api Edge Function proxy.
 */
async function proxyRequest<T = unknown>(
  request: SocialApiProxyRequest,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<MetricoolProxyResponse<T>>(
    'social-api',
    { body: request },
  );

  if (error) {
    throw new MetricoolClientError(
      error.message || 'Failed to call social API proxy',
      500,
    );
  }

  if (!data?.ok) {
    throw new MetricoolClientError(
      `Metricool API error: ${data?.status}`,
      data?.status ?? 500,
      data?.data,
    );
  }

  return data.data;
}

export const metricoolClient = {
  /**
   * GET request to Metricool API
   */
  async get<T = unknown>(
    endpoint: string,
    queryParams?: Record<string, string>,
    blogId?: string,
  ): Promise<T> {
    return proxyRequest<T>({ endpoint, method: 'GET', queryParams, blogId });
  },

  /**
   * POST request to Metricool API
   */
  async post<T = unknown>(
    endpoint: string,
    body?: unknown,
    queryParams?: Record<string, string>,
    blogId?: string,
  ): Promise<T> {
    return proxyRequest<T>({ endpoint, method: 'POST', body, queryParams, blogId });
  },

  /**
   * PUT request to Metricool API
   */
  async put<T = unknown>(
    endpoint: string,
    body?: unknown,
    queryParams?: Record<string, string>,
    blogId?: string,
  ): Promise<T> {
    return proxyRequest<T>({ endpoint, method: 'PUT', body, queryParams, blogId });
  },

  /**
   * PATCH request to Metricool API
   */
  async patch<T = unknown>(
    endpoint: string,
    body?: unknown,
    queryParams?: Record<string, string>,
    blogId?: string,
  ): Promise<T> {
    return proxyRequest<T>({ endpoint, method: 'PATCH', body, queryParams, blogId });
  },

  /**
   * DELETE request to Metricool API
   */
  async delete<T = unknown>(
    endpoint: string,
    queryParams?: Record<string, string>,
    blogId?: string,
  ): Promise<T> {
    return proxyRequest<T>({ endpoint, method: 'DELETE', queryParams, blogId });
  },
};
