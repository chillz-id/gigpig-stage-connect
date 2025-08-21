#!/usr/bin/env python3
"""
Setup Ticket Sales Integration
Creates a Notion database and configures N8N workflow
"""

import json
import requests
import sys
from datetime import datetime

# Configuration
NOTION_API_KEY = "ntn_YOUR_NOTION_API_KEY_HERE_CONTACT_OWNER"
N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1M2UzN2FhMC03MTc4LTRmMmYtODBhYS00ODNiYmE1ODc0YWYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUxNTcwMDc2fQ._zbYlvtzSMRFHnQu6O_L2LhJU4Ib1655bynbmoXeqMo"
N8N_API_URL = "http://localhost:5678/api/v1"
WORKFLOW_ID = "GIKrozPgzkjMBbhn"
HUMANITIX_API_KEY = "9f23a99810087538c62feb645c45d195ab966d38533cd6456a4c7092f6ae679fd4515936e5b9869c261dc83721626a46c7328dd22bf6acd567646897ecf4c8c7b4f8b24a1b0dbab2fd952a8c25dd7a3b3f5542f0121c63e6616322eb128741bfbd9322b94c5a46acbe3cc9add71ec2"

def create_notion_database():
    """Create the Ticket Sales Tracker database in Notion"""
    
    headers = {
        "Authorization": f"Bearer {NOTION_API_KEY}",
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
    }
    
    # Database schema
    database_data = {
        "parent": {
            "type": "page_id",
            "page_id": "1b34745b-8cbe-815e-948d-f0159297da66"
        },
        "title": [
            {
                "type": "text",
                "text": {
                    "content": "Ticket Sales Tracker"
                }
            }
        ],
        "properties": {
            "Event Name": {
                "title": {}
            },
            "Event Date": {
                "date": {}
            },
            "Platform": {
                "select": {
                    "options": [
                        {"name": "Humanitix", "color": "blue"},
                        {"name": "Eventbrite", "color": "green"},
                        {"name": "Other", "color": "gray"}
                    ]
                }
            },
            "Order ID": {
                "rich_text": {}
            },
            "Customer Name": {
                "rich_text": {}
            },
            "Customer Email": {
                "email": {}
            },
            "Customer Phone": {
                "phone_number": {}
            },
            "Ticket Types": {
                "rich_text": {}
            },
            "Quantity": {
                "number": {
                    "format": "number"
                }
            },
            "Amount": {
                "number": {
                    "format": "dollar"
                }
            },
            "Currency": {
                "select": {
                    "options": [
                        {"name": "AUD", "color": "blue"},
                        {"name": "USD", "color": "green"},
                        {"name": "EUR", "color": "yellow"},
                        {"name": "GBP", "color": "purple"}
                    ]
                }
            },
            "Status": {
                "select": {
                    "options": [
                        {"name": "Paid", "color": "green"},
                        {"name": "Pending", "color": "yellow"},
                        {"name": "Cancelled", "color": "red"},
                        {"name": "Refunded", "color": "gray"}
                    ]
                }
            },
            "Purchase Date": {
                "date": {}
            },
            "Venue": {
                "rich_text": {}
            },
            "Last Sync": {
                "date": {}
            },
            "Raw Data": {
                "rich_text": {}
            }
        }
    }
    
    print("Creating Notion database...")
    response = requests.post(
        "https://api.notion.com/v1/databases",
        headers=headers,
        json=database_data
    )
    
    if response.status_code == 200:
        database = response.json()
        database_id = database["id"]
        print(f"✅ Database created successfully!")
        print(f"   Database ID: {database_id}")
        print(f"   URL: {database.get('url', 'N/A')}")
        return database_id
    else:
        print(f"❌ Error creating database: {response.status_code}")
        print(response.text)
        return None

