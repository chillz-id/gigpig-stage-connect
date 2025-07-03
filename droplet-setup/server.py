#!/usr/bin/env python3
"""
Stand Up Sydney MCP Server
Consolidated MCP server with all business tools
"""

import os
import json
import asyncio
import httpx
from datetime import datetime
from typing import Dict, List, Any, Optional
from fastmcp import FastMCP, Context
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastMCP server
mcp = FastMCP(
    "Stand Up Sydney MCP Server",
    dependencies=[
        "httpx", 
        "psycopg2-binary", 
        "python-dotenv",
        "playwright",
        "asyncio",
        "aiofiles"
    ]
)

# ========================================
# SUPABASE TOOLS
# ========================================

@mcp.tool()
async def query_supabase(table: str, filters: dict = None, ctx: Context = None) -> list:
    """Query Supabase database table with optional filters"""
    await ctx.info(f"Querying Supabase table: {table}")
    
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_ANON_KEY')
    
    headers = {
        'apikey': supabase_key,
        'Authorization': f'Bearer {supabase_key}',
        'Content-Type': 'application/json'
    }
    
    url = f"{supabase_url}/rest/v1/{table}"
    if filters:
        # Convert filters to Supabase query params
        params = []
        for key, value in filters.items():
            params.append(f"{key}=eq.{value}")
        if params:
            url += "?" + "&".join(params)
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Supabase query failed: {response.status_code} - {response.text}")

@mcp.tool()
async def insert_supabase(table: str, data: dict, ctx: Context = None) -> dict:
    """Insert data into Supabase table"""
    await ctx.info(f"Inserting into Supabase table: {table}")
    
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_ANON_KEY')
    
    headers = {
        'apikey': supabase_key,
        'Authorization': f'Bearer {supabase_key}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }
    
    url = f"{supabase_url}/rest/v1/{table}"
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=data)
        if response.status_code in [200, 201]:
            return response.json()
        else:
            raise Exception(f"Supabase insert failed: {response.status_code} - {response.text}")

@mcp.tool()
async def update_supabase(table: str, filters: dict, data: dict, ctx: Context = None) -> dict:
    """Update data in Supabase table"""
    await ctx.info(f"Updating Supabase table: {table}")
    
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_ANON_KEY')
    
    headers = {
        'apikey': supabase_key,
        'Authorization': f'Bearer {supabase_key}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }
    
    # Build filter query
    params = []
    for key, value in filters.items():
        params.append(f"{key}=eq.{value}")
    
    url = f"{supabase_url}/rest/v1/{table}?" + "&".join(params)
    
    async with httpx.AsyncClient() as client:
        response = await client.patch(url, headers=headers, json=data)
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Supabase update failed: {response.status_code} - {response.text}")

# ========================================
# GITHUB TOOLS
# ========================================

@mcp.tool()
async def github_create_issue(repo: str, title: str, body: str, labels: list = None, ctx: Context = None) -> dict:
    """Create GitHub issue in repository"""
    await ctx.info(f"Creating GitHub issue: {title}")
    
    github_token = os.getenv('GITHUB_TOKEN')
    headers = {
        'Authorization': f'token {github_token}',
        'Accept': 'application/vnd.github.v3+json'
    }
    
    data = {
        'title': title,
        'body': body,
        'labels': labels or []
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://api.github.com/repos/{repo}/issues",
            headers=headers,
            json=data
        )
        if response.status_code == 201:
            return response.json()
        else:
            raise Exception(f"GitHub issue creation failed: {response.status_code}")

@mcp.tool()
async def github_deploy_trigger(repo: str, branch: str = "main", environment: str = "production", ctx: Context = None) -> dict:
    """Trigger GitHub Actions deployment workflow"""
    await ctx.info(f"Triggering deployment for {repo}:{branch}")
    
    github_token = os.getenv('GITHUB_TOKEN')
    headers = {
        'Authorization': f'token {github_token}',
        'Accept': 'application/vnd.github.v3+json'
    }
    
    data = {
        'ref': branch,
        'inputs': {
            'environment': environment
        }
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://api.github.com/repos/{repo}/actions/workflows/deploy.yml/dispatches",
            headers=headers,
            json=data
        )
        return {"status": "triggered", "repo": repo, "branch": branch}
