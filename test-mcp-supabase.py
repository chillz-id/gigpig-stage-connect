#!/usr/bin/env python3
"""
Test script to use the Supabase MCP tool for running SQL queries
"""
import json
import requests
import sys

def call_mcp_tool(tool_name, params):
    """Call an MCP tool on the FastMCP server"""
    url = "http://localhost:8080/mcp/"
    
    # Create proper MCP request format
    request_data = {
        "jsonrpc": "2.0",
        "id": "test-request",
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": params
        }
    }
    
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream"
    }
    
    try:
        response = requests.post(url, json=request_data, headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        return response.json() if response.content else None
    except Exception as e:
        print(f"Error: {e}")
        return None

def test_supabase_query():
    """Test the Supabase query tool"""
    print("🔍 Testing Supabase MCP Tool")
    print("=" * 40)
    
    # Test 1: Select from profiles
    print("\n1. Testing SELECT from profiles table:")
    result = call_mcp_tool("supabase_query", {
        "table": "profiles",
        "operation": "select"
    })
    
    if result:
        print(f"Result: {json.dumps(result, indent=2)}")
    
    # Test 2: Check if we can run raw SQL
    print("\n2. Testing raw SQL execution:")
    result = call_mcp_tool("supabase_query", {
        "table": "auth.users",
        "operation": "select"
    })
    
    if result:
        print(f"Result: {json.dumps(result, indent=2)}")

def list_available_tools():
    """List all available MCP tools"""
    print("🛠️  Available MCP Tools")
    print("=" * 40)
    
    request_data = {
        "jsonrpc": "2.0",
        "id": "list-tools",
        "method": "tools/list"
    }
    
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream"
    }
    
    try:
        response = requests.post("http://localhost:8080/mcp/", json=request_data, headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("🚀 MCP Server Tool Test")
    print("=" * 50)
    
    # First, try to list available tools
    list_available_tools()
    
    # Then test Supabase
    test_supabase_query()