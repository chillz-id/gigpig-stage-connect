#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import ora from 'ora';
import chalk from 'chalk';

// Get Supabase configuration from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const baseUrl = process.env.VITE_PUBLIC_URL || 'https://standupsydney.com';

if (!supabaseUrl || !supabaseKey) {
  console.error(chalk.red('Error: Supabase configuration not found in environment variables'));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Spinner for progress indication
const spinner = ora();

// Escape XML special characters
function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Generate XML for a sitemap
function generateSitemapXML(entries) {
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ];

  for (const entry of entries) {
    xml.push('  <url>');
    xml.push(`    <loc>${escapeXml(entry.loc)}</loc>`);
    
    if (entry.lastmod) {
      xml.push(`    <lastmod>${entry.lastmod}</lastmod>`);
    }
    
    if (entry.changefreq) {
      xml.push(`    <changefreq>${entry.changefreq}</changefreq>`);
    }
    
    if (entry.priority !== undefined) {
      xml.push(`    <priority>${entry.priority}</priority>`);
    }
    
    xml.push(`    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(entry.loc)}" />`);
    xml.push('  </url>');
  }

  xml.push('</urlset>');
  return xml.join('\n');
}

// Fetch comedian profiles
async function fetchComedianProfiles() {
  spinner.text = 'Fetching comedian profiles...';
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, stage_name, profile_url, updated_at')
    .eq('role', 'comedian')
    .eq('is_public', true)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch comedian profiles: ${error.message}`);
  }

  const entries = [];
  for (const profile of profiles || []) {
    const slug = profile.profile_url || profile.id;
    entries.push({
      loc: `${baseUrl}/comedian/${slug}`,
      lastmod: profile.updated_at ? new Date(profile.updated_at).toISOString() : undefined,
      changefreq: 'weekly',
      priority: 0.8,
    });
  }

  return entries;
}

// Fetch public events
async function fetchPublicEvents() {
  spinner.text = 'Fetching public events...';
  
  const { data: events, error } = await supabase
    .from('events')
    .select('id, name, date, updated_at')
    .eq('status', 'published')
    .gte('date', new Date().toISOString())
    .order('date', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch events: ${error.message}`);
  }

  const entries = [];
  for (const event of events || []) {
    entries.push({
      loc: `${baseUrl}/events/${event.id}`,
      lastmod: event.updated_at ? new Date(event.updated_at).toISOString() : undefined,
      changefreq: 'daily',
      priority: 0.7,
    });
  }

  return entries;
}

// Get static pages
function getStaticPages() {
  const staticPages = [
    { path: '/', priority: 1.0, changefreq: 'daily' },
    { path: '/shows', priority: 0.9, changefreq: 'daily' },
    { path: '/comedians', priority: 0.9, changefreq: 'daily' },
    { path: '/photographers', priority: 0.7, changefreq: 'weekly' },
    { path: '/book-comedian', priority: 0.8, changefreq: 'weekly' },
  ];

  return staticPages.map(page => ({
    loc: `${baseUrl}${page.path}`,
    changefreq: page.changefreq,
    priority: page.priority,
    lastmod: new Date().toISOString(),
  }));
}

// Main function
async function generateSitemaps() {
  console.log(chalk.cyan('🗺️  Generating sitemaps for Stand Up Sydney\n'));
  
  try {
    spinner.start('Generating sitemaps...');
    
    // Fetch all data
    const [comedianEntries, eventEntries] = await Promise.all([
      fetchComedianProfiles(),
      fetchPublicEvents(),
    ]);
    
    const staticEntries = getStaticPages();
    
    spinner.text = 'Creating sitemap files...';
    
    // Generate main sitemap
    const allEntries = [...staticEntries, ...comedianEntries, ...eventEntries];
    const mainSitemap = generateSitemapXML(allEntries);
    
    // Generate comedian-specific sitemap
    const comedianSitemap = generateSitemapXML(comedianEntries);
    
    // Generate event-specific sitemap
    const eventSitemap = generateSitemapXML(eventEntries);
    
    // Write files
    const publicDir = resolve(process.cwd(), 'public');
    
    writeFileSync(resolve(publicDir, 'sitemap.xml'), mainSitemap);
    writeFileSync(resolve(publicDir, 'sitemap-comedians.xml'), comedianSitemap);
    writeFileSync(resolve(publicDir, 'sitemap-events.xml'), eventSitemap);
    
    spinner.succeed(chalk.green('✅ Sitemaps generated successfully!\n'));
    
    // Summary
    console.log(chalk.bold('Summary:'));
    console.log(`  • Static pages: ${staticEntries.length}`);
    console.log(`  • Comedian profiles: ${comedianEntries.length}`);
    console.log(`  • Events: ${eventEntries.length}`);
    console.log(`  • Total entries: ${allEntries.length}\n`);
    
    console.log(chalk.bold('Generated files:'));
    console.log(`  • ${chalk.cyan('public/sitemap.xml')} (main sitemap)`);
    console.log(`  • ${chalk.cyan('public/sitemap-comedians.xml')} (comedians only)`);
    console.log(`  • ${chalk.cyan('public/sitemap-events.xml')} (events only)\n`);
    
    console.log(chalk.yellow('💡 Tip: Run "npm run sitemap:submit" to submit to search engines'));
    
  } catch (error) {
    spinner.fail(chalk.red('Failed to generate sitemaps'));
    console.error(chalk.red(`\nError: ${error.message}`));
    process.exit(1);
  }
}

// Run the script
generateSitemaps();