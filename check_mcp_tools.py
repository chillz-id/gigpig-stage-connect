#!/opt/standup-sydney-mcp/venv/bin/python3
"""Check available MCP tools"""

import asyncio
import sys
import os

# Add MCP server path
sys.path.insert(0, '/opt/standup-sydney-mcp')

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def check_tools():
    server_params = StdioServerParameters(
        command='/opt/standup-sydney-mcp/venv/bin/python3',
        args=['/opt/standup-sydney-mcp/server.py'],
        env=os.environ.copy()
    )
    
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            
            # List available tools
            print("=== AVAILABLE TOOLS ===")
            tools = await session.list_tools()
            for tool in tools.tools:
                print(f"\nTool: {tool.name}")
                print(f"Description: {tool.description}")
                if hasattr(tool, 'inputSchema') and tool.inputSchema:
                    print(f"Input Schema: {tool.inputSchema}")

if __name__ == "__main__":
    asyncio.run(check_tools())