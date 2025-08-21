# Humanitix Events & Ticket Type Analysis

**Generated**: July 14, 2025, 6:44:19 PM  
**Mission**: Agent 2 - Event & Ticket Type Analysis  
**Data Source**: Humanitix API v1

## Executive Summary

This comprehensive analysis extracted and analyzed all event data and ticket type configurations from Humanitix, providing insights into Stand Up Sydney's comedy event ecosystem.

### Key Metrics

- **Total Events**: 22
- **Total Ticket Types**: 52 (including 15 package deals)
- **Total Orders**: 732 across all events
- **Published Events**: 22 (100% publication rate)
- **Public Events**: 21 (95% public visibility)
- **Suspended Events**: 1 (temporary suspension)

## Event Portfolio Analysis

### Event Distribution by Status
- **Published**: 22 events (100%)
- **Draft**: 0 events (0%)
- **Public**: 21 events (95%)
- **Sold Out**: 0 events (0%)
- **Suspended**: 1 event (5%)

### Geographic Distribution
- **New South Wales**: 18 events (82%)
- **Western Australia**: 3 events (14%)
- **Victoria**: 1 event (4%)

### City-Level Analysis
- **Darlinghurst**: 12 events (55%)
- **Sydney**: 5 events (23%)
- **Perth/Fremantle/Mandurah**: 3 events (14%)
- **North Melbourne**: 1 event (4%)
- **Potts Point**: 1 event (4%)

## Ticket Type Analysis

### Ticket Type Categories
1. **General Admission**: 23 tickets (44%)
2. **Package Deals**: 15 tickets (29%)
3. **Other**: 6 tickets (12%)
4. **Early Bird**: 4 tickets (8%)
5. **VIP/Premium**: 3 tickets (6%)
6. **Student/Concession**: 1 ticket (2%)

### Package Deal Analysis
**Package Events**: 9 events offer package deals
- **Group of 4**: Most common package size
- **Group of 5**: Secondary package option
- **Group of 6-10**: Premium packages for larger groups
- **Price Range**: $60-$200 per package
- **Average Savings**: 10-25% discount vs individual tickets

### Pricing Structure Analysis

#### Price Distribution
- **$21-$50**: 23 ticket types (44%)
- **$51-$100**: 13 ticket types (25%)
- **$1-$20**: 6 ticket types (12%)
- **Free**: 6 ticket types (12%)
- **$101-$200**: 4 ticket types (8%)

#### Pricing Statistics
- **Average Ticket Price**: $54.58
- **Free Tickets**: 6 (12%)
- **Paid Tickets**: 46 (88%)
- **Price Range**: $0 - $200
- **Most Common Price Point**: $25-$45

### Promotional Strategies
- **Early Bird Discounts**: 4 events (18%)
- **Group Discounts**: 9 events (41%)
- **Affiliate Codes**: Multiple events support promotional codes
- **Package Deals**: 9 events offer bundled pricing

## Venue Analysis

### Venue Distribution
1. **Kinselas Hotel**: 9 events (41%)
2. **iD Comedy Club**: 3 events (14%)
3. **Arcade Comedy Club**: 3 events (14%)
4. **Brighton Hotel**: 1 event (4%)
5. **Arcade Bar & Club**: 1 event (4%)
6. **Comedy Lounge Perth City**: 1 event (4%)
7. **Comedy Lounge Fremantle**: 1 event (4%)
8. **The Comic's Lounge**: 1 event (4%)
9. **Plaza Hotel Sydney**: 1 event (4%)
10. **Potts Point Hotel**: 1 event (4%)

### Venue Capacity Analysis
- **Average Capacity**: 110 seats
- **Largest Venue**: The Comic's Lounge (400 seats)
- **Smallest Venue**: New Stuff: Jenny Tian (60 seats)
- **Most Popular Capacity**: 110 seats (9 events)

## Sales Performance Analysis