def update_n8n_workflow(database_id):
    """Update the N8N workflow with environment variables"""
    
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-N8N-API-KEY": N8N_API_KEY
    }
    
    print("\nSetting workflow variables...")
    
    # N8N stores workflow variables in staticData
    variables_data = {
        "NOTION_DATABASE_ID": database_id,
        "HUMANITIX_API_KEY": HUMANITIX_API_KEY,
        "SLACK_CHANNEL_ID": ""  # Optional - leave empty for now
    }
    
    # First, get the current workflow
    response = requests.get(f"{N8N_API_URL}/workflows/{WORKFLOW_ID}", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Error fetching workflow: {response.status_code}")
        print(response.text)
        return False
    
    workflow = response.json()
    
    # Update staticData with variables
    if "staticData" not in workflow or workflow["staticData"] is None:
        workflow["staticData"] = {}
    
    workflow["staticData"]["vars"] = variables_data
    
    # Also update settings for better execution handling
    if "settings" not in workflow:
        workflow["settings"] = {}
    
    workflow["settings"]["saveDataErrorExecution"] = "all"
    workflow["settings"]["saveDataSuccessExecution"] = "all"
    workflow["settings"]["saveExecutionProgress"] = True
    workflow["settings"]["executionTimeout"] = 300  # 5 minutes timeout
    
    # Update only the fields that can be updated via API
    update_data = {
        "name": workflow["name"],
        "nodes": workflow["nodes"],
        "connections": workflow["connections"],
        "settings": workflow["settings"],
        "staticData": workflow["staticData"]
    }
    
    print("Updating workflow with environment variables...")
    response = requests.put(
        f"{N8N_API_URL}/workflows/{WORKFLOW_ID}",
        headers=headers,
        json=update_data
    )
    
    if response.status_code == 200:
        print("✅ Workflow updated successfully!")
        # Verify the variables were set
        updated = response.json()
        if "staticData" in updated and "vars" in updated.get("staticData", {}):
            print("   Variables set:")
            for key, value in updated["staticData"]["vars"].items():
                if key == "HUMANITIX_API_KEY":
                    print(f"   - {key}: {'*' * 20} (hidden)")
                else:
                    print(f"   - {key}: {value}")
        return True
    else:
        print(f"❌ Error updating workflow: {response.status_code}")
        print(response.text)
        return False

def activate_workflow():
    """Activate the N8N workflow"""
    
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-N8N-API-KEY": N8N_API_KEY
    }
    
    print("\nActivating workflow...")
    response = requests.patch(
        f"{N8N_API_URL}/workflows/{WORKFLOW_ID}",
        headers=headers,
        json={"active": True}
    )
    
    if response.status_code == 200:
        print("✅ Workflow activated successfully!")
        return True
    else:
        print(f"❌ Error activating workflow: {response.status_code}")
        print(response.text)
        return False

def main():
    print("🚀 Setting up Ticket Sales Integration")
    print("=" * 50)
    
    # Step 1: Create Notion database
    database_id = create_notion_database()
    if not database_id:
        print("Failed to create Notion database. Exiting.")
        sys.exit(1)
    
    # Step 2: Update N8N workflow
    if not update_n8n_workflow(database_id):
        print("Failed to update N8N workflow. Database was created but workflow not configured.")
        sys.exit(1)
    
    # Step 3: Activate workflow
    if not activate_workflow():
        print("Failed to activate workflow. Workflow was updated but not activated.")
        sys.exit(1)
    
    print("\n✅ Integration setup complete!")
    print(f"\n📋 Summary:")
    print(f"   - Notion Database ID: {database_id}")
    print(f"   - N8N Workflow ID: {WORKFLOW_ID}")
    print(f"   - Workflow Status: Active")
    print(f"\n🔗 Next steps:")
    print(f"   1. Test the webhook with a sample Humanitix order")
    print(f"   2. Configure Slack channel ID if you want notifications")
    print(f"   3. Monitor the N8N workflow executions")

if __name__ == "__main__":
    main()