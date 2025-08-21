#!/usr/bin/env node

/**
 * Create Notion Database for Humanitix Partner Invoicing
 * 
 * This script creates a comprehensive Notion database schema
 * for managing Humanitix ticket sales with partner invoicing.
 */

const { Client } = require('@notionhq/client');

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

// Database properties configuration
const ticketSalesProperties = {
  // Core Transaction Fields
  "Order ID": {
    title: {}
  },
  "Event": {
    relation: {
      database_id: "" // Will be set when Events table is created
    }
  },
  "Customer": {
    relation: {
      database_id: "" // Will be set when Customers table is created
    }
  },
  "Partner": {
    relation: {
      database_id: "" // Will be set when Partners table is created
    }
  },
  "Transaction Date": {
    date: {}
  },
  "Transaction Status": {
    select: {
      options: [
        { name: "Active", color: "green" },
        { name: "Refunded", color: "red" },
        { name: "Transferred", color: "yellow" },
        { name: "Cancelled", color: "gray" }
      ]
    }
  },
  
  // Ticket Details
  "Ticket Type": {
    rich_text: {}
  },
  "Quantity": {
    number: {
      format: "number"
    }
  },
  "Unit Price": {
    number: {
      format: "dollar"
    }
  },
  "Subtotal": {
    formula: {
      expression: "prop(\"Quantity\") * prop(\"Unit Price\")"
    }
  },
  "Package Name": {
    rich_text: {}
  },
  "Package Price": {
    number: {
      format: "dollar"
    }
  },
  
  // Discount Information
  "Discount Code": {
    rich_text: {}
  },
  "Discount Type": {
    select: {
      options: [
        { name: "Percentage", color: "blue" },
        { name: "Fixed", color: "green" },
        { name: "Package", color: "purple" }
      ]
    }
  },
  "Discount Amount": {
    number: {
      format: "dollar"
    }
  },
  "Discount Percentage": {
    number: {
      format: "percent"
    }
  },
  
  // Fee Breakdown
  "Platform Fee": {
    number: {
      format: "dollar"
    }
  },
  "Booking Fee": {
    number: {
      format: "dollar"
    }
  },
  "Processing Fee": {
    number: {
      format: "dollar"
    }
  },
  "Total Fees": {
    formula: {
      expression: "prop(\"Platform Fee\") + prop(\"Booking Fee\") + prop(\"Processing Fee\")"
    }
  },
  
  // Financial Calculations
  "Gross Revenue": {
    formula: {
      expression: "prop(\"Subtotal\")"
    }
  },
  "Net Revenue": {
    formula: {
      expression: "prop(\"Gross Revenue\") - prop(\"Discount Amount\") - prop(\"Total Fees\")"
    }
  },
  "Partner Share": {
    formula: {
      expression: "prop(\"Net Revenue\") * 0.743"
    }
  },
  "Platform Share": {
    formula: {
      expression: "prop(\"Total Fees\") + (prop(\"Net Revenue\") * 0.257)"
    }
  },
  
  // Refund Tracking
  "Refund Status": {
    select: {
      options: [
        { name: "None", color: "green" },
        { name: "Partial", color: "yellow" },
        { name: "Full", color: "red" }
      ]
    }
  },
  "Refund Amount": {
    number: {
      format: "dollar"
    }
  },
  "Refund Date": {
    date: {}
  },
  "Refund Reason": {
    rich_text: {}
  },
  
  // Audit Trail
  "Import Batch": {
    rich_text: {}
  }
};

const eventsProperties = {
  "Event Name": {
    title: {}
  },
  "Event Date": {
    date: {}
  },
  "Event Time": {
    rich_text: {}
  },
  "Venue": {
    rich_text: {}
  },
  "Partner": {
    relation: {
      database_id: "" // Will be set when Partners table is created
    }
  },
  "Event Status": {
    select: {
      options: [
        { name: "Active", color: "green" },
        { name: "Cancelled", color: "red" },
        { name: "Completed", color: "blue" }
      ]
    }
  },
  "Total Tickets Sold": {
    rollup: {
      relation_property_name: "Event",
      rollup_property_name: "Quantity",
      function: "sum"
    }
  },
  "Total Revenue": {
    rollup: {
      relation_property_name: "Event",
      rollup_property_name: "Net Revenue",
      function: "sum"
    }
  },
  "Partner Revenue": {
    rollup: {
      relation_property_name: "Event",
      rollup_property_name: "Partner Share",
      function: "sum"
    }
  },
  "Event Description": {
    rich_text: {}
  }
};

