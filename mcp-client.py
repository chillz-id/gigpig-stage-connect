#!/usr/bin/env python3
"""
Proper MCP client to connect to the local FastMCP server
"""
import sys
import os
sys.path.append('/opt/standup-sydney-mcp')

from fastmcp import FastMCP
import asyncio
import json

async def test_mcp_connection():
    """Test connection to local MCP server"""
    print("🔌 Connecting to local MCP server...")
    
    # Import the server app directly
    from server_http import app
    
    # List available tools
    print("📋 Available tools:")
    for tool_name in dir(app):
        if hasattr(getattr(app, tool_name), '__annotations__'):
            print(f"  - {tool_name}")
    
    # Test supabase_query function directly
    print("\n🔍 Testing Supabase query...")
    try:
        from server_http import supabase_query
        result = supabase_query("profiles", "select")
        print(f"Result: {json.dumps(result, indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_mcp_connection())