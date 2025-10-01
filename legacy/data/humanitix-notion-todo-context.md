# Humanitix-Notion Integration TODO with Complete Context

## Project Overview
Setting up complete Notion databases to capture ALL fields from the Humanitix API endpoints. The user specifically requested that EVERY property from the Humanitix API must be included in the Notion databases, not just a subset.

## Critical Requirements
1. **MUST include ALL properties from the Humanitix API** (user was very clear about this)
2. **MUST properly handle multi-date events** (critical for event structure)
3. **Need 4 databases, not 3**: Events, Event Dates, Orders, Tickets

## Database IDs (Already Created)
- Events: `2794745b-8cbe-8182-8ba0-d283f3b2b904`
- Orders: `2794745b-8cbe-81ed-b8c1-c3def0d4e2ef`
- Tickets: `2794745b-8cbe-8137-9e27-daac3fe6ccc2`
- Event Dates: **NEEDS TO BE CREATED**

## Source Files
- Humanitix OpenAPI Spec: `/root/HUMANITIXopenapi.yaml`
- Test import script: `/root/agents/test-humanitix-import.js`
- Sample data files: `/root/agents/data/notion-Event-*.json`

## Current TODO List

### Phase 1: Database Structure Setup
- [ ] Create Event Dates database in Notion
- [ ] Update Events database with ALL 40+ properties from API
- [ ] Update Orders database with ALL 35+ properties from API
- [ ] Update Tickets database with ALL 45+ properties from API
- [ ] Set up proper relationships between all 4 databases

### Phase 2: Complete Property Mapping

#### EVENTS Database - Missing Properties to Add:
- userId (text)
- organiserId (text)
- slug (text)
- url (url)
- tagIds (multi-select or JSON)
- category (select)
- classification type (select)
- classification category (select)
- classification subcategory (select)
- artists (JSON array with origin, name, externalId)
- public (checkbox)
- published (checkbox)
- suspendSales (checkbox)
- markedAsSoldOut (checkbox)
- timezone (text)
- totalCapacity (number)
- ticketTypes (JSON - complete array)
- pricing.minimumPrice (number)
- pricing.maximumPrice (number)
- paymentOptions.refundSettings.refundPolicy (text)
- paymentOptions.refundSettings.customRefundPolicy (text)
- publishedAt (date)
- additionalQuestions (JSON array)
- bannerImage.url (url)
- featureImage.url (url)
- socialImage.url (url)
- eventLocation.type (select: address/online/custom/toBeAnnounced)
- eventLocation.venueName (text)
- eventLocation.address (text)
- eventLocation.latLng (text/JSON)
- eventLocation.instructions (text)
- eventLocation.placeId (text)
- eventLocation.onlineUrl (url)
- eventLocation.mapUrl (url)
- eventLocation.city (text)
- eventLocation.region (text)
- eventLocation.country (text)
- dates (relation to Event Dates table)
- packagedTickets (JSON array)
- accessibility (JSON - all fields)
- affiliateCode.code (text)
- keywords (multi-select or JSON)
- location (select - country code)
- createdAt (date)
- updatedAt (date)

#### EVENT DATES Database - ALL Properties (NEW DATABASE):
- _id (title - Event Date ID)
- eventId (relation to Events)
- startDate (date)
- endDate (date)
- scheduleId (text)
- disabled (checkbox)
- deleted (checkbox)
- ticketsSold (rollup from Tickets)
- ordersCount (rollup from Orders)
- revenue (rollup from Orders)

#### ORDERS Database - Missing Properties to Add:
- eventId (relation to Events)
- eventDateId (relation to Event Dates)
- userId (text)
- currency (select)
- status (select: complete/cancelled)
- financialStatus (select: free/paid/partiallyRefunded/refunded)
- firstName (text)
- lastName (text)
- organisation (text)
- mobile (phone)
- email (email)
- accessCode (text)
- discounts.autoDiscount.discountAmount (number)
- discounts.discountCode.code (text)
- discounts.discountCode.discountAmount (number)
- businessPurpose (checkbox)
- businessTaxId (text)
- businessName (text)
- paymentType (select - all enum values)
- paymentGateway (select - all enum values)
- manualOrder (checkbox)
- tipFees (checkbox)
- clientDonation (number)
- notes (text)
- organiserMailListOptIn (checkbox)
- incompleteAt (date)
- completedAt (date)
- waitlistOfferId (text)
- isInternationalTransaction (checkbox)
- totals.subtotal (number)
- totals.amexFee (number)
- totals.zipFee (number)
- totals.humanitixFee (number)
- totals.bookingFee (number)
- totals.passedOnFee (number)
- totals.clientDonation (number)
- totals.netClientDonation (number)
- totals.donation (number)
- totals.dgrDonation (number)
- totals.giftCardCredit (number)
- totals.credit (number)
- totals.outstandingAmount (number)
- totals.feesIncluded (checkbox)
- totals.bookingTaxes (number)
- totals.passedOnTaxes (number)
- totals.taxes (number)
- totals.totalTaxes (number)
- totals.discounts (number)
- totals.refunds (number)
- totals.netSales (number)
- totals.grossSales (number)
- totals.referralAmount (number)
- totals.total (number)
- purchaseTotals (JSON - same structure as totals)
- additionalFields (JSON array)
- salesChannel (select: online/manual)
- location (select - country code)
- createdAt (date)
- updatedAt (date)

