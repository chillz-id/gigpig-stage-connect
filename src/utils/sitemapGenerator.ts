import { supabase } from '@/integrations/supabase/client';

interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

interface SitemapOptions {
  baseUrl: string;
  maxEntriesPerSitemap?: number;
}

export class SitemapGenerator {
  private baseUrl: string;
  private maxEntriesPerSitemap: number;

  constructor(options: SitemapOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.maxEntriesPerSitemap = options.maxEntriesPerSitemap || 50000; // Google's limit
  }

  /**
   * Generate XML for a single sitemap
   */
  private generateSitemapXML(entries: SitemapEntry[]): string {
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
      '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ];

    for (const entry of entries) {
      xml.push('  <url>');
      xml.push(`    <loc>${this.escapeXml(entry.loc)}</loc>`);
      
      if (entry.lastmod) {
        xml.push(`    <lastmod>${entry.lastmod}</lastmod>`);
      }
      
      if (entry.changefreq) {
        xml.push(`    <changefreq>${entry.changefreq}</changefreq>`);
      }
      
      if (entry.priority !== undefined) {
        xml.push(`    <priority>${entry.priority}</priority>`);
      }
      
      // Add hreflang alternatives if needed (for internationalization)
      // Currently we only support English
      xml.push(`    <xhtml:link rel="alternate" hreflang="en" href="${this.escapeXml(entry.loc)}" />`);
      
      xml.push('  </url>');
    }

    xml.push('</urlset>');
    return xml.join('\n');
  }

  /**
   * Generate sitemap index XML for multiple sitemaps
   */
  private generateSitemapIndexXML(sitemapUrls: string[]): string {
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ];

    const lastmod = new Date().toISOString();
    
    for (const url of sitemapUrls) {
      xml.push('  <sitemap>');
      xml.push(`    <loc>${this.escapeXml(url)}</loc>`);
      xml.push(`    <lastmod>${lastmod}</lastmod>`);
      xml.push('  </sitemap>');
    }

