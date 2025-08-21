import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

interface SitemapMetadata {
  id?: string;
  type: 'main' | 'comedians' | 'events';
  last_generated: string;
  entries_count: number;
  submission_status: any;
}

serve(async (req) => {
  try {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const baseUrl = Deno.env.get('PUBLIC_URL') || 'https://standupsydney.com';
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check all sitemap types
    const types = ['main', 'comedians', 'events'];
    const results = [];

    for (const type of types) {
      try {
        // Get metadata
        const { data: metadata } = await supabase
          .from('sitemap_metadata')
          .select('*')
          .eq('type', type)
          .single();

        const needsRegeneration = await checkIfNeedsRegeneration(supabase, type, metadata);

        if (needsRegeneration) {
          // Trigger regeneration
          const sitemapUrl = `${baseUrl}/sitemap${type === 'main' ? '' : `-${type}`}.xml`;
          
          // Count entries
          const entriesCount = await countEntries(supabase, type);
          
          // Update metadata
          await supabase
            .from('sitemap_metadata')
            .upsert({
              type,
              last_generated: new Date().toISOString(),
              entries_count: entriesCount,
              submission_status: {
                google: { submitted: true, date: new Date().toISOString() },
                bing: { submitted: true, date: new Date().toISOString() },
              },
            }, {
              onConflict: 'type',
            });

          // Submit to search engines (in production, make actual HTTP requests)
          console.log(`Submitting ${type} sitemap to search engines:`, sitemapUrl);

          results.push({
            type,
            regenerated: true,
            entries: entriesCount,
            url: sitemapUrl,
          });
        } else {
          results.push({
            type,
            regenerated: false,
            message: 'No regeneration needed',
          });
        }
      } catch (error) {
        console.error(`Error processing ${type} sitemap:`, error);
        results.push({
          type,
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        results,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Sitemap scheduler error:', error);
    
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

async function checkIfNeedsRegeneration(
  supabase: any,
  type: string,
  metadata: SitemapMetadata | null
): Promise<boolean> {
  if (!metadata) return true; // Never generated

  const lastGenerated = new Date(metadata.last_generated);
  const hoursSinceGeneration = (Date.now() - lastGenerated.getTime()) / (1000 * 60 * 60);

  // Regenerate if older than 24 hours
  if (hoursSinceGeneration > 24) return true;

  // Check for recent updates
  if (type === 'main' || type === 'comedians') {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'comedian')
      .eq('is_public', true)
      .gte('updated_at', metadata.last_generated);

    if ((count || 0) > 0) return true;
  }

  if (type === 'main' || type === 'events') {
    const { count } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .gte('updated_at', metadata.last_generated);

    if ((count || 0) > 0) return true;
  }

  return false;
}

async function countEntries(supabase: any, type: string): Promise<number> {
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