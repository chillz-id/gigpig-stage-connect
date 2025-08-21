# ========================================
# NOTION TOOLS  
# ========================================

@mcp.tool()
async def notion_create_page(database_id: str, properties: dict, content: str = "", ctx: Context = None) -> dict:
    """Create page in Notion database"""
    await ctx.info(f"Creating Notion page in database: {database_id}")
    
    notion_token = os.getenv('NOTION_TOKEN')
    headers = {
        'Authorization': f'Bearer {notion_token}',
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
    }
    
    data = {
        'parent': {'database_id': database_id},
        'properties': properties
    }
    
    if content:
        data['children'] = [
            {
                'object': 'block',
                'type': 'paragraph',
                'paragraph': {
                    'rich_text': [
                        {
                            'type': 'text',
                            'text': {'content': content}
                        }
                    ]
                }
            }
        ]
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.notion.com/v1/pages",
            headers=headers,
            json=data
        )
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Notion page creation failed: {response.status_code} - {response.text}")

@mcp.tool()
async def notion_query_database(database_id: str, filter_conditions: dict = None, ctx: Context = None) -> dict:
    """Query Notion database with optional filters"""
    await ctx.info(f"Querying Notion database: {database_id}")
    
    notion_token = os.getenv('NOTION_TOKEN')
    headers = {
        'Authorization': f'Bearer {notion_token}',
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
    }
    
    data = {}
    if filter_conditions:
        data['filter'] = filter_conditions
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://api.notion.com/v1/databases/{database_id}/query",
            headers=headers,
            json=data
        )
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Notion database query failed: {response.status_code} - {response.text}")

@mcp.tool()
async def notion_update_page(page_id: str, properties: dict, ctx: Context = None) -> dict:
    """Update Notion page properties"""
    await ctx.info(f"Updating Notion page: {page_id}")
    
    notion_token = os.getenv('NOTION_TOKEN')
    headers = {
        'Authorization': f'Bearer {notion_token}',
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
    }
    
    data = {'properties': properties}
    
    async with httpx.AsyncClient() as client:
        response = await client.patch(
            f"https://api.notion.com/v1/pages/{page_id}",
            headers=headers,
            json=data
        )
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Notion page update failed: {response.status_code} - {response.text}")

# ========================================
# METRICOOL TOOLS
# ========================================

@mcp.tool()
async def metricool_get_brands(ctx: Context = None) -> dict:
    """Get list of brands from Metricool account"""
    await ctx.info("Getting Metricool brands")
    
    metricool_api_key = os.getenv('METRICOOL_API_KEY')
    headers = {
        'X-API-KEY': metricool_api_key,
        'Content-Type': 'application/json'
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.metricool.com/v1/brands",
            headers=headers
        )
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Metricool brands request failed: {response.status_code}")

@mcp.tool()
async def metricool_schedule_post(brand_id: str, text: str, social_networks: list, scheduled_time: str, ctx: Context = None) -> dict:
    """Schedule a post through Metricool"""
    await ctx.info(f"Scheduling Metricool post for brand: {brand_id}")
    
    metricool_api_key = os.getenv('METRICOOL_API_KEY')
    headers = {
        'X-API-KEY': metricool_api_key,
        'Content-Type': 'application/json'
    }
    
    data = {
        'text': text,
        'social_networks': social_networks,
        'scheduled_time': scheduled_time,
        'brand_id': brand_id
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.metricool.com/v1/posts",
            headers=headers,
            json=data
        )
        if response.status_code == 201:
            return response.json()
        else:
            raise Exception(f"Metricool post scheduling failed: {response.status_code}")

# ========================================
# STAND UP SYDNEY BUSINESS TOOLS
# ========================================

@mcp.tool()
async def standup_create_event(event_data: dict, ctx: Context = None) -> dict:
    """Create a new Stand Up Sydney comedy event"""
    await ctx.info(f"Creating Stand Up Sydney event: {event_data.get('title', 'Untitled')}")
    
    # Insert into Supabase events table
    event_record = await insert_supabase('events', event_data, ctx)
    
    # Create corresponding Notion page
    notion_events_db = os.getenv('NOTION_EVENTS_DATABASE_ID')
    notion_properties = {
        'Title': {
            'title': [
                {
                    'text': {'content': event_data.get('title', 'New Event')}
                }
            ]
        },
        'Date': {
            'date': {'start': event_data.get('event_date')}
        },
        'Venue': {
            'rich_text': [
                {
                    'text': {'content': event_data.get('venue', '')}
                }
            ]
        },
        'Status': {
            'select': {'name': event_data.get('status', 'Planning')}
        }
    }
    
    notion_page = await notion_create_page(notion_events_db, notion_properties, "", ctx)
    
    return {
        'supabase_record': event_record,
        'notion_page': notion_page,
        'status': 'created'
    }

