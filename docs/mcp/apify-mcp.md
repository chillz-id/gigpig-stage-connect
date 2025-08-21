# Apify MCP Server Documentation

## Overview

The Apify MCP server provides web scraping and automation capabilities through the Model Context Protocol, enabling AI assistants to run Apify actors for data extraction and web automation tasks.

**Official Repository**: [github.com/apify/actors-mcp-server](https://github.com/apify/actors-mcp-server)

## Configuration

In `/root/agents/.mcp.json`:
```json
"apify": {
  "command": "npx",
  "args": [
    "-y",
    "@apify/actors-mcp-server@latest"
  ],
  "env": {
    "APIFY_TOKEN": "your_apify_token_here"
  }
}
```

## Available Tools

### Actor Management
- `list_actors`: List available actors
- `get_actor`: Get actor details
- `run_actor`: Execute actor with input
- `get_actor_run`: Get run status and results
- `stop_actor_run`: Stop running actor

### Run Management
- `list_runs`: List actor runs
- `get_run_log`: Get run execution logs
- `get_run_output`: Get run output data
- `download_run_dataset`: Download run dataset
- `abort_run`: Abort running actor

### Dataset Operations
- `list_datasets`: List available datasets
- `get_dataset`: Get dataset details
- `get_dataset_items`: Get dataset items
- `download_dataset`: Download dataset
- `delete_dataset`: Delete dataset

### Key-Value Store
- `list_key_value_stores`: List key-value stores
- `get_key_value_store`: Get store details
- `get_store_record`: Get record from store
- `set_store_record`: Set record in store
- `delete_store_record`: Delete record from store

### Request Queue
- `list_request_queues`: List request queues
- `get_request_queue`: Get queue details
- `add_request`: Add request to queue
- `get_request`: Get request from queue
- `update_request`: Update request in queue

## Usage Examples

### Running Actors
```javascript
// List available actors
const actors = await apify.list_actors({
  limit: 50,
  offset: 0
});

// Run web scraper actor
const run = await apify.run_actor({
  actorId: "apify/web-scraper",
  input: {
    startUrls: [
      { url: "https://example.com" }
    ],
    linkSelector: "a[href]",
    pageFunction: "context => ({ title: context.page.title() })",
    maxRequestsPerCrawl: 10
  }
});

// Get run results
const results = await apify.get_run_output({
  runId: run.id
});
```

### Social Media Scraping
```javascript
// Instagram scraper
const instagramRun = await apify.run_actor({
  actorId: "apify/instagram-scraper",
  input: {
    usernames: ["example_user"],
    resultsLimit: 50,
    includeStories: true
  }
});

// Twitter scraper
const twitterRun = await apify.run_actor({
  actorId: "apify/twitter-scraper",
  input: {
    searchTerms: ["#technology"],
    maxTweets: 100,
    startDate: "2024-01-01"
  }
});
```

### E-commerce Data Extraction
```javascript
// Amazon product scraper
const amazonRun = await apify.run_actor({
  actorId: "apify/amazon-product-scraper",
  input: {
    startUrls: [
      { url: "https://www.amazon.com/dp/B08N5WRWNW" }
    ],
    maxItems: 100,
    extendOutputFunction: "($) => ({ customField: $('.custom-selector').text() })"
  }
});

// Google Shopping scraper
const shoppingRun = await apify.run_actor({
  actorId: "apify/google-shopping-scraper",
  input: {
    queries: ["laptop", "smartphone"],
    maxItems: 50,
    countryCode: "US"
  }
});
```

### Dataset Management
```javascript
// Get dataset items
const items = await apify.get_dataset_items({
  datasetId: "dataset_123",
  format: "json",
  limit: 1000
});

// Download dataset
const dataset = await apify.download_dataset({
  datasetId: "dataset_123",
  format: "csv"
});

// Process dataset items
items.forEach(item => {
  console.log(`Title: ${item.title}`);
  console.log(`URL: ${item.url}`);
});
```

### Key-Value Store Operations
```javascript
// Store custom data
await apify.set_store_record({
  storeId: "store_123",
  key: "config",
  value: {
    scraping_settings: {
      delay: 1000,
      retries: 3
    }
  }
});

// Retrieve stored data
const config = await apify.get_store_record({
  storeId: "store_123",
  key: "config"
});
```

## Popular Actors

### Web Scraping
- **Web Scraper**: General-purpose web scraper
- **Puppeteer Scraper**: Advanced browser automation
- **Playwright Scraper**: Modern browser automation
- **Cheerio Scraper**: Fast server-side scraping

### Social Media
- **Instagram Scraper**: Instagram posts and profiles
- **Twitter Scraper**: Twitter posts and profiles
- **Facebook Scraper**: Facebook posts and pages
- **LinkedIn Scraper**: LinkedIn profiles and posts

### E-commerce
- **Amazon Scraper**: Amazon product data
- **eBay Scraper**: eBay listings
- **Google Shopping**: Product comparisons
- **Shopify Scraper**: Shopify store data

### Search Engines
- **Google Search**: Google search results
- **Bing Search**: Bing search results
- **DuckDuckGo Search**: Privacy-focused search
- **Google Images**: Image search results

### Real Estate
- **Zillow Scraper**: Property listings
- **Realtor.com Scraper**: Real estate data
- **Property Listings**: Multi-source property data

## Input Configuration

### Common Input Parameters
```javascript
{
  startUrls: [
    { url: "https://example.com" }
  ],
  maxRequestsPerCrawl: 100,
  maxConcurrency: 10,
  requestDelay: 1000,
  pageLoadTimeoutSecs: 30,
  ignoreSslErrors: false,
  additionalMimeTypes: ["application/json"],
  customHttpHeaders: {},
  proxyConfiguration: {
    useApifyProxy: true,
    apifyProxyGroups: ["RESIDENTIAL"]
  }
}
```

### Advanced Options
```javascript
{
  pageFunction: `
    async context => {
      const { page, request } = context;
      const title = await page.title();
      const content = await page.$eval('body', el => el.textContent);
      return { title, content, url: request.url };
    }
  `,
  preNavigationHooks: `
    async ({ page, request }) => {
      await page.setViewport({ width: 1920, height: 1080 });
    }
  `,
  postNavigationHooks: `
    async ({ page, request }) => {
      await page.waitForSelector('.content');
    }
  `
}
```

## Data Output Formats

### JSON
```javascript
{
  format: "json",
  clean: true,
  skipEmpty: true
}
```

### CSV
```javascript
{
  format: "csv",
  delimiter: ",",
  bom: true
}
```

### RSS
```javascript
{
  format: "rss",
  title: "Scraped Data Feed",
  description: "Latest scraped items"
}
```

## Error Handling

### Common Errors
- **401 Unauthorized**: Check API token
- **403 Forbidden**: Check actor permissions
- **404 Not Found**: Verify actor/run ID
- **429 Rate Limited**: Implement rate limiting
- **500 Internal Error**: Check actor configuration

### Retry Logic
```javascript
async function runActorWithRetry(actorId, input, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apify.run_actor({ actorId, input });
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
}
```

## Performance Optimization

### Concurrency Settings
- Set appropriate `maxConcurrency`
- Use `requestDelay` for rate limiting
- Configure proxy settings
- Monitor resource usage

### Data Processing
- Use streaming for large datasets
- Filter data during scraping
- Implement pagination
- Use efficient selectors

## Best Practices

1. **Rate Limiting**: Respect website rate limits
2. **Proxy Usage**: Use proxies for large-scale scraping
3. **Error Handling**: Implement comprehensive error handling
4. **Data Validation**: Validate scraped data
5. **Monitoring**: Monitor scraping performance
6. **Legal Compliance**: Follow website terms of service

## Pricing

### Compute Units
- Actors consume compute units based on runtime
- Different actors have different consumption rates
- Monitor usage to optimize costs

### Data Transfer
- Dataset downloads consume data transfer
- Optimize data formats for efficiency
- Use compression when possible

## Common Use Cases

1. **Market Research**: Competitor analysis
2. **Price Monitoring**: E-commerce price tracking
3. **Content Aggregation**: News and content collection
4. **Lead Generation**: Contact information extraction
5. **SEO Analysis**: Website analysis and monitoring
6. **Social Media Monitoring**: Brand mention tracking

## Related Resources

- [Apify Documentation](https://docs.apify.com)
- [Apify Store](https://apify.com/store)
- [Apify MCP Server Repository](https://github.com/apify/actors-mcp-server)
- [Model Context Protocol Spec](https://modelcontextprotocol.io)
- [Apify SDK](https://sdk.apify.com)