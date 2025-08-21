import json
from datetime import datetime
from collections import defaultdict

# Load the orders data
with open('docs/humanitix-all-orders.json', 'r') as f:
    data = json.load(f)

orders = data['orders']
print(f'=== TRANSACTION LIFECYCLE ANALYSIS ===\n')

# Transaction lifecycle analysis
lifecycles = []
for order in orders:
    created = order.get('createdAt')
    updated = order.get('updatedAt')
    completed = order.get('completedAt')
    
    if created and completed:
        created_dt = datetime.fromisoformat(created.replace('Z', '+00:00'))
        completed_dt = datetime.fromisoformat(completed.replace('Z', '+00:00'))
        processing_time = (completed_dt - created_dt).total_seconds()
        lifecycles.append(processing_time)

print(f'Transaction Processing Times:')
print(f'Average processing time: {sum(lifecycles)/len(lifecycles):.2f} seconds')
print(f'Fastest transaction: {min(lifecycles):.2f} seconds')
print(f'Slowest transaction: {max(lifecycles):.2f} seconds')

# Multi-purchase customer analysis
print(f'\n=== REPEAT CUSTOMER ANALYSIS ===\n')

customers = {}
for order in orders:
    email = order.get('email')
    if email:
        if email not in customers:
            customers[email] = {
                'firstName': order.get('firstName', ''),
                'lastName': order.get('lastName', ''),
                'orders': [],
                'events': set(),
                'totalSpent': 0,
                'firstPurchase': None,
                'lastPurchase': None
            }
        
        order_date = order.get('completedAt')
        if order_date:
            order_dt = datetime.fromisoformat(order_date.replace('Z', '+00:00'))
            if not customers[email]['firstPurchase'] or order_dt < customers[email]['firstPurchase']:
                customers[email]['firstPurchase'] = order_dt
            if not customers[email]['lastPurchase'] or order_dt > customers[email]['lastPurchase']:
                customers[email]['lastPurchase'] = order_dt
        
        customers[email]['orders'].append(order)
        customers[email]['events'].add(order.get('eventName', ''))
        customers[email]['totalSpent'] += order.get('totals', {}).get('total', 0)

# Find repeat customers
repeat_customers = {email: data for email, data in customers.items() if len(data['orders']) > 1}

print(f'Repeat Customer Details:')
for email, data in sorted(repeat_customers.items(), key=lambda x: len(x[1]['orders']), reverse=True):
    days_between = None
    if data['firstPurchase'] and data['lastPurchase'] and len(data['orders']) > 1:
        days_between = (data['lastPurchase'] - data['firstPurchase']).days
    
    print(f"{data['firstName']} {data['lastName']} ({email})")
    print(f"  Orders: {len(data['orders'])}")
    print(f"  Events: {len(data['events'])}")
    print(f"  Total Spent: ${data['totalSpent']:.2f}")
    print(f"  Purchase Span: {days_between} days" if days_between is not None else "  Purchase Span: N/A")
    print(f"  Events: {', '.join(list(data['events']))}")
    print()

# Event-based customer analysis
print(f'=== EVENT-BASED CUSTOMER PATTERNS ===\n')

event_customers = defaultdict(lambda: {
    'customers': set(),
    'orders': [],
    'revenue': 0,
    'repeat_customers': set()
})

for order in orders:
    event_name = order.get('eventName', 'Unknown')
    email = order.get('email')
    
    if email:
        # Check if this customer has attended other events
        customer_events = [o.get('eventName') for o in customers[email]['orders']]
        if len(set(customer_events)) > 1:
            event_customers[event_name]['repeat_customers'].add(email)
    
    event_customers[event_name]['customers'].add(email)
    event_customers[event_name]['orders'].append(order)
    event_customers[event_name]['revenue'] += order.get('totals', {}).get('total', 0)

print('Event Customer Analysis:')
for event_name, data in sorted(event_customers.items(), key=lambda x: len(x[1]['customers']), reverse=True):
    repeat_rate = len(data['repeat_customers']) / len(data['customers']) * 100 if data['customers'] else 0
    print(f"{event_name}:")
    print(f"  Unique Customers: {len(data['customers'])}")
    print(f"  Total Orders: {len(data['orders'])}")
    print(f"  Cross-Event Customers: {len(data['repeat_customers'])} ({repeat_rate:.1f}%)")
    print(f"  Revenue: ${data['revenue']:.2f}")
    print()

# Payment gateway analysis by customer
print(f'=== PAYMENT GATEWAY CUSTOMER ANALYSIS ===\n')

gateway_customers = defaultdict(set)
for order in orders:
    gateway = order.get('paymentGateway', 'unknown')
    email = order.get('email')
    if email:
        gateway_customers[gateway].add(email)

print('Payment Gateway Customer Distribution:')
for gateway, customers_set in sorted(gateway_customers.items(), key=lambda x: len(x[1]), reverse=True):
    print(f"{gateway}: {len(customers_set)} unique customers")

# Refund analysis
print(f'\n=== REFUND ANALYSIS ===\n')

refunded_orders = [order for order in orders if order.get('financialStatus') == 'refunded']
print(f'Refunded Orders: {len(refunded_orders)}')

for order in refunded_orders:
    customer_name = f"{order.get('firstName', '')} {order.get('lastName', '')}"
    refund_amount = order.get('totals', {}).get('refunds', 0)
    event_name = order.get('eventName', 'Unknown')
    print(f"  {customer_name} - {event_name} - ${refund_amount:.2f}")

# Customer mobile coverage analysis
print(f'\n=== CUSTOMER CONTACT COVERAGE ===\n')

mobile_coverage = {}
for order in orders:
    event_name = order.get('eventName', 'Unknown')
    if event_name not in mobile_coverage:
        mobile_coverage[event_name] = {'total': 0, 'with_mobile': 0}
    
    mobile_coverage[event_name]['total'] += 1
    if order.get('mobile'):
        mobile_coverage[event_name]['with_mobile'] += 1

print('Mobile Coverage by Event:')
for event_name, data in sorted(mobile_coverage.items(), key=lambda x: x[1]['total'], reverse=True):
    coverage = data['with_mobile'] / data['total'] * 100 if data['total'] > 0 else 0
    print(f"{event_name}: {data['with_mobile']}/{data['total']} ({coverage:.1f}%)")

# International customer analysis
print(f'\n=== INTERNATIONAL CUSTOMER ANALYSIS ===\n')

international_orders = [order for order in orders if order.get('isInternationalTransaction')]
print(f'International Orders: {len(international_orders)}')

for order in international_orders:
    customer_name = f"{order.get('firstName', '')} {order.get('lastName', '')}"
    event_name = order.get('eventName', 'Unknown')
    total = order.get('totals', {}).get('total', 0)
    print(f"  {customer_name} - {event_name} - ${total:.2f}")