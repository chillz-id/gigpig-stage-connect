#!/opt/standup-sydney-mcp/venv/bin/python3
"""Query Supabase via MCP server"""

import asyncio
import sys
import os

# Add MCP server path
sys.path.insert(0, '/opt/standup-sydney-mcp')

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def run_queries():
    server_params = StdioServerParameters(
        command='/opt/standup-sydney-mcp/venv/bin/python3',
        args=['/opt/standup-sydney-mcp/server.py'],
        env=os.environ.copy()
    )
    
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            
            # Query 1: Find invoice/xero tables
            print("\n=== INVOICE/XERO RELATED TABLES ===")
            try:
                result = await session.call_tool(
                    'supabase_query',
                    arguments={
                        'query': """
                            SELECT table_name 
                            FROM information_schema.tables 
                            WHERE table_schema = 'public' 
                            AND (table_name ILIKE '%invoice%' OR table_name ILIKE '%xero%')
                            ORDER BY table_name;
                        """
                    }
                )
                print(result.content[0].text if result.content else "No tables found")
            except Exception as e:
                print(f"Error: {e}")
            
            # Query 2: Invoices table structure
            print("\n=== INVOICES TABLE STRUCTURE ===")
            try:
                result = await session.call_tool(
                    'supabase_query',
                    arguments={
                        'query': """
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
                        """
                    }
                )
                print(result.content[0].text if result.content else "No invoices table found")
            except Exception as e:
                print(f"Error: {e}")
            
            # Query 3: Indexes
            print("\n=== INDEXES ON INVOICE TABLES ===")
            try:
                result = await session.call_tool(
                    'supabase_query',
                    arguments={
                        'query': """
                            SELECT 
                                tablename,
                                indexname,
                                indexdef
                            FROM pg_indexes
                            WHERE schemaname = 'public'
                            AND (tablename ILIKE '%invoice%' OR tablename ILIKE '%xero%')
                            ORDER BY tablename, indexname;
                        """
                    }
                )
                print(result.content[0].text if result.content else "No indexes found")
            except Exception as e:
                print(f"Error: {e}")
            
            # Query 4: Xero columns in other tables
            print("\n=== XERO COLUMNS IN OTHER TABLES ===")
            try:
                result = await session.call_tool(
                    'supabase_query',
                    arguments={
                        'query': """
                            SELECT 
                                table_name,
                                column_name,
                                data_type
                            FROM information_schema.columns
                            WHERE table_schema = 'public'
                            AND column_name ILIKE '%xero%'
                            ORDER BY table_name, column_name;
                        """
                    }
                )
                print(result.content[0].text if result.content else "No xero columns found")
            except Exception as e:
                print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(run_queries())