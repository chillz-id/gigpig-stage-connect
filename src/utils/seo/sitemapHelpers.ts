import { Helmet } from 'react-helmet-async';

interface SitemapMetaTags {
  canonicalUrl: string;
  alternateLanguages?: { lang: string; url: string }[];
  lastModified?: Date;
}

/**
 * Generate meta tags for sitemap-related pages
 */
export const SitemapMetaTags = ({ canonicalUrl, alternateLanguages = [], lastModified }: SitemapMetaTags) => {
  return (
    <Helmet>
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Alternate language links */}
      {alternateLanguages.map(({ lang, url }) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={url} />
      ))}
      
      {/* Default language */}
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />
      
      {/* Last modified */}
      {lastModified && (
        <meta property="article:modified_time" content={lastModified.toISOString()} />
      )}
    </Helmet>
  );
};

/**
 * Generate structured data for comedian profiles
 */
export const generateComedianStructuredData = (comedian: {
  id: string;
  full_name: string;
  stage_name?: string;
  bio?: string;
  profile_picture?: string;
  social_links?: any;
  location?: string;
}) => {
  const name = comedian.stage_name || comedian.full_name;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${window.location.origin}/comedian/${comedian.id}`,
    name: name,
    alternateName: comedian.stage_name ? comedian.full_name : undefined,
    description: comedian.bio,
    image: comedian.profile_picture,
    url: `${window.location.origin}/comedian/${comedian.id}`,
    jobTitle: 'Comedian',
    performerIn: {
      '@type': 'TheaterEvent',
      name: 'Stand-up Comedy',
    },
    sameAs: comedian.social_links ? [
      comedian.social_links.instagram && `https://instagram.com/${comedian.social_links.instagram}`,
      comedian.social_links.twitter && `https://twitter.com/${comedian.social_links.twitter}`,
      comedian.social_links.facebook && `https://facebook.com/${comedian.social_links.facebook}`,
      comedian.social_links.website,
    ].filter(Boolean) : [],
    address: comedian.location ? {
      '@type': 'PostalAddress',
      addressLocality: comedian.location,
      addressCountry: 'AU',
    } : undefined,
  };
};

/**
 * Generate structured data for events
 */
export const generateEventStructuredData = (event: {
  id: string;
  name: string;
  description?: string;
  date: string;
  venue?: {
    name: string;
    address?: string;
    city?: string;
  };
  ticket_price?: number;
  image_url?: string;
}) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'ComedyEvent',
    '@id': `${window.location.origin}/events/${event.id}`,
    name: event.name,
    description: event.description,
    startDate: event.date,
    url: `${window.location.origin}/events/${event.id}`,
    image: event.image_url,
    location: event.venue ? {
      '@type': 'Place',
      name: event.venue.name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: event.venue.address,
        addressLocality: event.venue.city || 'Sydney',
        addressRegion: 'NSW',
        addressCountry: 'AU',
      },
    } : undefined,
    offers: event.ticket_price !== undefined ? {
      '@type': 'Offer',
      price: event.ticket_price,
      priceCurrency: 'AUD',
      availability: 'https://schema.org/InStock',
      url: `${window.location.origin}/events/${event.id}`,
    } : undefined,
    performer: {
      '@type': 'PerformingGroup',
      name: 'Stand Up Sydney Comedians',
    },
  };
};

/**
 * Generate breadcrumb structured data
 */
export const generateBreadcrumbStructuredData = (items: { name: string; url?: string }[]) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url || undefined,
    })),
  };
};

/**
 * Helper to inject structured data into the page
 */
export const StructuredData = ({ data }: { data: any }) => {
  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(data)}
      </script>
    </Helmet>
  );
};