# N8N WORKFLOW DEPLOYMENT GUIDE
**Stand Up Sydney Platform - September 10, 2025**

---

## 🎯 DEPLOYMENT STATUS
- **N8N Health**: 100/100 ✅ (Service operational at localhost:5678)
- **Workflows Ready**: 11 JSON files prepared for deployment
- **Dependencies**: Resolved ✅ (Production builds now working)
- **Authentication**: Manual deployment required due to API auth limitations

---

## 📋 WORKFLOWS TO DEPLOY (11 Total)

### High Priority Workflows (Deploy First)
1. **Error Monitoring** - `/root/agents/n8n-workflows/error-monitoring-workflow.json`
   - **Purpose**: Knowledge Graph → Linear integration for automated issue tracking
   - **Trigger**: Webhook from Knowledge Graph
   - **Size**: 8,699 bytes (8.5KB)

2. **Webhook Processing** - `/root/agents/n8n-workflows/webhook-processing-workflow.json`
   - **Purpose**: Handle Humanitix/Eventbrite webhook orders
   - **Trigger**: HTTP webhook endpoints
   - **Size**: 5,784 bytes (5.6KB)

3. **Database Sync** - `/root/agents/n8n-workflows/database-sync-workflow.json`
   - **Purpose**: Multi-platform data synchronization (Supabase, Notion, Linear, Slack)
   - **Trigger**: Schedule + webhook triggers
   - **Size**: 9,657 bytes (9.4KB)

### Core Automation Workflows
4. **Content Generation** - `/root/agents/n8n-workflows/content-generation-workflow.json`
   - **Purpose**: AI-powered content creation for events
   - **Trigger**: Supabase database trigger
   - **Size**: 5,392 bytes (5.3KB)

5. **Social Media Automation** - `/root/agents/n8n-workflows/social-media-automation-workflow.json`
   - **Purpose**: Metricool integration for automated posting
   - **Trigger**: Schedule + event triggers
   - **Size**: 9,615 bytes (9.4KB)

6. **Competitor Monitoring** - `/root/agents/n8n-workflows/competitor-monitoring-workflow.json`
   - **Purpose**: Web scraping with Apify for competitor analysis
   - **Trigger**: Scheduled (daily/weekly)
   - **Size**: 11,202 bytes (10.9KB)

### Integration Workflows (Existing)
7. **Humanitix-Brevo Sync** - `/root/agents/n8n-workflows/humanitix-brevo-sync.json`
   - **Purpose**: Customer data synchronization
   - **Trigger**: Humanitix webhooks
   - **Size**: 13,956 bytes (13.6KB)

8. **Humanitix Event Sync** - `/root/agents/n8n-workflows/humanitix-event-sync.json`
   - **Purpose**: Event synchronization to platform
   - **Trigger**: Event creation/updates
   - **Size**: 7,755 bytes (7.6KB)

9. **Multi-Platform Ticket Sync** - `/root/agents/n8n-workflows/multi-platform-ticket-sync.json`
   - **Purpose**: Real-time ticket sales synchronization
   - **Trigger**: Multiple platform webhooks
   - **Size**: 13,913 bytes (13.6KB)

### Utility Workflows
10. **Google Auth Recovery** - `/root/agents/n8n-workflows/google-auth-recovery-workflow.json`
    - **Purpose**: User onboarding automation
    - **Trigger**: Auth events
    - **Size**: 10,293 bytes (10.0KB)

11. **Flight Monitoring** - `/root/agents/n8n-workflows/flight-monitoring-workflows.json`
    - **Purpose**: Travel automation (comedian travel tracking)
    - **Trigger**: Travel booking events
    - **Size**: 28,422 bytes (27.8KB)

---

## 🚀 DEPLOYMENT PROCESS

### Step 1: Access N8N Interface
```bash
# Open in browser
http://localhost:5678/

# Verify health (should show {"status":"ok"})
curl http://localhost:5678/healthz
```

### Step 2: Import Workflows (Manual Process)
For each workflow file:

1. **Navigate to**: N8N web interface at localhost:5678
2. **Click**: "Import from file" or "New workflow"
3. **Upload/Paste**: Content from JSON file
4. **Configure**: Set up credentials and connections
5. **Test**: Execute workflow manually to verify
6. **Activate**: Enable workflow for production use

### Step 3: Deploy in Priority Order
**Recommended deployment sequence**:
1. Error Monitoring (critical for issue tracking)
2. Webhook Processing (essential for order handling)
3. Database Sync (core data synchronization)
4. Content Generation (automation enhancement)
5. Social Media Automation (marketing automation)
6. Remaining 6 workflows as needed

### Step 4: Post-Deployment Verification
For each deployed workflow:
```bash
# Run monitoring script to verify
node /root/agents/scripts/n8n-monitor.cjs

# Check workflow execution logs in N8N UI
# Test webhook endpoints if applicable
# Verify database connections and integrations
```

---

## ⚙️ CONFIGURATION REQUIREMENTS

### Credentials Needed
- **Supabase**: Already configured in MCP
- **Linear**: Integration active via Knowledge Graph
- **Slack**: Bot permissions needed (pending)
- **Canva**: API token needed (pending)
- **Metricool**: Social media credentials
- **Apify**: Web scraping service token
- **Humanitix/Eventbrite**: Webhook configurations

### Environment Variables
All credentials are centralized in `/etc/standup-sydney/credentials.env`

---

## 📊 SUCCESS METRICS

### Immediate Verification
- [ ] All 11 workflows imported successfully
- [ ] No import/parsing errors
- [ ] Credential connections established
- [ ] Test executions successful

### Operational Metrics
- **Workflow Success Rate**: Target >95%
- **Error Resolution**: Automated via Error Monitoring workflow
- **Integration Health**: All connections operational
- **Performance**: Sub-5-second execution times

### Business Impact
- **Manual Task Reduction**: >60% expected
- **Error Response Time**: <15 minutes via automation
- **Integration Reliability**: >98% uptime
- **Content Generation**: Automated for all events

---

## 🚨 TROUBLESHOOTING

### Common Issues
1. **Credential Errors**: Verify `/etc/standup-sydney/credentials.env`
2. **Webhook Failures**: Check endpoint configurations
3. **Database Connection**: Verify Supabase connectivity
4. **API Timeouts**: Adjust workflow timeout settings

### Monitoring
Use the existing monitoring script:
```bash
# Continuous monitoring
node /root/agents/scripts/n8n-monitor.cjs watch

# One-time health check
node /root/agents/scripts/n8n-monitor.cjs report
```

### Log Analysis
- Check N8N execution logs in the web interface
- Monitor Knowledge Graph entries for automated issues
- Review Linear for auto-created issues from Error Monitoring workflow

---

## 📝 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [x] N8N service health verified (100/100)
- [x] All 11 workflow files prepared
- [x] Monitoring system operational
- [x] Credential system verified

### During Deployment
- [ ] Import Error Monitoring workflow first
- [ ] Test each workflow after import
- [ ] Configure webhook endpoints
- [ ] Set up scheduled triggers
- [ ] Verify credential connections

### Post-Deployment
- [ ] All workflows active and operational
- [ ] Monitoring confirms 100% success rate
- [ ] Integration tests passed
- [ ] Documentation updated with results

---

**🎯 Expected Outcome**: Transform platform from 99% to 100% automation readiness with fully operational workflow engine driving business processes.**

*Deployment guide prepared for Week 2 Day 5 priorities - September 10, 2025*