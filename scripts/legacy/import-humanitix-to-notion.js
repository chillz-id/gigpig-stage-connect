#!/usr/bin/env node

/**
 * Import Humanitix Data to Notion Database
 * 
 * This script imports data from N8N workflow results into the
 * Notion database system for partner invoicing.
 */

const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

// Database IDs (these would be set after database creation)
const DATABASE_IDS = {
  partners: process.env.PARTNERS_DB_ID,
  events: process.env.EVENTS_DB_ID,
  customers: process.env.CUSTOMERS_DB_ID,
  ticketTypes: process.env.TICKET_TYPES_DB_ID,
  ticketSales: process.env.TICKET_SALES_DB_ID
};

// Sample data structure based on N8N workflow results
const sampleHumanitixData = {
  orders: [
    {
      order_id: "HUM-2024-001",
      event_name: "Comedy Night at The Laugh Track",
      event_date: "2024-02-15",
      event_time: "20:00",
      venue: "The Laugh Track",
      partner_name: "Comedy Club ABC",
      partner_email: "bookings@comedyclubabc.com",
      customer_name: "John Smith",
      customer_email: "john.smith@email.com",
      customer_phone: "+61400123456",
      ticket_type: "General Admission",
      quantity: 2,
      unit_price: 35.00,
      discount_code: "EARLY10",
      discount_amount: 7.00,
      platform_fee: 4.20,
      booking_fee: 2.10,
      processing_fee: 1.68,
      transaction_date: "2024-01-15T10:30:00Z",
      refund_amount: 0,
      refund_date: null,
      refund_reason: null
    }
  ],
  financial_summary: {
    total_revenue: 32472.86,
    partner_share: 24142.07,
    platform_fees: 4488.06,
    discounts: 3380.93,
    refunds: 481.73
  }
};

// Utility functions
function formatCurrency(amount) {
  return Math.round(amount * 100) / 100;
}

function formatDate(dateString) {
  if (!dateString) return null;
  return new Date(dateString).toISOString().split('T')[0];
}

function formatDateTime(dateString) {
  if (!dateString) return null;
  return new Date(dateString).toISOString();
}

// Create or find partner
async function createOrFindPartner(partnerData) {
  try {
    // Search for existing partner
    const existingPartner = await notion.databases.query({
      database_id: DATABASE_IDS.partners,
      filter: {
        property: "Partner Name",
        title: {
          equals: partnerData.partner_name
        }
      }
    });
    
    if (existingPartner.results.length > 0) {
      return existingPartner.results[0];
    }
    
    // Create new partner
    const newPartner = await notion.pages.create({
      parent: { database_id: DATABASE_IDS.partners },
      properties: {
        "Partner Name": {
          title: [{ text: { content: partnerData.partner_name } }]
        },
        "Contact Email": {
          email: partnerData.partner_email
        },
        "Revenue Share Rate": {
          number: 0.743 // 74.3% partner share
        },
        "Payment Method": {
          select: { name: "Bank Transfer" }
        },
        "Customer Status": {
          select: { name: "Active" }
        }
      }
    });
    
    console.log(`✅ Created partner: ${partnerData.partner_name}`);
    return newPartner;
    
  } catch (error) {
    console.error(`❌ Error creating partner ${partnerData.partner_name}:`, error);
    throw error;
  }
}

// Create or find event
async function createOrFindEvent(eventData, partnerId) {
  try {
    // Search for existing event
    const existingEvent = await notion.databases.query({
      database_id: DATABASE_IDS.events,
      filter: {
        and: [
          {
            property: "Event Name",
            title: {
              equals: eventData.event_name
            }
          },
          {
            property: "Event Date",
            date: {
              equals: formatDate(eventData.event_date)
            }
          }
        ]
      }
    });
    
    if (existingEvent.results.length > 0) {
      return existingEvent.results[0];
    }
    
    // Create new event
    const newEvent = await notion.pages.create({
      parent: { database_id: DATABASE_IDS.events },
      properties: {
        "Event Name": {
          title: [{ text: { content: eventData.event_name } }]
        },
        "Event Date": {
          date: { start: formatDate(eventData.event_date) }
        },
        "Event Time": {
          rich_text: [{ text: { content: eventData.event_time || "" } }]
        },
        "Venue": {
          rich_text: [{ text: { content: eventData.venue || "" } }]
        },
        "Partner": {
          relation: [{ id: partnerId }]
        },
        "Event Status": {
          select: { name: "Active" }
        }
      }
    });
    
    console.log(`✅ Created event: ${eventData.event_name}`);
    return newEvent;
    
  } catch (error) {
    console.error(`❌ Error creating event ${eventData.event_name}:`, error);
    throw error;
  }
}

