#!/usr/bin/env node

/**
 * Create Notion Database Views for Humanitix Partner Invoicing
 * 
 * This script creates comprehensive views for partner reporting,
 * financial analysis, and customer insights.
 */

const { Client } = require('@notionhq/client');

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

// View configurations
const viewConfigurations = {
  ticketSales: {
    // Partner Revenue Dashboard
    partnerRevenue: {
      type: "table",
      table: {
        properties: [
          "Partner",
          "Event",
          "Customer",
          "Ticket Type",
          "Quantity",
          "Unit Price",
          "Partner Share",
          "Transaction Date"
        ]
      },
      filter: {
        property: "Transaction Status",
        select: {
          equals: "Active"
        }
      },
      sorts: [
        {
          property: "Transaction Date",
          direction: "descending"
        }
      ]
    },
    
    // Event Financial Summary
    eventFinancial: {
      type: "table",
      table: {
        properties: [
          "Event",
          "Partner",
          "Gross Revenue",
          "Discount Amount",
          "Total Fees",
          "Net Revenue",
          "Partner Share",
          "Platform Share",
          "Transaction Date"
        ]
      },
      sorts: [
        {
          property: "Net Revenue",
          direction: "descending"
        }
      ]
    },
    
    // Monthly Revenue Report
    monthlyRevenue: {
      type: "table",
      table: {
        properties: [
          "Transaction Date",
          "Partner",
          "Event",
          "Net Revenue",
          "Partner Share",
          "Platform Share",
          "Discount Amount"
        ]
      },
      sorts: [
        {
          property: "Transaction Date",
          direction: "descending"
        }
      ]
    },
    
    // Refund Tracking
    refundTracking: {
      type: "table",
      table: {
        properties: [
          "Order ID",
          "Customer",
          "Event",
          "Refund Status",
          "Refund Amount",
          "Refund Date",
          "Refund Reason",
          "Transaction Date"
        ]
      },
      filter: {
        property: "Refund Status",
        select: {
          does_not_equal: "None"
        }
      },
      sorts: [
        {
          property: "Refund Date",
          direction: "descending"
        }
      ]
    },
    
    // High Value Orders
    highValueOrders: {
      type: "table",
      table: {
        properties: [
          "Order ID",
          "Customer",
          "Event",
          "Partner",
          "Net Revenue",
          "Partner Share",
          "Transaction Date"
        ]
      },
      filter: {
        property: "Net Revenue",
        number: {
          greater_than: 100
        }
      },
      sorts: [
        {
          property: "Net Revenue",
          direction: "descending"
        }
      ]
    }
  },
  
  events: {
    // Event Performance
    eventPerformance: {
      type: "table",
      table: {
        properties: [
          "Event Name",
          "Event Date",
          "Partner",
          "Total Tickets Sold",
          "Total Revenue",
          "Partner Revenue",
          "Event Status"
        ]
      },
      sorts: [
        {
          property: "Total Revenue",
          direction: "descending"
        }
      ]
    },
    
    // Upcoming Events
    upcomingEvents: {
      type: "table",
      table: {
        properties: [
          "Event Name",
          "Event Date",
          "Event Time",
          "Venue",
          "Partner",
          "Event Status"
        ]
      },
      filter: {
        and: [
          {
            property: "Event Date",
            date: {
              after: new Date().toISOString().split('T')[0]
            }
          },
          {
            property: "Event Status",
            select: {
              equals: "Active"
            }
          }
        ]
      },
      sorts: [
        {
          property: "Event Date",
          direction: "ascending"
        }
      ]
    },
    
    // Completed Events
    completedEvents: {
      type: "table",
      table: {
        properties: [
          "Event Name",
          "Event Date",
          "Partner",
          "Total Tickets Sold",
          "Total Revenue",
          "Partner Revenue"
        ]
      },
      filter: {
        property: "Event Status",
        select: {
          equals: "Completed"
        }
      },
      sorts: [
        {
          property: "Event Date",
          direction: "descending"
        }
      ]
    }
  },
  
  customers: {
    // Top Customers
    topCustomers: {
      type: "table",
      table: {
        properties: [
          "Customer Name",
          "Email",
          "Total Orders",
          "Total Spent",
          "First Purchase",
          "Last Purchase"
        ]
      },
      sorts: [
        {
          property: "Total Spent",
          direction: "descending"
        }
      ]
    },
    
    // Recent Customers
    recentCustomers: {
      type: "table",
      table: {
        properties: [
          "Customer Name",
          "Email",
          "Phone",
          "First Purchase",
          "Total Orders",
          "Total Spent"
        ]
      },
      sorts: [
        {
          property: "First Purchase",
          direction: "descending"
        }
      ]
    },
    
    // Frequent Customers
    frequentCustomers: {
      type: "table",
      table: {
        properties: [
          "Customer Name",
          "Email",
          "Total Orders",
          "Total Spent",
          "Last Purchase"
        ]
      },
      filter: {
        property: "Total Orders",
        number: {
          greater_than_or_equal_to: 3
        }
      },
      sorts: [
        {
          property: "Total Orders",
          direction: "descending"
        }
      ]
    }
  },
  
  partners: {
    // Partner Dashboard
    partnerDashboard: {
      type: "table",
      table: {
        properties: [
          "Partner Name",
          "Contact Email",
          "Total Events",
          "Total Revenue",
          "Partner Share Total",
          "Revenue Share Rate"
        ]
      },
      sorts: [
        {
          property: "Partner Share Total",
          direction: "descending"
        }
      ]
    },
    
    // Partner Performance
    partnerPerformance: {
      type: "table",
      table: {
        properties: [
          "Partner Name",
          "Total Events",
          "Total Revenue",
          "Partner Share Total",
          "Payment Method"
        ]
      },
      sorts: [
        {
          property: "Total Revenue",
          direction: "descending"
        }
      ]
    }
  }
};

