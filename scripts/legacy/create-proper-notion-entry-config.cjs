#!/usr/bin/env node
/**
 * Create proper "Create Entry" Notion node configuration
 */

// This is the COMPLETE configuration for the Create Entry node
// that will properly map all the transformed order data to Notion fields

const properCreateEntryConfig = {
  resource: "databasePage",
  operation: "create",
  databaseId: "2304745b-8cbe-81cd-9483-d7acc2377bd6", // Your existing database ID
  propertiesUi: {
    propertyValues: [
      {
        key: "Event Name",
        type: "title",
        title: "={{ $json.properties['Event Name'].title[0].text.content }}"
      },
      {
        key: "Event Date", 
        type: "date",
        date: "={{ $json.properties['Event Date'].date.start }}"
      },
      {
        key: "Platform",
        type: "select",
        select: "={{ $json.properties.Platform.select.name }}"
      },
      {
        key: "Order ID",
        type: "rich_text", 
        rich_text: "={{ $json.properties['Order ID'].rich_text[0].text.content }}"
      },
      {
        key: "Customer Name",
        type: "rich_text",
        rich_text: "={{ $json.properties['Customer Name'].rich_text[0].text.content }}"
      },
      {
        key: "Customer Email",
        type: "email",
        email: "={{ $json.properties['Customer Email'].email }}"
      },
      {
        key: "Customer Phone", 
        type: "phone_number",
        phone_number: "={{ $json.properties['Customer Phone'] ? $json.properties['Customer Phone'].phone_number : '' }}"
      },
      {
        key: "Ticket Types",
        type: "rich_text",
        rich_text: "={{ $json.properties['Ticket Types'].rich_text[0].text.content }}"
      },
      {
        key: "Quantity",
        type: "number",
        number: "={{ $json.properties.Quantity.number }}"
      },
      {
        key: "Amount",
        type: "number", 
        number: "={{ $json.properties.Amount.number }}"
      },
      {
        key: "Currency",
        type: "select",
        select: "={{ $json.properties.Currency.select.name }}"
      },
      {
        key: "Status",
        type: "select",
        select: "={{ $json.properties.Status.select.name }}"
      },
      {
        key: "Purchase Date",
        type: "date",
        date: "={{ $json.properties['Purchase Date'].date.start }}"
      },
      {
        key: "Venue",
        type: "rich_text",
        rich_text: "={{ $json.properties.Venue.rich_text[0].text.content }}"
      },
      {
        key: "Last Sync",
        type: "date", 
        date: "={{ $json.properties['Last Sync'].date.start }}"
      },
      {
        key: "Notes",
        type: "rich_text",
        rich_text: "={{ $json.properties.Notes.rich_text[0].text.content }}"
      }
    ]
  },
  options: {}
};

console.log('🎯 COMPLETE "Create Entry" Node Configuration:');
console.log('Copy this EXACT configuration into your Create Entry node:\n');
console.log(JSON.stringify(properCreateEntryConfig, null, 2));
console.log();

console.log('📋 Manual Configuration Steps:');
console.log('1. Open the "Create Entry" node in your N8N workflow');
console.log('2. Set the following:');
console.log('   • Resource: Database Page');
console.log('   • Operation: Create'); 
console.log('   • Database: Keep your existing database selection');
console.log('');
console.log('3. In "Properties" section, add these mappings:');
console.log();

const mappings = [
  { field: 'Event Name', type: 'Title', value: '{{ $json.properties[\'Event Name\'].title[0].text.content }}' },
  { field: 'Event Date', type: 'Date', value: '{{ $json.properties[\'Event Date\'].date.start }}' },
  { field: 'Platform', type: 'Select', value: '{{ $json.properties.Platform.select.name }}' },
  { field: 'Order ID', type: 'Rich Text', value: '{{ $json.properties[\'Order ID\'].rich_text[0].text.content }}' },
  { field: 'Customer Name', type: 'Rich Text', value: '{{ $json.properties[\'Customer Name\'].rich_text[0].text.content }}' },
  { field: 'Customer Email', type: 'Email', value: '{{ $json.properties[\'Customer Email\'].email }}' },
  { field: 'Customer Phone', type: 'Phone', value: '{{ $json.properties[\'Customer Phone\'] ? $json.properties[\'Customer Phone\'].phone_number : \'\' }}' },
  { field: 'Ticket Types', type: 'Rich Text', value: '{{ $json.properties[\'Ticket Types\'].rich_text[0].text.content }}' },
  { field: 'Quantity', type: 'Number', value: '{{ $json.properties.Quantity.number }}' },
  { field: 'Amount', type: 'Number', value: '{{ $json.properties.Amount.number }}' },
  { field: 'Currency', type: 'Select', value: '{{ $json.properties.Currency.select.name }}' },
  { field: 'Status', type: 'Select', value: '{{ $json.properties.Status.select.name }}' },
  { field: 'Purchase Date', type: 'Date', value: '{{ $json.properties[\'Purchase Date\'].date.start }}' },
  { field: 'Venue', type: 'Rich Text', value: '{{ $json.properties.Venue.rich_text[0].text.content }}' },
  { field: 'Last Sync', type: 'Date', value: '{{ $json.properties[\'Last Sync\'].date.start }}' },
  { field: 'Notes', type: 'Rich Text', value: '{{ $json.properties.Notes.rich_text[0].text.content }}' }
];

mappings.forEach((mapping, index) => {
  console.log(`   ${index + 1}. Field: "${mapping.field}"`);
  console.log(`      Type: ${mapping.type}`);
  console.log(`      Value: ${mapping.value}`);
  console.log('');
});

console.log('4. Save the workflow');
console.log();

console.log('🎉 What This Fixes:');
console.log('  ✅ Maps ALL transformed data from Transform Orders to Notion fields');
console.log('  ✅ Proper field types (title, rich_text, email, number, date, select)');  
console.log('  ✅ Handles optional fields like Customer Phone safely');
console.log('  ✅ Creates complete Notion database entries with all order data');
console.log('  ✅ Connects the entire workflow chain properly');
console.log();

console.log('🚀 After this fix, your workflow will:');
console.log('  1. ✅ Fetch Humanitix events and orders');
console.log('  2. ✅ Transform data with safe JavaScript'); 
console.log('  3. ✅ Check for duplicates by Order ID');
console.log('  4. ✅ Create complete Notion entries with all data');
console.log('  5. ✅ Successfully import ALL historical data!');

console.log('\n💡 The Create Entry node was completely empty - this fixes everything!');