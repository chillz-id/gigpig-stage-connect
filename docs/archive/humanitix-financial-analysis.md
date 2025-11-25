# Humanitix Financial Data Analysis for Partner Invoicing

**Generated:** 2025-07-14T18:52:11.562Z  
**Analysis Source:** 746 orders across 22 events  
**Total Revenue:** $32,472.86 AUD  
**Total Partner Share:** $24,142.07 AUD

---

## Executive Summary

This comprehensive analysis examines the financial transaction structures and order data from Humanitix to establish accurate partner invoicing methodologies. The analysis covers fee breakdowns, revenue sharing calculations, discount applications, and refund processing patterns across 746 completed orders.

### Key Financial Metrics

- **Total Orders Analyzed:** 746
- **Total Revenue:** $32,472.86 AUD
- **Partner Revenue Share:** $24,142.07 AUD (74.3%)
- **Humanitix Commission:** $4,480.49 AUD (13.8%)
- **Average Order Value:** $38.35 AUD
- **Median Order Value:** $27.96 AUD

---

## 1. Fee Structure Analysis

### 1.1 Humanitix Fee Breakdown

| Fee Type | Min | Max | Average | Total |
|----------|-----|-----|---------|-------|
| **Humanitix Fee** | $1.70 | $22.56 | $3.00 | $2,234.40 |
| **Booking Fee** | $1.70 | $22.56 | $3.01 | $2,246.09 |
| **Passed On Fee** | $1.70 | $22.56 | $2.98 | $2,226.80 |
| **Absorbed Fee** | $2.80 | $4.80 | $0.01 | $7.60 |
| **Amex Fee** | $0.13 | $0.96 | $0.02 | $11.69 |
| **Zip Fee** | $0.00 | $0.00 | $0.00 | $0.00 |

### 1.2 Fee Calculation Formula

```
Partner Net Revenue = Subtotal - Discounts - Refunds - Passed On Fees
Humanitix Revenue = Humanitix Fee + Booking Fee + Absorbed Fees
```

### 1.3 Fee Absorption Analysis

- **Total Absorbed:** $7.60 (0.34% absorption rate)
- **Total Passed On:** $2,226.80 (99.66% passed to customers)
- **Fee Absorption Strategies:**
  - Full Absorption: 0 orders
  - Partial Absorption: 2 orders  
  - No Absorption: 744 orders

**Key Finding:** Humanitix rarely absorbs fees (only 0.34% of total fees), with 99.66% of fees passed on to customers.

---

## 2. Revenue Flow Analysis

### 2.1 Revenue Breakdown

```
Gross Sales:     $32,472.86  (100%)
├─ Subtotal:     $30,234.37  (93.1%)
├─ Fees:         $4,480.49   (13.8%)
├─ Discounts:    -$3,392.50  (-10.4%)
├─ Refunds:      -$473.00    (-1.5%)
└─ Rebates:      -$1,116.00  (-3.4%)

Net Sales:       $26,361.27  (81.2%)
Partner Share:   $24,142.07  (74.3%)
```

### 2.2 Revenue Distribution by Event Type

**High-Revenue Events ($2,000+):**
- Comedy Untamed - Fridays: $4,728.82 (114 orders)
- Rory Lowe - The Special: $3,232.29 (31 orders)
- ID Comedy Club - Fri/Sat: $2,994.29 (93 orders)
- Damien Power - From Nothing: $2,089.31 (49 orders)

**Medium-Revenue Events ($500-$2,000):**
- CIANG AJEIC: IN THE BENINGING: $1,654.36 (59 orders)
- Rory Lowe - Real Men Do Pilates: $1,321.84 (40 orders)
- Magic Mic Comedy - Wednesdays: $1,223.80 (39 orders)
- Roast Battle: Sydney: $1,218.74 (46 orders)
- Off The Record - Comedy Club: $918.27 (79 orders)

---

## 3. Discount and Refund Analysis

### 3.1 Discount Patterns

Common discount amounts and frequency:
- $25 discount: 20 orders
- $30 discount: 12 orders
- $20 discount: 9 orders
- $50 discount: 9 orders
- $40 discount: 8 orders
- $60 discount: 6 orders
- $12.50 discount: 5 orders

**Total Discounts Applied:** $3,392.50 across 82 orders (11% of all orders)

### 3.2 Refund Patterns

Refund amounts processed:
- $60 refunds: 3 orders
- $40 refunds: 2 orders
- $80 refunds: 2 orders
- $20 refunds: 1 order
- $33 refunds: 1 order

**Total Refunds Processed:** $473.00 across 9 orders (1.2% of all orders)

---

## 4. Payment Method Analysis

### 4.1 Payment Gateway Distribution

| Gateway | Orders | Percentage |
|---------|--------|------------|
| **Braintree** | 638 | 85.5% |
| **Manual** | 105 | 14.1% |
| **Stripe Payments** | 3 | 0.4% |

### 4.2 Payment Status Distribution

| Status | Orders | Percentage |
|--------|--------|------------|
| **Paid** | 550 | 73.7% |
| **Free** | 187 | 25.1% |
| **Refunded** | 9 | 1.2% |

---

## 5. Partner Invoicing Data Structure

### 5.1 Invoice Data Format

