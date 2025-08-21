# Brave Search MCP Server Documentation

## Overview

The Brave Search MCP server provides web search capabilities through the Model Context Protocol, enabling AI assistants to search the web using Brave's search engine API.

**Official Repository**: [github.com/modelcontextprotocol/server-brave-search](https://github.com/modelcontextprotocol/server-brave-search)

## Configuration

In `/root/agents/.mcp.json`:
```json
"brave-search": {
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-brave-search@latest"
  ],
  "env": {
    "BRAVE_API_KEY": "{{BRAVE_API_KEY}}"
  }
}
```

## Available Tools

### Web Search
- `web_search`: Perform web search with query
- `news_search`: Search for news articles
- `image_search`: Search for images
- `video_search`: Search for videos

### Advanced Search
- `search_with_filters`: Search with advanced filters
- `search_suggestions`: Get search suggestions
- `search_autocomplete`: Get autocomplete suggestions

### Regional Search
- `search_by_region`: Search in specific geographic region
- `search_by_language`: Search in specific language
- `local_search`: Search for local businesses/places

## Usage Examples

### Basic Web Search
```javascript
// Simple web search
const results = await brave_search.web_search({
  query: "artificial intelligence trends 2024",
  count: 10,
  offset: 0
});

// Search with filters
const filtered = await brave_search.search_with_filters({
  query: "climate change research",
  country: "US",
  language: "en",
  freshness: "week",
  safe_search: "moderate"
});
```

### News Search
```javascript
// Search news articles
const news = await brave_search.news_search({
  query: "technology news",
  count: 20,
  freshness: "day"
});

// Recent news with location
const localNews = await brave_search.news_search({
  query: "local events",
  country: "AU",
  region: "Sydney",
  count: 15
});
```

### Image and Video Search
```javascript
// Search images
const images = await brave_search.image_search({
  query: "sunset landscape",
  count: 25,
  size: "large",
  color: "color"
});

// Search videos
const videos = await brave_search.video_search({
  query: "cooking tutorial",
  count: 10,
  duration: "medium"
});
```

### Regional and Language Search
```javascript
// Search in specific region
const regional = await brave_search.search_by_region({
  query: "restaurants near me",
  country: "US",
  region: "California",
  count: 15
});

// Search in specific language
const multilingual = await brave_search.search_by_language({
  query: "tecnología",
  language: "es",
  count: 20
});
```

### Search Suggestions
```javascript
// Get search suggestions
const suggestions = await brave_search.search_suggestions({
  query: "machine learn",
  count: 10
});

// Get autocomplete
const autocomplete = await brave_search.search_autocomplete({
  query: "artificial int",
  count: 5
});
```

## Search Parameters

### Basic Parameters
- `query`: Search query string
- `count`: Number of results (1-20, default 10)
- `offset`: Results offset for pagination
- `market`: Market/region code

### Filter Parameters
- `freshness`: `day`, `week`, `month`, `year`
- `safe_search`: `off`, `moderate`, `strict`
- `country`: Country code (US, UK, AU, etc.)
- `language`: Language code (en, es, fr, etc.)

### Image Search Parameters
- `size`: `small`, `medium`, `large`, `wallpaper`
- `color`: `color`, `monochrome`, `red`, `blue`, etc.
- `type`: `photo`, `clipart`, `line`, `face`
- `layout`: `square`, `wide`, `tall`

### Video Search Parameters
- `duration`: `short`, `medium`, `long`
- `resolution`: `low`, `medium`, `high`
- `freshness`: `day`, `week`, `month`

## Response Format

### Web Search Results
```javascript
{
  "type": "search",
  "results": [
    {
      "title": "Result Title",
      "url": "https://example.com",
      "description": "Result description",
      "date": "2024-01-15",
      "extra_snippets": ["additional context"],
      "language": "en",
      "family_friendly": true
    }
  ],
  "query": {
    "original": "search query",
    "show_strict_warning": false,
    "altered": "modified query"
  }
}
```

### News Results
```javascript
{
  "type": "news",
  "results": [
    {
      "title": "News Title",
      "url": "https://news.example.com",
      "description": "News description",
      "date": "2024-01-15T10:30:00Z",
      "source": "News Source",
      "thumbnail": "https://image.url"
    }
  ]
}
```

## Authentication

### API Key Setup
1. Visit [Brave Search API](https://api.search.brave.com)
2. Create account and get API key
3. Configure in MCP server environment
4. Set appropriate usage limits

### Rate Limiting
- **Free Tier**: 2,000 queries per month
- **Paid Tiers**: Higher limits available
- Implement rate limiting in applications

## Common Use Cases

1. **Research**: Find information on specific topics
2. **News Monitoring**: Track news on specific subjects
3. **Content Discovery**: Find relevant content
4. **Market Research**: Research competitors and trends
5. **Fact Checking**: Verify information
6. **SEO Research**: Analyze search results
7. **Media Search**: Find images and videos

## Error Handling

Common errors and solutions:
- **401 Unauthorized**: Check API key validity
- **403 Forbidden**: Check API key permissions
- **429 Too Many Requests**: Implement rate limiting
- **400 Bad Request**: Validate query parameters
- **500 Internal Error**: Retry with backoff

## Search Quality Tips

### Query Optimization
- Use specific, descriptive queries
- Include relevant keywords
- Use quotes for exact phrases
- Use operators like site:, filetype:

### Result Filtering
- Apply appropriate filters
- Use freshness filters for recent content
- Set safe search appropriately
- Filter by language and region

## Performance Optimization

### Request Optimization
- Cache frequently requested results
- Use appropriate page sizes
- Implement pagination properly
- Batch related queries

### Response Handling
- Process results efficiently
- Handle empty results gracefully
- Implement proper error handling
- Use async/await patterns

## Best Practices

1. **API Key Security**: Store API keys securely
2. **Rate Limiting**: Respect API rate limits
3. **Error Handling**: Implement comprehensive error handling
4. **Caching**: Cache results when appropriate
5. **User Experience**: Provide fast, relevant results
6. **Privacy**: Respect user privacy in searches

## Comparison with Other Search APIs

### Brave vs Google
- **Privacy**: Brave prioritizes privacy
- **Results**: Different result ranking
- **Features**: Similar core functionality
- **Pricing**: Competitive pricing

### Brave vs Bing
- **Independence**: Brave uses own index
- **Features**: Different feature sets
- **Integration**: Different API designs

## Related Resources

- [Brave Search API Documentation](https://api.search.brave.com)
- [Brave Search MCP Server Repository](https://github.com/modelcontextprotocol/server-brave-search)
- [Model Context Protocol Spec](https://modelcontextprotocol.io)
- [Brave Search](https://search.brave.com)