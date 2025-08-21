#!/usr/bin/env node

import fetch from 'node-fetch';
import ora from 'ora';
import chalk from 'chalk';

const baseUrl = process.env.VITE_PUBLIC_URL || 'https://standupsydney.com';

// Search engines to submit to
const searchEngines = [
  {
    name: 'Google',
    pingUrl: (sitemapUrl) => `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
    color: 'blue',
  },
  {
    name: 'Bing',
    pingUrl: (sitemapUrl) => `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
    color: 'cyan',
  },
];

// Sitemaps to submit
const sitemaps = [
  { name: 'Main', path: '/sitemap.xml' },
  { name: 'Comedians', path: '/sitemap-comedians.xml' },
  { name: 'Events', path: '/sitemap-events.xml' },
];

// Submit a sitemap to a search engine
async function submitSitemap(engine, sitemapUrl) {
  const spinner = ora(`Submitting to ${engine.name}...`).start();
  
  try {
    const pingUrl = engine.pingUrl(sitemapUrl);
    const response = await fetch(pingUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Stand Up Sydney Sitemap Submitter',
      },
    });

    if (response.ok) {
      spinner.succeed(chalk[engine.color](`✓ ${engine.name}: Submitted successfully`));
      return true;
    } else {
      spinner.warn(chalk.yellow(`⚠ ${engine.name}: Received status ${response.status}`));
      return false;
    }
  } catch (error) {
    spinner.fail(chalk.red(`✗ ${engine.name}: ${error.message}`));
    return false;
  }
}

// Main function
async function submitSitemaps() {
  console.log(chalk.cyan('🚀 Submitting sitemaps to search engines\n'));
  console.log(chalk.dim(`Base URL: ${baseUrl}\n`));

  const results = {
    total: 0,
    successful: 0,
    failed: 0,
  };

  for (const sitemap of sitemaps) {
    const sitemapUrl = `${baseUrl}${sitemap.path}`;
    console.log(chalk.bold(`\n${sitemap.name} Sitemap:`));
    console.log(chalk.dim(sitemapUrl));
    
    for (const engine of searchEngines) {
      results.total++;
      const success = await submitSitemap(engine, sitemapUrl);
      if (success) {
        results.successful++;
      } else {
        results.failed++;
      }
    }
  }

  // Summary
  console.log(chalk.bold('\n📊 Summary:'));
  console.log(`  • Total submissions: ${results.total}`);
  console.log(`  • ${chalk.green(`Successful: ${results.successful}`)}`);
  if (results.failed > 0) {
    console.log(`  • ${chalk.red(`Failed: ${results.failed}`)}`);
  }

  // Additional instructions
  console.log(chalk.yellow('\n💡 Additional steps:'));
  console.log('  1. Verify ownership in Google Search Console');
  console.log('  2. Submit sitemaps manually through webmaster tools');
  console.log('  3. Monitor indexing status regularly');
  console.log('  4. Check for crawl errors\n');

  console.log(chalk.dim('Note: Some search engines may require manual verification'));
  console.log(chalk.dim('Visit their webmaster tools for more detailed submission:\n'));
  console.log(chalk.dim('  • Google: https://search.google.com/search-console'));
  console.log(chalk.dim('  • Bing: https://www.bing.com/webmasters\n'));
}

// Run the script
submitSitemaps();