### Top Performing Events by Orders
1. **Comedy Untamed - Fridays**: 100 orders
2. **ID Comedy Club - Fri/Sat**: 93 orders
3. **Off The Record - Comedy Club**: 79 orders
4. **CIANG AJEIC: IN THE BENINGING**: 59 orders
5. **Damien Power - From Nothing**: 49 orders
6. **Roast Battle: Sydney**: 46 orders
7. **Rory Lowe - Real Men Do Pilates**: 40 orders
8. **Magic Mic Comedy - Wednesdays**: 39 orders
9. **Arcade Comedy Club - Tuesdays**: 37 orders
10. **Shad & Pete Save The World**: 36 orders

### Revenue Analysis (Sample from Jenny Tian Event)
- **34 Orders Processed**
- **Price Points**: $10-$20 per ticket
- **Average Order Value**: ~$15-25 including fees
- **Booking Fees**: $1.70-$6.40 per order
- **Discounts Applied**: Auto-discounts available
- **Payment Methods**: Primarily Braintree gateway

## Event-Ticket Relationship Mapping

### Single-Show Events
- **Rory Lowe Shows**: Multiple cities with $35-$40 tickets
- **Jenny Tian Shows**: $10 tickets for new material testing
- **Damien Power**: $35 tickets for experimental format

### Recurring Events
- **Comedy Untamed**: $19.99 early bird, $25 general, $75 group packages
- **ID Comedy Club**: $15-$25 tickets with $75-$180 packages
- **Arcade Comedy Club**: $18-$25 tickets with group packages

### Premium Events
- **Julian Woods**: $34.90 early bird, $44.90 general admission
- **Rory Lowe Special**: $25 early bird, $33 general, $100 group packages

## Ticket Sales Integration

### Humanitix Platform Features
- **Comprehensive Event Management**: Full event lifecycle support
- **Flexible Pricing**: Multiple ticket types and package options
- **Promotional Tools**: Discount codes, early bird pricing
- **Customer Data**: Detailed buyer information and preferences
- **Payment Processing**: Integrated Braintree payments
- **International Support**: Multi-currency and location handling

### Order Processing Insights
- **Complete Orders**: 732 successful transactions
- **Payment Status**: All orders marked as "paid"
- **Customer Information**: Full contact details captured
- **Additional Fields**: Age verification and address collection
- **Fee Structure**: Transparent booking fee system

## Recommendations

### Pricing Strategy
1. **Optimize Price Points**: Most successful events price at $25-$45
2. **Expand Package Deals**: 41% of events use packages successfully
3. **Early Bird Strategy**: Implement across more events
4. **Free Events**: Use strategically for audience building

### Venue Strategy
1. **Kinselas Hotel**: Strong performance, continue partnership
2. **Capacity Optimization**: 110-seat venues show optimal performance
3. **Geographic Expansion**: Strong NSW presence, explore other states

### Revenue Optimization
1. **Package Deals**: Increase adoption from 41% to 70%
2. **Tiered Pricing**: Implement early bird across all events
3. **Group Sales**: Focus on 4-6 person packages
4. **Premium Events**: Explore higher-priced specialty shows

## Technical Implementation

### API Integration
- **Base URL**: https://api.humanitix.com/v1
- **Authentication**: x-api-key header
- **Rate Limiting**: 500ms between requests
- **Error Handling**: Comprehensive error management

### Data Structure
- **Events**: 22 comprehensive event objects
- **Tickets**: 52 ticket configurations
- **Orders**: 732 transaction records
- **Venues**: 10 unique venue locations

## Raw Data Access

Complete datasets available in:
- **JSON Format**: `/root/agents/docs/humanitix-events-data.json`
- **Markdown Report**: `/root/agents/docs/humanitix-events-analysis.md`
- **Analysis Script**: `/root/agents/scripts/humanitix-event-analysis.js`

---

**Agent 2 Mission Complete**: Successfully extracted and analyzed all event data and ticket type configurations from Humanitix, providing comprehensive insights into Stand Up Sydney's comedy event ecosystem, pricing strategies, venue partnerships, and sales performance.

*Analysis generated automatically by Agent 2 - Event & Ticket Type Analysis*