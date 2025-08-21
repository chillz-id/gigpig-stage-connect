# Humanitix Fee Breakdown Examples

## Real Transaction Examples

### Example 1: Standard Paid Order
```json
{
  "orderName": "6E6TWL85",
  "customer": "Duncan Wichmann",
  "event": "New Stuff: Jenny Tian",
  "subtotal": 20.00,
  "fees": {
    "humanitixFee": 3.40,
    "bookingFee": 3.66,
    "passedOnFee": 3.40,
    "absorbedFee": 0.00,
    "amexFee": 0.26
  },
  "discounts": 0.00,
  "refunds": 0.00,
  "rebates": 2.00,
  "total": 23.66,
  "partnerShare": 16.60
}
```

**Calculation:**
- Subtotal: $20.00
- Discounts: $0.00
- Refunds: $0.00
- Passed On Fees: $3.40
- **Partner Share: $20.00 - $0.00 - $0.00 - $3.40 = $16.60**

### Example 2: Order with Discount
```json
{
  "orderName": "V33KE6J5",
  "customer": "Andy Lynch",
  "event": "New Stuff: Jenny Tian",
  "subtotal": 40.00,
  "fees": {
    "humanitixFee": 6.40,
    "bookingFee": 6.40,
    "passedOnFee": 6.40,
    "absorbedFee": 0.00
  },
  "discounts": 20.00,
  "refunds": 0.00,
  "rebates": 4.00,
  "total": 26.40,
  "partnerShare": 13.60
}
```

**Calculation:**
- Subtotal: $40.00
- Discounts: $20.00
- Refunds: $0.00
- Passed On Fees: $6.40
- **Partner Share: $40.00 - $20.00 - $0.00 - $6.40 = $13.60**

### Example 3: Free Order
```json
{
  "orderName": "ABC12345",
  "customer": "Free Attendee",
  "event": "Comedy Club Weekly",
  "subtotal": 0.00,
  "fees": {
    "humanitixFee": 0.00,
    "bookingFee": 0.00,
    "passedOnFee": 0.00,
    "absorbedFee": 0.00
  },
  "discounts": 0.00,
  "refunds": 0.00,
  "total": 0.00,
  "partnerShare": 0.00
}
```

**Calculation:**
- Subtotal: $0.00
- **Partner Share: $0.00**

## Fee Structure Patterns

### Standard Fee Calculation
```
Humanitix Fee = Subtotal × Fee Rate (typically 15-17%)
Booking Fee = Humanitix Fee + Payment Processing Fee
Passed On Fee = Amount charged to customer
Absorbed Fee = Amount absorbed by Humanitix (rare)
```

### Partner Revenue Formula
```
Partner Net Revenue = Subtotal - Discounts - Refunds - Passed On Fees
```

### Fee Absorption Analysis
- **Full Absorption:** 0 orders (0%)
- **Partial Absorption:** 2 orders (0.27%)
- **No Absorption:** 744 orders (99.73%)

## Payment Gateway Fees

### Braintree Fees (85.5% of orders)
- Standard processing fee included in booking fee
- No additional charges to partner

### Manual Orders (14.1% of orders)
- No payment processing fees
- Direct payment handling

### Stripe Payments (0.4% of orders)
- Standard processing fee structure
- Similar to Braintree handling

## Discount Code Impact

### Discount Distribution
- $25 discount: 20 orders (most common)
- $30 discount: 12 orders
- $20 discount: 9 orders
- $50 discount: 9 orders
- $40 discount: 8 orders

### Revenue Impact
- Total discounts: $3,392.50
- Average discount: $41.37
- Impact on partner revenue: Direct reduction

## Refund Processing

### Refund Amounts
- $60 refunds: 3 orders
- $40 refunds: 2 orders
- $80 refunds: 2 orders
- $20 refunds: 1 order
- $33 refunds: 1 order

### Refund Impact on Partners
- Full refund amount deducted from partner share
- Fees may or may not be refunded depending on policy
- Total refund impact: $473.00

## Event-Specific Examples

### High-Volume Event: Comedy Untamed - Fridays
- 114 orders processed
- Average order value: $41.48
- Total partner revenue: $4,728.82
- Fee efficiency: 76.4% partner share

### Premium Event: Rory Lowe - The Special
- 31 orders processed
- Average order value: $104.27
- Total partner revenue: $3,232.29
- Higher price point, better partner margin

### Regular Club Night: Off The Record - Comedy Club
- 79 orders processed
- Average order value: $11.62
- Total partner revenue: $918.27
- Lower price point, many free tickets

## International Transaction Handling

### Special Considerations
- Some orders marked as international
- Same fee structure applied
- Currency conversion at time of transaction
- No additional international fees observed

## Tax Implications

### Current Tax Status
- No GST/VAT charged separately
- All amounts in AUD
- Tax handling appears to be included in pricing
- No separate tax line items in transactions

## Invoice Generation Data Points

### Required Fields for Partner Invoicing
1. **Event Details:** ID, name, date, venue
2. **Order Summary:** Count, total revenue, fees, discounts
3. **Individual Orders:** ID, customer, amounts, status
4. **Fee Breakdown:** Detailed fee analysis
5. **Net Calculation:** Final partner share amount

### Audit Trail Requirements
- Complete transaction history
- Fee calculation methodology
- Discount application records
- Refund processing documentation
- Status change tracking

## Error Handling Scenarios

### Missing Data
- Some orders may have incomplete fee data
- Default to conservative calculations
- Flag for manual review

### Calculation Discrepancies
- Validate totals against subtotals + fees
- Check for rounding differences
- Implement tolerance thresholds

### Status Inconsistencies
- Verify order status matches financial status
- Handle edge cases gracefully
- Maintain audit logs

This fee breakdown provides the foundation for accurate partner invoicing with complete transparency and audit trail capabilities.