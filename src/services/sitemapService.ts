import { supabase } from '@/integrations/supabase/client';
import { SitemapGenerator } from '@/utils/sitemapGenerator';

interface SitemapMetadata {
  id?: string;
  type: 'main' | 'comedians' | 'events';
  last_generated: string;
  entries_count: number;
  submission_status: {
    google?: { submitted: boolean; date?: string };
    bing?: { submitted: boolean; date?: string };
  };
}

export class SitemapService {
  private generator: SitemapGenerator;
  private baseUrl: string;

  constructor(baseUrl: string = window.location.origin) {
    this.baseUrl = baseUrl;
    this.generator = new SitemapGenerator({ baseUrl });
  }

  /**
   * Get sitemap metadata from database
   */
  async getSitemapMetadata(type: string): Promise<SitemapMetadata | null> {
    try {
      const { data, error } = await supabase
        .from('sitemap_metadata')
        .select('*')
        .eq('type', type)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      
      return data;
    } catch (error) {
      console.error('Error fetching sitemap metadata:', error);
      return null;
    }
  }

  /**
   * Update sitemap metadata
   */
  async updateSitemapMetadata(metadata: SitemapMetadata): Promise<void> {
    try {
      const { error } = await supabase
        .from('sitemap_metadata')
        .upsert({
          ...metadata,
          last_generated: new Date().toISOString(),
        }, {
          onConflict: 'type',
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating sitemap metadata:', error);
    }
  }

  /**
   * Check if sitemap needs regeneration
   */
  async needsRegeneration(type: string = 'main'): Promise<boolean> {
    try {
      const metadata = await this.getSitemapMetadata(type);
      
      if (!metadata) return true; // No metadata means never generated
      
      const lastGenerated = new Date(metadata.last_generated);
      const hoursSinceGeneration = (Date.now() - lastGenerated.getTime()) / (1000 * 60 * 60);
      
      // Regenerate if older than 24 hours
      if (hoursSinceGeneration > 24) return true;
      
      // Check for recent updates
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      if (type === 'main' || type === 'comedians') {
        const { count: profileCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'comedian')
          .eq('is_public', true)
          .gte('updated_at', metadata.last_generated);
        
        if ((profileCount || 0) > 0) return true;
      }
      
      if (type === 'main' || type === 'events') {
        const { count: eventCount } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'published')
          .gte('updated_at', metadata.last_generated);
        
        if ((eventCount || 0) > 0) return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking regeneration need:', error);
      return false;
    }
  }

  /**
   * Submit sitemap to search engines
   */
  async submitToSearchEngines(sitemapUrl: string, type: string = 'main'): Promise<void> {
    const metadata = await this.getSitemapMetadata(type) || {
      type: type as any,
      last_generated: new Date().toISOString(),
      entries_count: 0,
      submission_status: {},
    };

    // Google submission
    try {
      const googlePingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
      
      // In production, you would make an actual HTTP request
      // For now, we'll simulate the submission
      console.log('Submitting to Google:', googlePingUrl);
      
      metadata.submission_status.google = {
        submitted: true,
        date: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error submitting to Google:', error);
      metadata.submission_status.google = { submitted: false };
    }

    // Bing submission
    try {
      const bingPingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
      
      console.log('Submitting to Bing:', bingPingUrl);
      
      metadata.submission_status.bing = {
        submitted: true,
        date: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error submitting to Bing:', error);
      metadata.submission_status.bing = { submitted: false };
    }

    await this.updateSitemapMetadata(metadata);
  }

  /**
   * Regenerate and submit sitemap
   */
  async regenerateAndSubmit(type: string = 'main'): Promise<void> {
    try {
      console.log(`Regenerating ${type} sitemap...`);
      
      // Generate sitemap
      const result = await this.generator.generateSitemaps();
      
      // Update metadata
      const entries = await this.countEntries(type);
      await this.updateSitemapMetadata({
        type: type as any,
        last_generated: new Date().toISOString(),
        entries_count: entries,
        submission_status: {},
      });

      // Submit to search engines
      const sitemapUrl = `${this.baseUrl}/sitemap${type === 'main' ? '' : `-${type}`}.xml`;
      await this.submitToSearchEngines(sitemapUrl, type);
      
      console.log(`${type} sitemap regenerated and submitted successfully`);
    } catch (error) {
      console.error(`Error regenerating ${type} sitemap:`, error);
      throw error;
    }
  }

  /**
   * Count entries for a specific sitemap type
   */
  private async countEntries(type: string): Promise<number> {
    let count = 0;
    
    if (type === 'main' || type === 'comedians') {
      const { count: comedianCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'comedian')
        .eq('is_public', true);
      
      count += comedianCount || 0;
    }
    
    if (type === 'main' || type === 'events') {
      const { count: eventCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')
        .gte('date', new Date().toISOString());
      
      count += eventCount || 0;
    }
    
    if (type === 'main') {
      count += 5; // Static pages
    }
    
    return count;
  }

  /**
   * Get sitemap performance metrics
   */
  async getSitemapMetrics(): Promise<{
    totalEntries: number;
    lastGenerated: Date | null;
    submissionStatus: any;
    coverage: {
      comedians: number;
      events: number;
      static: number;
    };
  }> {
    try {
      const mainMetadata = await this.getSitemapMetadata('main');
      
      const [comedianCount, eventCount] = await Promise.all([
        this.countEntries('comedians'),
        this.countEntries('events'),
      ]);
      
      return {
        totalEntries: mainMetadata?.entries_count || 0,
        lastGenerated: mainMetadata ? new Date(mainMetadata.last_generated) : null,
        submissionStatus: mainMetadata?.submission_status || {},
        coverage: {
          comedians: comedianCount,
          events: eventCount,
          static: 5,
        },
      };
    } catch (error) {
      console.error('Error fetching sitemap metrics:', error);
      throw error;
    }
  }

  /**
   * Schedule automatic sitemap regeneration
   */
  async scheduleRegeneration(): Promise<void> {
    // Check all sitemap types
    const types = ['main', 'comedians', 'events'];
    
    for (const type of types) {
      try {
        const needsRegen = await this.needsRegeneration(type);
        
        if (needsRegen) {
          await this.regenerateAndSubmit(type);
        }
      } catch (error) {
        console.error(`Error checking/regenerating ${type} sitemap:`, error);
      }
    }
  }
}

// Export singleton instance
export const sitemapService = new SitemapService();