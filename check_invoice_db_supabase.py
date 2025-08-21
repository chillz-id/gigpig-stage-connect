#!/opt/standup-sydney-mcp/venv/bin/python3
"""Check invoice database structure using Supabase client"""

import os
import sys
from dotenv import load_dotenv

# Add path for imports
sys.path.insert(0, '/opt/standup-sydney-mcp')

# Load environment variables
load_dotenv('/opt/standup-sydney-mcp/.env')

from supabase import create_client, Client

# Initialize Supabase client
url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_KEY')

if not url or not key:
    print("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY")
    sys.exit(1)

supabase: Client = create_client(url, key)

def check_table_exists(table_name):
    """Check if a table exists by trying to query it"""
    try:
        result = supabase.table(table_name).select("*").limit(0).execute()
        return True
    except Exception as e:
        return False

def get_table_sample(table_name, limit=1):
    """Get a sample row to see columns"""
    try:
        result = supabase.table(table_name).select("*").limit(limit).execute()
        if result.data and len(result.data) > 0:
            return list(result.data[0].keys())
        else:
            # Try with count to at least confirm table exists
            count_result = supabase.table(table_name).select("*", count='exact').limit(0).execute()
            return f"Table exists but is empty (count: {count_result.count})"
    except Exception as e:
        return f"Error: {str(e)}"

print("=== CHECKING INVOICE-RELATED TABLES ===\n")

# List of tables to check
tables_to_check = [
    'invoices',
    'invoice_items',
    'invoice_line_items',
    'invoice_recipients',
    'invoice_payments',
    'xero_invoices',
    'xero_integrations',
    'xero_tokens',
    'xero_contacts',
    'xero_webhook_events',
    'payments',
    'recurring_invoices'
]

existing_tables = []
missing_tables = []

for table in tables_to_check:
    exists = check_table_exists(table)
    if exists:
        existing_tables.append(table)
        print(f"✓ {table}: EXISTS")
        columns = get_table_sample(table)
        if isinstance(columns, list):
            print(f"  Columns: {', '.join(columns)}")
        else:
            print(f"  {columns}")
    else:
        missing_tables.append(table)
        print(f"✗ {table}: NOT FOUND")
    print()

print("\n=== SUMMARY ===")
print(f"Existing tables ({len(existing_tables)}): {', '.join(existing_tables)}")
print(f"Missing tables ({len(missing_tables)}): {', '.join(missing_tables)}")

# Check for xero-related columns in common tables
print("\n=== CHECKING FOR XERO COLUMNS IN COMMON TABLES ===")

tables_to_check_for_xero = ['users', 'profiles', 'events', 'event_spots']

for table in tables_to_check_for_xero:
    columns = get_table_sample(table)
    if isinstance(columns, list):
        xero_columns = [col for col in columns if 'xero' in col.lower() or 'invoice' in col.lower()]
        if xero_columns:
            print(f"{table}: Found related columns: {', '.join(xero_columns)}")
        else:
            print(f"{table}: No xero/invoice columns found")

print("\n=== ANALYSIS COMPLETE ===")