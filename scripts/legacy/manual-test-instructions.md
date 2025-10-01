# ✅ CORRECTED HUMANITIX WORKFLOW - MANUAL TEST INSTRUCTIONS

## 🎯 Summary of Fixes Applied

### 1. ✅ Transform Orders JavaScript Updated
- **File**: `/root/agents/scripts/corrected-transform-orders.js`
- **Fixed**: Major field mapping issues - now outputs correct Notion structure
- **Key Fix**: Customer name goes to "Name" (title field), not event name

### 2. ✅ Create Entry Node Updated  
- **Applied**: Correct field mappings for all 15 properties
- **Database ID**: Updated to correct `1374745b-8cbe-804b-87a2ec93b3385e01`
- **Mappings**: All fields now match actual Notion database structure

## 🚀 HOW TO TEST MANUALLY

### Step 1: Open N8N Workflow
1. Go to: http://localhost:5678
2. Open workflow: "Humanitix Historical Import - All Time (Restored)"
3. Workflow ID: `py2wq9zchBz0TD9j`

### Step 2: Verify Transform Orders Code
1. Click on "Transform Orders" node
2. Verify the JavaScript code matches `/root/agents/scripts/corrected-transform-orders.js`
3. **KEY CHECK**: Look for this line around line 126:
   ```javascript
   "Name": {
     title: [{ text: { content: customerName } }]  // ← Should be customerName, NOT eventName
   },
   ```

### Step 3: Verify Create Entry Mappings
1. Click on "Create Entry" node  
2. Check that all these field mappings exist:
   - **Name|title** → `={{ $json.properties.Name.title[0].text.content }}`
   - **Email|email** → `={{ $json.properties.Email.email }}`
   - **Mobile|phone_number** → `={{ $json.properties.Mobile?.phone_number || '' }}`
   - **Event Name|rich_text** → `={{ $json.properties['Event Name'].rich_text[0].text.content }}`
   - **Order ID|rich_text** → `={{ $json.properties['Order ID'].rich_text[0].text.content }}`
   - **Total Amount|number** → `={{ $json.properties['Total Amount'].number }}`
   - **Ticketing Partner|select** → `={{ $json.properties['Ticketing Partner'].select.name }}`

### Step 4: Manual Test Run
1. Click the "Manual Trigger" node
2. Click "Execute Node" or use the play button
3. **Watch the execution progress** - it should go through all nodes
4. **Check for errors** at each step

### Step 5: Verify Results
1. Open Notion database: https://www.notion.so/1374745b8cbe804b87a2ec93b3385e01
2. **Look for new entries** with:
   - ✅ Customer names in the "Name" (title) field
   - ✅ Emails in proper email format
   - ✅ Event names in "Event Name" field
   - ✅ "Humanitix" in "Ticketing Partner" field
   - ✅ Proper amounts and dates

## 🔍 WHAT TO LOOK FOR

### ✅ SUCCESS INDICATORS:
- Workflow completes without stopping at "Transform Orders"
- Data reaches "Create Entry" node
- New entries appear in Notion with customer names as titles
- All fields populated correctly

### ❌ FAILURE INDICATORS:
- Workflow stops at "Transform Orders" (JavaScript error)
- Workflow stops at "Create Entry" (field mapping error)
- Data appears in Notion but with wrong field mappings
- Event names appearing as titles instead of customer names

## 🛠 IF ISSUES OCCUR

### If Transform Orders Fails:
1. Copy content from `/root/agents/scripts/corrected-transform-orders.js`
2. Paste into Transform Orders node JavaScript
3. Save workflow and retry

### If Create Entry Fails:
1. Run: `node /root/agents/scripts/update-create-entry-mappings.cjs`
2. Or manually apply mappings from `/root/agents/scripts/correct-create-entry-mappings.json`

### If No Data in Notion:
1. Check database ID is: `1374745b-8cbe-804b-87a2ec93b3385e01`
2. Verify Notion credential is working
3. Check IF New Order node condition: `{{ $input.all().length }}` == 0

## 🎯 EXPECTED OUTCOME

After running the workflow, you should see entries in your Notion database like:

| Name (Title) | Email | Event Name | Order ID | Total Amount | Ticketing Partner |
|-------------|-------|------------|----------|--------------|------------------|
| John Smith | john@email.com | Comedy Night | HTX-123456 | 25.00 | Humanitix |
| Jane Doe | jane@email.com | Comedy Night | HTX-123457 | 50.00 | Humanitix |

**The key fix**: Customer names should appear in the "Name" column (title field), NOT event names.