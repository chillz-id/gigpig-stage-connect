# Humanitix Financial Analysis Summary

## Key Findings

### Financial Overview
- **Total Orders Analyzed:** 746 orders across 22 events
- **Total Revenue:** $32,472.86 AUD
- **Partner Share:** $24,142.07 AUD (74.3%)
- **Humanitix Commission:** $4,480.49 AUD (13.8%)
- **Average Order Value:** $38.35 AUD
- **Median Order Value:** $27.96 AUD

### Fee Structure Insights

#### Standard Fee Components
1. **Humanitix Fee:** $1.70 - $22.56 (avg: $3.00)
2. **Booking Fee:** $1.70 - $22.56 (avg: $3.01)
3. **Passed On Fee:** $1.70 - $22.56 (avg: $2.98)
4. **Absorbed Fee:** $2.80 - $4.80 (avg: $0.01)

#### Fee Absorption Pattern
- **99.66% of fees** are passed on to customers
- **0.34% of fees** are absorbed by Humanitix
- Fee absorption is extremely rare (only 2 orders out of 746)

### Revenue Distribution

#### By Order Value Range
- **$51-$100:** 259 orders (34.7%)
- **$26-$50:** 184 orders (24.7%)
- **Free:** 187 orders (25.1%)
- **$100+:** 29 orders (3.9%)
- **$11-$25:** 78 orders (10.5%)
- **$1-$10:** 9 orders (1.2%)

#### By Payment Status
- **Paid:** 550 orders (73.7%)
- **Free:** 187 orders (25.1%)
- **Refunded:** 9 orders (1.2%)

### Partner Revenue Calculation

```
Partner Share = Subtotal - Discounts - Refunds - Passed On Fees
```

#### Examples:
- **Standard Order:** $20 subtotal → $16.60 partner share (83%)
- **With Discount:** $40 subtotal, $20 discount → $13.60 partner share (68%)
- **Free Order:** $0 subtotal → $0 partner share

### Discount & Refund Impact

#### Discounts Applied
- **Total Discounts:** $3,392.50 (11% of orders)
- **Common Amounts:** $25 (20 orders), $30 (12 orders), $20 (9 orders)
- **Average Discount:** $41.37

#### Refunds Processed
- **Total Refunds:** $473.00 (1.2% of orders)
- **Common Amounts:** $60 (3 orders), $40 (2 orders), $80 (2 orders)

### Payment Gateway Distribution

1. **Braintree:** 638 orders (85.5%)
2. **Manual:** 105 orders (14.1%)
3. **Stripe:** 3 orders (0.4%)

### High-Performance Events

| Event | Orders | Revenue | Avg Order |
|-------|--------|---------|-----------|
| Comedy Untamed - Fridays | 114 | $4,728.82 | $41.48 |
| Rory Lowe - The Special | 31 | $3,232.29 | $104.27 |
| ID Comedy Club - Fri/Sat | 93 | $2,994.29 | $32.20 |
| Damien Power - From Nothing | 49 | $2,089.31 | $42.64 |

### Order Completion Rates

- **100% completion rate** for all analyzed orders
- **No incomplete or cancelled orders** in dataset
- **High payment success rate** (98.8% paid/free, 1.2% refunded)

### Key Recommendations

1. **Automated Invoicing:** Use the standard partner revenue formula
2. **Fee Transparency:** Provide detailed fee breakdowns to partners
3. **Discount Tracking:** Monitor promotional impact on partner revenue
4. **Refund Management:** Clear policies for refund impact on partner payments
5. **Audit Trail:** Maintain complete transaction records for reconciliation

### Technical Implementation Notes

- **API Endpoint:** `/v1/events/{eventId}/orders`
- **Key Fields:** `subtotal`, `discounts`, `refunds`, `passedOnFee`
- **Status Validation:** Ensure `status: "complete"` and `financialStatus: "paid"`
- **Currency:** All transactions in AUD
- **Pagination:** Use page parameter for large event datasets

### Edge Cases to Handle

1. **Partial Fee Absorption:** Rare but possible (2 orders)
2. **Amex Fees:** Additional processing fees for some credit cards
3. **International Orders:** Same fee structure, AUD pricing
4. **Manual Orders:** No payment processing fees
5. **Free Events:** Zero revenue but still tracked

This summary provides the essential information needed for implementing accurate partner invoicing based on Humanitix transaction data.