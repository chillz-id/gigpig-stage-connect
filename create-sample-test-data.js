#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create comprehensive sample data for testing
const sampleEventId = '68947b841d67cb4b00f4c974';
const sampleEventDateId = '68947b841d67cb4b00f4c97b';

// Sample Orders with all properties
const sampleOrders = [
  {
    "_id": "order-001-test-sample",
    "id": "order-001-test-sample",
    "eventId": sampleEventId,
    "eventDateId": sampleEventDateId,
    "userId": "user-12345",
    "currency": "AUD",
    "status": "complete",
    "financialStatus": "paid",
    "reference": "HTX-001-2024",
    "firstName": "John",
    "lastName": "Smith",
    "customer": {
      "firstName": "John",
      "lastName": "Smith",
      "email": "john.smith@example.com"
    },
    "organisation": "Comedy Lovers Inc",
    "mobile": "+61412345678",
    "email": "john.smith@example.com",
    "accessCode": "AC12345",
    "discounts": {
      "autoDiscount": {
        "discountAmount": 5.00
      },
      "discountCode": {
        "code": "EARLY10",
        "discountAmount": 3.50
      }
    },
    "businessPurpose": true,
    "businessTaxId": "ABN123456789",
    "businessName": "Smith Entertainment Pty Ltd",
    "paymentType": "credit_card",
    "paymentGateway": "stripe",
    "manualOrder": false,
    "tipFees": true,
    "clientDonation": 2.50,
    "isInternationalTransaction": false,
    "createdAt": "2024-12-01T10:30:00.000Z",
    "completedAt": "2024-12-01T10:32:00.000Z",
    "updatedAt": "2024-12-01T10:32:00.000Z",
    "quantity": 2,
    "totals": {
      "subtotal": 70.00,
      "total": 78.50,
      "totalFees": 8.50,
      "amexFee": 0.00,
      "zipFee": 0.00,
      "humanitixFee": 4.20,
      "bookingFee": 4.30,
      "passedOnFee": 0.00,
      "netClientDonation": 2.50,
      "donation": 2.50,
      "dgrDonation": 0.00,
      "giftCardCredit": 0.00,
      "credit": 0.00,
      "outstandingAmount": 0.00,
      "feesIncluded": false,
      "bookingTaxes": 0.43,
      "passedOnTaxes": 0.00,
      "taxes": 7.85,
      "totalTaxes": 8.28,
      "discounts": 8.50,
      "refunds": 0.00,
      "netSales": 70.00,
      "grossSales": 78.50,
      "referralAmount": 0.00
    },
    "purchaseTotals": {
      "itemTotal": 70.00,
      "taxTotal": 7.00
    },
    "additionalFields": [
      {
        "question": "Dietary requirements",
        "answer": "Vegetarian"
      }
    ],
    "salesChannel": "online",
    "location": "AU",
    "notes": "VIP seating requested",
    "organiserMailListOptIn": true,
    "waitlistOfferId": ""
  },
  {
    "_id": "order-002-test-sample",
    "id": "order-002-test-sample",
    "eventId": sampleEventId,
    "eventDateId": sampleEventDateId,
    "userId": "user-67890",
    "currency": "AUD",
    "status": "complete",
    "financialStatus": "paid",
    "reference": "HTX-002-2024",
    "firstName": "Sarah",
    "lastName": "Johnson",
    "customer": {
      "firstName": "Sarah",
      "lastName": "Johnson",
      "email": "sarah.j@example.com"
    },
    "mobile": "+61487654321",
    "email": "sarah.j@example.com",
    "accessCode": "AC67890",
    "businessPurpose": false,
    "paymentType": "paypal",
    "paymentGateway": "paypal",
    "manualOrder": false,
    "tipFees": false,
    "isInternationalTransaction": false,
    "createdAt": "2024-12-01T14:15:00.000Z",
    "completedAt": "2024-12-01T14:17:00.000Z",
    "updatedAt": "2024-12-01T14:17:00.000Z",
    "quantity": 1,
    "totals": {
      "subtotal": 35.00,
      "total": 39.25,
      "totalFees": 4.25,
      "humanitixFee": 2.10,
      "bookingFee": 2.15,
      "taxes": 3.50,
      "totalTaxes": 3.93,
      "discounts": 0.00,
      "refunds": 0.00,
      "netSales": 35.00,
      "grossSales": 39.25
    },
    "salesChannel": "online",
    "location": "AU",
    "organiserMailListOptIn": false
  },
  {
    "_id": "order-003-test-sample",
    "id": "order-003-test-sample",
    "eventId": sampleEventId,
    "eventDateId": sampleEventDateId,
    "userId": "user-11111",
    "currency": "AUD",
    "status": "complete",
    "financialStatus": "paid",
    "reference": "HTX-003-2024",
    "firstName": "Mike",
    "lastName": "Wilson",
    "customer": {
      "firstName": "Mike",
      "lastName": "Wilson",
      "email": "m.wilson@example.com"
    },
    "email": "m.wilson@example.com",
    "paymentType": "bank_transfer",
    "manualOrder": true,
    "createdAt": "2024-12-01T16:20:00.000Z",
    "completedAt": "2024-12-01T16:22:00.000Z",
    "quantity": 3,
    "totals": {
      "subtotal": 105.00,
      "total": 117.75,
      "totalFees": 12.75,
      "netSales": 105.00,
      "grossSales": 117.75
    },
    "salesChannel": "box_office"
  },
  {
    "_id": "order-004-test-sample",
    "id": "order-004-test-sample",
    "eventId": sampleEventId,
    "eventDateId": sampleEventDateId,
    "userId": "user-22222",
    "currency": "AUD",
    "status": "complete",
    "financialStatus": "paid",
    "reference": "HTX-004-2024",
    "firstName": "Emma",
    "lastName": "Davis",
    "customer": {
      "firstName": "Emma",
      "lastName": "Davis",
      "email": "emma.davis@example.com"
    },
    "email": "emma.davis@example.com",
    "clientDonation": 5.00,
    "createdAt": "2024-12-01T18:45:00.000Z",
    "completedAt": "2024-12-01T18:47:00.000Z",
    "quantity": 1,
    "totals": {
      "subtotal": 35.00,
      "total": 44.25,
      "netClientDonation": 5.00,
      "donation": 5.00,
      "netSales": 35.00,
      "grossSales": 44.25
    }
  },
  {
    "_id": "order-005-test-sample",
    "id": "order-005-test-sample",
    "eventId": sampleEventId,
    "eventDateId": sampleEventDateId,
    "userId": "user-33333",
    "currency": "AUD",
    "status": "complete",
    "financialStatus": "refunded",
    "reference": "HTX-005-2024",
    "firstName": "David",
    "lastName": "Brown",
    "customer": {
      "firstName": "David",
      "lastName": "Brown",
      "email": "d.brown@example.com"
    },
    "email": "d.brown@example.com",
    "createdAt": "2024-12-01T20:10:00.000Z",
    "completedAt": "2024-12-01T20:12:00.000Z",
    "quantity": 2,
    "totals": {
      "subtotal": 70.00,
      "total": 78.50,
      "refunds": 78.50,
      "netSales": -8.50,
      "grossSales": 0.00
    }
  }
];

