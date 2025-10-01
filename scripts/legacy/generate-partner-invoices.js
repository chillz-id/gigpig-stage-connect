#!/usr/bin/env node

/**
 * Generate Partner Invoices from Notion Database
 * 
 * This script generates detailed invoices for partners based on
 * their ticket sales data in the Notion database.
 */

const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

// Database IDs
const DATABASE_IDS = {
  partners: process.env.PARTNERS_DB_ID,
  events: process.env.EVENTS_DB_ID,
  customers: process.env.CUSTOMERS_DB_ID,
  ticketSales: process.env.TICKET_SALES_DB_ID
};

// Invoice generation utilities
class InvoiceGenerator {
  constructor() {
    this.invoiceNumber = 0;
  }
  
  generateInvoiceNumber(partnerName, month, year) {
    this.invoiceNumber++;
    const partnerCode = partnerName.replace(/[^A-Z]/g, '').substring(0, 3);
    return `INV-${partnerCode}-${year}${month.toString().padStart(2, '0')}-${this.invoiceNumber.toString().padStart(3, '0')}`;
  }
  
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  }
  
  formatDate(date) {
    return new Intl.DateTimeFormat('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  }
  
  formatPercentage(decimal) {
    return `${(decimal * 100).toFixed(1)}%`;
  }
}

// Get partner data
async function getPartnerData(partnerId) {
  try {
    const partner = await notion.pages.retrieve({
      page_id: partnerId
    });
    
    return {
      id: partner.id,
      name: partner.properties["Partner Name"]?.title[0]?.text?.content || 'Unknown Partner',
      email: partner.properties["Contact Email"]?.email || '',
      phone: partner.properties["Contact Phone"]?.phone_number || '',
      revenueShareRate: partner.properties["Revenue Share Rate"]?.number || 0.743,
      paymentMethod: partner.properties["Payment Method"]?.select?.name || 'Bank Transfer',
      taxId: partner.properties["Tax ID"]?.rich_text[0]?.text?.content || ''
    };
  } catch (error) {
    console.error(`❌ Error retrieving partner ${partnerId}:`, error);
    throw error;
  }
}

// Get ticket sales for partner in date range
async function getPartnerSales(partnerId, startDate, endDate) {
  try {
    const response = await notion.databases.query({
      database_id: DATABASE_IDS.ticketSales,
      filter: {
        and: [
          {
            property: "Partner",
            relation: {
              contains: partnerId
            }
          },
          {
            property: "Transaction Date",
            date: {
              on_or_after: startDate
            }
          },
          {
            property: "Transaction Date",
            date: {
              on_or_before: endDate
            }
          },
          {
            property: "Transaction Status",
            select: {
              equals: "Active"
            }
          }
        ]
      },
      sorts: [
        {
          property: "Transaction Date",
          direction: "ascending"
        }
      ]
    });
    
    return response.results.map(page => ({
      orderId: page.properties["Order ID"]?.title[0]?.text?.content || '',
      eventId: page.properties["Event"]?.relation[0]?.id || '',
      customerId: page.properties["Customer"]?.relation[0]?.id || '',
      transactionDate: page.properties["Transaction Date"]?.date?.start || '',
      ticketType: page.properties["Ticket Type"]?.rich_text[0]?.text?.content || '',
      quantity: page.properties["Quantity"]?.number || 0,
      unitPrice: page.properties["Unit Price"]?.number || 0,
      discountCode: page.properties["Discount Code"]?.rich_text[0]?.text?.content || '',
      discountAmount: page.properties["Discount Amount"]?.number || 0,
      platformFee: page.properties["Platform Fee"]?.number || 0,
      bookingFee: page.properties["Booking Fee"]?.number || 0,
      processingFee: page.properties["Processing Fee"]?.number || 0,
      grossRevenue: page.properties["Quantity"]?.number * page.properties["Unit Price"]?.number || 0,
      netRevenue: page.properties["Gross Revenue"]?.number - page.properties["Discount Amount"]?.number - page.properties["Total Fees"]?.number || 0,
      partnerShare: page.properties["Partner Share"]?.number || 0,
      platformShare: page.properties["Platform Share"]?.number || 0,
      refundAmount: page.properties["Refund Amount"]?.number || 0
    }));
  } catch (error) {
    console.error(`❌ Error retrieving sales for partner ${partnerId}:`, error);
    throw error;
  }
}

// Get event details
async function getEventDetails(eventIds) {
  try {
    const events = {};
    
    for (const eventId of eventIds) {
      const event = await notion.pages.retrieve({
        page_id: eventId
      });
      
      events[eventId] = {
        name: event.properties["Event Name"]?.title[0]?.text?.content || 'Unknown Event',
        date: event.properties["Event Date"]?.date?.start || '',
        time: event.properties["Event Time"]?.rich_text[0]?.text?.content || '',
        venue: event.properties["Venue"]?.rich_text[0]?.text?.content || ''
      };
    }
    
    return events;
  } catch (error) {
    console.error('❌ Error retrieving event details:', error);
    throw error;
  }
}

// Get customer details
async function getCustomerDetails(customerIds) {
  try {
    const customers = {};
    
    for (const customerId of customerIds) {
      const customer = await notion.pages.retrieve({
        page_id: customerId
      });
      
      customers[customerId] = {
        name: customer.properties["Customer Name"]?.title[0]?.text?.content || 'Unknown Customer',
        email: customer.properties["Email"]?.email || '',
        phone: customer.properties["Phone"]?.phone_number || ''
      };
    }
    
    return customers;
  } catch (error) {
    console.error('❌ Error retrieving customer details:', error);
    throw error;
  }
}

// Generate invoice data
async function generateInvoiceData(partnerId, startDate, endDate) {
  try {
    console.log(`📊 Generating invoice for partner ${partnerId} from ${startDate} to ${endDate}`);
    
    const generator = new InvoiceGenerator();
    
    // Get partner data
    const partner = await getPartnerData(partnerId);
    
    // Get ticket sales
    const sales = await getPartnerSales(partnerId, startDate, endDate);
    
    if (sales.length === 0) {
      console.log('ℹ️  No sales found for this partner in the specified date range');
      return null;
    }
    
    // Get event and customer details
    const uniqueEventIds = [...new Set(sales.map(sale => sale.eventId))];
    const uniqueCustomerIds = [...new Set(sales.map(sale => sale.customerId))];
    
    const events = await getEventDetails(uniqueEventIds);
    const customers = await getCustomerDetails(uniqueCustomerIds);
    
    // Calculate totals
    const totals = sales.reduce((acc, sale) => {
      acc.totalTickets += sale.quantity;
      acc.grossRevenue += sale.grossRevenue;
      acc.totalDiscounts += sale.discountAmount;
      acc.totalFees += sale.platformFee + sale.bookingFee + sale.processingFee;
      acc.netRevenue += sale.netRevenue;
      acc.partnerShare += sale.partnerShare;
      acc.platformShare += sale.platformShare;
      acc.totalRefunds += sale.refundAmount;
      return acc;
    }, {
      totalTickets: 0,
      grossRevenue: 0,
      totalDiscounts: 0,
      totalFees: 0,
      netRevenue: 0,
      partnerShare: 0,
      platformShare: 0,
      totalRefunds: 0
    });
    
    // Group sales by event
    const salesByEvent = sales.reduce((acc, sale) => {
      if (!acc[sale.eventId]) {
        acc[sale.eventId] = [];
      }
      acc[sale.eventId].push(sale);
      return acc;
    }, {});
    
    // Generate invoice number
    const invoiceDate = new Date();
    const invoiceNumber = generator.generateInvoiceNumber(
      partner.name, 
      invoiceDate.getMonth() + 1, 
      invoiceDate.getFullYear()
    );
    
    return {
      invoiceNumber,
      invoiceDate: invoiceDate.toISOString(),
      period: {
        startDate,
        endDate
      },
      partner,
      sales: sales.map(sale => ({
        ...sale,
        event: events[sale.eventId],
        customer: customers[sale.customerId]
      })),
      salesByEvent: Object.keys(salesByEvent).map(eventId => ({
        event: events[eventId],
        sales: salesByEvent[eventId].map(sale => ({
          ...sale,
          customer: customers[sale.customerId]
        })),
        eventTotals: salesByEvent[eventId].reduce((acc, sale) => {
          acc.tickets += sale.quantity;
          acc.grossRevenue += sale.grossRevenue;
          acc.discounts += sale.discountAmount;
          acc.fees += sale.platformFee + sale.bookingFee + sale.processingFee;
          acc.netRevenue += sale.netRevenue;
          acc.partnerShare += sale.partnerShare;
          return acc;
        }, {
          tickets: 0,
          grossRevenue: 0,
          discounts: 0,
          fees: 0,
          netRevenue: 0,
          partnerShare: 0
        })
      })),
      totals,
      generator
    };
    
  } catch (error) {
    console.error('❌ Error generating invoice data:', error);
    throw error;
  }
}

// Generate HTML invoice
function generateHTMLInvoice(invoiceData) {
  const { partner, invoiceNumber, invoiceDate, period, salesByEvent, totals, generator } = invoiceData;
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Partner Invoice - ${invoiceNumber}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
        .invoice-header { border-bottom: 2px solid #4CAF50; padding-bottom: 20px; margin-bottom: 30px; }
        .invoice-title { font-size: 28px; color: #4CAF50; margin: 0; }
        .invoice-number { font-size: 18px; color: #666; margin: 5px 0; }
        .invoice-date { font-size: 14px; color: #888; }
        .partner-info { background: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .partner-name { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
        .period-info { background: #e8f5e8; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .event-section { margin-bottom: 30px; border: 1px solid #ddd; border-radius: 5px; }
        .event-header { background: #4CAF50; color: white; padding: 10px 15px; font-weight: bold; }
        .event-details { padding: 10px 15px; background: #f0f8f0; font-size: 14px; }
        .sales-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .sales-table th, .sales-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .sales-table th { background: #f2f2f2; font-weight: bold; }
        .sales-table .currency { text-align: right; }
        .event-totals { background: #f9f9f9; padding: 10px 15px; border-top: 1px solid #ddd; }
        .invoice-summary { background: #4CAF50; color: white; padding: 20px; border-radius: 5px; margin-top: 30px; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .summary-total { font-size: 18px; font-weight: bold; border-top: 1px solid rgba(255,255,255,0.3); padding-top: 10px; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        .payment-info { background: #fff3cd; padding: 15px; border-radius: 5px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="invoice-header">
        <h1 class="invoice-title">Partner Revenue Invoice</h1>
        <div class="invoice-number">Invoice #${invoiceNumber}</div>
        <div class="invoice-date">Generated: ${generator.formatDate(invoiceDate)}</div>
    </div>
    
    <div class="partner-info">
        <div class="partner-name">${partner.name}</div>
        <div>Email: ${partner.email}</div>
        ${partner.phone ? `<div>Phone: ${partner.phone}</div>` : ''}
        ${partner.taxId ? `<div>Tax ID: ${partner.taxId}</div>` : ''}
        <div>Revenue Share: ${generator.formatPercentage(partner.revenueShareRate)}</div>
    </div>
    
    <div class="period-info">
        <strong>Invoice Period:</strong> ${generator.formatDate(period.startDate)} to ${generator.formatDate(period.endDate)}
    </div>
    
    <h2>Event Details</h2>
    
    ${salesByEvent.map(eventData => `
        <div class="event-section">
            <div class="event-header">
                ${eventData.event.name}
            </div>
            <div class="event-details">
                <strong>Date:</strong> ${generator.formatDate(eventData.event.date)} ${eventData.event.time ? `at ${eventData.event.time}` : ''}<br>
                <strong>Venue:</strong> ${eventData.event.venue}
            </div>
            
            <table class="sales-table">
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Ticket Type</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Discount</th>
                        <th>Fees</th>
                        <th>Net Revenue</th>
                        <th>Partner Share</th>
                    </tr>
                </thead>
                <tbody>
                    ${eventData.sales.map(sale => `
                        <tr>
                            <td>${sale.orderId}</td>
                            <td>${sale.customer.name}</td>
                            <td>${sale.ticketType}</td>
                            <td>${sale.quantity}</td>
                            <td class="currency">${generator.formatCurrency(sale.unitPrice)}</td>
                            <td class="currency">${generator.formatCurrency(sale.discountAmount)}</td>
                            <td class="currency">${generator.formatCurrency(sale.platformFee + sale.bookingFee + sale.processingFee)}</td>
                            <td class="currency">${generator.formatCurrency(sale.netRevenue)}</td>
                            <td class="currency">${generator.formatCurrency(sale.partnerShare)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="event-totals">
                <strong>Event Totals:</strong>
                ${eventData.eventTotals.tickets} tickets, 
                ${generator.formatCurrency(eventData.eventTotals.grossRevenue)} gross revenue, 
                ${generator.formatCurrency(eventData.eventTotals.discounts)} discounts, 
                ${generator.formatCurrency(eventData.eventTotals.fees)} fees, 
                ${generator.formatCurrency(eventData.eventTotals.netRevenue)} net revenue, 
                <strong>${generator.formatCurrency(eventData.eventTotals.partnerShare)} partner share</strong>
            </div>
        </div>
    `).join('')}
    
    <div class="invoice-summary">
        <div class="summary-row">
            <span>Total Tickets Sold:</span>
            <span>${totals.totalTickets}</span>
        </div>
        <div class="summary-row">
            <span>Gross Revenue:</span>
            <span>${generator.formatCurrency(totals.grossRevenue)}</span>
        </div>
        <div class="summary-row">
            <span>Total Discounts:</span>
            <span>${generator.formatCurrency(totals.totalDiscounts)}</span>
        </div>
        <div class="summary-row">
            <span>Platform Fees:</span>
            <span>${generator.formatCurrency(totals.totalFees)}</span>
        </div>
        <div class="summary-row">
            <span>Net Revenue:</span>
            <span>${generator.formatCurrency(totals.netRevenue)}</span>
        </div>
        <div class="summary-row summary-total">
            <span>Partner Share (${generator.formatPercentage(partner.revenueShareRate)}):</span>
            <span>${generator.formatCurrency(totals.partnerShare)}</span>
        </div>
    </div>
    
    <div class="payment-info">
        <strong>Payment Information:</strong><br>
        Payment Method: ${partner.paymentMethod}<br>
        This invoice represents your share of revenue from ticket sales during the specified period.
        Payment will be processed according to our partner agreement terms.
    </div>
    
    <div class="footer">
        <p>This invoice was generated automatically from our ticket sales system.</p>
        <p>If you have any questions about this invoice, please contact our partner support team.</p>
        <p>Stand Up Sydney - Comedy Partner Revenue Invoice</p>
    </div>
</body>
</html>
  `;
  
  return html;
}

// Generate CSV export
function generateCSVExport(invoiceData) {
  const { sales } = invoiceData;
  
  const headers = [
    'Order ID',
    'Event Name',
    'Event Date',
    'Customer Name',
    'Customer Email',
    'Ticket Type',
    'Quantity',
    'Unit Price',
    'Discount Code',
    'Discount Amount',
    'Platform Fee',
    'Booking Fee',
    'Processing Fee',
    'Gross Revenue',
    'Net Revenue',
    'Partner Share',
    'Transaction Date'
  ];
  
  const rows = sales.map(sale => [
    sale.orderId,
    sale.event.name,
    sale.event.date,
    sale.customer.name,
    sale.customer.email,
    sale.ticketType,
    sale.quantity,
    sale.unitPrice,
    sale.discountCode,
    sale.discountAmount,
    sale.platformFee,
    sale.bookingFee,
    sale.processingFee,
    sale.grossRevenue,
    sale.netRevenue,
    sale.partnerShare,
    sale.transactionDate
  ]);
  
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
  
  return csv;
}

// Generate partner invoice
async function generatePartnerInvoice(partnerId, startDate, endDate, outputDir = './invoices') {
  try {
    console.log(`🧾 Generating partner invoice for ${partnerId}...`);
    
    const invoiceData = await generateInvoiceData(partnerId, startDate, endDate);
    
    if (!invoiceData) {
      console.log('ℹ️  No invoice generated - no sales data found');
      return null;
    }
    
    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Generate HTML invoice
    const html = generateHTMLInvoice(invoiceData);
    const htmlPath = path.join(outputDir, `${invoiceData.invoiceNumber}.html`);
    fs.writeFileSync(htmlPath, html);
    
    // Generate CSV export
    const csv = generateCSVExport(invoiceData);
    const csvPath = path.join(outputDir, `${invoiceData.invoiceNumber}.csv`);
    fs.writeFileSync(csvPath, csv);
    
    // Generate JSON data
    const jsonPath = path.join(outputDir, `${invoiceData.invoiceNumber}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(invoiceData, null, 2));
    
    console.log(`✅ Invoice generated successfully`);
    console.log(`📄 HTML: ${htmlPath}`);
    console.log(`📊 CSV: ${csvPath}`);
    console.log(`📋 JSON: ${jsonPath}`);
    console.log(`💰 Total Partner Share: ${invoiceData.generator.formatCurrency(invoiceData.totals.partnerShare)}`);
    
    return {
      invoiceNumber: invoiceData.invoiceNumber,
      partnerName: invoiceData.partner.name,
      totalPartnerShare: invoiceData.totals.partnerShare,
      totalTickets: invoiceData.totals.totalTickets,
      htmlPath,
      csvPath,
      jsonPath
    };
    
  } catch (error) {
    console.error('❌ Error generating partner invoice:', error);
    throw error;
  }
}

// Generate invoices for all partners
async function generateAllPartnerInvoices(startDate, endDate, outputDir = './invoices') {
  try {
    console.log(`🧾 Generating invoices for all partners from ${startDate} to ${endDate}...`);
    
    // Get all partners
    const partnersResponse = await notion.databases.query({
      database_id: DATABASE_IDS.partners
    });
    
    const results = [];
    
    for (const partner of partnersResponse.results) {
      try {
        const result = await generatePartnerInvoice(partner.id, startDate, endDate, outputDir);
        if (result) {
          results.push(result);
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error generating invoice for partner ${partner.id}:`, error);
        results.push({
          partnerId: partner.id,
          partnerName: partner.properties["Partner Name"]?.title[0]?.text?.content || 'Unknown',
          error: error.message
        });
      }
    }
    
    // Generate summary report
    const summaryPath = path.join(outputDir, `invoice-summary-${Date.now()}.json`);
    fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));
    
    console.log(`✅ Generated ${results.filter(r => !r.error).length} invoices`);
    console.log(`📋 Summary report: ${summaryPath}`);
    
    return results;
    
  } catch (error) {
    console.error('❌ Error generating all partner invoices:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  const partnerId = process.argv[2];
  const startDate = process.argv[3];
  const endDate = process.argv[4];
  const outputDir = process.argv[5] || './invoices';
  
  if (!startDate || !endDate) {
    console.error('❌ Usage: node generate-partner-invoices.js [partnerId] <startDate> <endDate> [outputDir]');
    console.error('❌ Example: node generate-partner-invoices.js 2024-01-01 2024-01-31');
    console.error('❌ Example: node generate-partner-invoices.js abc123 2024-01-01 2024-01-31');
    process.exit(1);
  }
  
  // Validate database IDs
  for (const [dbType, dbId] of Object.entries(DATABASE_IDS)) {
    if (!dbId || dbId.startsWith('process.env.')) {
      console.error(`❌ Database ID not set for ${dbType}: ${dbId}`);
      console.error(`❌ Please set ${dbType.toUpperCase()}_DB_ID environment variable`);
      process.exit(1);
    }
  }
  
  if (partnerId && !partnerId.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // Generate invoice for specific partner
    generatePartnerInvoice(partnerId, startDate, endDate, outputDir)
      .then(() => {
        console.log('✅ Partner invoice generation completed');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Partner invoice generation failed:', error);
        process.exit(1);
      });
  } else {
    // Generate invoices for all partners
    generateAllPartnerInvoices(startDate, endDate, outputDir)
      .then(() => {
        console.log('✅ All partner invoices generation completed');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ All partner invoices generation failed:', error);
        process.exit(1);
      });
  }
}

module.exports = {
  generatePartnerInvoice,
  generateAllPartnerInvoices,
  generateInvoiceData,
  generateHTMLInvoice,
  generateCSVExport,
  InvoiceGenerator
};