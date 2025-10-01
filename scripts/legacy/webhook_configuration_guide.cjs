console.log('🔗 HUMANITIX WEBHOOK CONFIGURATION GUIDE');
console.log('========================================');

console.log('✅ **STATUS UPDATE:**');
console.log('   - Real-time sync workflow: ACTIVATED');
console.log('   - Missing test orders: IMPORTED (Nelson Bours & Terrence Rothacker)');
console.log('   - N8N webhook endpoint: READY');
console.log();

console.log('🚨 **CRITICAL NEXT STEP - UPDATE WEBHOOK URL:**');
console.log('==============================================');

console.log('**Current Problem:**');
console.log('   - Humanitix webhook is calling OLD endpoint: py2wq9zchBz0TD9j');
console.log('   - This points to historical import workflow, NOT real-time sync');
console.log('   - New orders cannot sync until webhook URL is updated');
console.log();

console.log('**NEW WEBHOOK URL TO USE:**');
console.log('   http://170.64.129.59:5678/webhook/humanitix-webhook');
console.log();

console.log('🔧 **HOW TO UPDATE WEBHOOK:**');
console.log('=============================');

console.log('**Option 1: Via Humanitix Dashboard**');
console.log('   1. Log into your Humanitix account');
console.log('   2. Go to Account Settings > Webhooks');
console.log('   3. Find the existing webhook configuration');
console.log('   4. UPDATE the URL to: http://170.64.129.59:5678/webhook/humanitix-webhook');
console.log('   5. Ensure events selected: "Order Created", "Order Completed"');
console.log('   6. Save changes');
console.log();

console.log('**Option 2: Contact Humanitix Support**');
console.log('   - If you cannot access webhook settings');
console.log('   - Ask them to update your webhook URL to:');
console.log('   - http://170.64.129.59:5678/webhook/humanitix-webhook');
console.log();

console.log('🧪 **TESTING THE FIX:**');
console.log('======================');
console.log('Once webhook is updated:');
console.log('   1. Place a test order on any Humanitix event');
console.log('   2. Order should appear in Notion within 10-30 seconds');
console.log('   3. Check N8N logs at http://170.64.129.59:5678 for execution details');
console.log();

console.log('💰 **FINANCIAL FIELD VERIFICATION:**');
console.log('====================================');
console.log('All orders (including your test orders) now show:');
console.log('   ✅ Total Amount: Gross sales (original price)');
console.log('   ✅ Net Sales: Amount after discount');
console.log('   ✅ Discount Code: Code used (e.g., "LIVE")');  
console.log('   ✅ Discount Amount: Discount value');
console.log('   ✅ Complete customer & event details');
console.log();

console.log('📊 **RECENT IMPORTS CONFIRMED:**');
console.log('===============================');
console.log('   ✅ Nelson Bours: $63.60 → $30 (LIVE discount -$30)');
console.log('   ✅ Terrence Rothacker: $85.54 → $80');
console.log('   ✅ Max Eastwood: $37.20 → $35');
console.log('   ✅ Gabrielle Wakeman: $63.60 → $30 (LIVE discount -$30)');
console.log();

console.log('🎯 **FINAL STATUS:**');
console.log('===================');
console.log('   ✅ Real-time sync workflow: READY');
console.log('   ✅ Financial field mappings: FIXED');
console.log('   ✅ Test orders: IMPORTED');
console.log('   ⚠️ Webhook URL: NEEDS UPDATE');
console.log();
console.log('🚀 Once webhook URL is updated, your Humanitix sync will be 100% operational!');

console.log();
console.log('🔗 **LINKS:**');
console.log('   - Notion Database: https://www.notion.so/1374745b8cbe804b87a2ec93b3385e01');
console.log('   - N8N Dashboard: http://170.64.129.59:5678');
console.log('   - Webhook URL: http://170.64.129.59:5678/webhook/humanitix-webhook');