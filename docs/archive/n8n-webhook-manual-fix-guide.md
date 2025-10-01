# N8N Webhook Manual Fix Guide

## 🚨 CRITICAL ISSUE IDENTIFIED

**Root Cause**: All Humanitix → Notion workflows stopped executing in August 2025 because webhook nodes are configured for GET requests instead of POST requests.

**Impact**: No ticket sales data has been synced to Notion since August 28th, 2025.

## 📊 Status Summary

| Component | Status | Details |
|-----------|--------|---------|
| ✅ N8N Service | OPERATIONAL | Running on port 5678, API responding |
| ✅ Humanitix API | OPERATIONAL | API key valid, endpoint responding |
| ✅ Notion API | OPERATIONAL | Token valid, database accessible |
| ✅ Brevo API | OPERATIONAL | Connection working |
| ❌ Webhook Config | MISCONFIGURED | GET instead of POST methods |

## 🔧 Manual Fix Instructions

### Access N8N Web Interface
- **URL**: http://170.64.252.55:5678
- **Login**: Use your existing N8N credentials

### Workflows Requiring Fixes

#### 1. Humanitix Complete Data Sync (ID: FMsWcRZKh4WhFWxe)
- **Edit URL**: http://170.64.252.55:5678/workflow/FMsWcRZKh4WhFWxe
- **Fix**: Click "Webhook Trigger" node → Set "HTTP Method" to "POST" → Save → Activate

#### 2. Simple Event Test (ID: jmCqdP8aZkzizhWm)  
- **Edit URL**: http://170.64.252.55:5678/workflow/jmCqdP8aZkzizhWm
- **Fix**: Click "Webhook" node → Set "HTTP Method" to "POST" → Save → Activate

#### 3. Humanitix Test - Webhook (ID: nwD76Jaj0ifRpk8H)
- **Edit URL**: http://170.64.252.55:5678/workflow/nwD76Jaj0ifRpk8H  
- **Fix**: Click "Webhook" node → Set "HTTP Method" to "POST" → Save → Activate

#### 4. Historical Quantity Fix (ID: SHtfkarCza7ZAP86)
- **Edit URL**: http://170.64.252.55:5678/workflow/SHtfkarCza7ZAP86
- **Fix**: Click "Manual Trigger" node → Set "HTTP Method" to "POST" → Save → Activate

### Step-by-Step Fix Process

1. **Open Workflow**
   - Click on workflow name from list
   - Or use direct URL provided above

2. **Select Webhook Node**
   - Click on the webhook/trigger node (usually first node)
   - Node will be highlighted

3. **Update HTTP Method**
   - In the right panel, find "HTTP Method" setting
   - Change from "GET" (default) to "POST"
   - This is critical for Humanitix webhooks

4. **Save Changes**
   - Click "Save" button (top right)
   - Wait for confirmation

5. **Activate Workflow**
   - Toggle the "Active" switch to ON
   - Workflow should show green "Active" status

6. **Test (Optional)**
   - Use "Execute Workflow" button to test manually
   - Check execution history for success

## 🧪 Testing Fixed Webhooks

After fixing each workflow, test with curl:

```bash
# Test webhook endpoint (replace {path} with actual webhook path)
curl -X POST -H "Content-Type: application/json" \
  -d '{"test": "data", "eventType": "order.created"}' \
  "http://170.64.252.55:5678/webhook/{path}"
```

**Expected Response**: JSON success or workflow execution, NOT "This webhook is not registered for POST requests"

## 📈 Monitoring Setup

### Daily Workflow Health Check
```bash
# Check workflow status
curl -H "X-N8N-API-KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  "http://localhost:5678/api/v1/workflows" | \
  jq -r '.data[] | select(.active == true) | .id + " | " + .name + " | Active: " + (.active|tostring)'
```

### Execution History Check
```bash
# Check recent executions (last 24 hours)
curl -H "X-N8N-API-KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  "http://localhost:5678/api/v1/executions?limit=50" | \
  jq '.data[] | {workflow: .workflowName, status: .status, startTime: .startedAt}'
```

## 🚨 Priority Actions

### Immediate (Next 24 Hours)
1. ✅ **Fix webhook configurations** (all 4 workflows)
2. 🔄 **Test each webhook endpoint** 
3. 📞 **Contact Humanitix** - verify webhook URLs are current
4. 📊 **Monitor execution logs** for successful runs

### Short Term (Next Week)
1. **Set up monitoring alerts** for workflow failures
2. **Document webhook URLs** for Humanitix configuration  
3. **Create backup webhook endpoints** for redundancy
4. **Audit other webhook-based workflows**

## 🔗 Important URLs & Resources

- **N8N Interface**: http://170.64.252.55:5678
- **API Documentation**: http://170.64.252.55:5678/api/v1/docs
- **Workflow List**: http://170.64.252.55:5678/workflows
- **Execution History**: http://170.64.252.55:5678/executions

## 📞 Next Steps After Fix

1. **Verify Data Sync**: Check Notion database for new entries
2. **Backfill Missing Data**: Consider manually syncing August-September data
3. **Update Webhook URLs**: Ensure Humanitix has correct endpoints
4. **Create Monitoring Dashboard**: Track workflow health ongoing

---

**Created**: September 13, 2025  
**Issue**: N8N workflows stopped executing due to webhook HTTP method mismatch  
**Status**: Manual fix required via web interface  
**Priority**: CRITICAL - Revenue tracking affected