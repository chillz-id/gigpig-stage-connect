# Debugging Sessions Directory

This directory contains all debugging session data and reports for the Stand Up Sydney platform.

## Directory Structure

### `/active/`
Contains currently active debugging sessions. Each session has its own subdirectory with:
- `session.json` - Session metadata, activities, issues, and solutions
- Additional session-specific files as needed

### `/completed/`
Contains completed debugging sessions. Sessions are moved here when ended.
Structure mirrors `/active/` but sessions are finalized.

### `/archived/`
Contains old sessions that have been archived for long-term storage.
Used for historical analysis and trend tracking.

### `/reports/`
Contains generated reports and analytics:
- `session-{sessionId}.json` - Individual session reports
- `analytics-{timeframe}-{timestamp}.json` - Analytics reports
- Dashboard exports and visualizations

## Session Data Structure

Each session contains:

```json
{
  "id": "debug-timestamp-random",
  "startTime": "ISO timestamp",
  "endTime": "ISO timestamp or null",
  "status": "active|completed|archived",
  "title": "Session title",
  "description": "Session description",
  "priority": "low|medium|high|critical",
  "tags": ["tag1", "tag2"],
  "activities": [
    {
      "id": "uuid",
      "timestamp": "ISO timestamp",
      "type": "activity-type",
      "description": "Activity description",
      "metadata": {},
      "status": "completed"
    }
  ],
  "issues": [
    {
      "id": "uuid",
      "timestamp": "ISO timestamp",
      "name": "Issue name",
      "description": "Issue description",
      "severity": "low|medium|high|critical",
      "status": "open|resolved",
      "metadata": {},
      "solutions": [
        {
          "id": "uuid",
          "timestamp": "ISO timestamp",
          "solution": "Solution description",
          "success": true,
          "metadata": {}
        }
      ]
    }
  ],
  "metrics": {
    "totalActivities": 0,
    "issuesFound": 0,
    "issuesResolved": 0,
    "duration": null
  },
  "integrations": {
    "knowledgeGraph": false,
    "n8nWorkflows": [],
    "supabaseQueries": [],
    "externalAPIs": []
  },
  "metadata": {
    "user": "system",
    "platform": "platform",
    "nodeVersion": "version",
    "workingDirectory": "path"
  }
}
```

## Usage

The debugging session tracker is managed via the main script:

```bash
# Start new session
node /root/agents/scripts/debugging-session-tracker.js start "Session Title"

# Log activities
node /root/agents/scripts/debugging-session-tracker.js activity "test" "Testing API connection"

# Log issues
node /root/agents/scripts/debugging-session-tracker.js issue "API Error" "Connection timeout" "high"

# Log solutions
node /root/agents/scripts/debugging-session-tracker.js solution {issueId} "Fixed connection settings" true

# End session
node /root/agents/scripts/debugging-session-tracker.js end "Session completed successfully"

# View status
node /root/agents/scripts/debugging-session-tracker.js status

# Generate analytics
node /root/agents/scripts/debugging-session-tracker.js analytics "7d"
```

## Integration Points

- **Knowledge Graph**: Automatic logging of critical issues and solutions
- **N8N Workflows**: Registration of workflow activities and results
- **Supabase Operations**: Tracking of database queries and operations
- **External APIs**: Monitoring of API calls and responses

## Cleanup and Archival

Sessions older than 90 days are automatically candidates for archival.
The system maintains performance by keeping active sessions lightweight
and moving historical data to appropriate storage locations.