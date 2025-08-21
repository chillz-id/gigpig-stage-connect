"""
Customer Database Model for Partner Reporting
Stand Up Sydney - Comedy Platform
"""

import json
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict

@dataclass
class CustomerProfile:
    """Complete customer profile for partner reporting"""
    email: str
    first_name: str
    last_name: str
    mobile: Optional[str]
    location: str
    marketing_opt_in: bool
    created_at: datetime
    updated_at: datetime
    
    # Computed fields
    total_orders: int = 0
    total_spent: float = 0.0
    lifetime_value: float = 0.0
    is_repeat_customer: bool = False
    customer_segment: str = "new"  # new, repeat, vip, corporate
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        data = asdict(self)
        data['created_at'] = self.created_at.isoformat()
        data['updated_at'] = self.updated_at.isoformat()
        return data

@dataclass
class TransactionRecord:
    """Transaction record for audit trail"""
    transaction_id: str
    order_id: str
    customer_email: str
    event_id: str
    event_name: str
    order_total: float
    partner_share: float
    humanitix_fees: float
    discounts_applied: float
    refunds_processed: float
    payment_gateway: str
    payment_status: str
    transaction_date: datetime
    completion_date: Optional[datetime]
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        data = asdict(self)
        data['transaction_date'] = self.transaction_date.isoformat()
        data['completion_date'] = self.completion_date.isoformat() if self.completion_date else None
        return data

@dataclass
class PartnerReport:
    """Partner invoice report structure"""
    partner_id: str
    event_id: str
    event_name: str
    event_date: datetime
    report_period: str
    
    # Customer metrics
    total_customers: int
    new_customers: int
    repeat_customers: int
    customer_retention_rate: float
    
    # Transaction metrics
    total_orders: int
    total_revenue: float
    partner_share: float
    platform_fees: float
    
    # Customer contact data
    email_reachable: int
    sms_reachable: int
    marketing_opted_in: int
    
    # Detailed customer list (anonymized)
    customer_breakdown: List[Dict]
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        data = asdict(self)
        data['event_date'] = self.event_date.isoformat()
        return data

