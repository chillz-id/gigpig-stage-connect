# Metricool MCP Server Documentation

## Overview

The Metricool MCP server provides integration with Metricool's social media analytics API through the Model Context Protocol, enabling AI assistants to access social media metrics and analytics data.

**Official Repository**: [github.com/metricool/mcp-metricool](https://github.com/metricool/mcp-metricool)

## Configuration

In `/root/agents/.mcp.json`:
```json
"metricool": {
  "command": "uvx",
  "args": [
    "--upgrade",
    "mcp-metricool"
  ],
  "env": {
    "METRICOOL_USER_TOKEN": "AIRTBTNXQVUPFDHLEYFDXMVIWNGSJFXPDZMIZCOAFSIKZWHXZOZTZAXMATBHNJMR",
    "METRICOOL_USER_ID": "3477256"
  }
}
```

## Available Tools

### Account Management
- `get_account_info`: Get account details and settings
- `list_connected_accounts`: List connected social media accounts
- `get_account_metrics`: Get overall account performance metrics

### Content Analytics
- `get_post_metrics`: Get performance metrics for specific posts
- `list_recent_posts`: List recent posts across platforms
- `get_content_performance`: Analyze content performance over time
- `get_engagement_metrics`: Get engagement rates and interactions

### Platform-Specific Analytics
- `get_instagram_metrics`: Instagram-specific analytics
- `get_facebook_metrics`: Facebook page and post analytics
- `get_twitter_metrics`: Twitter account performance
- `get_linkedin_metrics`: LinkedIn page analytics
- `get_youtube_metrics`: YouTube channel analytics

### Reporting Tools
- `generate_report`: Generate custom analytics reports
- `get_competitor_analysis`: Compare performance with competitors
- `export_data`: Export analytics data in various formats

### Scheduling & Planning
- `list_scheduled_posts`: View scheduled content
- `get_content_calendar`: Access content calendar
- `get_posting_schedule`: View optimal posting times

## Usage Examples

### Account Analytics
```javascript
// Get account overview
const accountInfo = await metricool.get_account_info();

// List connected platforms
const connectedAccounts = await metricool.list_connected_accounts();

// Get overall metrics
const metrics = await metricool.get_account_metrics({
  date_from: "2024-01-01",
  date_to: "2024-01-31"
});
```

### Content Performance
```javascript
// Get post metrics
const postMetrics = await metricool.get_post_metrics({
  post_id: "post_123456",
  platform: "instagram"
});

// Get recent posts
const recentPosts = await metricool.list_recent_posts({
  limit: 20,
  platform: "all"
});

// Analyze content performance
const performance = await metricool.get_content_performance({
  date_range: "last_30_days",
  platform: "instagram"
});
```

### Platform Analytics
```javascript
// Instagram metrics
const instagramMetrics = await metricool.get_instagram_metrics({
  metric_type: "engagement",
  date_from: "2024-01-01",
  date_to: "2024-01-31"
});

// Facebook analytics
const facebookMetrics = await metricool.get_facebook_metrics({
  page_id: "page_123456",
  metrics: ["reach", "impressions", "engagement"]
});
```

### Reporting
```javascript
// Generate custom report
const report = await metricool.generate_report({
  platforms: ["instagram", "facebook"],
  metrics: ["engagement", "reach", "impressions"],
  date_range: "last_month",
  format: "json"
});

// Export data
const exportData = await metricool.export_data({
  data_type: "posts",
  format: "csv",
  date_from: "2024-01-01",
  date_to: "2024-01-31"
});
```

## Authentication

The Metricool MCP server requires:
- **User Token**: API access token
- **User ID**: Account identifier

### Getting API Credentials
1. Log into your Metricool account
2. Go to Settings → API Integration
3. Generate API token
4. Copy User Token and User ID

## Common Use Cases

1. **Social Media Analytics**: Track performance across platforms
2. **Content Strategy**: Analyze what content performs best
3. **Competitor Analysis**: Compare performance with competitors
4. **Engagement Tracking**: Monitor likes, comments, shares
5. **Report Generation**: Create custom analytics reports
6. **Content Planning**: Optimize posting schedules

## Supported Platforms

- **Instagram**: Posts, stories, reels analytics
- **Facebook**: Page and post performance
- **Twitter**: Tweet and account metrics
- **LinkedIn**: Page and post analytics
- **YouTube**: Channel and video performance
- **TikTok**: Video and account metrics
- **Pinterest**: Pin and board analytics

## Metrics Available

### Engagement Metrics
- Likes, comments, shares
- Engagement rate
- Reach and impressions
- Click-through rates

### Growth Metrics
- Follower growth
- Account reach
- Profile visits
- Website clicks

### Content Metrics
- Post performance
- Optimal posting times
- Content type analysis
- Hashtag performance

## Error Handling

Common errors and solutions:
- **401 Unauthorized**: Check API token validity
- **403 Forbidden**: Verify account permissions
- **404 Not Found**: Check resource IDs
- **429 Rate Limited**: Implement rate limiting
- **500 Server Error**: Retry with backoff

## Rate Limiting

Metricool API has rate limits:
- **Standard**: 1000 requests per hour
- **Premium**: 5000 requests per hour
- Implement exponential backoff for retries

## Best Practices

1. **Token Security**: Store tokens securely
2. **Rate Limiting**: Respect API limits
3. **Error Handling**: Implement proper error handling
4. **Data Caching**: Cache frequently accessed data
5. **Batch Requests**: Combine multiple requests when possible

## Related Resources

- [Metricool API Documentation](https://metricool.com/api)
- [Metricool MCP Repository](https://github.com/metricool/mcp-metricool)
- [Model Context Protocol Spec](https://modelcontextprotocol.io)
- [Metricool Help Center](https://help.metricool.com)