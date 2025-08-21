#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { existsSync, statSync } from 'fs';
import { resolve } from 'path';
import ora from 'ora';
import chalk from 'chalk';

// Get Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const baseUrl = process.env.VITE_PUBLIC_URL || 'https://standupsydney.com';

if (!supabaseUrl || !supabaseKey) {
  console.error(chalk.red('Error: Supabase configuration not found in environment variables'));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Check sitemap file status
function checkSitemapFile(filename) {
  const filepath = resolve(process.cwd(), 'public', filename);
  
  if (!existsSync(filepath)) {
    return { exists: false };
  }
  
  const stats = statSync(filepath);
  const ageInHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
  
  return {
    exists: true,
    size: stats.size,
    modified: stats.mtime,
    ageInHours: Math.round(ageInHours * 10) / 10,
    isStale: ageInHours > 24,
  };
}

// Check for recent content updates
async function checkContentUpdates() {
  const spinner = ora('Checking for recent content updates...').start();
  
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    // Check comedian profile updates
    const { count: comedianUpdates } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'comedian')
      .eq('is_public', true)
      .gte('updated_at', oneDayAgo);
    
    // Check event updates
    const { count: eventUpdates } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .gte('updated_at', oneDayAgo);
    
    spinner.stop();
    
    return {
      comedianUpdates: comedianUpdates || 0,
      eventUpdates: eventUpdates || 0,
      hasUpdates: (comedianUpdates || 0) + (eventUpdates || 0) > 0,
    };
  } catch (error) {
    spinner.fail('Failed to check content updates');
    throw error;
  }
}

// Get sitemap metadata from database
async function getSitemapMetadata() {
  const spinner = ora('Fetching sitemap metadata...').start();
  
  try {
    const { data, error } = await supabase
      .from('sitemap_metadata')
      .select('*')
      .order('last_generated', { ascending: false });
    
    spinner.stop();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    spinner.fail('Failed to fetch metadata');
    throw error;
  }
}

// Get content statistics
async function getContentStats() {
  const spinner = ora('Gathering content statistics...').start();
  
  try {
    const [comedianResult, eventResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'comedian')
        .eq('is_public', true),
      supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')
        .gte('date', new Date().toISOString()),
    ]);
    
    spinner.stop();
    
    return {
      comedians: comedianResult.count || 0,
      events: eventResult.count || 0,
      static: 5, // Static pages count
    };
  } catch (error) {
    spinner.fail('Failed to get content statistics');
    throw error;
  }
}

// Format file size
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Main monitoring function
async function monitorSitemaps() {
  console.log(chalk.cyan('📊 Sitemap Monitoring Dashboard\n'));
  
  try {
    // Check sitemap files
    console.log(chalk.bold('📁 Sitemap Files:'));
    const sitemapFiles = [
      { name: 'sitemap.xml', description: 'Main sitemap' },
      { name: 'sitemap-comedians.xml', description: 'Comedian profiles' },
      { name: 'sitemap-events.xml', description: 'Events listing' },
    ];
    
    let regenerationNeeded = false;
    
    for (const file of sitemapFiles) {
      const status = checkSitemapFile(file.name);
      
      if (!status.exists) {
        console.log(`  ${chalk.red('✗')} ${file.name} - ${chalk.red('Not found')}`);
        regenerationNeeded = true;
      } else {
        const statusColor = status.isStale ? 'yellow' : 'green';
        const statusIcon = status.isStale ? '⚠' : '✓';
        
        console.log(`  ${chalk[statusColor](statusIcon)} ${file.name}`);
        console.log(`     Size: ${formatFileSize(status.size)}`);
        console.log(`     Age: ${status.ageInHours} hours`);
        
        if (status.isStale) {
          regenerationNeeded = true;
        }
      }
    }
    
    // Check content updates
    console.log(chalk.bold('\n🔄 Recent Updates:'));
    const updates = await checkContentUpdates();
    
    if (updates.hasUpdates) {
      console.log(`  ${chalk.yellow('⚠')} Content updated in the last 24 hours:`);
      if (updates.comedianUpdates > 0) {
        console.log(`     • ${updates.comedianUpdates} comedian profile(s)`);
      }
      if (updates.eventUpdates > 0) {
        console.log(`     • ${updates.eventUpdates} event(s)`);
      }
      regenerationNeeded = true;
    } else {
      console.log(`  ${chalk.green('✓')} No content updates in the last 24 hours`);
    }
    
    // Get content statistics
    console.log(chalk.bold('\n📈 Content Statistics:'));
    const stats = await getContentStats();
    const totalEntries = stats.comedians + stats.events + stats.static;
    
    console.log(`  • Total entries: ${totalEntries}`);
    console.log(`    - Static pages: ${stats.static}`);
    console.log(`    - Comedian profiles: ${stats.comedians}`);
    console.log(`    - Events: ${stats.events}`);
    
    // Get sitemap metadata
    console.log(chalk.bold('\n🗄️  Database Metadata:'));
    const metadata = await getSitemapMetadata();
    
    if (metadata.length === 0) {
      console.log(`  ${chalk.yellow('⚠')} No metadata found in database`);
    } else {
      for (const meta of metadata) {
        const lastGen = new Date(meta.last_generated);
        const ageInHours = (Date.now() - lastGen.getTime()) / (1000 * 60 * 60);
        
        console.log(`\n  ${chalk.bold(meta.type)} sitemap:`);
        console.log(`    Last generated: ${lastGen.toLocaleString()}`);
        console.log(`    Entries: ${meta.entries_count}`);
        
        if (meta.submission_status?.google?.submitted) {
          console.log(`    Google: ${chalk.green('✓')} Submitted`);
        }
        if (meta.submission_status?.bing?.submitted) {
          console.log(`    Bing: ${chalk.green('✓')} Submitted`);
        }
      }
    }
    
    // Recommendations
    console.log(chalk.bold('\n💡 Recommendations:'));
    
    if (regenerationNeeded) {
      console.log(`  ${chalk.yellow('•')} Sitemap regeneration recommended`);
      console.log(`    Run: ${chalk.cyan('npm run sitemap:generate')}`);
    } else {
      console.log(`  ${chalk.green('•')} Sitemaps are up to date`);
    }
    
    console.log(`\n  ${chalk.dim('View sitemaps:')}`);
    console.log(`  ${chalk.dim(`• ${baseUrl}/sitemap.xml`)}`);
    console.log(`  ${chalk.dim(`• ${baseUrl}/sitemap-comedians.xml`)}`);
    console.log(`  ${chalk.dim(`• ${baseUrl}/sitemap-events.xml`)}`);
    
  } catch (error) {
    console.error(chalk.red(`\nError: ${error.message}`));
    process.exit(1);
  }
}

// Run the monitoring
monitorSitemaps();