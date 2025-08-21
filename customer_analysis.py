import json
from datetime import datetime

# Load the orders data
with open('docs/humanitix-all-orders.json', 'r') as f:
    data = json.load(f)

orders = data['orders']
print(f'Total orders: {len(orders)}')
print(f'Sample order keys: {list(orders[0].keys())}')

# Customer data analysis
customers = {}
for order in orders:
    email = order.get('email')
    if email:
        if email not in customers:
            customers[email] = {
                'firstName': order.get('firstName', ''),
                'lastName': order.get('lastName', ''),
                'mobile': order.get('mobile', ''),
                'location': order.get('location', ''),
                'orders': [],
                'totalSpent': 0,
                'totalOrders': 0
            }
        customers[email]['orders'].append(order['_id'])
        customers[email]['totalSpent'] += order.get('totals', {}).get('total', 0)
        customers[email]['totalOrders'] += 1

print(f'\nUnique customers: {len(customers)}')
print(f'Average orders per customer: {len(orders) / len(customers):.2f}')

# Find repeat customers
repeat_customers = {email: data for email, data in customers.items() if data['totalOrders'] > 1}
print(f'Repeat customers: {len(repeat_customers)}')
print(f'Repeat customer rate: {len(repeat_customers) / len(customers) * 100:.1f}%')

# Top spending customers
sorted_customers = sorted(customers.items(), key=lambda x: x[1]['totalSpent'], reverse=True)
print(f'\nTop 10 spending customers:')
for i, (email, data) in enumerate(sorted_customers[:10]):
    print(f'{i+1}. {data["firstName"]} {data["lastName"]} - ${data["totalSpent"]:.2f} ({data["totalOrders"]} orders)')

# Payment method analysis
payment_methods = {}
for order in orders:
    method = order.get('paymentGateway', 'unknown')
    payment_methods[method] = payment_methods.get(method, 0) + 1

print(f'\nPayment methods:')
for method, count in sorted(payment_methods.items(), key=lambda x: x[1], reverse=True):
    print(f'{method}: {count} orders ({count/len(orders)*100:.1f}%)')

# Transaction status analysis
statuses = {}
for order in orders:
    status = order.get('financialStatus', 'unknown')
    statuses[status] = statuses.get(status, 0) + 1

print(f'\nTransaction statuses:')
for status, count in sorted(statuses.items(), key=lambda x: x[1], reverse=True):
    print(f'{status}: {count} orders ({count/len(orders)*100:.1f}%)')

# Order completion analysis
completion_statuses = {}
for order in orders:
    status = order.get('status', 'unknown')
    completion_statuses[status] = completion_statuses.get(status, 0) + 1

print(f'\nOrder completion statuses:')
for status, count in sorted(completion_statuses.items(), key=lambda x: x[1], reverse=True):
    print(f'{status}: {count} orders ({count/len(orders)*100:.1f}%)')

# Location analysis
locations = {}
for order in orders:
    location = order.get('location', 'unknown')
    locations[location] = locations.get(location, 0) + 1

print(f'\nCustomer locations:')
for location, count in sorted(locations.items(), key=lambda x: x[1], reverse=True):
    print(f'{location}: {count} orders ({count/len(orders)*100:.1f}%)')

# Mobile phone coverage
mobile_coverage = sum(1 for order in orders if order.get('mobile'))
print(f'\nMobile phone coverage: {mobile_coverage}/{len(orders)} orders ({mobile_coverage/len(orders)*100:.1f}%)')

# Email coverage
email_coverage = sum(1 for order in orders if order.get('email'))
print(f'Email coverage: {email_coverage}/{len(orders)} orders ({email_coverage/len(orders)*100:.1f}%)')

# Business purpose analysis
business_orders = sum(1 for order in orders if order.get('businessPurpose'))
print(f'Business orders: {business_orders}/{len(orders)} orders ({business_orders/len(orders)*100:.1f}%)')

# International transaction analysis
international_orders = sum(1 for order in orders if order.get('isInternationalTransaction'))
print(f'International orders: {international_orders}/{len(orders)} orders ({international_orders/len(orders)*100:.1f}%)')