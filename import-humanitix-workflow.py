#!/usr/bin/env python3
"""
Import and activate Humanitix to Notion sync workflow in N8N
"""

import json
import os
import requests
from datetime import datetime

def import_workflow():
    """Import the Humanitix workflow to N8N"""
    
    # N8N API configuration
    n8n_url = "http://localhost:5678"
    
    # Read the workflow JSON
    with open('/root/agents/humanitix-notion-sync-active.json', 'r') as f:
        workflow = json.load(f)
    
    # Make the workflow active
    workflow['active'] = True
    
    print("🚀 Importing Humanitix to Notion sync workflow...")
    
    try:
        # Try to import via file copy (direct method)
        import subprocess
        
        # Save workflow with unique ID
        workflow_id = f"humanitix-notion-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        workflow_file = f"/tmp/{workflow_id}.json"
        
        with open(workflow_file, 'w') as f:
            json.dump(workflow, f, indent=2)
        
        # Copy to N8N workflows directory
        result = subprocess.run([
            'docker', 'cp', workflow_file, 
            'n8n:/home/node/.n8n/workflows/'
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Workflow file copied to N8N container")
            
            # Restart N8N to load the new workflow
            print("🔄 Restarting N8N to load workflow...")
            subprocess.run(['docker', 'restart', 'n8n'], capture_output=True)
            print("✅ N8N restarted successfully")
            
            return True
        else:
            print(f"❌ Failed to copy workflow: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error importing workflow: {str(e)}")
        return False

def test_humanitix_api():
    """Test if Humanitix API is working"""
    print("\n📊 Testing Humanitix API...")
    
    api_key = "9f23a99810087538c62feb645c45d195ab966d38533cd6456a4c7092f6ae679fd4515936e5b9869c261dc83721626a46c7328dd22bf6acd567646897ecf4c8c7b4f8b24a1b0dbab2fd952a8c25dd7a3b3f5542f0121c63e6616322eb128741bfbd9322b94c5a46acbe3cc9add71ec2"
    
    headers = {
        'X-API-Key': api_key,
        'Content-Type': 'application/json'
    }
    
    try:
        # Get events
        response = requests.get(
            'https://api.humanitix.com/v1/events?page=1',
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            events = data.get('events', [])
            print(f"✅ Found {len(events)} events in Humanitix")
            
            # Show first few events
            for i, event in enumerate(events[:3]):
                print(f"   - {event.get('name', 'Unknown')}")
                
            return True
        else:
            print(f"❌ API returned status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing API: {str(e)}")
        return False

def main():
    print("=" * 50)
    print("Humanitix to Notion N8N Workflow Setup")
    print("=" * 50)
    
    # Test Humanitix API
    if not test_humanitix_api():
        print("\n⚠️  Warning: Humanitix API test failed")
    
    # Import workflow
    if import_workflow():
        print("\n✅ Workflow import completed!")
        print("\n📋 Next steps:")
        print("1. Open N8N at http://170.64.252.55:5678")
        print("2. Find 'Humanitix to Notion Sync - Active' workflow")
        print("3. Open it and click 'Activate' to enable scheduled runs")
        print("4. Click 'Execute Workflow' to run it manually once")
        print("\n💡 The workflow will then run automatically every 15 minutes")
    else:
        print("\n❌ Workflow import failed")
        print("Please import manually via N8N interface")

if __name__ == "__main__":
    main()