async function createDatabaseView(databaseId, viewName, viewConfig) {
  try {
    // Note: Notion API doesn't directly support creating views
    // This would need to be done through the Notion UI or using blocks
    // This function serves as a template for the view configurations
    
    console.log(`📊 View configuration for ${viewName}:`);
    console.log(JSON.stringify(viewConfig, null, 2));
    
    return { viewName, config: viewConfig };
  } catch (error) {
    console.error(`❌ Error creating view ${viewName}:`, error);
    throw error;
  }
}

async function createAllViews(databaseIds) {
  console.log('🚀 Creating Notion Database Views...');
  
  const createdViews = {};
  
  // Create views for each database
  for (const [dbType, viewsConfig] of Object.entries(viewConfigurations)) {
    if (databaseIds[dbType]) {
      createdViews[dbType] = {};
      
      for (const [viewName, viewConfig] of Object.entries(viewsConfig)) {
        const view = await createDatabaseView(databaseIds[dbType], viewName, viewConfig);
        createdViews[dbType][viewName] = view;
      }
    }
  }
  
  return createdViews;
}

// Export view configurations for manual setup
function exportViewConfigurations() {
  console.log('📋 Exporting View Configurations for Manual Setup...');
  
  const viewSetupInstructions = {
    ticketSales: [
      {
        name: "Partner Revenue Dashboard",
        type: "Table",
        properties: ["Partner", "Event", "Customer", "Ticket Type", "Quantity", "Unit Price", "Partner Share", "Transaction Date"],
        filter: "Transaction Status equals Active",
        sort: "Transaction Date descending"
      },
      {
        name: "Event Financial Summary",
        type: "Table",
        properties: ["Event", "Partner", "Gross Revenue", "Discount Amount", "Total Fees", "Net Revenue", "Partner Share", "Platform Share", "Transaction Date"],
        sort: "Net Revenue descending"
      },
      {
        name: "Monthly Revenue Report",
        type: "Table",
        properties: ["Transaction Date", "Partner", "Event", "Net Revenue", "Partner Share", "Platform Share", "Discount Amount"],
        sort: "Transaction Date descending"
      },
      {
        name: "Refund Tracking",
        type: "Table",
        properties: ["Order ID", "Customer", "Event", "Refund Status", "Refund Amount", "Refund Date", "Refund Reason", "Transaction Date"],
        filter: "Refund Status does not equal None",
        sort: "Refund Date descending"
      },
      {
        name: "High Value Orders",
        type: "Table",
        properties: ["Order ID", "Customer", "Event", "Partner", "Net Revenue", "Partner Share", "Transaction Date"],
        filter: "Net Revenue greater than 100",
        sort: "Net Revenue descending"
      }
    ],
    
    events: [
      {
        name: "Event Performance",
        type: "Table",
        properties: ["Event Name", "Event Date", "Partner", "Total Tickets Sold", "Total Revenue", "Partner Revenue", "Event Status"],
        sort: "Total Revenue descending"
      },
      {
        name: "Upcoming Events",
        type: "Table",
        properties: ["Event Name", "Event Date", "Event Time", "Venue", "Partner", "Event Status"],
        filter: "Event Date after today AND Event Status equals Active",
        sort: "Event Date ascending"
      },
      {
        name: "Completed Events",
        type: "Table",
        properties: ["Event Name", "Event Date", "Partner", "Total Tickets Sold", "Total Revenue", "Partner Revenue"],
        filter: "Event Status equals Completed",
        sort: "Event Date descending"
      }
    ],
    
    customers: [
      {
        name: "Top Customers",
        type: "Table",
        properties: ["Customer Name", "Email", "Total Orders", "Total Spent", "First Purchase", "Last Purchase"],
        sort: "Total Spent descending"
      },
      {
        name: "Recent Customers",
        type: "Table",
        properties: ["Customer Name", "Email", "Phone", "First Purchase", "Total Orders", "Total Spent"],
        sort: "First Purchase descending"
      },
      {
        name: "Frequent Customers",
        type: "Table",
        properties: ["Customer Name", "Email", "Total Orders", "Total Spent", "Last Purchase"],
        filter: "Total Orders greater than or equal to 3",
        sort: "Total Orders descending"
      }
    ],
    
    partners: [
      {
        name: "Partner Dashboard",
        type: "Table",
        properties: ["Partner Name", "Contact Email", "Total Events", "Total Revenue", "Partner Share Total", "Revenue Share Rate"],
        sort: "Partner Share Total descending"
      },
      {
        name: "Partner Performance",
        type: "Table",
        properties: ["Partner Name", "Total Events", "Total Revenue", "Partner Share Total", "Payment Method"],
        sort: "Total Revenue descending"
      }
    ]
  };
  
  return viewSetupInstructions;
}