```json
{
  "eventId": "686c9048a3100076cfb5f844",
  "eventName": "Live from Here with Sath Nadesan & Pat Doherty",
  "eventDate": "2025-08-23T10:30:00.600Z",
  "venue": {
    "name": "iD Comedy Club",
    "address": "383 Bourke St, Darlinghurst NSW 2010, Australia",
    "city": "Darlinghurst",
    "state": "NSW",
    "country": "AU",
    "capacity": 110
  },
  "orderCount": 1,
  "summary": {
    "totalGrossSales": 60.00,
    "totalNetSales": 64.20,
    "totalFees": 8.40,
    "totalDiscounts": 0.00,
    "totalRefunds": 0.00,
    "partnerShare": 55.80,
    "humanitixShare": 8.40
  },
  "orderBreakdown": [
    {
      "orderId": "686cf02c25fff6460b2e7893",
      "orderName": "9Q8QX2LW",
      "customer": {
        "name": "Madison Peachey",
        "email": "madisonpeachey@gmail.com"
      },
      "subtotal": 60.00,
      "fees": {
        "humanitix": 4.20,
        "booking": 4.20,
        "passedOn": 4.20,
        "absorbed": 0.00
      },
      "discounts": 0.00,
      "refunds": 0.00,
      "total": 64.20,
      "partnerShare": 55.80,
      "status": "complete",
      "financialStatus": "paid",
      "completedAt": "2025-07-08T10:17:17.240Z"
    }
  ]
}
```

### 5.2 Partner Revenue Calculation

**Formula:**
```
Partner Share = Subtotal - Discounts - Refunds - Passed On Fees
```

**Example Calculation:**
- Subtotal: $60.00
- Discounts: $0.00
- Refunds: $0.00
- Passed On Fees: $4.20
- **Partner Share: $55.80**

---

## 6. Order Value Distribution

| Price Range | Orders | Percentage |
|-------------|--------|------------|
| **$51-$100** | 259 | 34.7% |
| **$26-$50** | 184 | 24.7% |
| **Free** | 187 | 25.1% |
| **$100+** | 29 | 3.9% |
| **$11-$25** | 78 | 10.5% |
| **$1-$10** | 9 | 1.2% |

---

## 7. Transaction Status Analysis

### 7.1 Order Completion Rates

- **Complete Orders:** 746 (100%)
- **Incomplete Orders:** 0 (0%)
- **Cancelled Orders:** 0 (0%)

### 7.2 Financial Status Distribution

- **Paid Orders:** 550 (73.7%)
- **Free Orders:** 187 (25.1%)
- **Refunded Orders:** 9 (1.2%)

---

## 8. Edge Cases and Exception Handling

### 8.1 Partial Fee Absorption

**Julian Woods: Cancel Me! Event:**
- 2 orders with partial fee absorption
- Total absorbed: $7.60
- Absorbed on orders with higher-value transactions

### 8.2 Amex Fee Handling

- Additional Amex fees: $11.69 total
- Range: $0.13 - $0.96 per transaction
- Applied to 8.5% of credit card transactions

### 8.3 International Transactions

- Some orders marked as international
- Same fee structure applied
- Currency: AUD maintained throughout

---

## 9. Partner Invoicing Recommendations

### 9.1 Invoice Generation Process

1. **Data Collection:** Pull order data by event from Humanitix API
2. **Fee Calculation:** Apply partner revenue formula
3. **Discount Tracking:** Account for promotional discounts
4. **Refund Processing:** Deduct refunded amounts from partner share
5. **Audit Trail:** Maintain detailed transaction records

### 9.2 Key Metrics to Track

- **Gross Revenue:** Total ticket sales before deductions
- **Net Revenue:** Revenue after fees, discounts, and refunds
- **Partner Share:** Final amount payable to partners
- **Fee Breakdown:** Detailed fee analysis for transparency
- **Refund Impact:** Track refund effects on partner revenue

### 9.3 Financial Reconciliation

**Monthly Reconciliation Checklist:**
- [ ] Verify all order statuses are "complete"
- [ ] Confirm financial statuses (paid/free/refunded)
- [ ] Calculate total partner revenue by event
- [ ] Account for all discounts and refunds
- [ ] Validate fee calculations
- [ ] Generate detailed invoice with order breakdown

---

## 10. Technical Implementation

### 10.1 API Integration Points

```javascript
// Get event orders
GET /v1/events/{eventId}/orders?page=1

// Order structure for invoicing
{
  "subtotal": 60.00,
  "totals": {
    "humanitixFee": 4.20,
    "bookingFee": 4.20,
    "passedOnFee": 4.20,
    "absorbedFee": 0.00,
    "discounts": 0.00,
    "refunds": 0.00,
    "total": 64.20
  },
  "status": "complete",
  "financialStatus": "paid"
}
```

### 10.2 Revenue Calculation Function

```javascript
function calculatePartnerRevenue(orderTotals) {
  const subtotal = orderTotals.subtotal || 0;
  const discounts = orderTotals.discounts || 0;
  const refunds = orderTotals.refunds || 0;
  const passedOnFee = orderTotals.passedOnFee || 0;
  
  // Partner revenue = subtotal - discounts - refunds - fees passed to customer
  return subtotal - discounts - refunds - passedOnFee;
}
```

---

## 11. Conclusion

The analysis reveals a consistent and transparent fee structure across Humanitix transactions:

1. **Partner Revenue:** 74.3% of total revenue flows to partners
2. **Fee Transparency:** Clear breakdown of all fees and deductions
3. **Minimal Fee Absorption:** Only 0.34% of fees absorbed by Humanitix
4. **Predictable Structure:** Consistent fee calculation across all events
5. **Audit Trail:** Complete transaction history for reconciliation

This financial structure provides a solid foundation for automated partner invoicing with clear audit trails and transparent revenue sharing.

---

**Next Steps:**
1. Implement automated invoice generation system
2. Create partner-facing financial dashboard
3. Set up monthly reconciliation processes
4. Establish dispute resolution procedures
5. Build real-time revenue tracking

---

*Analysis completed by Agent 3: Order & Financial Data Deep Dive*  
*Stand Up Sydney - Comedy Platform Financial Analysis*