interface PersonSchema {
  '@context': string;
  '@type': string;
  name: string;
  alternateName?: string;
  description?: string;
  image?: string;
  url?: string;
  sameAs?: string[];
  jobTitle?: string;
  performerIn?: EventSchema[];
  memberOf?: OrganizationSchema;
}

interface EventSchema {
  '@type': string;
  name: string;
  startDate: string;
  endDate?: string;
  location: {
    '@type': string;
    name: string;
    address?: {
      '@type': string;
      streetAddress?: string;
      addressLocality?: string;
      addressRegion?: string;
      postalCode?: string;
      addressCountry?: string;
    };
  };
  url?: string;
  image?: string;
  description?: string;
  performer?: {
    '@type': string;
    name: string;
  };
  offers?: {
    '@type': string;
    url?: string;
    price?: string;
    priceCurrency?: string;
    availability?: string;
    validFrom?: string;
  };
}

interface OrganizationSchema {
  '@type': string;
  name: string;
  url?: string;
}

export const generatePersonSchema = (comedian: {
  name: string;
  stage_name?: string;
  bio?: string;
  profile_picture?: string;
  slug?: string;
  social_media?: {
    twitter?: string;
    instagram?: string;
    facebook?: string;
    youtube?: string;
    tiktok?: string;
  };
  agency?: {
    name: string;
    website?: string;
  };
  upcoming_shows?: Array<{
    title: string;
    start_time: string;
    end_time?: string;
    venue_name?: string;
    venue_address?: string;
    ticket_url?: string;
  }>;
}): PersonSchema => {
  const baseUrl = window.location.origin;
  const displayName = comedian.stage_name || comedian.name;
  
  // Build sameAs array from social media links
  const sameAs: string[] = [];
  if (comedian.social_media) {
    if (comedian.social_media.twitter) {
      sameAs.push(`https://twitter.com/${comedian.social_media.twitter}`);
    }
    if (comedian.social_media.instagram) {
      sameAs.push(`https://instagram.com/${comedian.social_media.instagram}`);
    }
    if (comedian.social_media.facebook) {
      sameAs.push(`https://facebook.com/${comedian.social_media.facebook}`);
    }
    if (comedian.social_media.youtube) {
      sameAs.push(`https://youtube.com/${comedian.social_media.youtube}`);
    }
    if (comedian.social_media.tiktok) {
      sameAs.push(`https://tiktok.com/@${comedian.social_media.tiktok}`);
    }
  }
  
  const personSchema: PersonSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: displayName,
    ...(comedian.stage_name && comedian.name !== comedian.stage_name ? { alternateName: comedian.name } : {}),
    ...(comedian.bio ? { description: comedian.bio } : {}),
    ...(comedian.profile_picture ? { image: `${baseUrl}${comedian.profile_picture}` } : {}),
    url: comedian.slug ? `${baseUrl}/comedians/${comedian.slug}` : `${baseUrl}/profile/${comedian.name}`,
    ...(sameAs.length > 0 ? { sameAs } : {}),
    jobTitle: 'Comedian',
    ...(comedian.agency ? {
      memberOf: {
        '@type': 'Organization',
        name: comedian.agency.name,
        ...(comedian.agency.website ? { url: comedian.agency.website } : {})
      }
    } : {})
  };
  
  // Add upcoming shows as performerIn events
  if (comedian.upcoming_shows && comedian.upcoming_shows.length > 0) {
    personSchema.performerIn = comedian.upcoming_shows.map(show => generateEventSchema({
      name: show.title,
      startDate: show.start_time,
      endDate: show.end_time,
      location: {
        name: show.venue_name || 'TBA',
        address: show.venue_address
      },
      performer: {
        name: displayName
      },
      ...(show.ticket_url ? {
        offers: {
          url: show.ticket_url
        }
      } : {})
    }));
  }
  
  return personSchema;
};

export const generateEventSchema = (event: {
  name: string;
  startDate: string;
  endDate?: string;
  location: {
    name: string;
    address?: string;
  };
  url?: string;
  image?: string;
  description?: string;
  performer?: {
    name: string;
  };
  offers?: {
    url?: string;
    price?: string;
    priceCurrency?: string;
    availability?: string;
    validFrom?: string;
  };
}): EventSchema => {
  const baseUrl = window.location.origin;
  
  return {
    '@type': 'ComedyEvent',
    name: event.name,
    startDate: event.startDate,
    ...(event.endDate ? { endDate: event.endDate } : {}),
    location: {
      '@type': 'Place',
      name: event.location.name,
      ...(event.location.address ? {
        address: {
          '@type': 'PostalAddress',
          streetAddress: event.location.address,
          addressLocality: 'Sydney',
          addressRegion: 'NSW',
          addressCountry: 'AU'
        }
      } : {})
    },
    ...(event.url ? { url: `${baseUrl}${event.url}` } : {}),
    ...(event.image ? { image: `${baseUrl}${event.image}` } : {}),
    ...(event.description ? { description: event.description } : {}),
    ...(event.performer ? {
      performer: {
        '@type': 'Person',
        name: event.performer.name
      }
    } : {}),
    ...(event.offers ? {
      offers: {
        '@type': 'Offer',
        ...(event.offers.url ? { url: event.offers.url } : {}),
        ...(event.offers.price ? { price: event.offers.price } : {}),
        priceCurrency: event.offers.priceCurrency || 'AUD',
        availability: event.offers.availability || 'https://schema.org/InStock',
        ...(event.offers.validFrom ? { validFrom: event.offers.validFrom } : {})
      }
    } : {})
  };
};

export const generateBreadcrumbSchema = (items: Array<{ name: string; url?: string }>) => {
  const baseUrl = window.location.origin;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.url ? { item: `${baseUrl}${item.url}` } : {})
    }))
  };
};

export const generateOrganizationSchema = () => {
  const baseUrl = window.location.origin;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Stand Up Sydney',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: 'Sydney\'s premier comedy platform connecting comedians with venues and audiences',
    sameAs: [
      'https://facebook.com/standupsydney',
      'https://instagram.com/standupsydney',
      'https://twitter.com/standupsydney'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'support@standupsydney.com',
      areaServed: 'AU',
      availableLanguage: ['English']
    }
  };
};