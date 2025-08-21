# 🚀 N8N Workflow Update Instructions

## ✅ Database Status: ENHANCED & READY
Your database now includes all enhanced customer fields and is ready for the final workflow update.

## 📋 Step-by-Step N8N Workflow Update

### 1. Access N8N Dashboard
- **URL**: http://170.64.129.59:5678
- **Login** with your N8N credentials

### 2. Find Existing Workflow
- Look for: **"Humanitix to Brevo Customer Sync"**
- Note the current workflow ID if it exists

### 3. Import Enhanced Workflow
**Option A: Update Existing Workflow**
1. Click on the existing "Humanitix to Brevo Customer Sync" workflow
2. Go to workflow settings (gear icon)
3. **Export** the current workflow (as backup)
4. **Import** and replace with: `/root/agents/n8n-workflows/humanitix-brevo-sync.json`

**Option B: Create New Workflow**
1. Click **"+ Add Workflow"**
2. **Import** from file: `/root/agents/n8n-workflows/humanitix-brevo-sync.json`
3. **Rename** to: "Humanitix to Brevo Customer Sync - Enhanced"

### 4. Configure Credentials (If Needed)
Ensure these credentials are set:
- **Supabase API**: Your project credentials
- **Brevo API**: Your API key (should already be configured)

### 5. Activate Workflow
- **Toggle** the workflow to "Active"
- **Save** the workflow

### 6. Test Webhook URL
The enhanced workflow will be available at:
```
http://170.64.129.59:5678/webhook/humanitix-brevo-sync
```

## 🌟 Enhanced Workflow Features

### New Customer Fields Synced:
- **DATE_OF_BIRTH**: Birthday for age-based campaigns
- **ADDRESS**: Location for venue-specific marketing  
- **COMPANY**: Business info for corporate events
- **Always Opt-in**: All customers automatically opted into marketing

### Enhanced Brevo Attributes:
```javascript
{
  FIRSTNAME: customer.first_name,
  LASTNAME: customer.last_name, 
  SMS: customer.mobile,
  DATE_OF_BIRTH: customer.date_of_birth,      // 🆕 NEW
  ADDRESS: customer.address,                   // 🆕 NEW
  COMPANY: customer.company,                   // 🆕 NEW
  ORDER_COUNT: customer.total_orders,
  LIFETIME_VALUE: customer.total_spent,
  CUSTOMER_SEGMENT: customer.customer_segment,
  MARKETING_OPT_IN: true,                     // 🆕 ALWAYS TRUE
  // ... other existing fields
}
```

## ✅ Verification Checklist

After updating the workflow:
- [ ] Workflow shows as "Active" 
- [ ] No error messages in workflow execution
- [ ] Webhook URL responds properly
- [ ] Test customer sync includes new fields

## 🧪 Test the Enhanced Integration

Run this test after activation:
```bash
cd /root/agents
node scripts/test-complete-enhanced-integration.js
```

## 🎯 What Changes?

**Before Enhancement:**
- Basic customer info (name, email, mobile)
- Purchase history
- Simple segmentation

**After Enhancement:**
- **🎂 Age targeting**: Birthday campaigns and age demographics
- **📍 Location marketing**: Address-based venue recommendations
- **🏢 Corporate events**: B2B targeting with company information
- **📱 Guaranteed mobile**: SMS marketing capability
- **✅ 100% opt-in**: All customers automatically in marketing funnel

## 🎉 Success Indicators

Once active, you should see:
1. **New customers** syncing with enhanced fields
2. **Brevo contacts** populated with DATE_OF_BIRTH, ADDRESS, COMPANY
3. **Marketing campaigns** can target by age, location, business type
4. **SMS + Email** multi-channel marketing enabled

Your enhanced integration will be **production-ready** for sophisticated customer targeting! 🎭✨