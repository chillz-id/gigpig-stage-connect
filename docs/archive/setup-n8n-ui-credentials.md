# N8N UI Credential Setup Guide

## 🔍 Authentication Context

### Understanding N8N Authentication Types

**Two distinct authentication scenarios:**

1. **External API Authentication (This Guide):**
   - Used for connecting N8N workflows to external services (Firecrawl, Notion, etc.)
   - Uses "HTTP Header Auth" credential type in N8N UI
   - Format: `Authorization: Bearer <token>`

2. **N8N API Authentication (Not This Guide):**
   - Used for N8N's own REST API management
   - Uses `X-N8N-API-KEY` header
   - For programmatically managing N8N workflows/credentials

## 🔧 Create Credentials in N8N UI

### Step 1: Access N8N Interface
```bash
# Navigate to N8N UI
http://localhost:5678
```

### Step 2: Create Firecrawl Credential

1. Click **Credentials** in the left sidebar
2. Click **+ Add Credential**
3. Search for and select **Generic Credential Type**
4. Configure:
   - **Name:** `firecrawl_api`
   - **Generic Auth Type:** Select `Header Auth`
   - **Header Name:** `Authorization`
   - **Header Value:** `Bearer YOUR_FIRECRAWL_API_KEY_HERE`
5. Click **Save**

⚠️ **2025 N8N Bug Warning:** If credential value resets to `__n8n_BLANK_VALUE...` after saving, see troubleshooting section below.

### Step 3: Create Notion Credential

1. Click **+ Add Credential** 
2. Search for and select **Generic Credential Type**
3. Configure:
   - **Name:** `notion_api`
   - **Generic Auth Type:** Select `Header Auth`
   - **Header Name:** `Authorization` 
   - **Header Value:** `Bearer YOUR_NOTION_API_KEY_HERE`
4. Click **Save**

⚠️ **2025 N8N Bug Warning:** If credential value resets to `__n8n_BLANK_VALUE...` after saving, see troubleshooting section below.

### Step 4: Verify Workflow References

⚠️ **Important:** Due to 2025 N8N credential bugs, workflows may need to use direct headers instead of credential references.

**If credentials work correctly:**
- `{{ $credentials.firecrawl_api.headerValue }}`
- `{{ $credentials.notion_api.headerValue }}`

**If credentials fail (recommended approach):**
Use direct headers in HTTP Request nodes:
- Header: `Authorization` Value: `Bearer {{ $env.FIRECRAWL_API_KEY }}`
- Header: `Authorization` Value: `Bearer {{ $env.NOTION_API_KEY }}`

💡 **Environment Variables:** Use the actual environment variable names from `/opt/standup-sydney-mcp/.env`

### Step 5: Test Workflows

1. Open "Humanitix Polling Sync to Notion (Every 3 Minutes)"
2. Click **Execute Workflow** 
3. Check for successful execution without credential errors

## ✅ Verification Checklist

- [ ] Firecrawl credential created with correct name
- [ ] Notion credential created with correct name
- [ ] Test workflow executes successfully
- [ ] No authentication errors in N8N logs
- [ ] API calls complete successfully

## 🔧 Troubleshooting Authentication Issues

### Critical 2025 N8N Bugs:

1. **Credential Values Reset to Placeholder (Active Bug):**
   - **Issue:** After saving Generic Credential Type with Header Auth, values reset to `__n8n_BLANK_VALUE...`
   - **Immediate Workaround:** Hardcode headers directly in HTTP Request nodes
   - **GitHub Issue:** [#12596](https://github.com/n8n-io/n8n/issues/12596)

2. **Bearer Token Not Added to Requests (Active Bug):**
   - **Issue:** Generic Credential Type with Bearer Auth fails to attach Authorization header
   - **Result:** 401 Unauthorized errors even with correct tokens
   - **GitHub Issue:** [#14884](https://github.com/n8n-io/n8n/issues/14884)

3. **Authorization Headers Not Passed Through:**
   - **Issue:** Bearer/Custom auth tokens sent as empty values
   - **Workaround:** Use Header Auth instead of Bearer Auth under Generic Credential Type

### Alternative Authentication Methods:

#### Method 1: Direct Header Configuration (Most Reliable)
Instead of using credentials, configure headers directly in HTTP Request nodes:

1. Open HTTP Request node
2. Go to **Headers** section
3. Add header:
   - **Name:** `Authorization`
   - **Value:** `Bearer your_token_here`

#### Method 2: Environment Variable References
If hardcoding in workflows, reference environment variables:
- **Value:** `Bearer {{ $env.FIRECRAWL_API_KEY }}`

#### Method 3: Predefined Credential Types
Check if specific credential types exist for your services:
- Search for "Firecrawl" or "Notion" specific credential types
- These may be more stable than Generic Credential Type

### Verification Steps:

1. **Test Credential in N8N UI:**
   ```
   Credentials → Your Credential → Test Connection
   ```

2. **Check Network Tab:**
   - Open browser DevTools during workflow execution
   - Verify Authorization header is present in requests
   - Confirm token format is correct

3. **Enable Detailed Logging:**
   ```bash
   # Check N8N container logs for auth errors
   docker logs n8n 2>&1 | grep -i "auth\|401\|403"
   ```

## 🚨 Next Security Steps

**IMMEDIATE:** After confirming workflows function correctly:

1. **Rotate Firecrawl API Key:**
   - Generate new key at Firecrawl dashboard
   - Update N8N credential
   - Test workflows

2. **Rotate Notion API Key:**
   - Generate new integration token
   - Update N8N credential  
   - Test workflows

3. **Remove old keys from environment:**
   ```bash
   # Update /root/.n8n/.env with new keys
   # Or better yet, move to proper secrets management
   ```

## 📚 Additional Resources

- [N8N HTTP Request Credentials Documentation](https://docs.n8n.io/integrations/builtin/credentials/httprequest/)
- [N8N API Authentication](https://docs.n8n.io/api/authentication/)
- [Community Troubleshooting: Bearer Token Issues](https://community.n8n.io/t/using-a-bearer-token-with-http-request-api-calls/25264)

## ⚠️ Current Status: 2025-08-22

**Updated based on 2025 N8N UI changes and active bugs:**

1. **UI Changed:** "HTTP Header Auth" credential type no longer exists - use "Generic Credential Type" → "Header Auth"
2. **Active Bugs:** Multiple credential-related bugs in 2025 N8N affecting Generic Credential Types
3. **Recommended Approach:** Use direct header configuration in HTTP Request nodes until bugs are resolved
4. **Monitor:** Check N8N GitHub issues for bug fix releases

**Next Review:** Check N8N release notes for credential bug fixes and update documentation accordingly.