# Linear Automation Setup - Stand Up Sydney

## Overview
Complete automation integration between Linear and the Stand Up Sydney development ecosystem.

## Git Integration

### Branch Naming Convention
Pattern: `{team}/{issue-number}-{description}`

Examples:
- `frontend/SUS-004-comedian-profiles`
- `backend/SUS-001-auth-fix`
- `testing/SUS-013-test-coverage`

### Commit Linking
- Commits automatically linked to Linear issues via branch name
- Pattern: `SUS-{number}: {commit message}`
- Status updates trigger on specific commit messages

## Knowledge Graph Integration

### Automatic Issue Creation
- Critical issue discovered → Create Linear issue
- Session protocol violation → Create compliance issue
- System failure detected → Create alert issue
- Solution documented → Update related issues

### Issue Types
- **knowledge-graph-discovery**: INTEGRATION team, High Priority priority
- **protocol-violation**: INTEGRATION team, Critical priority
- **system-alert**: INFRA team, Critical priority

## Multi-Agent Coordination

### Agent Assignment Rules
- **Agent-Frontend**: Auto-assigned to FRONTEND team
- **Agent-Backend**: Auto-assigned to BACKEND team
- **Agent-Testing**: Auto-assigned to TESTING team

### Workflow Automation
- Frontend issues → Auto-assign to Frontend Agent
- Backend/API issues → Auto-assign to Backend Agent
- Testing issues → Auto-assign to Testing Agent
- Cross-team issues → Create subtasks for each agent

## Benefits

1. **Unified Tracking**: All development work tracked in Linear
2. **Automated Routing**: Issues automatically assigned to correct teams/agents
3. **Real-time Updates**: Git commits and status changes sync automatically
4. **Proactive Issue Creation**: Problems detected and tracked immediately
5. **Agent Coordination**: Multi-agent system coordinated through Linear
6. **Knowledge Preservation**: Historical context linked to current work

## Usage

### For Developers
1. Create branches following naming convention
2. Commits automatically link to Linear issues
3. Issue status updates based on commit messages

### For Agents
1. Issues automatically assigned based on team/labels
2. Status updates trigger agent notifications
3. Cross-team issues create subtasks for coordination

### For Project Management
1. Real-time visibility into all development work
2. Automated issue creation from system monitoring
3. Historical tracking through Knowledge Graph integration

---
*Generated: 2025-08-21T18:07:10.625Z*
