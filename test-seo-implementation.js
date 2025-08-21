#!/usr/bin/env node

import { generateComedianMetaTags, generatePersonSchema, generateBreadcrumbSchema } from './src/utils/seo/index.js';

// Test comedian data
const testComedian = {
  id: '123',
  name: 'John Smith',
  stage_name: 'Johnny Comedy',
  bio: 'John Smith, known on stage as Johnny Comedy, is a renowned stand-up comedian from Sydney. With over 10 years of experience, he has performed at major comedy festivals across Australia.',
  avatar_url: 'https://example.com/avatar.jpg',
  profile_slug: 'johnny-comedy',
  twitter_url: 'https://twitter.com/johnnycomedy',
  instagram_url: 'https://instagram.com/johnnycomedy',
  facebook_url: 'https://facebook.com/johnnycomedy',
  youtube_url: 'https://youtube.com/johnnycomedy',
  tiktok_url: 'https://tiktok.com/@johnnycomedy'
};

console.log('Testing SEO Implementation for Comedian Profiles\n');
console.log('===============================================\n');

// Test meta tags generation
console.log('1. Meta Tags Generation:');
const metaTags = generateComedianMetaTags(testComedian);
console.log(JSON.stringify(metaTags, null, 2));
console.log('\n');

// Test structured data generation
console.log('2. Person Schema (JSON-LD):');
const personSchema = generatePersonSchema({
  ...testComedian,
  social_media: {
    twitter: 'johnnycomedy',
    instagram: 'johnnycomedy',
    facebook: 'johnnycomedy',
    youtube: 'johnnycomedy',
    tiktok: 'johnnycomedy'
  },
  upcoming_shows: [
    {
      title: 'Friday Night Comedy',
      start_time: '2024-02-15T19:00:00',
      end_time: '2024-02-15T21:00:00',
      venue_name: 'Sydney Comedy Club',
      venue_address: '123 Comedy St, Sydney NSW 2000',
      ticket_url: 'https://example.com/tickets'
    }
  ]
});
console.log(JSON.stringify(personSchema, null, 2));
console.log('\n');

// Test breadcrumb schema
console.log('3. Breadcrumb Schema:');
const breadcrumbSchema = generateBreadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: 'Comedians', url: '/comedians' },
  { name: 'Johnny Comedy' }
]);
console.log(JSON.stringify(breadcrumbSchema, null, 2));
console.log('\n');

console.log('✅ SEO implementation test complete!');
console.log('\nKey features implemented:');
console.log('- Open Graph meta tags for social sharing');
console.log('- Twitter Card support');
console.log('- JSON-LD structured data (Person, Event, Organization schemas)');
console.log('- Image optimization for social media');
console.log('- Dynamic sitemap generation utilities');
console.log('- SEO-friendly URLs and breadcrumbs');