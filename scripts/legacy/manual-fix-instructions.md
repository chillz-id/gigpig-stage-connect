# 🔧 MANUAL FIX: Humanitix Workflow API Key Update

## 🚨 CRITICAL ISSUE IDENTIFIED
The Humanitix Historical Import workflow is using an **EXPIRED API KEY from 2024** which is why it's not importing any orders.

## ✅ SOLUTION: Update API Key Manually

### Step 1: Get Current API Key
**Current Valid API Key**: `9f23a99810087538c62feb645c45d195ab966d38533cd6456a4c7092f6ae679fd4515936e5b9869c261dc83721626a46c7328dd22bf6acd567646897ecf4c8c7b4f8b24a1b0dbab2fd952a8c25dd7a3b3f5542f0121c63e6616322eb128741bfbd9322b94c5a46acbe3cc9add71ec2`

### Step 2: Open N8N Workflow
1. Go to **http://localhost:5678**
2. Find workflow: **"Humanitix Historical Import - All Time (Restored)"**
3. Click to open the workflow

### Step 3: Update API Key in "Get ALL Events" Node
1. Click on **"Get ALL Events"** node
2. Scroll down to **"Headers"** section
3. Find header with name **"x-api-key"**
4. Replace the value with the current API key above
5. Click **"Save"** or **"Update"**

### Step 4: Update API Key in "Get ALL Orders" Node  
1. Click on **"Get ALL Orders"** node
2. Scroll down to **"Headers"** section
3. Find header with name **"x-api-key"**
4. Replace the value with the current API key above
5. Click **"Save"** or **"Update"**

### Step 5: Activate and Test
1. **Activate** the workflow (toggle switch)
2. Click **"Test workflow"** or **"Execute Workflow"**
3. Monitor the execution in real-time
4. Check execution logs for any errors

### Step 6: Verify Results
1. Check your **Notion database**: https://www.notion.so/1374745b8cbe804b87a2ec93b3385e01
2. Look for new Humanitix orders being imported
3. Verify the duplicate checking is working correctly

## 🔍 What This Fixes

### Before:
- **Old API Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1M2UzN2FhMC03MTc4LTRmMmYtODBhYS00ODNiYmE1ODc0YWYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUxNTcwMDc2fQ._zbYlvtzSMRFHnQu6O_L2LhJU4Ib1655bynbmoXeqMo` (from March 2024)
- **Result**: API returns empty responses → No data to process → Workflow finishes "successfully" but imports nothing

### After:
- **New API Key**: Current valid key from .env file
- **Result**: API returns actual events and orders → Data gets processed → Orders imported to Notion

## 🎯 Expected Outcome
Once the API key is updated, the workflow will:
1. ✅ Fetch all Humanitix events
2. ✅ Get orders for each event  
3. ✅ Transform order data to Notion format
4. ✅ Check for duplicates (skip existing orders)
5. ✅ Create new Notion entries for unique orders
6. ✅ Display import count and success metrics

## 🆘 If You Still Have Issues
If the workflow still doesn't work after updating the API key:

1. **Check API Key Format**: Ensure no extra spaces or characters
2. **Check Humanitix API Status**: Visit Humanitix developer portal
3. **Check Execution Logs**: Look for specific error messages in N8N
4. **Check Notion Database**: Verify the database ID is still valid
5. **Contact Support**: Provide execution logs and error details

## 📞 Quick Test
To verify the API key works, you can test it with curl:
```bash
curl -H "x-api-key: 9f23a99810087538c62feb645c45d195ab966d38533cd6456a4c7092f6ae679fd4515936e5b9869c261dc83721626a46c7328dd22bf6acd567646897ecf4c8c7b4f8b24a1b0dbab2fd952a8c25dd7a3b3f5542f0121c63e6616322eb128741bfbd9322b94c5a46acbe3cc9add71ec2" \
https://api.humanitix.com/v1/events
```

If this returns events data, the API key is working correctly.