// Sample Tickets with all properties
const sampleTickets = [
  {
    "_id": "ticket-001-test-sample",
    "id": "ticket-001-test-sample",
    "eventId": sampleEventId,
    "eventDateId": sampleEventDateId,
    "orderId": "order-001-test-sample",
    "orderName": "John Smith Order",
    "currency": "AUD",
    "number": 1001,
    "firstName": "John",
    "lastName": "Smith",
    "attendee": {
      "firstName": "John",
      "lastName": "Smith",
      "email": "john.smith@example.com"
    },
    "organisation": "Comedy Lovers Inc",
    "ticketTypeName": "General Admission",
    "ticketTypeId": "tt-general-001",
    "ticketType": "paid",
    "name": "General Admission Ticket",
    "accessCode": "TC12345",
    "price": 35.00,
    "discount": 4.25,
    "netPrice": 30.75,
    "taxes": 3.08,
    "fee": 4.25,
    "passedOnFee": 0.00,
    "absorbedFee": 0.00,
    "dgrDonation": 0.00,
    "total": 39.25,
    "customScanningCode": "SCAN001",
    "seatingLocation": {
      "seatingMapId": "map-001",
      "name": "Front Section A",
      "section": { "name": "A", "row": "1" },
      "table": { "number": "T1" },
      "seat": { "number": "12" },
      "note": "Near stage"
    },
    "status": "valid",
    "checkInStatus": "checked_in",
    "checkIn": {
      "checkedIn": true,
      "date": "2024-12-01T19:30:00.000Z",
      "userId": "checkin-staff-001"
    },
    "checkInHistory": [
      {
        "date": "2024-12-01T19:30:00.000Z",
        "action": "check_in",
        "userId": "checkin-staff-001"
      }
    ],
    "additionalFields": [
      {
        "question": "Age verification",
        "answer": "25"
      }
    ],
    "isDonation": false,
    "packageId": "",
    "packageName": "",
    "attendeeProfileId": "profile-john-001",
    "salesChannel": "online",
    "qrCodeData": {
      "_id": "qr-001",
      "eventId": sampleEventId
    },
    "discounts": {
      "autoDiscount": {
        "discountAmount": 2.50
      },
      "discountCode": {
        "code": "EARLY10",
        "discountAmount": 1.75
      }
    },
    "location": "AU",
    "createdAt": "2024-12-01T10:32:00.000Z",
    "updatedAt": "2024-12-01T19:30:00.000Z",
    "barcode": "SCAN001"
  },
  {
    "_id": "ticket-002-test-sample",
    "id": "ticket-002-test-sample",
    "eventId": sampleEventId,
    "eventDateId": sampleEventDateId,
    "orderId": "order-001-test-sample",
    "orderName": "John Smith Order",
    "currency": "AUD",
    "number": 1002,
    "firstName": "Jane",
    "lastName": "Smith",
    "attendee": {
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane.smith@example.com"
    },
    "ticketTypeName": "General Admission",
    "ticketTypeId": "tt-general-001",
    "price": 35.00,
    "discount": 4.25,
    "netPrice": 30.75,
    "total": 39.25,
    "status": "valid",
    "checkInStatus": "not_checked_in",
    "checkIn": {
      "checkedIn": false
    },
    "salesChannel": "online",
    "createdAt": "2024-12-01T10:32:00.000Z",
    "updatedAt": "2024-12-01T10:32:00.000Z"
  },
  {
    "_id": "ticket-003-test-sample",
    "id": "ticket-003-test-sample",
    "eventId": sampleEventId,
    "eventDateId": sampleEventDateId,
    "orderId": "order-002-test-sample",
    "orderName": "Sarah Johnson Order",
    "currency": "AUD",
    "number": 1003,
    "firstName": "Sarah",
    "lastName": "Johnson",
    "attendee": {
      "firstName": "Sarah",
      "lastName": "Johnson",
      "email": "sarah.j@example.com"
    },
    "ticketTypeName": "Standard",
    "ticketTypeId": "tt-standard-001",
    "price": 35.00,
    "total": 39.25,
    "status": "valid",
    "checkInStatus": "not_checked_in",
    "salesChannel": "online",
    "createdAt": "2024-12-01T14:17:00.000Z"
  },
  {
    "_id": "ticket-004-test-sample",
    "id": "ticket-004-test-sample",
    "eventId": sampleEventId,
    "eventDateId": sampleEventDateId,
    "orderId": "order-003-test-sample",
    "orderName": "Mike Wilson Order",
    "currency": "AUD",
    "number": 1004,
    "firstName": "Mike",
    "lastName": "Wilson",
    "attendee": {
      "firstName": "Mike",
      "lastName": "Wilson",
      "email": "m.wilson@example.com"
    },
    "ticketTypeName": "VIP",
    "ticketTypeId": "tt-vip-001",
    "price": 50.00,
    "total": 56.25,
    "status": "valid",
    "checkInStatus": "not_checked_in",
    "salesChannel": "box_office",
    "seatingLocation": {
      "name": "VIP Section",
      "section": { "name": "VIP" },
      "note": "Premium seating with complimentary drink"
    },
    "createdAt": "2024-12-01T16:22:00.000Z"
  },
  {
    "_id": "ticket-005-test-sample",
    "id": "ticket-005-test-sample",
    "eventId": sampleEventId,
    "eventDateId": sampleEventDateId,
    "orderId": "order-005-test-sample",
    "orderName": "David Brown Order",
    "currency": "AUD",
    "number": 1005,
    "firstName": "David",
    "lastName": "Brown",
    "attendee": {
      "firstName": "David",
      "lastName": "Brown",
      "email": "d.brown@example.com"
    },
    "ticketTypeName": "General Admission",
    "price": 35.00,
    "total": 39.25,
    "status": "refunded",
    "checkInStatus": "not_checked_in",
    "salesChannel": "online",
    "cancelledAt": "2024-12-02T09:00:00.000Z",
    "createdAt": "2024-12-01T20:12:00.000Z"
  }
];

// Save sample data
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

fs.writeFileSync(path.join(dataDir, 'sample-orders.json'), JSON.stringify(sampleOrders, null, 2));
fs.writeFileSync(path.join(dataDir, 'sample-tickets.json'), JSON.stringify(sampleTickets, null, 2));

console.log('✅ Created comprehensive sample test data:');
console.log(`   📊 ${sampleOrders.length} sample orders with complete financial data`);
console.log(`   🎫 ${sampleTickets.length} sample tickets with seating, check-in, and payment details`);
console.log('   💾 Saved to /root/agents/data/sample-orders.json and sample-tickets.json');