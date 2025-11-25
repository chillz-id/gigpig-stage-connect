import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Extract meta tag content by property or name
 */
function extractMetaContent(html: string, property: string): string | null {
  // Try Open Graph meta tags first (property="og:...")
  const ogRegex = new RegExp(
    `<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["'][^>]*>`,
    'i'
  );
  const ogMatch = html.match(ogRegex);
  if (ogMatch && ogMatch[1]) {
    return ogMatch[1];
  }

  // Try Twitter Card meta tags (name="twitter:...")
  const twitterProperty = property.replace('og:', 'twitter:');
  const twitterRegex = new RegExp(
    `<meta[^>]*name=["']${twitterProperty}["'][^>]*content=["']([^"']*)["'][^>]*>`,
    'i'
  );
  const twitterMatch = html.match(twitterRegex);
  if (twitterMatch && twitterMatch[1]) {
    return twitterMatch[1];
  }

  // Try reversed attribute order (content before property/name)
  const reversedOgRegex = new RegExp(
    `<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${property}["'][^>]*>`,
    'i'
  );
  const reversedOgMatch = html.match(reversedOgRegex);
  if (reversedOgMatch && reversedOgMatch[1]) {
    return reversedOgMatch[1];
  }

  return null;
}

/**
 * Fetch and parse Open Graph metadata from a URL
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()

    if (!url || typeof url !== 'string') {
      throw new Error('URL parameter is required')
    }

    // Validate URL format
    let targetUrl: URL
    try {
      targetUrl = new URL(url)
    } catch {
      throw new Error('Invalid URL format')
    }

    // Fetch the HTML content
    const response = await fetch(targetUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; StandUpSydney/1.0; +https://gigpigs.app)',
      },
      redirect: 'follow',
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`)
    }

    const html = await response.text()

    // Extract Open Graph metadata
    const image = extractMetaContent(html, 'og:image');
    const title = extractMetaContent(html, 'og:title');
    const description = extractMetaContent(html, 'og:description');

    // If no OG data found, try to extract from basic HTML tags
    let fallbackTitle = title;
    let fallbackDescription = description;

    if (!fallbackTitle) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        fallbackTitle = titleMatch[1].trim();
      }
    }

    if (!fallbackDescription) {
      const descMatch = html.match(
        /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i
      );
      if (descMatch && descMatch[1]) {
        fallbackDescription = descMatch[1];
      }
    }

    // Return metadata
    return new Response(
      JSON.stringify({
        url: targetUrl.toString(),
        image: image || null,
        title: fallbackTitle || targetUrl.hostname,
        description: fallbackDescription || null,
        success: true,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('OG fetch error:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to fetch Open Graph metadata',
        success: false,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
