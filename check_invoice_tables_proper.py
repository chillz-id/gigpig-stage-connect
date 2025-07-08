#!/opt/standup-sydney-mcp/venv/bin/python3
"""Check invoice-related tables using Supabase tool properly"""

import asyncio
import sys
import os
import json

# Add MCP server path
sys.path.insert(0, '/opt/standup-sydney-mcp')

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def query_supabase():
    server_params = StdioServerParameters(
        command='/opt/standup-sydney-mcp/venv/bin/python3',
        args=['/opt/standup-sydney-mcp/server.py'],
        env=os.environ.copy()
    )
    
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            
            # First, let's try to query the invoices table if it exists
            print("\n=== CHECKING INVOICES TABLE ===")
            try:
                result = await session.call_tool(
                    'supabase_query',
                    arguments={
                        'table': 'invoices',
                        'operation': 'select',
                        'filters': {'limit': 1}
                    }
                )
                print("Invoices table exists!")
                if result.content:
                    print(result.content[0].text)
            except Exception as e:
                print(f"Invoices table not found or error: {e}")
            
            # Check invoice_line_items table
            print("\n=== CHECKING INVOICE_LINE_ITEMS TABLE ===")
            try:
                result = await session.call_tool(
                    'supabase_query',
                    arguments={
                        'table': 'invoice_line_items',
                        'operation': 'select',
                        'filters': {'limit': 1}
                    }
                )
                print("Invoice_line_items table exists!")
                if result.content:
                    print(result.content[0].text)
            except Exception as e:
                print(f"Invoice_line_items table not found or error: {e}")
            
            # Check xero_invoices table
            print("\n=== CHECKING XERO_INVOICES TABLE ===")
            try:
                result = await session.call_tool(
                    'supabase_query',
                    arguments={
                        'table': 'xero_invoices',
                        'operation': 'select',
                        'filters': {'limit': 1}
                    }
                )
                print("Xero_invoices table exists!")
                if result.content:
                    print(result.content[0].text)
            except Exception as e:
                print(f"Xero_invoices table not found or error: {e}")
            
            # Check payments table
            print("\n=== CHECKING PAYMENTS TABLE ===")
            try:
                result = await session.call_tool(
                    'supabase_query',
                    arguments={
                        'table': 'payments',
                        'operation': 'select',
                        'filters': {'limit': 1}
                    }
                )
                print("Payments table exists!")
                if result.content:
                    print(result.content[0].text)
            except Exception as e:
                print(f"Payments table not found or error: {e}")
            
            # Check event_spots table for xero-related columns
            print("\n=== CHECKING EVENT_SPOTS TABLE FOR XERO COLUMNS ===")
            try:
                result = await session.call_tool(
                    'supabase_query',
                    arguments={
                        'table': 'event_spots',
                        'operation': 'select',
                        'filters': {'limit': 1}
                    }
                )
                if result.content:
                    # Parse the result to check for xero columns
                    try:
                        data = json.loads(result.content[0].text)
                        if data and len(data) > 0:
                            columns = list(data[0].keys())
                            xero_columns = [col for col in columns if 'xero' in col.lower()]
                            if xero_columns:
                                print(f"Found Xero columns in event_spots: {xero_columns}")
                            else:
                                print("No Xero columns found in event_spots table")
                    except:
                        print("Could not parse event_spots data")
            except Exception as e:
                print(f"Error checking event_spots: {e}")
            
            # Check users table for xero-related columns
            print("\n=== CHECKING USERS TABLE FOR XERO COLUMNS ===")
            try:
                result = await session.call_tool(
                    'supabase_query',
                    arguments={
                        'table': 'users',
                        'operation': 'select',
                        'filters': {'limit': 1}
                    }
                )
                if result.content:
                    # Parse the result to check for xero columns
                    try:
                        data = json.loads(result.content[0].text)
                        if data and len(data) > 0:
                            columns = list(data[0].keys())
                            xero_columns = [col for col in columns if 'xero' in col.lower()]
                            if xero_columns:
                                print(f"Found Xero columns in users: {xero_columns}")
                            else:
                                print("No Xero columns found in users table")
                    except:
                        print("Could not parse users data")
            except Exception as e:
                print(f"Error checking users: {e}")
            
            # Check events table for xero-related columns
            print("\n=== CHECKING EVENTS TABLE FOR XERO COLUMNS ===")
            try:
                result = await session.call_tool(
                    'supabase_query',
                    arguments={
                        'table': 'events',
                        'operation': 'select',
                        'filters': {'limit': 1}
                    }
                )
                if result.content:
                    # Parse the result to check for xero columns
                    try:
                        data = json.loads(result.content[0].text)
                        if data and len(data) > 0:
                            columns = list(data[0].keys())
                            xero_columns = [col for col in columns if 'xero' in col.lower() or 'invoice' in col.lower()]
                            if xero_columns:
                                print(f"Found Xero/Invoice columns in events: {xero_columns}")
                            else:
                                print("No Xero/Invoice columns found in events table")
                    except:
                        print("Could not parse events data")
            except Exception as e:
                print(f"Error checking events: {e}")

if __name__ == "__main__":
    asyncio.run(query_supabase())