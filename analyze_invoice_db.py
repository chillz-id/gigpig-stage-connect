#!/usr/bin/env python3
"""Analyze invoice database structure directly"""

import os
import psycopg2
import json
from urllib.parse import urlparse
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/opt/standup-sydney-mcp/.env')

# Get database connection from environment
database_url = os.getenv('DATABASE_URL')
if not database_url:
    # Try to construct from Supabase URL if DATABASE_URL not available
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
    if supabase_url:
        parsed = urlparse(supabase_url)
        # Supabase database URLs follow pattern: db.PROJECT_ID.supabase.co
        db_host = parsed.hostname.replace('project.', 'db.')
        database_url = f"postgresql://postgres.{parsed.hostname.split('.')[0]}:{supabase_key}@{db_host}:5432/postgres"

def run_query(conn, query, description):
    """Run a query and print results"""
    print(f"\n{'='*60}")
    print(f"=== {description} ===")
    print('='*60)
    
    try:
        with conn.cursor() as cur:
            cur.execute(query)
            
            # Get column names
            if cur.description:
                col_names = [desc[0] for desc in cur.description]
                rows = cur.fetchall()
                
                if rows:
                    # Print as formatted table
                    for row in rows:
                        for i, val in enumerate(row):
                            print(f"{col_names[i]}: {val}")
                        print("-" * 40)
                else:
                    print("No results found")
            else:
                print("Query executed successfully")
                
    except Exception as e:
        print(f"Error: {e}")

def main():
    try:
        # Connect to database
        print(f"Connecting to database...")
        conn = psycopg2.connect(database_url)
        print("Connected successfully!")
        
        # 1. Check invoice-related tables
        run_query(conn, """
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND (table_name ILIKE '%invoice%' OR table_name ILIKE '%xero%')
            ORDER BY table_name;
        """, "INVOICE/XERO RELATED TABLES")
        
        # 2. Check invoices table structure
        run_query(conn, """
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
        
        # 3. Check invoice_line_items structure (checking both names)
        run_query(conn, """
            SELECT 
                column_name,
                data_type,
                is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND table_name = 'invoice_line_items'
            ORDER BY ordinal_position;
        """, "INVOICE_LINE_ITEMS TABLE STRUCTURE")
        
        # 3b. Check invoice_items structure
        run_query(conn, """
            SELECT 
                column_name,
                data_type,
                is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND table_name = 'invoice_items'
            ORDER BY ordinal_position;
        """, "INVOICE_ITEMS TABLE STRUCTURE")
        
        # 4. Check xero_invoices structure
        run_query(conn, """
            SELECT 
                column_name,
                data_type,
                is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND table_name = 'xero_invoices'
            ORDER BY ordinal_position;
        """, "XERO_INVOICES TABLE STRUCTURE")
        
        # 5. Check for xero columns in other tables
        run_query(conn, """
            SELECT 
                table_name,
                column_name,
                data_type
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND column_name ILIKE '%xero%'
            ORDER BY table_name, column_name;
        """, "XERO COLUMNS IN OTHER TABLES")
        
        # 6. Check indexes
        run_query(conn, """
            SELECT 
                tablename,
                indexname
            FROM pg_indexes
            WHERE schemaname = 'public'
            AND (tablename ILIKE '%invoice%' OR tablename ILIKE '%xero%')
            ORDER BY tablename, indexname;
        """, "INVOICE/XERO RELATED INDEXES")
        
        # 7. Check functions
        run_query(conn, """
            SELECT 
                routine_name,
                routine_type
            FROM information_schema.routines
            WHERE routine_schema = 'public'
            AND (routine_name ILIKE '%invoice%' OR routine_name ILIKE '%xero%')
            ORDER BY routine_name;
        """, "INVOICE/XERO RELATED FUNCTIONS")
        
        # 8. Check for payment tables
        run_query(conn, """
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name ILIKE '%payment%'
            ORDER BY table_name;
        """, "PAYMENT RELATED TABLES")
        
        # Close connection
        conn.close()
        print("\nAnalysis complete!")
        
    except Exception as e:
        print(f"Failed to connect to database: {e}")
        print("\nTrying alternative approach with Supabase client...")

if __name__ == "__main__":
    main()