    xml.push('</sitemapindex>');
    return xml.join('\n');
  }

  /**
   * Escape special XML characters
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Fetch all public comedian profiles
   */
  async fetchComedianProfiles(): Promise<SitemapEntry[]> {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, stage_name, profile_url, updated_at')
        .eq('role', 'comedian')
        .eq('is_public', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const entries: SitemapEntry[] = [];

      for (const profile of profiles || []) {
        // Use profile_url if available, otherwise use ID
        const slug = profile.profile_url || profile.id;
        
        entries.push({
          loc: `${this.baseUrl}/comedian/${slug}`,
          lastmod: profile.updated_at ? new Date(profile.updated_at).toISOString() : undefined,
          changefreq: 'weekly',
          priority: 0.8, // High priority for comedian profiles
        });
      }

      return entries;
    } catch (error) {
      console.error('Error fetching comedian profiles:', error);
      return [];
    }
  }

  /**
   * Fetch all public events
   */
  async fetchPublicEvents(): Promise<SitemapEntry[]> {
    try {
      const { data: events, error } = await supabase
        .from('events')
        .select('id, name, date, updated_at')
        .eq('status', 'published')
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true });

      if (error) throw error;

      const entries: SitemapEntry[] = [];

      for (const event of events || []) {
        entries.push({
          loc: `${this.baseUrl}/events/${event.id}`,
          lastmod: event.updated_at ? new Date(event.updated_at).toISOString() : undefined,
          changefreq: 'daily',
          priority: 0.7,
        });
      }

      return entries;
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  }

  /**
   * Get static pages for the sitemap
   */
  getStaticPages(): SitemapEntry[] {
    const staticPages = [
      { path: '/', priority: 1.0, changefreq: 'daily' as const },
      { path: '/shows', priority: 0.9, changefreq: 'daily' as const },
      { path: '/comedians', priority: 0.9, changefreq: 'daily' as const },
      { path: '/photographers', priority: 0.7, changefreq: 'weekly' as const },
      { path: '/book-comedian', priority: 0.8, changefreq: 'weekly' as const },
    ];

    return staticPages.map(page => ({
      loc: `${this.baseUrl}${page.path}`,
      changefreq: page.changefreq,
      priority: page.priority,
      lastmod: new Date().toISOString(),
    }));
  }

  /**
   * Generate all sitemaps
   */
  async generateSitemaps(): Promise<{ type: 'index' | 'single', content: string, urls?: string[] }> {
    try {
      // Fetch all entries
      const [comedianEntries, eventEntries] = await Promise.all([
        this.fetchComedianProfiles(),
        this.fetchPublicEvents(),
      ]);
      
      const staticEntries = this.getStaticPages();
      
      // Combine all entries
      const allEntries = [...staticEntries, ...comedianEntries, ...eventEntries];

      // If we have more entries than the limit, create multiple sitemaps
      if (allEntries.length > this.maxEntriesPerSitemap) {
        const sitemaps: string[] = [];
        const sitemapUrls: string[] = [];
        
        // Split entries into chunks
        for (let i = 0; i < allEntries.length; i += this.maxEntriesPerSitemap) {
          const chunk = allEntries.slice(i, i + this.maxEntriesPerSitemap);
          const sitemapXml = this.generateSitemapXML(chunk);
          const sitemapIndex = Math.floor(i / this.maxEntriesPerSitemap);
          
          sitemaps.push(sitemapXml);
          sitemapUrls.push(`${this.baseUrl}/sitemap-${sitemapIndex}.xml`);
        }

        // Generate sitemap index
        const indexXml = this.generateSitemapIndexXML(sitemapUrls);
        
        return {
          type: 'index',
          content: indexXml,
          urls: sitemapUrls,
        };
      } else {
        // Single sitemap
        const sitemapXml = this.generateSitemapXML(allEntries);
        
        return {
          type: 'single',
          content: sitemapXml,
        };
      }
    } catch (error) {
      console.error('Error generating sitemaps:', error);
      throw error;
    }
  }

  /**
   * Validate XML syntax
   */
  validateXML(xml: string): boolean {
    try {
      // Basic validation - check for proper XML structure
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'text/xml');
      
      // Check for parsing errors
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        console.error('XML parsing error:', parserError.textContent);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('XML validation error:', error);
      return false;
    }
  }

  /**
   * Submit sitemap to search engines
   */
  async submitToSearchEngines(sitemapUrl: string): Promise<void> {
    const searchEngines = [
      {
        name: 'Google',
        url: `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
      },
      {
        name: 'Bing',
        url: `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
      },
    ];

    for (const engine of searchEngines) {
      try {
        // Note: In a real implementation, you'd make HTTP requests to these URLs
        // For now, we'll just log the submission
        console.log(`Submitting sitemap to ${engine.name}: ${engine.url}`);
        
        // In production, you would:
        // await fetch(engine.url);
      } catch (error) {
        console.error(`Error submitting to ${engine.name}:`, error);
      }
    }
  }
}

// Helper function to generate sitemap for edge function
export async function generateSitemap(baseUrl: string): Promise<string> {
  const generator = new SitemapGenerator({ baseUrl });
  const result = await generator.generateSitemaps();
  
  if (!generator.validateXML(result.content)) {
    throw new Error('Generated sitemap has invalid XML');
  }
  
  return result.content;
}

// Helper function to check if regeneration is needed
export async function shouldRegenerateSitemap(): Promise<boolean> {
  try {
    // Check when sitemap was last generated (could store in database or cache)
    // For now, we'll regenerate if there have been updates in the last hour
    
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { count: profileCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'comedian')
      .eq('is_public', true)
      .gte('updated_at', oneHourAgo);
    
    const { count: eventCount } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .gte('updated_at', oneHourAgo);
    
    return (profileCount || 0) > 0 || (eventCount || 0) > 0;
  } catch (error) {
    console.error('Error checking sitemap regeneration:', error);
    return false;
  }
}