#### TICKETS Database - Missing Properties to Add:
- eventId (relation to Events)
- eventDateId (relation to Event Dates)
- orderId (relation to Orders)
- orderName (text)
- currency (select)
- number (number)
- firstName (text)
- lastName (text)
- organisation (text)
- ticketTypeName (text)
- ticketTypeId (text)
- accessCode (text)
- price (number)
- discount (number)
- netPrice (number)
- taxes (number)
- fee (number)
- passedOnFee (number)
- absorbedFee (number)
- dgrDonation (number)
- total (number)
- customScanningCode (text)
- seatingLocation.seatingMapId (text)
- seatingLocation.name (text)
- seatingLocation.section (JSON)
- seatingLocation.table (JSON)
- seatingLocation.seat (JSON)
- seatingLocation.note (text)
- status (select: complete/cancelled)
- additionalFields (JSON array)
- checkIn.checkedIn (checkbox)
- checkIn.date (date)
- checkIn.userId (text)
- checkInHistory (JSON array)
- cancelledAt (date)
- isDonation (checkbox)
- packageId (text)
- packageName (text)
- packageGroupId (text)
- packagePrice (number)
- attendeeProfileId (text)
- swappedFrom (JSON)
- swappedTo (JSON)
- salesChannel (select: online/manual)
- qrCodeData._id (text)
- qrCodeData.eventId (text)
- discounts.autoDiscount.discountAmount (number)
- discounts.discountCode.code (text)
- discounts.discountCode.discountAmount (number)
- location (select - country code)
- createdAt (date)
- updatedAt (date)

### Phase 3: Update Import Scripts
- [ ] Update `mapEventToNotion()` function to include ALL properties
- [ ] Create `mapEventDateToNotion()` function for Event Dates
- [ ] Update `mapOrderToNotion()` function to include ALL properties and link to Event Dates
- [ ] Update `mapTicketToNotion()` function to include ALL properties and link to Event Dates
- [ ] Handle null/undefined values properly
- [ ] Ensure proper data type conversions

### Phase 4: Testing
- [ ] Test single-date event import
- [ ] Test multi-date event import
- [ ] Test events with all fields populated
- [ ] Test events with minimal fields
- [ ] Verify relationships work correctly
- [ ] Test rollup calculations

## Key Implementation Notes

### Multi-Date Event Structure
```
Events (1) → Event Dates (Many)
Event Dates (1) → Orders (Many)
Event Dates (1) → Tickets (Many)
Orders (1) → Tickets (Many)
```

### Critical Fields for Relationships
- Orders MUST link to both Event AND Event Date
- Tickets MUST link to both Event AND Event Date
- This ensures proper tracking for multi-date events

### Data Type Mappings
- Arrays → JSON text fields or multi-select where appropriate
- Nested objects → Either flatten into individual fields or store as JSON
- Enums → Select fields with all possible values
- Dates → Date fields (parse ISO strings)
- Numbers → Number fields (parse strings if needed)
- Booleans → Checkbox fields

### API Endpoints Coverage
From `/root/HUMANITIXopenapi.yaml`:
- GET /v1/events - All Event properties
- GET /v1/events/{eventId} - Single Event details
- GET /v1/events/{eventId}/orders - All Order properties
- GET /v1/events/{eventId}/tickets - All Ticket properties
- GET /v1/events/{eventId}/check-in-count - Check-in data

## Files to Update
1. `/root/agents/test-humanitix-import.js` - Main import script
2. Create new: `/root/agents/scripts/update-notion-databases.js` - Database structure updater
3. Create new: `/root/agents/scripts/create-event-dates-database.js` - Event Dates database creator

## Success Criteria
✅ All 4 databases exist with complete field structure
✅ Every property from Humanitix API is mapped to Notion
✅ Multi-date events are properly supported
✅ Relationships between databases work correctly
✅ Import scripts handle all fields without data loss
✅ Sample data imports successfully with all fields populated

## Current Status
- Events, Orders, Tickets databases exist but need ALL properties added
- Event Dates database needs to be created
- Import script exists but only maps subset of fields
- Sample data files available in `/root/agents/data/`

## Next Immediate Action
Create the Event Dates database first, as it's critical for the multi-date event structure, then systematically update each existing database to include ALL properties from the API specification.