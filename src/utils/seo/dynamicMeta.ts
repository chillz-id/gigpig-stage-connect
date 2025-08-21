/**
 * Dynamic meta tag generators for different content types
 */

import { generateMetaTags, MetaTagsProps } from './metaTags';
import { getOptimizedImageUrl } from './imageOptimization';

export const generateEventMetaTags = (event: {
  title: string;
  description?: string;
  start_time: string;
  venue_name?: string;
  image_url?: string;
  slug?: string;
  id: string;
}): ReturnType<typeof generateMetaTags> => {
  const eventDate = new Date(event.start_time).toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const description = event.description
    ? event.description.substring(0, 160) + (event.description.length > 160 ? '...' : '')
    : `Comedy show at ${event.venue_name || 'Sydney'} on ${eventDate}. Get tickets and more information.`;
  
  return generateMetaTags({
    title: event.title,
    description,
    image: getOptimizedImageUrl(event.image_url),
    url: `/events/${event.slug || event.id}`,
    type: 'event',
    article: {
      publishedTime: new Date().toISOString(),
      section: 'Comedy Events'
    }
  });
};

export const generatePhotographerMetaTags = (photographer: {
  name: string;
  bio?: string;
  profile_picture?: string;
  avatar_url?: string;
  portfolio_url?: string;
}): ReturnType<typeof generateMetaTags> => {
  const description = photographer.bio
    ? photographer.bio.substring(0, 160) + (photographer.bio.length > 160 ? '...' : '')
    : `${photographer.name} is a professional photographer specializing in comedy events in Sydney.`;
  
  return generateMetaTags({
    title: `${photographer.name} - Event Photographer`,
    description,
    image: getOptimizedImageUrl(photographer.avatar_url || photographer.profile_picture),
    url: `/photographers/${photographer.name.toLowerCase().replace(/\s+/g, '-')}`,
    type: 'profile'
  });
};

export const generateShowMetaTags = (show: {
  title: string;
  description?: string;
  date: string;
  venue?: string;
  image?: string;
}): ReturnType<typeof generateMetaTags> => {
  const showDate = new Date(show.date).toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const description = show.description ||
    `${show.title} - Comedy show at ${show.venue || 'Sydney'} on ${showDate}`;
  
  return generateMetaTags({
    title: show.title,
    description: description.substring(0, 160) + (description.length > 160 ? '...' : ''),
    image: getOptimizedImageUrl(show.image),
    type: 'event'
  });
};

export const generateHomePageMetaTags = (): ReturnType<typeof generateMetaTags> => {
  return generateMetaTags({
    title: 'Stand Up Sydney - Comedy Events & Comedian Bookings',
    description: 'Sydney\'s premier comedy platform connecting comedians with venues and audiences. Find comedy shows, book comedians, and join the comedy community.',
    url: '/',
    type: 'website'
  });
};