@mcp.tool()
async def standup_book_comedian(comedian_id: str, event_id: str, fee: float, ctx: Context = None) -> dict:
    """Book a comedian for a Stand Up Sydney event"""
    await ctx.info(f"Booking comedian {comedian_id} for event {event_id}")
    
    booking_data = {
        'comedian_id': comedian_id,
        'event_id': event_id,
        'fee': fee,
        'status': 'confirmed',
        'booking_date': datetime.now().isoformat()
    }
    
    # Insert booking record
    booking_record = await insert_supabase('bookings', booking_data, ctx)
    
    # Update event lineup in Supabase
    event_update = {'lineup_updated': datetime.now().isoformat()}
    await update_supabase('events', {'id': event_id}, event_update, ctx)
    
    return {
        'booking_record': booking_record,
        'status': 'booked'
    }

@mcp.tool()
async def standup_generate_lineup(event_id: str, ctx: Context = None) -> dict:
    """Generate event lineup and promotional content"""
    await ctx.info(f"Generating lineup for event: {event_id}")
    
    # Get event details
    event_data = await query_supabase('events', {'id': event_id}, ctx)
    if not event_data:
        raise Exception(f"Event {event_id} not found")
    
    # Get booked comedians
    bookings = await query_supabase('bookings', {'event_id': event_id}, ctx)
    
    lineup_text = f"🎭 {event_data[0]['title']} LINEUP 🎭\n\n"
    for booking in bookings:
        comedian = await query_supabase('comedians', {'id': booking['comedian_id']}, ctx)
        if comedian:
            lineup_text += f"• {comedian[0]['name']}\n"
    
    lineup_text += f"\n📅 {event_data[0]['event_date']}\n📍 {event_data[0]['venue']}"
    
    return {
        'lineup_text': lineup_text,
        'event_details': event_data[0],
        'booked_comedians': len(bookings)
    }

@mcp.tool()
async def standup_sync_n8n_webhook(workflow_name: str, data: dict, ctx: Context = None) -> dict:
    """Trigger N8N automation workflow"""
    await ctx.info(f"Triggering N8N workflow: {workflow_name}")
    
    n8n_webhook_url = os.getenv('N8N_WEBHOOK_URL')
    webhook_url = f"{n8n_webhook_url}/{workflow_name}"
    
    async with httpx.AsyncClient() as client:
        response = await client.post(webhook_url, json=data)
        if response.status_code == 200:
            return response.json()
        else:
            return {"status": "triggered", "workflow": workflow_name}

# ========================================
# HEALTH CHECK & SERVER UTILITIES
# ========================================

@mcp.tool()
async def mcp_health_check(ctx: Context = None) -> dict:
    """Check MCP server health and tool availability"""
    await ctx.info("Performing MCP health check")
    
    # Check environment variables
    required_env = [
        'SUPABASE_URL', 'SUPABASE_ANON_KEY',
        'GITHUB_TOKEN', 'NOTION_TOKEN',
        'METRICOOL_API_KEY'
    ]
    
    missing_env = []
    for env_var in required_env:
        if not os.getenv(env_var):
            missing_env.append(env_var)
    
    # Test basic connectivity
    connectivity_tests = {}
    
    # Test Supabase
    try:
        supabase_url = os.getenv('SUPABASE_URL')
        if supabase_url:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{supabase_url}/rest/v1/")
                connectivity_tests['supabase'] = response.status_code < 500
        else:
            connectivity_tests['supabase'] = False
    except:
        connectivity_tests['supabase'] = False
    
    health_status = {
        "server": "Stand Up Sydney MCP Server",
        "status": "healthy" if not missing_env else "missing_config",
        "timestamp": datetime.now().isoformat(),
        "tools_registered": len(mcp.tools),
        "missing_environment": missing_env,
        "connectivity": connectivity_tests,
        "environment": os.getenv('STANDUP_ENV', 'development')
    }
    
    return health_status

# ========================================
# SERVER STARTUP
# ========================================

if __name__ == "__main__":
    print("🎭 Starting Stand Up Sydney MCP Server...")
    print(f"📊 Registered {len(mcp.tools)} MCP tools:")
    for tool_name in mcp.tools.keys():
        print(f"  • {tool_name}")
    
    # Run the FastMCP server
    mcp.run(
        transport="sse",
        host="0.0.0.0", 
        port=8000
    )