const customersProperties = {
  "Customer Name": {
    title: {}
  },
  "Email": {
    email: {}
  },
  "Phone": {
    phone_number: {}
  },
  "Total Orders": {
    rollup: {
      relation_property_name: "Customer",
      rollup_property_name: "Order ID",
      function: "count"
    }
  },
  "Total Spent": {
    rollup: {
      relation_property_name: "Customer",
      rollup_property_name: "Net Revenue",
      function: "sum"
    }
  },
  "First Purchase": {
    rollup: {
      relation_property_name: "Customer",
      rollup_property_name: "Transaction Date",
      function: "earliest_date"
    }
  },
  "Last Purchase": {
    rollup: {
      relation_property_name: "Customer",
      rollup_property_name: "Transaction Date",
      function: "latest_date"
    }
  },
  "Customer Status": {
    select: {
      options: [
        { name: "Active", color: "green" },
        { name: "Inactive", color: "gray" }
      ]
    }
  }
};

const partnersProperties = {
  "Partner Name": {
    title: {}
  },
  "Contact Email": {
    email: {}
  },
  "Contact Phone": {
    phone_number: {}
  },
  "Revenue Share Rate": {
    number: {
      format: "percent"
    }
  },
  "Total Events": {
    rollup: {
      relation_property_name: "Partner",
      rollup_property_name: "Event Name",
      function: "count"
    }
  },
  "Total Revenue": {
    rollup: {
      relation_property_name: "Partner",
      rollup_property_name: "Net Revenue",
      function: "sum"
    }
  },
  "Partner Share Total": {
    rollup: {
      relation_property_name: "Partner",
      rollup_property_name: "Partner Share",
      function: "sum"
    }
  },
  "Payment Method": {
    select: {
      options: [
        { name: "Bank Transfer", color: "green" },
        { name: "PayPal", color: "blue" },
        { name: "Check", color: "yellow" }
      ]
    }
  },
  "Tax ID": {
    rich_text: {}
  }
};

const ticketTypesProperties = {
  "Ticket Type Name": {
    title: {}
  },
  "Event": {
    relation: {
      database_id: "" // Will be set when Events table is created
    }
  },
  "Base Price": {
    number: {
      format: "dollar"
    }
  },
  "Quantity Available": {
    number: {
      format: "number"
    }
  },
  "Quantity Sold": {
    rollup: {
      relation_property_name: "Ticket Type",
      rollup_property_name: "Quantity",
      function: "sum"
    }
  },
  "Revenue Generated": {
    rollup: {
      relation_property_name: "Ticket Type",
      rollup_property_name: "Net Revenue",
      function: "sum"
    }
  },
  "Ticket Description": {
    rich_text: {}
  }
};

async function createDatabase(title, properties, parent_page_id) {
  try {
    const response = await notion.databases.create({
      parent: {
        type: "page_id",
        page_id: parent_page_id
      },
      title: [
        {
          type: "text",
          text: {
            content: title
          }
        }
      ],
      properties: properties
    });
    
    console.log(`✅ Created database: ${title}`);
    console.log(`Database ID: ${response.id}`);
    return response;
  } catch (error) {
    console.error(`❌ Error creating database ${title}:`, error);
    throw error;
  }
}

async function updateDatabaseRelations(databaseId, properties) {
  try {
    await notion.databases.update({
      database_id: databaseId,
      properties: properties
    });
    console.log(`✅ Updated database relations for ${databaseId}`);
  } catch (error) {
    console.error(`❌ Error updating database relations:`, error);
    throw error;
  }
}

