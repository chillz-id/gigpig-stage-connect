import { useEffect } from 'react';

export const SitemapRoute = () => {
  useEffect(() => {
    // Redirect to the edge function that serves the sitemap
    const baseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const sitemapUrl = `${baseUrl}/functions/v1/sitemap/sitemap.xml?baseUrl=${window.location.origin}`;
    window.location.href = sitemapUrl;
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting to sitemap...</p>
    </div>
  );
};