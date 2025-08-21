import { Helmet } from 'react-helmet-async';
import { getOptimizedImageUrl, getComedianProfileImage } from './imageOptimization';

export interface MetaTagsProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: string;
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  };
  twitter?: {
    card?: 'summary' | 'summary_large_image' | 'app' | 'player';
    site?: string;
    creator?: string;
  };
}

export const generateMetaTags = ({
  title,
  description,
  image,
  url,
  type = 'website',
  article,
  twitter = { card: 'summary_large_image' }
}: MetaTagsProps) => {
  const siteName = 'Stand Up Sydney';
  const defaultImage = '/og-default.jpg';
  const baseUrl = window.location.origin;
  
  const fullUrl = url ? `${baseUrl}${url}` : window.location.href;
  const fullImage = image ? `${baseUrl}${image}` : `${baseUrl}${defaultImage}`;
  
  return {
    title: `${title} | ${siteName}`,
    meta: [
      // Basic meta tags
      { name: 'description', content: description },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      
      // Open Graph tags
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: fullImage },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:url', content: fullUrl },
      { property: 'og:type', content: type },
      { property: 'og:site_name', content: siteName },
      { property: 'og:locale', content: 'en_AU' },
      
      // Twitter Card tags
      { name: 'twitter:card', content: twitter.card },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: fullImage },
      { name: 'twitter:image:alt', content: `${title} profile image` },
      ...(twitter.site ? [{ name: 'twitter:site', content: twitter.site }] : []),
      ...(twitter.creator ? [{ name: 'twitter:creator', content: twitter.creator }] : []),
      
      // Article specific tags
      ...(article ? [
        ...(article.publishedTime ? [{ property: 'article:published_time', content: article.publishedTime }] : []),
        ...(article.modifiedTime ? [{ property: 'article:modified_time', content: article.modifiedTime }] : []),
        ...(article.author ? [{ property: 'article:author', content: article.author }] : []),
        ...(article.section ? [{ property: 'article:section', content: article.section }] : []),
        ...(article.tags?.map(tag => ({ property: 'article:tag', content: tag })) || [])
      ] : [])
    ],
    link: [
      { rel: 'canonical', href: fullUrl }
    ]
  };
};

export const generateComedianMetaTags = (comedian: {
  name: string;
  stage_name?: string;
  bio?: string;
  profile_picture?: string;
  avatar_url?: string;
  slug?: string;
  social_media?: {
    twitter?: string;
    instagram?: string;
    facebook?: string;
  };
}) => {
  const displayName = comedian.stage_name || comedian.name;
  const description = comedian.bio
    ? comedian.bio.substring(0, 160) + (comedian.bio.length > 160 ? '...' : '')
    : `${displayName} is a comedian performing in Sydney. View their profile, upcoming shows, and booking information.`;
  
  const url = comedian.slug ? `/comedians/${comedian.slug}` : `/profile/${comedian.name}`;
  const optimizedImage = getComedianProfileImage(comedian);
  
  return generateMetaTags({
    title: `${displayName} - Comedian Profile`,
    description,
    image: optimizedImage,
    url,
    type: 'profile',
    twitter: {
      card: 'summary_large_image',
      ...(comedian.social_media?.twitter ? { creator: `@${comedian.social_media.twitter}` } : {})
    }
  });
};