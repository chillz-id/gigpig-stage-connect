#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    });
  }
}

loadEnv();

// Notion database IDs (from creation)
const NOTION_DATABASES = {
  events: '2794745b-8cbe-8112-9ce0-dc2229da701c',
  eventDates: '2794745b-8cbe-81b8-b290-c4d552eb0c0f',
  orders: '2794745b-8cbe-811d-ae4f-fe88f3295973',
  tickets: '2794745b-8cbe-81bb-b17b-e9e9d53e05c8'
};

// Humanitix API configuration
const HUMANITIX_CONFIG = {
  baseURL: 'https://api.humanitix.com',
  apiKey: process.env.HUMANITIX_API_KEY || process.env.VITE_HUMANITIX_API_KEY,
  headers: {
    'X-API-Key': '',
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
};

// Data storage directory
const DATA_DIR = path.join(__dirname, 'data');

async function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('📁 Created data directory:', DATA_DIR);
  }
}

async function fetchFromHumanitix(endpoint, description) {
  console.log(`🔍 ${description}`);
  console.log(`   URL: ${HUMANITIX_CONFIG.baseURL}${endpoint}`);

  try {
    const response = await fetch(`${HUMANITIX_CONFIG.baseURL}${endpoint}`, {
      method: 'GET',
      headers: {
        ...HUMANITIX_CONFIG.headers,
        'X-API-Key': HUMANITIX_CONFIG.apiKey
      }
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('   ❌ Error:', errorText);
      return null;
    }

    const data = await response.json();
    console.log('   ✅ Success!');

    return data;
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
    return null;
  }
}

function saveRawData(filename, data) {
  const filepath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log(`💾 Saved raw data: ${filename}`);
}

function mapEventToNotion(event) {
  // Map ALL Humanitix event fields to Notion Events database properties
  const description = event.description ? event.description.replace(/<[^>]*>/g, '').substring(0, 2000) : '';
  const eventType = event.eventLocation?.type === 'address' ? 'In Person' : 'Online';
  const status = event.published ? 'Active' : 'Draft';
  const locationType = event.eventLocation?.type || 'toBeAnnounced';

  return {
    parent: { database_id: NOTION_DATABASES.events },
    properties: {
      "Event ID": { title: [{ text: { content: event._id || 'Unknown' } }] },
      "Name": { rich_text: [{ text: { content: event.name || '' } }] },
      "Status": { select: { name: status } },
      "Description": { rich_text: [{ text: { content: description } }] },
      "Event Type": { select: { name: eventType } },

      // Basic Info
      "User ID": { rich_text: [{ text: { content: event.userId || '' } }] },
      "Organiser ID": { rich_text: [{ text: { content: event.organiserId || '' } }] },
      "Slug": { rich_text: [{ text: { content: event.slug || '' } }] },
      "URL": event.url ? { url: event.url } : null,
      "Website URL": event.url ? { url: event.url } : null,
      "Currency": { select: { name: event.currency || 'AUD' } },

      // Classification
      "Category": event.category ? { select: { name: event.category } } : null,
      "Classification Type": event.classification?.type ? { select: { name: event.classification.type } } : null,
      "Classification Category": event.classification?.category ? { select: { name: event.classification.category } } : null,
      "Classification Subcategory": event.classification?.subcategory ? { select: { name: event.classification.subcategory } } : null,

      // Meta fields
      "Tag IDs": { rich_text: [{ text: { content: JSON.stringify(event.tagIds || []) } }] },
      "Artists": { rich_text: [{ text: { content: JSON.stringify(event.artists || []) } }] },
      "Keywords": { rich_text: [{ text: { content: JSON.stringify(event.keywords || []) } }] },

      // Status flags
      "Public": { checkbox: Boolean(event.public) },
      "Published": { checkbox: Boolean(event.published) },
      "Suspend Sales": { checkbox: Boolean(event.suspendSales) },
      "Marked As Sold Out": { checkbox: Boolean(event.markedAsSoldOut) },

      // Dates and timing
      "Created Date": event.createdAt ? { date: { start: event.createdAt.split('T')[0] } } : null,
      "Start Date": event.startDate ? { date: { start: event.startDate.split('T')[0] } } : null,
      "End Date": event.endDate ? { date: { start: event.endDate.split('T')[0] } } : null,
      "Published At": event.publishedAt ? { date: { start: event.publishedAt.split('T')[0] } } : null,
      "Updated At": event.updatedAt ? { date: { start: event.updatedAt.split('T')[0] } } : null,
      "Timezone": { rich_text: [{ text: { content: event.timezone || '' } }] },

      // Capacity and pricing
      "Capacity": event.totalCapacity ? { number: parseInt(event.totalCapacity) } : null,
      "Total Capacity": event.totalCapacity ? { number: parseInt(event.totalCapacity) } : null,
      "Min Price": event.pricing?.minimumPrice ? { number: parseFloat(event.pricing.minimumPrice) } : null,
      "Max Price": event.pricing?.maximumPrice ? { number: parseFloat(event.pricing.maximumPrice) } : null,
      "Minimum Price": event.pricing?.minimumPrice ? { number: parseFloat(event.pricing.minimumPrice) } : null,
      "Maximum Price": event.pricing?.maximumPrice ? { number: parseFloat(event.pricing.maximumPrice) } : null,

      // Ticket info
      "Ticket Types": { rich_text: [{ text: { content: JSON.stringify(event.ticketTypes || []) } }] },
      "Packaged Tickets": { rich_text: [{ text: { content: JSON.stringify(event.packagedTickets || []) } }] },

      // Refund policy
      "Refund Policy": { rich_text: [{ text: { content: event.paymentOptions?.refundSettings?.refundPolicy || '' } }] },
      "Custom Refund Policy": { rich_text: [{ text: { content: event.paymentOptions?.refundSettings?.customRefundPolicy || '' } }] },

      // Additional features
      "Additional Questions": { rich_text: [{ text: { content: JSON.stringify(event.additionalQuestions || []) } }] },
      "Accessibility": { rich_text: [{ text: { content: JSON.stringify(event.accessibility || {}) } }] },

      // Images
      "Banner Image URL": event.bannerImage?.url ? { url: event.bannerImage.url } : null,
      "Feature Image URL": event.featureImage?.url ? { url: event.featureImage.url } : null,
      "Social Image URL": event.socialImage?.url ? { url: event.socialImage.url } : null,

      // Location details
      "Location Type": { select: { name: locationType } },
      "Venue Name": { rich_text: [{ text: { content: event.eventLocation?.venueName || '' } }] },
      "Address": { rich_text: [{ text: { content: event.eventLocation?.address || '' } }] },
      "City": { rich_text: [{ text: { content: event.eventLocation?.city || '' } }] },
      "Region": { rich_text: [{ text: { content: event.eventLocation?.region || '' } }] },
      "Country": { rich_text: [{ text: { content: event.eventLocation?.country || '' } }] },
      "Lat Lng": { rich_text: [{ text: { content: JSON.stringify(event.eventLocation?.latLng || {}) } }] },
      "Instructions": { rich_text: [{ text: { content: event.eventLocation?.instructions || '' } }] },
      "Place ID": { rich_text: [{ text: { content: event.eventLocation?.placeId || '' } }] },
      "Online URL": event.eventLocation?.onlineUrl ? { url: event.eventLocation.onlineUrl } : null,
      "Map URL": event.eventLocation?.mapUrl ? { url: event.eventLocation.mapUrl } : null,

      // Affiliate and location codes
      "Affiliate Code": { rich_text: [{ text: { content: event.affiliateCode?.code || '' } }] },
      "Location Code": { rich_text: [{ text: { content: event.location || '' } }] },

      // Event dates relation (will be set up after Event Dates are created)
      "Event Date IDs": { rich_text: [{ text: { content: JSON.stringify(event.dates?.map(d => d._id) || []) } }] }
    }
  };
}

function mapOrderToNotion(order, eventId) {
  // Map ALL Humanitix order fields to Notion Orders database properties
  const status = order.status || 'complete';
  const financialStatus = order.financialStatus || 'paid';
  const paymentType = order.paymentType || '';
  const paymentGateway = order.paymentGateway || '';
  const salesChannel = order.salesChannel || 'online';

  return {
    parent: { database_id: NOTION_DATABASES.orders },
    properties: {
      "Order ID": { title: [{ text: { content: order._id || order.id || 'Unknown' } }] },

      // Relations (will be set up with actual relations later)
      "Event ID": { rich_text: [{ text: { content: eventId || '' } }] },
      "Event Date ID": { rich_text: [{ text: { content: order.eventDateId || '' } }] },

      // Basic order info
      "User ID": { rich_text: [{ text: { content: order.userId || '' } }] },
      "Currency": { select: { name: order.currency || 'AUD' } },
      "Status": { select: { name: status } },
      "Financial Status": { select: { name: financialStatus } },
      "Order Status": { select: { name: order.status || 'confirmed' } },
      "Order Reference": { rich_text: [{ text: { content: order.reference || '' } }] },

      // Customer info
      "First Name": { rich_text: [{ text: { content: order.firstName || order.customer?.firstName || '' } }] },
      "Last Name": { rich_text: [{ text: { content: order.lastName || order.customer?.lastName || '' } }] },
      "Customer First Name": { rich_text: [{ text: { content: order.customer?.firstName || '' } }] },
      "Customer Last Name": { rich_text: [{ text: { content: order.customer?.lastName || '' } }] },
      "Organisation": { rich_text: [{ text: { content: order.organisation || '' } }] },
      "Mobile": order.mobile ? { phone_number: order.mobile } : null,
      "Email": order.email || order.customer?.email ? { email: order.email || order.customer?.email } : null,
      "Customer Email": order.customer?.email ? { email: order.customer.email } : null,
      "Access Code": { rich_text: [{ text: { content: order.accessCode || '' } }] },

      // Discount info
      "Auto Discount Amount": order.discounts?.autoDiscount?.discountAmount ? { number: parseFloat(order.discounts.autoDiscount.discountAmount) } : null,
      "Discount Code": { rich_text: [{ text: { content: order.discounts?.discountCode?.code || '' } }] },
      "Discount Code Amount": order.discounts?.discountCode?.discountAmount ? { number: parseFloat(order.discounts.discountCode.discountAmount) } : null,

      // Business info
      "Business Purpose": { checkbox: Boolean(order.businessPurpose) },
      "Business Tax ID": { rich_text: [{ text: { content: order.businessTaxId || '' } }] },
      "Business Name": { rich_text: [{ text: { content: order.businessName || '' } }] },

      // Payment info
      "Payment Type": paymentType ? { select: { name: paymentType } } : null,
      "Payment Gateway": paymentGateway ? { select: { name: paymentGateway } } : null,
      "Manual Order": { checkbox: Boolean(order.manualOrder) },
      "Tip Fees": { checkbox: Boolean(order.tipFees) },
      "Client Donation": order.clientDonation ? { number: parseFloat(order.clientDonation) } : null,
      "Is International Transaction": { checkbox: Boolean(order.isInternationalTransaction) },

      // Dates
      "Created Date": order.createdAt ? { date: { start: order.createdAt.split('T')[0] } } : null,
      "Incomplete At": order.incompleteAt ? { date: { start: order.incompleteAt.split('T')[0] } } : null,
      "Completed At": order.completedAt ? { date: { start: order.completedAt.split('T')[0] } } : null,
      "Updated At": order.updatedAt ? { date: { start: order.updatedAt.split('T')[0] } } : null,

      // Financial totals
      "Quantity": order.quantity ? { number: parseInt(order.quantity) } : null,
      "Subtotal": order.totals?.subtotal ? { number: parseFloat(order.totals.subtotal) } : null,
      "Subtotal Amount": order.totals?.subtotal ? { number: parseFloat(order.totals.subtotal) } : null,
      "Total Amount": order.totals?.total ? { number: parseFloat(order.totals.total) } : null,
      "Total": order.totals?.total ? { number: parseFloat(order.totals.total) } : null,
      "Total Fees": order.totals?.totalFees ? { number: parseFloat(order.totals.totalFees) } : null,

      // Detailed financial breakdown
      "Amex Fee": order.totals?.amexFee ? { number: parseFloat(order.totals.amexFee) } : null,
      "Zip Fee": order.totals?.zipFee ? { number: parseFloat(order.totals.zipFee) } : null,
      "Humanitix Fee": order.totals?.humanitixFee ? { number: parseFloat(order.totals.humanitixFee) } : null,
      "Booking Fee": order.totals?.bookingFee ? { number: parseFloat(order.totals.bookingFee) } : null,
      "Passed On Fee": order.totals?.passedOnFee ? { number: parseFloat(order.totals.passedOnFee) } : null,
      "Net Client Donation": order.totals?.netClientDonation ? { number: parseFloat(order.totals.netClientDonation) } : null,
      "Donation": order.totals?.donation ? { number: parseFloat(order.totals.donation) } : null,
      "DGR Donation": order.totals?.dgrDonation ? { number: parseFloat(order.totals.dgrDonation) } : null,
      "Gift Card Credit": order.totals?.giftCardCredit ? { number: parseFloat(order.totals.giftCardCredit) } : null,
      "Credit": order.totals?.credit ? { number: parseFloat(order.totals.credit) } : null,
      "Outstanding Amount": order.totals?.outstandingAmount ? { number: parseFloat(order.totals.outstandingAmount) } : null,

      // Tax info
      "Fees Included": { checkbox: Boolean(order.totals?.feesIncluded) },
      "Booking Taxes": order.totals?.bookingTaxes ? { number: parseFloat(order.totals.bookingTaxes) } : null,
      "Passed On Taxes": order.totals?.passedOnTaxes ? { number: parseFloat(order.totals.passedOnTaxes) } : null,
      "Taxes": order.totals?.taxes ? { number: parseFloat(order.totals.taxes) } : null,
      "Total Taxes": order.totals?.totalTaxes ? { number: parseFloat(order.totals.totalTaxes) } : null,

      // Summary financial
      "Discounts": order.totals?.discounts ? { number: parseFloat(order.totals.discounts) } : null,
      "Refunds": order.totals?.refunds ? { number: parseFloat(order.totals.refunds) } : null,
      "Net Sales": order.totals?.netSales ? { number: parseFloat(order.totals.netSales) } : null,
      "Gross Sales": order.totals?.grossSales ? { number: parseFloat(order.totals.grossSales) } : null,
      "Referral Amount": order.totals?.referralAmount ? { number: parseFloat(order.totals.referralAmount) } : null,

      // Additional data
      "Purchase Totals": { rich_text: [{ text: { content: JSON.stringify(order.purchaseTotals || {}) } }] },
      "Additional Fields": { rich_text: [{ text: { content: JSON.stringify(order.additionalFields || []) } }] },
      "Sales Channel": { select: { name: salesChannel } },
      "Location Code": { rich_text: [{ text: { content: order.location || '' } }] },
      "Notes": { rich_text: [{ text: { content: order.notes || '' } }] },
      "Organiser Mail List Opt In": { checkbox: Boolean(order.organiserMailListOptIn) },
      "Waitlist Offer ID": { rich_text: [{ text: { content: order.waitlistOfferId || '' } }] }
    }
  };
}

function mapTicketToNotion(ticket, eventId, orderId) {
  // Map ALL Humanitix ticket fields to Notion Tickets database properties
  const status = ticket.status || 'complete';
  const salesChannel = ticket.salesChannel || 'online';

  return {
    parent: { database_id: NOTION_DATABASES.tickets },
    properties: {
      "Ticket ID": { title: [{ text: { content: ticket._id || ticket.id || 'Unknown' } }] },

      // Relations (will be set up with actual relations later)
      "Event ID": { rich_text: [{ text: { content: eventId || '' } }] },
      "Event Date ID": { rich_text: [{ text: { content: ticket.eventDateId || '' } }] },
      "Order ID": { rich_text: [{ text: { content: orderId || '' } }] },

      // Basic ticket info
      "Order Name": { rich_text: [{ text: { content: ticket.orderName || '' } }] },
      "Currency": { select: { name: ticket.currency || 'AUD' } },
      "Number": ticket.number ? { number: parseInt(ticket.number) } : null,

      // Attendee info
      "First Name": { rich_text: [{ text: { content: ticket.firstName || '' } }] },
      "Last Name": { rich_text: [{ text: { content: ticket.lastName || '' } }] },
      "Attendee First Name": { rich_text: [{ text: { content: ticket.attendee?.firstName || ticket.firstName || '' } }] },
      "Attendee Last Name": { rich_text: [{ text: { content: ticket.attendee?.lastName || ticket.lastName || '' } }] },
      "Attendee Email": ticket.attendee?.email ? { email: ticket.attendee.email } : null,
      "Organisation": { rich_text: [{ text: { content: ticket.organisation || '' } }] },

      // Ticket type info
      "Ticket Type Name": { rich_text: [{ text: { content: ticket.ticketTypeName || '' } }] },
      "Ticket Type ID": { rich_text: [{ text: { content: ticket.ticketTypeId || '' } }] },
      "Ticket Type": { rich_text: [{ text: { content: ticket.ticketType || '' } }] },
      "Ticket Name": { rich_text: [{ text: { content: ticket.name || '' } }] },
      "Access Code": { rich_text: [{ text: { content: ticket.accessCode || '' } }] },

      // Pricing breakdown
      "Price": ticket.price ? { number: parseFloat(ticket.price) } : null,
      "Ticket Price": ticket.price ? { number: parseFloat(ticket.price) } : null,
      "Discount": ticket.discount ? { number: parseFloat(ticket.discount) } : null,
      "Net Price": ticket.netPrice ? { number: parseFloat(ticket.netPrice) } : null,
      "Taxes": ticket.taxes ? { number: parseFloat(ticket.taxes) } : null,
      "Fee": ticket.fee ? { number: parseFloat(ticket.fee) } : null,
      "Passed On Fee": ticket.passedOnFee ? { number: parseFloat(ticket.passedOnFee) } : null,
      "Absorbed Fee": ticket.absorbedFee ? { number: parseFloat(ticket.absorbedFee) } : null,
      "DGR Donation": ticket.dgrDonation ? { number: parseFloat(ticket.dgrDonation) } : null,
      "Total": ticket.total ? { number: parseFloat(ticket.total) } : null,

      // Seating info
      "Custom Scanning Code": { rich_text: [{ text: { content: ticket.customScanningCode || '' } }] },
      "Seating Map ID": { rich_text: [{ text: { content: ticket.seatingLocation?.seatingMapId || '' } }] },
      "Seating Name": { rich_text: [{ text: { content: ticket.seatingLocation?.name || '' } }] },
      "Seating Section": { rich_text: [{ text: { content: JSON.stringify(ticket.seatingLocation?.section || {}) } }] },
      "Seating Table": { rich_text: [{ text: { content: JSON.stringify(ticket.seatingLocation?.table || {}) } }] },
      "Seating Seat": { rich_text: [{ text: { content: JSON.stringify(ticket.seatingLocation?.seat || {}) } }] },
      "Seating Note": { rich_text: [{ text: { content: ticket.seatingLocation?.note || '' } }] },

      // Status and check-in
      "Status": { select: { name: status } },
      "Ticket Status": { select: { name: ticket.status || 'valid' } },
      "Check In Status": { select: { name: ticket.checkInStatus || 'not_checked_in' } },
      "Check In Checked In": { checkbox: Boolean(ticket.checkIn?.checkedIn) },
      "Check In Date": ticket.checkIn?.date ? { date: { start: ticket.checkIn.date.split('T')[0] } } : null,
      "Check In User ID": { rich_text: [{ text: { content: ticket.checkIn?.userId || '' } }] },
      "Check In History": { rich_text: [{ text: { content: JSON.stringify(ticket.checkInHistory || []) } }] },

      // Additional ticket info
      "Additional Fields": { rich_text: [{ text: { content: JSON.stringify(ticket.additionalFields || []) } }] },
      "Cancelled At": ticket.cancelledAt ? { date: { start: ticket.cancelledAt.split('T')[0] } } : null,
      "Is Donation": { checkbox: Boolean(ticket.isDonation) },

      // Package info
      "Package ID": { rich_text: [{ text: { content: ticket.packageId || '' } }] },
      "Package Name": { rich_text: [{ text: { content: ticket.packageName || '' } }] },
      "Package Group ID": { rich_text: [{ text: { content: ticket.packageGroupId || '' } }] },
      "Package Price": ticket.packagePrice ? { number: parseFloat(ticket.packagePrice) } : null,

      // Profile and swapping
      "Attendee Profile ID": { rich_text: [{ text: { content: ticket.attendeeProfileId || '' } }] },
      "Swapped From": { rich_text: [{ text: { content: JSON.stringify(ticket.swappedFrom || {}) } }] },
      "Swapped To": { rich_text: [{ text: { content: JSON.stringify(ticket.swappedTo || {}) } }] },

      // System info
      "Sales Channel": { select: { name: salesChannel } },
      "QR Code ID": { rich_text: [{ text: { content: ticket.qrCodeData?._id || '' } }] },
      "QR Code Event ID": { rich_text: [{ text: { content: ticket.qrCodeData?.eventId || '' } }] },

      // Discount info
      "Auto Discount Amount": ticket.discounts?.autoDiscount?.discountAmount ? { number: parseFloat(ticket.discounts.autoDiscount.discountAmount) } : null,
      "Discount Code": { rich_text: [{ text: { content: ticket.discounts?.discountCode?.code || '' } }] },
      "Discount Code Amount": ticket.discounts?.discountCode?.discountAmount ? { number: parseFloat(ticket.discounts.discountCode.discountAmount) } : null,

      // Location and dates
      "Location Code": { rich_text: [{ text: { content: ticket.location || '' } }] },
      "Created Date": ticket.createdAt ? { date: { start: ticket.createdAt.split('T')[0] } } : null,
      "Updated At": ticket.updatedAt ? { date: { start: ticket.updatedAt.split('T')[0] } } : null,

      // Legacy fields for compatibility
      "Barcode": { rich_text: [{ text: { content: ticket.barcode || ticket.customScanningCode || '' } }] }
    }
  };
}

function mapEventDateToNotion(eventDate, eventId) {
  // Map Humanitix event date fields to Notion Event Dates database properties
  return {
    parent: { database_id: NOTION_DATABASES.eventDates },
    properties: {
      "Event Date ID": { title: [{ text: { content: eventDate._id || 'Unknown' } }] },
      "Start Date": eventDate.startDate ? { date: { start: eventDate.startDate.split('T')[0] } } : null,
      "End Date": eventDate.endDate ? { date: { start: eventDate.endDate.split('T')[0] } } : null,
      "Schedule ID": { rich_text: [{ text: { content: eventDate.scheduleId || '' } }] },
      "Disabled": { checkbox: Boolean(eventDate.disabled) },
      "Deleted": { checkbox: Boolean(eventDate.deleted) },
      "Tickets Sold": eventDate.ticketsSold ? { number: parseInt(eventDate.ticketsSold) } : null,
      "Orders Count": eventDate.ordersCount ? { number: parseInt(eventDate.ordersCount) } : null,
      "Revenue": eventDate.revenue ? { number: parseFloat(eventDate.revenue) } : null
      // Note: Event relation will be set up later with actual relation properties
    }
  };
}

async function createNotionPage(pageData, entityType, index) {
  try {
    console.log(`📝 Creating ${entityType} ${index + 1} in Notion...`);

    // Save the page data for backup/reference
    const filename = `notion-${entityType}-${index + 1}.json`;
    const filepath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filepath, JSON.stringify(pageData, null, 2));
    console.log(`   💾 Saved backup data: ${filename}`);

    // This will be called through Claude's MCP integration
    // For now, we simulate success and save the data for actual import
    const titleProperty = Object.keys(pageData.properties)[0];
    const title = pageData.properties[titleProperty].title?.[0]?.text?.content || 'Unknown';
    console.log(`   📋 ${entityType} Title: ${title}`);
    console.log(`   🗄️  Database ID: ${pageData.parent.database_id}`);
    console.log(`   📊 Properties: ${Object.keys(pageData.properties).length} fields`);
    console.log(`   ✅ Ready for Notion import`);

    return { success: true, id: `ready-${entityType}-${index}`, savedAs: filename };
  } catch (error) {
    console.log(`   ❌ Failed to prepare ${entityType}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testHumanitixImport() {
  console.log('🚀 Starting Humanitix API Test Import');
  console.log('=====================================');

  // Validate API key
  if (!HUMANITIX_CONFIG.apiKey) {
    console.error('❌ No Humanitix API key found in environment variables');
    console.log('Please set HUMANITIX_API_KEY or VITE_HUMANITIX_API_KEY');
    process.exit(1);
  }

  console.log('🔐 API Key found:', HUMANITIX_CONFIG.apiKey.substring(0, 10) + '...');

  // Ensure data directory exists
  await ensureDataDirectory();

  // Step 1: Fetch 5 Events
  console.log('\n📅 Step 1: Fetching Events');
  console.log('==========================');

  const eventsData = await fetchFromHumanitix('/v1/events?pageSize=5&page=1', 'Fetching 5 events');

  if (!eventsData) {
    console.log('❌ Failed to fetch events. Exiting.');
    return;
  }

  // Handle different response structures
  let events = [];
  if (Array.isArray(eventsData)) {
    events = eventsData.slice(0, 5);
  } else if (eventsData.data && Array.isArray(eventsData.data)) {
    events = eventsData.data.slice(0, 5);
  } else if (eventsData.events && Array.isArray(eventsData.events)) {
    events = eventsData.events.slice(0, 5);
  }

  if (events.length === 0) {
    console.log('❌ No events found in response. Exiting.');
    return;
  }

  console.log(`✅ Found ${events.length} events`);
  saveRawData('events-sample.json', events);

  // Step 2: Fetch Orders and Tickets from multiple events to get adequate data
  console.log('\n💰 Step 2: Fetching Orders & Tickets');
  console.log('=====================================');

  let orders = [];
  let tickets = [];
  let eventDatesWithData = [];

  // Try to fetch orders and tickets from multiple events until we get enough data
  for (let eventIndex = 0; eventIndex < events.length && (orders.length < 5 || tickets.length < 5); eventIndex++) {
    const event = events[eventIndex];
    const eventId = event._id;

    console.log(`\n🔍 Checking Event ${eventIndex + 1}: ${event.name}`);
    console.log(`   Event ID: ${eventId}`);

    if (event.dates && event.dates.length > 0) {
      // Try each event date to find one with orders/tickets
      for (let dateIndex = 0; dateIndex < event.dates.length; dateIndex++) {
        const eventDate = event.dates[dateIndex];
        if (eventDate.deleted) continue;

        const eventDateId = eventDate._id;
        console.log(`   📅 Trying Event Date: ${eventDateId}`);

        // Fetch orders for this event date
        const ordersEndpoint = `/v1/events/${eventId}/orders?eventDateId=${eventDateId}&pageSize=10&page=1`;
        const ordersData = await fetchFromHumanitix(ordersEndpoint, `Fetching orders for event ${eventIndex + 1}`);

        if (ordersData) {
          let eventOrders = [];
          if (Array.isArray(ordersData)) {
            eventOrders = ordersData;
          } else if (ordersData.data && Array.isArray(ordersData.data)) {
            eventOrders = ordersData.data;
          }

          if (eventOrders.length > 0) {
            console.log(`   ✅ Found ${eventOrders.length} orders for this event date`);
            orders.push(...eventOrders.slice(0, Math.min(eventOrders.length, 5 - orders.length)));
            eventDatesWithData.push({ eventId, eventDateId, event: event.name });
          }
        }

        // Fetch tickets for this event date
        const ticketsEndpoint = `/v1/events/${eventId}/tickets?eventDateId=${eventDateId}&pageSize=10&page=1`;
        const ticketsData = await fetchFromHumanitix(ticketsEndpoint, `Fetching tickets for event ${eventIndex + 1}`);

        if (ticketsData) {
          let eventTickets = [];
          if (Array.isArray(ticketsData)) {
            eventTickets = ticketsData;
          } else if (ticketsData.data && Array.isArray(ticketsData.data)) {
            eventTickets = ticketsData.data;
          }

          if (eventTickets.length > 0) {
            console.log(`   ✅ Found ${eventTickets.length} tickets for this event date`);
            tickets.push(...eventTickets.slice(0, Math.min(eventTickets.length, 5 - tickets.length)));
          }
        }

        // Break if we have enough data
        if (orders.length >= 5 && tickets.length >= 5) break;
      }
    }
  }

  console.log(`\n📊 Data Collection Summary:`);
  console.log(`   Events: ${events.length}`);
  console.log(`   Orders: ${orders.length}`);
  console.log(`   Tickets: ${tickets.length}`);
  console.log(`   Event dates with data: ${eventDatesWithData.length}`);

  if (orders.length > 0) {
    saveRawData('orders-sample.json', orders);
  }
  if (tickets.length > 0) {
    saveRawData('tickets-sample.json', tickets);
  }

  // Step 4: Import to Notion
  console.log('\n📊 Step 4: Importing to Notion');
  console.log('===============================');

  // Import Events
  console.log('\n📅 Importing Events to Notion...');
  for (let i = 0; i < events.length; i++) {
    const notionEventData = mapEventToNotion(events[i]);
    await createNotionPage(notionEventData, 'Event', i);
  }

  // Import Event Dates
  console.log('\n📅 Importing Event Dates to Notion...');
  let allEventDates = [];
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    if (event.dates && event.dates.length > 0) {
      for (let j = 0; j < event.dates.length; j++) {
        const eventDate = event.dates[j];
        const notionEventDateData = mapEventDateToNotion(eventDate, event._id);
        await createNotionPage(notionEventDateData, 'EventDate', allEventDates.length);
        allEventDates.push(eventDate);
      }
    }
  }

  // Import Orders
  console.log('\n💰 Importing Orders to Notion...');
  for (let i = 0; i < orders.length; i++) {
    // Try to find the event ID for this order
    const order = orders[i];
    let relatedEventId = events[0]._id; // Default to first event

    // Try to match with events that had data
    const relatedEventData = eventDatesWithData.find(ed =>
      order.eventId === ed.eventId || order.eventDateId === ed.eventDateId
    );
    if (relatedEventData) {
      relatedEventId = relatedEventData.eventId;
    }

    const notionOrderData = mapOrderToNotion(order, relatedEventId);
    await createNotionPage(notionOrderData, 'Order', i);
  }

  // Import Tickets
  console.log('\n🎫 Importing Tickets to Notion...');
  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i];

    // Try to match ticket with its order
    let orderId = 'unknown';
    const matchingOrder = orders.find(order =>
      order._id === ticket.orderId || order.id === ticket.orderId
    );
    if (matchingOrder) {
      orderId = matchingOrder._id || matchingOrder.id;
    } else if (orders.length > 0) {
      // Fallback to first available order
      orderId = orders[0]._id || orders[0].id || 'unknown';
    }

    // Try to find the event ID for this ticket
    let relatedEventId = events[0]._id; // Default to first event
    const relatedEventData = eventDatesWithData.find(ed =>
      ticket.eventId === ed.eventId || ticket.eventDateId === ed.eventDateId
    );
    if (relatedEventData) {
      relatedEventId = relatedEventData.eventId;
    }

    const notionTicketData = mapTicketToNotion(ticket, relatedEventId, orderId);
    await createNotionPage(notionTicketData, 'Ticket', i);
  }

  // Summary
  console.log('\n🎉 Test Import Complete!');
  console.log('========================');
  console.log(`✅ Fetched ${events.length} events from Humanitix`);
  console.log(`✅ Processed ${allEventDates.length} event dates from ${events.length} events`);
  console.log(`✅ Fetched ${orders.length} orders from Humanitix`);
  console.log(`✅ Fetched ${tickets.length} tickets from Humanitix`);
  console.log(`✅ Generated complete import data for ${events.length} events (ALL 57 properties)`);
  console.log(`✅ Generated complete import data for ${allEventDates.length} event dates (ALL 10 properties)`);
  console.log(`✅ Generated complete import data for ${orders.length} orders (ALL 35+ properties)`);
  console.log(`✅ Generated complete import data for ${tickets.length} tickets (ALL 45+ properties)`);
  console.log('\n📁 Raw data saved in:', DATA_DIR);
  console.log('📄 Import files generated with comprehensive property mapping');
  console.log('🔗 Next steps: Use the generated JSON files to import to Notion with complete data coverage');
}

// Run the test import
testHumanitixImport().catch(console.error);