#!/usr/bin/env python3
"""Update N8N workflow with variables and activate it"""

import requests
import json

# Configuration
N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1M2UzN2FhMC03MTc4LTRmMmYtODBhYS00ODNiYmE1ODc0YWYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUxNTcwMDc2fQ._zbYlvtzSMRFHnQu6O_L2LhJU4Ib1655bynbmoXeqMo'
N8N_API_URL = 'http://localhost:5678/api/v1'
WORKFLOW_ID = 'GIKrozPgzkjMBbhn'
HUMANITIX_API_KEY = '9f23a99810087538c62feb645c45d195ab966d38533cd6456a4c7092f6ae679fd4515936e5b9869c261dc83721626a46c7328dd22bf6acd567646897ecf4c8c7b4f8b24a1b0dbab2fd952a8c25dd7a3b3f5542f0121c63e6616322eb128741bfbd9322b94c5a46acbe3cc9add71ec2'
database_id = '2304745b-8cbe-81cd-9483-d7acc2377bd6'

headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-N8N-API-KEY': N8N_API_KEY
}

print('Setting workflow variables...')

# First, get the current workflow
response = requests.get(f'{N8N_API_URL}/workflows/{WORKFLOW_ID}', headers=headers)

if response.status_code != 200:
    print(f'❌ Error fetching workflow: {response.status_code}')
    print(response.text)
    exit(1)

workflow = response.json()

# Update staticData with variables
if 'staticData' not in workflow or workflow['staticData'] is None:
    workflow['staticData'] = {}

workflow['staticData']['vars'] = {
    'NOTION_DATABASE_ID': database_id,
    'HUMANITIX_API_KEY': HUMANITIX_API_KEY,
    'SLACK_CHANNEL_ID': ''  # Optional - leave empty for now
}

# Also update settings for better execution handling
if 'settings' not in workflow:
    workflow['settings'] = {}

workflow['settings']['saveDataErrorExecution'] = 'all'
workflow['settings']['saveDataSuccessExecution'] = 'all'
workflow['settings']['saveExecutionProgress'] = True
workflow['settings']['executionTimeout'] = 300  # 5 minutes timeout

# Update only the fields that can be updated via API
update_data = {
    'name': workflow['name'],
    'nodes': workflow['nodes'],
    'connections': workflow['connections'],
    'settings': workflow['settings'],
    'staticData': workflow['staticData']
}

print('Updating workflow with environment variables...')
response = requests.put(
    f'{N8N_API_URL}/workflows/{WORKFLOW_ID}',
    headers=headers,
    json=update_data
)

if response.status_code == 200:
    print('✅ Workflow updated successfully!')
    # Verify the variables were set
    updated = response.json()
    if 'staticData' in updated and 'vars' in updated.get('staticData', {}):
        print('   Variables set:')
        for key, value in updated['staticData']['vars'].items():
            if key == 'HUMANITIX_API_KEY':
                print(f'   - {key}: {"*" * 20} (hidden)')
            else:
                print(f'   - {key}: {value}')
                
    # Now activate the workflow
    print('\nActivating workflow...')
    response = requests.patch(
        f'{N8N_API_URL}/workflows/{WORKFLOW_ID}',
        headers=headers,
        json={'active': True}
    )
    
    if response.status_code == 200:
        print('✅ Workflow activated successfully!')
        print('\n✅ Integration setup complete!')
        print(f'\n📋 Summary:')
        print(f'   - Notion Database ID: {database_id}')
        print(f'   - N8N Workflow ID: {WORKFLOW_ID}')
        print(f'   - Workflow Status: Active')
        print(f'\n🔗 Next steps:')
        print(f'   1. Test the webhook with a sample Humanitix order')
        print(f'   2. Configure Slack channel ID if you want notifications')
        print(f'   3. Monitor the N8N workflow executions at http://localhost:5678')
    else:
        print(f'❌ Error activating workflow: {response.status_code}')
        print(response.text)
else:
    print(f'❌ Error updating workflow: {response.status_code}')
    print(response.text)