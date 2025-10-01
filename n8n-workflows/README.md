# N8N Automation Workflows

This directory contains workflow definitions for Stand Up Sydney's automation infrastructure using N8N.

## Available Workflows

### 1. Webhook Processing (`webhook-processing-workflow.json`)
**Purpose**: Processes incoming webhooks from Humanitix and Eventbrite for order management.

**Triggers**: Webhook POST to `/humanitix-webhook`
**Features**:
- Filters order.created events
- Saves order data to Supabase
- Sends Slack notifications
- Returns success response to webhook provider

**Required Environment Variables**:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY` 
- `SUPABASE_ANON_KEY`
- `SLACK_WEBHOOK_URL`

### 2. Social Media Automation (`social-media-automation-workflow.json`)
**Purpose**: Automates social media posting for upcoming events via Metricool.

**Triggers**: Cron schedule (Monday/Wednesday/Friday 9AM)
**Features**:
- Fetches upcoming events from Supabase
- Generates platform-specific post content
- Schedules posts via Metricool API
- Logs social media activity to database

**Required Environment Variables**:
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_ANON_KEY`
- `METRICOOL_USER_TOKEN`

### 3. Error Monitoring (`error-monitoring-workflow.json`)  
**Purpose**: Processes error alerts from Knowledge Graph and creates Linear issues.

**Triggers**: Webhook POST to `/error-alert`
**Features**:
- Filters by error severity (medium/high/critical)
- Creates Linear issues automatically
- Sends Slack alerts for critical errors
- Logs all processed errors to database

**Required Environment Variables**:
- `LINEAR_API_KEY`, `LINEAR_TEAM_ID`, `LINEAR_ERROR_LABEL_ID`
- `SLACK_WEBHOOK_URL`
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_ANON_KEY`

### 4. Competitor Monitoring (`competitor-monitoring-workflow.json`)
**Purpose**: Weekly competitor analysis using Apify web scraping.

**Triggers**: Cron schedule (Monday 8AM weekly)
**Features**:
- Scrapes competitor event listings
- Analyzes pricing, venues, and trends
- Generates business intelligence insights
- Saves analysis results to database
- Sends weekly reports to Slack

**Required Environment Variables**:
- `APIFY_TOKEN`
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_ANON_KEY`
- `SLACK_WEBHOOK_URL`

## Installation Instructions

### 1. Import Workflows to N8N
```bash
# Access N8N interface
curl http://localhost:5678/healthz

# Import each workflow via N8N UI:
# 1. Go to http://localhost:5678
# 2. Click "Import from file"
# 3. Upload each .json file
# 4. Configure environment variables
```

### 2. Configure Environment Variables
Ensure these variables are set in N8N:

```bash
# Core Platform
SUPABASE_URL=https://pdikjpfulhhpqpxzpgtu.supabase.co
SUPABASE_SERVICE_KEY=your_service_key
SUPABASE_ANON_KEY=your_anon_key

# Social Media
METRICOOL_USER_TOKEN=your_metricool_token

# Project Management  
LINEAR_API_KEY=your_linear_key
LINEAR_TEAM_ID=your_team_id
LINEAR_ERROR_LABEL_ID=your_error_label_id

# Communication
SLACK_WEBHOOK_URL=your_slack_webhook

# Web Scraping
APIFY_TOKEN=your_apify_token
```

### 3. Activate Workflows
After importing, activate each workflow in N8N interface:
1. Open workflow
2. Click "Active" toggle
3. Verify webhook URLs are accessible

## Testing Workflows

### Test Webhook Processing
```bash
curl -X POST http://localhost:5678/webhook/humanitix-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "order.created",
    "event": {"id": "test-event", "name": "Test Comedy Show"},
    "customer": {"email": "test@example.com", "name": "Test User"},
    "order": {"id": "test-123", "total": 25.00, "tickets": 2}
  }'
```

### Test Error Monitoring
```bash
curl -X POST http://localhost:5678/webhook/error-alert \
  -H "Content-Type: application/json" \
  -d '{
    "severity": "high",
    "title": "Test Error",
    "error_type": "api_error",
    "component": "user_auth",
    "description": "Test error for workflow validation",
    "stack_trace": "Error: Test\n  at test.js:1:1",
    "context": "Testing workflow",
    "kg_id": "test-kg-001",
    "timestamp": "2025-09-09T22:30:00Z"
  }'
```

## Monitoring and Maintenance

### Workflow Health Checks
- Monitor execution logs in N8N interface
- Check Slack channels for alerts
- Review database logs for processed data

### Performance Optimization
- Adjust cron schedules based on usage patterns
- Monitor API rate limits (Metricool, Linear, Apify)
- Optimize database queries for large datasets

### Troubleshooting
1. **Webhook failures**: Check URL accessibility and payload format
2. **API errors**: Verify environment variables and API keys
3. **Database issues**: Check Supabase connectivity and permissions
4. **Schedule problems**: Verify cron expressions and timezone settings

## Integration with MCP Servers

These workflows are designed to work with our MCP server infrastructure:

- **Supabase MCP**: Database operations
- **Slack MCP**: Team notifications  
- **Metricool MCP**: Social media management
- **Apify MCP**: Web scraping capabilities
- **Linear MCP**: Project management integration

## Future Workflow Ideas

Based on our functional MCP servers, potential new workflows:

1. **Design Automation**: Canvas + events for automated promotional graphics
2. **Task Management**: Automatic task creation for event setup
3. **Content Generation**: AI-powered event descriptions and marketing copy
4. **Performance Analytics**: Automated reporting dashboard generation
5. **Customer Journey**: Multi-touch marketing automation

## Support

For workflow issues:
1. Check N8N execution logs
2. Verify environment variables
3. Test individual workflow nodes
4. Review Slack #alerts channel
5. Check Knowledge Graph for related errors