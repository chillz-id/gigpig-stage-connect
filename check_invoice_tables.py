#!/usr/bin/env python3
"""Check invoice-related database structures in Supabase"""

import os
import sys
import subprocess
import json

# Add the MCP server directory to Python path
sys.path.append('/opt/standup-sydney-mcp')

def run_mcp_query(query, description):
    """Run a query through the MCP server"""
    script = f'''
import asyncio
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def run_query():
    server_params = StdioServerParameters(
        command='python',
        args=['/opt/standup-sydney-mcp/server.py'],
        env=None
    )
    
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            
            result = await session.call_tool(
                'supabase_query',
                arguments={{
                    'query': """{query}"""
                }}
            )
            return result.content[0].text if result.content else None

result = asyncio.run(run_query())
print(result if result else "No results")
'''
    
    print(f"\n{'='*60}")
    print(f"=== {description} ===")
    print('='*60)
    
    try:
        result = subprocess.run(
            ['python3', '-c', script],
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
run_mcp_query("""
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND (table_name ILIKE '%invoice%' OR table_name ILIKE '%xero%')
    ORDER BY table_name;
""", "INVOICE/XERO RELATED TABLES")

# Query 2: Get structure of invoices table if it exists
run_mcp_query("""
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
run_mcp_query("""
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

# Query 4: Check for functions related to invoices
run_mcp_query("""
    SELECT 
        routine_name,
        routine_type,
        data_type
    FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND (routine_name ILIKE '%invoice%' OR routine_name ILIKE '%xero%')
    ORDER BY routine_name;
""", "INVOICE-RELATED FUNCTIONS")

# Query 5: Check for any xero-related columns in other tables
run_mcp_query("""
    SELECT 
        table_name,
        column_name,
        data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_name ILIKE '%xero%'
    ORDER BY table_name, column_name;
""", "XERO COLUMNS IN OTHER TABLES")

# Query 6: Check for foreign key relationships involving invoice tables
run_mcp_query("""
    SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
    FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND (tc.table_name ILIKE '%invoice%' OR tc.table_name ILIKE '%xero%'
         OR ccu.table_name ILIKE '%invoice%' OR ccu.table_name ILIKE '%xero%');
""", "FOREIGN KEY RELATIONSHIPS")