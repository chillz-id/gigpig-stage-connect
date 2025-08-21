/**
 * Sitemap generation utilities for SEO
 */

export interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export const generateSitemapXML = (entries: SitemapEntry[]): string => {
  const baseUrl = 'https://standupsydney.com';
  
  const xmlEntries = entries.map(entry => `
  <url>
    <loc>${baseUrl}${entry.loc}</loc>
    ${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ''}
    ${entry.changefreq ? `<changefreq>${entry.changefreq}</changefreq>` : ''}
    ${entry.priority !== undefined ? `<priority>${entry.priority}</priority>` : ''}
  </url>`).join('');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;
};

export const getStaticRoutes = (): SitemapEntry[] => {
  const now = new Date().toISOString().split('T')[0];
  
  return [
    { loc: '/', lastmod: now, changefreq: 'daily', priority: 1.0 },
    { loc: '/comedians', lastmod: now, changefreq: 'daily', priority: 0.9 },
    { loc: '/shows', lastmod: now, changefreq: 'daily', priority: 0.9 },
    { loc: '/auth', lastmod: now, changefreq: 'monthly', priority: 0.5 },
    { loc: '/photographers', lastmod: now, changefreq: 'weekly', priority: 0.7 },
  ];
};

export const generateComedianSitemapEntries = (comedians: Array<{
  profile_slug?: string;
  name: string;
  updated_at?: string;
}>): SitemapEntry[] => {
  return comedians.map(comedian => ({
    loc: `/comedians/${comedian.profile_slug || comedian.name.toLowerCase().replace(/\s+/g, '-')}`,
    lastmod: comedian.updated_at ? new Date(comedian.updated_at).toISOString().split('T')[0] : undefined,
    changefreq: 'weekly' as const,
    priority: 0.8
  }));
};

export const generateEventSitemapEntries = (events: Array<{
  id: string;
  slug?: string;
  updated_at?: string;
}>): SitemapEntry[] => {
  return events.map(event => ({
    loc: `/events/${event.slug || event.id}`,
    lastmod: event.updated_at ? new Date(event.updated_at).toISOString().split('T')[0] : undefined,
    changefreq: 'weekly' as const,
    priority: 0.7
  }));
};