class CustomerTrackingSystem:
    """Customer tracking system for partner reporting"""
    
    def __init__(self):
        self.customers: Dict[str, CustomerProfile] = {}
        self.transactions: List[TransactionRecord] = []
        self.partner_reports: List[PartnerReport] = {}
    
    def process_order(self, order_data: Dict) -> TransactionRecord:
        """Process an order and update customer profile"""
        email = order_data.get('email')
        
        # Update or create customer profile
        if email not in self.customers:
            self.customers[email] = CustomerProfile(
                email=email,
                first_name=order_data.get('firstName', ''),
                last_name=order_data.get('lastName', ''),
                mobile=order_data.get('mobile'),
                location=order_data.get('location', 'AU'),
                marketing_opt_in=order_data.get('organiserMailListOptIn', False),
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
        
        customer = self.customers[email]
        
        # Update customer metrics
        customer.total_orders += 1
        customer.total_spent += order_data.get('totals', {}).get('total', 0)
        customer.updated_at = datetime.now()
        
        # Determine customer segment
        if customer.total_orders > 1:
            customer.is_repeat_customer = True
            customer.customer_segment = "repeat"
        if customer.total_spent > 200:
            customer.customer_segment = "vip"
        
        # Create transaction record
        transaction = TransactionRecord(
            transaction_id=order_data.get('_id'),
            order_id=order_data.get('orderName'),
            customer_email=email,
            event_id=order_data.get('eventId'),
            event_name=order_data.get('eventName'),
            order_total=order_data.get('totals', {}).get('total', 0),
            partner_share=order_data.get('totals', {}).get('total', 0) - order_data.get('totals', {}).get('passedOnFee', 0),
            humanitix_fees=order_data.get('totals', {}).get('humanitixFee', 0),
            discounts_applied=order_data.get('totals', {}).get('discounts', 0),
            refunds_processed=order_data.get('totals', {}).get('refunds', 0),
            payment_gateway=order_data.get('paymentGateway'),
            payment_status=order_data.get('financialStatus'),
            transaction_date=datetime.fromisoformat(order_data.get('createdAt').replace('Z', '+00:00')),
            completion_date=datetime.fromisoformat(order_data.get('completedAt').replace('Z', '+00:00')) if order_data.get('completedAt') else None
        )
        
        self.transactions.append(transaction)
        return transaction
    
    def generate_partner_report(self, event_id: str) -> PartnerReport:
        """Generate partner report for specific event"""
        event_transactions = [t for t in self.transactions if t.event_id == event_id]
        
        if not event_transactions:
            return None
        
        # Get event details from first transaction
        first_transaction = event_transactions[0]
        event_name = first_transaction.event_name
        
        # Calculate metrics
        unique_customers = set(t.customer_email for t in event_transactions)
        new_customers = sum(1 for email in unique_customers if self.customers[email].total_orders == 1)
        repeat_customers = len(unique_customers) - new_customers
        
        total_revenue = sum(t.order_total for t in event_transactions)
        partner_share = sum(t.partner_share for t in event_transactions)
        platform_fees = sum(t.humanitix_fees for t in event_transactions)
        
        # Contact metrics
        email_reachable = len(unique_customers)  # All customers have email
        sms_reachable = sum(1 for email in unique_customers if self.customers[email].mobile)
        marketing_opted_in = sum(1 for email in unique_customers if self.customers[email].marketing_opt_in)
        
        # Customer breakdown (anonymized)
        customer_breakdown = []
        for email in unique_customers:
            customer = self.customers[email]
            customer_transactions = [t for t in event_transactions if t.customer_email == email]
            
            customer_breakdown.append({
                'customer_id': hash(email) % 1000000,  # Anonymized ID
                'orders': len(customer_transactions),
                'total_spent': sum(t.order_total for t in customer_transactions),
                'partner_share': sum(t.partner_share for t in customer_transactions),
                'is_repeat': customer.is_repeat_customer,
                'segment': customer.customer_segment,
                'contactable_email': True,
                'contactable_sms': bool(customer.mobile),
                'marketing_consent': customer.marketing_opt_in
            })
        
        return PartnerReport(
            partner_id=event_id,  # Using event_id as partner_id for now
            event_id=event_id,
            event_name=event_name,
            event_date=first_transaction.transaction_date,
            report_period=first_transaction.transaction_date.strftime('%Y-%m'),
            total_customers=len(unique_customers),
            new_customers=new_customers,
            repeat_customers=repeat_customers,
            customer_retention_rate=repeat_customers / len(unique_customers) * 100 if unique_customers else 0,
            total_orders=len(event_transactions),
            total_revenue=total_revenue,
            partner_share=partner_share,
            platform_fees=platform_fees,
            email_reachable=email_reachable,
            sms_reachable=sms_reachable,
            marketing_opted_in=marketing_opted_in,
            customer_breakdown=customer_breakdown
        )
    
    def export_customer_data(self, filename: str):
        """Export customer data for analysis"""
        data = {
            'customers': [customer.to_dict() for customer in self.customers.values()],
            'transactions': [transaction.to_dict() for transaction in self.transactions],
            'summary': {
                'total_customers': len(self.customers),
                'total_transactions': len(self.transactions),
                'repeat_customers': sum(1 for c in self.customers.values() if c.is_repeat_customer),
                'average_order_value': sum(t.order_total for t in self.transactions) / len(self.transactions) if self.transactions else 0
            }
        }
        
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2)

# Example usage
if __name__ == "__main__":
    # Load Humanitix data
    with open('docs/humanitix-all-orders.json', 'r') as f:
        data = json.load(f)
    
    # Initialize tracking system
    tracking_system = CustomerTrackingSystem()
    
    # Process all orders
    for order in data['orders']:
        tracking_system.process_order(order)
    
    # Generate reports for each event
    events = set(order.get('eventId') for order in data['orders'])
    
    print("=== PARTNER REPORTS GENERATED ===\n")
    
    for event_id in events:
        if event_id:
            report = tracking_system.generate_partner_report(event_id)
            if report:
                print(f"Event: {report.event_name}")
                print(f"  Total Customers: {report.total_customers}")
                print(f"  New Customers: {report.new_customers}")
                print(f"  Repeat Customers: {report.repeat_customers}")
                print(f"  Retention Rate: {report.customer_retention_rate:.1f}%")
                print(f"  Total Revenue: ${report.total_revenue:.2f}")
                print(f"  Partner Share: ${report.partner_share:.2f}")
                print(f"  SMS Reachable: {report.sms_reachable}/{report.total_customers} ({report.sms_reachable/report.total_customers*100:.1f}%)")
                print(f"  Marketing Opted In: {report.marketing_opted_in}/{report.total_customers} ({report.marketing_opted_in/report.total_customers*100:.1f}%)")
                print()
    
    # Export data
    tracking_system.export_customer_data('docs/customer-tracking-export.json')
    print("Customer tracking data exported to 'docs/customer-tracking-export.json'")