async function createHumanitixDatabaseSystem() {
  console.log('🚀 Creating Humanitix Partner Invoicing Database System...');
  
  // You'll need to replace this with an actual parent page ID
  const PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID || 'YOUR_PARENT_PAGE_ID';
  
  if (PARENT_PAGE_ID === 'YOUR_PARENT_PAGE_ID') {
    console.error('❌ Please set NOTION_PARENT_PAGE_ID environment variable');
    process.exit(1);
  }
  
  try {
    // Create databases in order
    const partnersDb = await createDatabase('Partners', partnersProperties, PARENT_PAGE_ID);
    const eventsDb = await createDatabase('Events', eventsProperties, PARENT_PAGE_ID);
    const customersDb = await createDatabase('Customers', customersProperties, PARENT_PAGE_ID);
    const ticketTypesDb = await createDatabase('Ticket Types', ticketTypesProperties, PARENT_PAGE_ID);
    
    // Update relations in properties
    ticketSalesProperties.Event.relation.database_id = eventsDb.id;
    ticketSalesProperties.Customer.relation.database_id = customersDb.id;
    ticketSalesProperties.Partner.relation.database_id = partnersDb.id;
    
    eventsProperties.Partner.relation.database_id = partnersDb.id;
    ticketTypesProperties.Event.relation.database_id = eventsDb.id;
    
    // Create main ticket sales database
    const ticketSalesDb = await createDatabase('Ticket Sales', ticketSalesProperties, PARENT_PAGE_ID);
    
    // Update rollup relations
    const updatedEventsProperties = {
      "Total Tickets Sold": {
        rollup: {
          relation_property_name: "Event",
          rollup_property_name: "Quantity",
          function: "sum"
        }
      },
      "Total Revenue": {
        rollup: {
          relation_property_name: "Event",
          rollup_property_name: "Net Revenue",
          function: "sum"
        }
      },
      "Partner Revenue": {
        rollup: {
          relation_property_name: "Event",
          rollup_property_name: "Partner Share",
          function: "sum"
        }
      }
    };
    
    await updateDatabaseRelations(eventsDb.id, updatedEventsProperties);
    
    // Update customer rollups
    const updatedCustomersProperties = {
      "Total Orders": {
        rollup: {
          relation_property_name: "Customer",
          rollup_property_name: "Order ID",
          function: "count"
        }
      },
      "Total Spent": {
        rollup: {
          relation_property_name: "Customer",
          rollup_property_name: "Net Revenue",
          function: "sum"
        }
      },
      "First Purchase": {
        rollup: {
          relation_property_name: "Customer",
          rollup_property_name: "Transaction Date",
          function: "earliest_date"
        }
      },
      "Last Purchase": {
        rollup: {
          relation_property_name: "Customer",
          rollup_property_name: "Transaction Date",
          function: "latest_date"
        }
      }
    };
    
    await updateDatabaseRelations(customersDb.id, updatedCustomersProperties);
    
    // Update partner rollups
    const updatedPartnersProperties = {
      "Total Events": {
        rollup: {
          relation_property_name: "Partner",
          rollup_property_name: "Event Name",
          function: "count"
        }
      },
      "Total Revenue": {
        rollup: {
          relation_property_name: "Partner",
          rollup_property_name: "Net Revenue",
          function: "sum"
        }
      },
      "Partner Share Total": {
        rollup: {
          relation_property_name: "Partner",
          rollup_property_name: "Partner Share",
          function: "sum"
        }
      }
    };
    
    await updateDatabaseRelations(partnersDb.id, updatedPartnersProperties);
    
    console.log('🎉 Humanitix Database System Created Successfully!');
    console.log('\nDatabase IDs:');
    console.log(`Partners: ${partnersDb.id}`);
    console.log(`Events: ${eventsDb.id}`);
    console.log(`Customers: ${customersDb.id}`);
    console.log(`Ticket Types: ${ticketTypesDb.id}`);
    console.log(`Ticket Sales: ${ticketSalesDb.id}`);
    
    return {
      partners: partnersDb.id,
      events: eventsDb.id,
      customers: customersDb.id,
      ticketTypes: ticketTypesDb.id,
      ticketSales: ticketSalesDb.id
    };
    
  } catch (error) {
    console.error('❌ Error creating database system:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  createHumanitixDatabaseSystem()
    .then(() => {
      console.log('✅ Database creation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database creation failed:', error);
      process.exit(1);
    });
}

module.exports = {
  createHumanitixDatabaseSystem,
  ticketSalesProperties,
  eventsProperties,
  customersProperties,
  partnersProperties,
  ticketTypesProperties
};