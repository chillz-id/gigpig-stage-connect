import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

// Sitemap generation logic
interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

class SitemapGenerator {
  private baseUrl: string;
  private supabaseClient: any;

  constructor(baseUrl: string, supabaseUrl: string, supabaseKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.supabaseClient = createClient(supabaseUrl, supabaseKey);
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

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
      
      xml.push(`    <xhtml:link rel="alternate" hreflang="en" href="${this.escapeXml(entry.loc)}" />`);
      xml.push('  </url>');
    }

    xml.push('</urlset>');
    return xml.join('\n');
  }

  async fetchComedianProfiles(): Promise<SitemapEntry[]> {
    try {
      const { data: profiles, error } = await this.supabaseClient
        .from('profiles')
        .select('id, full_name, stage_name, profile_url, updated_at')
        .eq('role', 'comedian')
        .eq('is_public', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const entries: SitemapEntry[] = [];

      for (const profile of profiles || []) {
        const slug = profile.profile_url || profile.id;
        
        entries.push({
          loc: `${this.baseUrl}/comedian/${slug}`,
          lastmod: profile.updated_at ? new Date(profile.updated_at).toISOString() : undefined,
          changefreq: 'weekly',
          priority: 0.8,
        });
      }

      return entries;
    } catch (error) {
      console.error('Error fetching comedian profiles:', error);
      return [];
    }
  }

  async fetchPublicEvents(): Promise<SitemapEntry[]> {
    try {
      const { data: events, error } = await this.supabaseClient
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

  async generateSitemap(): Promise<string> {
    const [comedianEntries, eventEntries] = await Promise.all([
      this.fetchComedianProfiles(),
      this.fetchPublicEvents(),
    ]);
    
    const staticEntries = this.getStaticPages();
    const allEntries = [...staticEntries, ...comedianEntries, ...eventEntries];
    
    return this.generateSitemapXML(allEntries);
  }
}

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const baseUrl = url.searchParams.get('baseUrl') || 'https://standupsydney.com';

    // Initialize generator
    const generator = new SitemapGenerator(baseUrl, supabaseUrl, supabaseKey);

    // Generate sitemap based on path
    let xml = '';
    
    if (path === '/sitemap.xml' || path === '/') {
      // Main sitemap
      xml = await generator.generateSitemap();
    } else if (path === '/sitemap-comedians.xml') {
      // Comedians-only sitemap
      const entries = await generator.fetchComedianProfiles();
      xml = generator['generateSitemapXML'](entries);
    } else if (path === '/sitemap-events.xml') {
      // Events-only sitemap
      const entries = await generator.fetchPublicEvents();
      xml = generator['generateSitemapXML'](entries);
    } else {
      return new Response('Not Found', { status: 404, headers: corsHeaders });
    }

    // Return XML with appropriate headers
    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
});