// Template for partner-specific invoice view
function createPartnerInvoiceTemplate(partnerName) {
  return {
    name: `${partnerName} - Invoice View`,
    type: "Table",
    properties: [
      "Order ID",
      "Event",
      "Customer",
      "Ticket Type",
      "Quantity",
      "Unit Price",
      "Discount Amount",
      "Partner Share",
      "Transaction Date"
    ],
    filter: `Partner equals "${partnerName}" AND Transaction Status equals Active`,
    sort: "Transaction Date descending",
    group: "Event"
  };
}

// Dashboard template for overall financial tracking
function createFinancialDashboardTemplate() {
  return {
    name: "Financial Dashboard",
    type: "Board",
    groupBy: "Partner",
    properties: [
      "Event",
      "Customer",
      "Net Revenue",
      "Partner Share",
      "Platform Share",
      "Transaction Date"
    ],
    filter: "Transaction Status equals Active",
    sort: "Net Revenue descending"
  };
}

// Run the script
if (require.main === module) {
  const databaseIds = {
    ticketSales: process.env.TICKET_SALES_DB_ID || 'TICKET_SALES_DB_ID',
    events: process.env.EVENTS_DB_ID || 'EVENTS_DB_ID',
    customers: process.env.CUSTOMERS_DB_ID || 'CUSTOMERS_DB_ID',
    partners: process.env.PARTNERS_DB_ID || 'PARTNERS_DB_ID'
  };
  
  console.log('📊 View Configurations for Manual Setup:');
  const viewInstructions = exportViewConfigurations();
  
  console.log('\n=== TICKET SALES VIEWS ===');
  viewInstructions.ticketSales.forEach(view => {
    console.log(`\n📋 ${view.name}:`);
    console.log(`   Type: ${view.type}`);
    console.log(`   Properties: ${view.properties.join(', ')}`);
    if (view.filter) console.log(`   Filter: ${view.filter}`);
    if (view.sort) console.log(`   Sort: ${view.sort}`);
    if (view.group) console.log(`   Group: ${view.group}`);
  });
  
  console.log('\n=== EVENTS VIEWS ===');
  viewInstructions.events.forEach(view => {
    console.log(`\n📋 ${view.name}:`);
    console.log(`   Type: ${view.type}`);
    console.log(`   Properties: ${view.properties.join(', ')}`);
    if (view.filter) console.log(`   Filter: ${view.filter}`);
    if (view.sort) console.log(`   Sort: ${view.sort}`);
  });
  
  console.log('\n=== CUSTOMERS VIEWS ===');
  viewInstructions.customers.forEach(view => {
    console.log(`\n📋 ${view.name}:`);
    console.log(`   Type: ${view.type}`);
    console.log(`   Properties: ${view.properties.join(', ')}`);
    if (view.filter) console.log(`   Filter: ${view.filter}`);
    if (view.sort) console.log(`   Sort: ${view.sort}`);
  });
  
  console.log('\n=== PARTNERS VIEWS ===');
  viewInstructions.partners.forEach(view => {
    console.log(`\n📋 ${view.name}:`);
    console.log(`   Type: ${view.type}`);
    console.log(`   Properties: ${view.properties.join(', ')}`);
    if (view.filter) console.log(`   Filter: ${view.filter}`);
    if (view.sort) console.log(`   Sort: ${view.sort}`);
  });
  
  console.log('\n=== SPECIAL TEMPLATES ===');
  console.log('\n📋 Partner Invoice Template (example for "Comedy Club ABC"):');
  const partnerTemplate = createPartnerInvoiceTemplate("Comedy Club ABC");
  console.log(`   Type: ${partnerTemplate.type}`);
  console.log(`   Properties: ${partnerTemplate.properties.join(', ')}`);
  console.log(`   Filter: ${partnerTemplate.filter}`);
  console.log(`   Sort: ${partnerTemplate.sort}`);
  console.log(`   Group: ${partnerTemplate.group}`);
  
  console.log('\n📋 Financial Dashboard Template:');
  const dashboardTemplate = createFinancialDashboardTemplate();
  console.log(`   Type: ${dashboardTemplate.type}`);
  console.log(`   Group By: ${dashboardTemplate.groupBy}`);
  console.log(`   Properties: ${dashboardTemplate.properties.join(', ')}`);
  console.log(`   Filter: ${dashboardTemplate.filter}`);
  console.log(`   Sort: ${dashboardTemplate.sort}`);
  
  console.log('\n✅ View configuration export completed');
  console.log('🔧 Use these configurations to manually create views in Notion');
}

module.exports = {
  viewConfigurations,
  createAllViews,
  exportViewConfigurations,
  createPartnerInvoiceTemplate,
  createFinancialDashboardTemplate
};