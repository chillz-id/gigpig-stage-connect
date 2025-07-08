#!/usr/bin/env python3
"""Direct query to check invoice-related database structures in Supabase"""

import subprocess
import sys

def run_query_direct(query, description):
    """Run a direct query using the MCP server"""
    # Create a script that uses the MCP server directly
    script_content = f'''
import sys
sys.path.append('/opt/standup-sydney-mcp')

# Import the required modules directly
import asyncio
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/opt/standup-sydney-mcp/.env')

# Initialize Supabase client
url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_KEY')
supabase: Client = create_client(url, key)

# Run the query
query = """{query}"""

try:
    result = supabase.rpc('sql_query', {{'query': query}}).execute()
    if result.data:
        import json
        print(json.dumps(result.data, indent=2))
    else:
        # Try direct table query if RPC fails
        response = supabase.postgrest.schema('public').from_('information_schema.tables').select('*').execute()
        print("RPC not available, trying direct query...")
except Exception as e:
    print(f"Query failed: {{e}}")
    # Try using psycopg2 directly
    try:
        import psycopg2
        from urllib.parse import urlparse
        
        # Parse database URL from Supabase URL
        db_url = os.getenv('DATABASE_URL') or os.getenv('SUPABASE_DB_URL')
        if not db_url:
            # Construct from Supabase URL
            parsed = urlparse(url)
            db_host = parsed.hostname.replace('project.', 'db.')
            db_url = f"postgresql://postgres:{{os.getenv('SUPABASE_SERVICE_KEY')}}@{{db_host}}:5432/postgres"
        
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        cur.execute(query)
        
        # Get column names
        col_names = [desc[0] for desc in cur.description] if cur.description else []
        
        # Get results
        rows = cur.fetchall()
        
        # Format as list of dicts
        results = []
        for row in rows:
            results.append(dict(zip(col_names, row)))
        
        import json
        print(json.dumps(results, indent=2, default=str))
        
        cur.close()
        conn.close()
    except Exception as e2:
        print(f"Direct DB query also failed: {{e2}}")
'''
    
    print(f"\n{'='*60}")
    print(f"=== {description} ===")
    print('='*60)
    
    try:
        # Run with the virtual environment's Python
        result = subprocess.run(
            ['/opt/standup-sydney-mcp/venv/bin/python3', '-c', script_content],
            capture_output=True,
            text=True,
            cwd='/opt/standup-sydney-mcp'
        )
        if result.stdout:
            print(result.stdout)
        if result.stderr:
            print(f"Error: {result.stderr}")
    except Exception as e:
        print(f"Failed to run query: {e}")

# Query 1: Find all tables with 'invoice' or 'xero' in the name
run_query_direct("""
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND (table_name ILIKE '%invoice%' OR table_name ILIKE '%xero%')
    ORDER BY table_name;
""", "INVOICE/XERO RELATED TABLES")

# Query 2: Get structure of invoices table if it exists
run_query_direct("""
    SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'invoices'
    ORDER BY ordinal_position;
""", "INVOICES TABLE STRUCTURE")

# Query 3: Check for indexes on invoice tables
run_query_direct("""
    SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND (tablename ILIKE '%invoice%' OR tablename ILIKE '%xero%')
    ORDER BY tablename, indexname;
""", "INDEXES ON INVOICE TABLES")

# Query 4: Check for any xero-related columns in other tables
run_query_direct("""
    SELECT 
        table_name,
        column_name,
        data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_name ILIKE '%xero%'
    ORDER BY table_name, column_name;
""", "XERO COLUMNS IN OTHER TABLES")

# Query 5: Check invoice_line_items table if it exists
run_query_direct("""
    SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'invoice_line_items'
    ORDER BY ordinal_position;
""", "INVOICE_LINE_ITEMS TABLE STRUCTURE")

# Query 6: Check for any payment-related tables
run_query_direct("""
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name ILIKE '%payment%'
    ORDER BY table_name;
""", "PAYMENT RELATED TABLES")