// Create or find customer
async function createOrFindCustomer(customerData) {
  try {
    // Search for existing customer
    const existingCustomer = await notion.databases.query({
      database_id: DATABASE_IDS.customers,
      filter: {
        property: "Email",
        email: {
          equals: customerData.customer_email
        }
      }
    });
    
    if (existingCustomer.results.length > 0) {
      return existingCustomer.results[0];
    }
    
    // Create new customer
    const newCustomer = await notion.pages.create({
      parent: { database_id: DATABASE_IDS.customers },
      properties: {
        "Customer Name": {
          title: [{ text: { content: customerData.customer_name } }]
        },
        "Email": {
          email: customerData.customer_email
        },
        "Phone": {
          phone_number: customerData.customer_phone || null
        },
        "Customer Status": {
          select: { name: "Active" }
        }
      }
    });
    
    console.log(`✅ Created customer: ${customerData.customer_name}`);
    return newCustomer;
    
  } catch (error) {
    console.error(`❌ Error creating customer ${customerData.customer_name}:`, error);
    throw error;
  }
}

// Create ticket sale record
async function createTicketSale(orderData, partnerId, eventId, customerId) {
  try {
    const grossRevenue = formatCurrency(orderData.quantity * orderData.unit_price);
    const totalFees = formatCurrency(
      (orderData.platform_fee || 0) + 
      (orderData.booking_fee || 0) + 
      (orderData.processing_fee || 0)
    );
    const discountAmount = formatCurrency(orderData.discount_amount || 0);
    const netRevenue = formatCurrency(grossRevenue - discountAmount - totalFees);
    const partnerShare = formatCurrency(netRevenue * 0.743);
    const platformShare = formatCurrency(netRevenue * 0.257 + totalFees);
    
    const ticketSale = await notion.pages.create({
      parent: { database_id: DATABASE_IDS.ticketSales },
      properties: {
        "Order ID": {
          title: [{ text: { content: orderData.order_id } }]
        },
        "Partner": {
          relation: [{ id: partnerId }]
        },
        "Event": {
          relation: [{ id: eventId }]
        },
        "Customer": {
          relation: [{ id: customerId }]
        },
        "Transaction Date": {
          date: { start: formatDateTime(orderData.transaction_date) }
        },
        "Transaction Status": {
          select: { name: orderData.refund_amount > 0 ? "Refunded" : "Active" }
        },
        "Ticket Type": {
          rich_text: [{ text: { content: orderData.ticket_type } }]
        },
        "Quantity": {
          number: orderData.quantity
        },
        "Unit Price": {
          number: formatCurrency(orderData.unit_price)
        },
        "Package Name": {
          rich_text: [{ text: { content: orderData.package_name || "" } }]
        },
        "Package Price": {
          number: formatCurrency(orderData.package_price || 0)
        },
        "Discount Code": {
          rich_text: [{ text: { content: orderData.discount_code || "" } }]
        },
        "Discount Amount": {
          number: discountAmount
        },
        "Platform Fee": {
          number: formatCurrency(orderData.platform_fee || 0)
        },
        "Booking Fee": {
          number: formatCurrency(orderData.booking_fee || 0)
        },
        "Processing Fee": {
          number: formatCurrency(orderData.processing_fee || 0)
        },
        "Refund Status": {
          select: { 
            name: orderData.refund_amount > 0 ? 
              (orderData.refund_amount >= netRevenue ? "Full" : "Partial") : 
              "None" 
          }
        },
        "Refund Amount": {
          number: formatCurrency(orderData.refund_amount || 0)
        },
        "Refund Date": {
          date: orderData.refund_date ? { start: formatDate(orderData.refund_date) } : null
        },
        "Refund Reason": {
          rich_text: [{ text: { content: orderData.refund_reason || "" } }]
        },
        "Import Batch": {
          rich_text: [{ text: { content: `import-${new Date().toISOString().split('T')[0]}` } }]
        }
      }
    });
    
    console.log(`✅ Created ticket sale: ${orderData.order_id}`);
    return ticketSale;
    
  } catch (error) {
    console.error(`❌ Error creating ticket sale ${orderData.order_id}:`, error);
    throw error;
  }
}

// Process batch import
async function processBatchImport(data) {
  console.log('🚀 Starting batch import of Humanitix data...');
  
  const results = {
    partners: [],
    events: [],
    customers: [],
    ticketSales: [],
    errors: []
  };
  
  try {
    for (const order of data.orders) {
      try {
        // Create or find partner
        const partner = await createOrFindPartner(order);
        results.partners.push(partner);
        
        // Create or find event
        const event = await createOrFindEvent(order, partner.id);
        results.events.push(event);
        
        // Create or find customer
        const customer = await createOrFindCustomer(order);
        results.customers.push(customer);
        
        // Create ticket sale
        const ticketSale = await createTicketSale(order, partner.id, event.id, customer.id);
        results.ticketSales.push(ticketSale);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error processing order ${order.order_id}:`, error);
        results.errors.push({
          order_id: order.order_id,
          error: error.message
        });
      }
    }
    
    console.log('✅ Batch import completed');
    console.log(`📊 Results: ${results.ticketSales.length} ticket sales, ${results.errors.length} errors`);
    
    return results;
    
  } catch (error) {
    console.error('❌ Batch import failed:', error);
    throw error;
  }
}

// Load data from N8N workflow result
async function loadDataFromN8N(workflowId) {
  try {
    // This would connect to N8N API to get workflow results
    // For now, we'll use sample data
    console.log(`📥 Loading data from N8N workflow: ${workflowId}`);
    
    // In a real implementation, this would call N8N API
    // const response = await fetch(`${process.env.N8N_API_URL}/executions/${workflowId}`);
    // const data = await response.json();
    
    // For demonstration, return sample data
    return sampleHumanitixData;
    
  } catch (error) {
    console.error('❌ Error loading data from N8N:', error);
    throw error;
  }
}

// Load data from JSON file
async function loadDataFromFile(filePath) {
  try {
    console.log(`📁 Loading data from file: ${filePath}`);
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    
    console.log(`✅ Loaded ${data.orders?.length || 0} orders from file`);
    return data;
    
  } catch (error) {
    console.error('❌ Error loading data from file:', error);
    throw error;
  }
}

// Generate import report
function generateImportReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total_orders: results.ticketSales.length,
      successful_imports: results.ticketSales.length - results.errors.length,
      failed_imports: results.errors.length,
      unique_partners: new Set(results.partners.map(p => p.id)).size,
      unique_events: new Set(results.events.map(e => e.id)).size,
      unique_customers: new Set(results.customers.map(c => c.id)).size
    },
    errors: results.errors
  };
  
  console.log('📊 Import Report:');
  console.log(JSON.stringify(report, null, 2));
  
  return report;
}

// Main import function
async function importHumanitixData(source, sourceId = null) {
  try {
    // Validate database IDs
    for (const [dbType, dbId] of Object.entries(DATABASE_IDS)) {
      if (!dbId || dbId.startsWith('process.env.')) {
        console.error(`❌ Database ID not set for ${dbType}: ${dbId}`);
        throw new Error(`Please set ${dbType.toUpperCase()}_DB_ID environment variable`);
      }
    }
    
    let data;
    
    switch (source) {
      case 'n8n':
        data = await loadDataFromN8N(sourceId);
        break;
      case 'file':
        data = await loadDataFromFile(sourceId);
        break;
      case 'sample':
        data = sampleHumanitixData;
        break;
      default:
        throw new Error(`Unknown source: ${source}`);
    }
    
    const results = await processBatchImport(data);
    const report = generateImportReport(results);
    
    // Save report to file
    const reportPath = path.join(__dirname, `import-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📋 Import report saved to: ${reportPath}`);
    return results;
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  const source = process.argv[2] || 'sample';
  const sourceId = process.argv[3];
  
  console.log(`🚀 Starting Humanitix data import from ${source}...`);
  
  importHumanitixData(source, sourceId)
    .then((results) => {
      console.log('✅ Import completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Import failed:', error);
      process.exit(1);
    });
}

module.exports = {
  importHumanitixData,
  processBatchImport,
  createOrFindPartner,
  createOrFindEvent,
  createOrFindCustomer,
  createTicketSale,
  generateImportReport
};