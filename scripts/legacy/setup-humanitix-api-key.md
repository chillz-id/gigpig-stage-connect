# Setting up Humanitix API Key in N8N

## API Key Configuration

Based on the Humanitix OpenAPI specification (`/root/HUMANITIXopenapi.yaml`), Humanitix uses **header-based authentication** with the `x-api-key` header.

## How to Add the API Key in N8N

### Option 1: Environment Variables (Recommended - Most Secure)

1. **Access N8N Settings**:
   - Go to your N8N interface at `http://localhost:5678`
   - Click on your profile/settings (usually top-right corner)
   - Go to "Settings" → "Environment Variables"

2. **Add the Environment Variable**:
   ```
   Variable Name: HUMANITIX_API_KEY
   Variable Value: [Your Humanitix API Key]
   ```

3. **Save and Restart N8N** (if required)

The workflows are already configured to use `{{ $env.HUMANITIX_API_KEY }}` automatically.

### Option 2: N8N Credentials (Alternative Method)

1. **Create New Credential**:
   - Go to "Credentials" in N8N
   - Click "Create New Credential"
   - Search for "Header Auth" or "HTTP Header Auth"

2. **Configure Header Auth**:
   ```
   Credential Name: Humanitix API Key
   Header Name: x-api-key
   Header Value: [Your Humanitix API Key]
   ```

3. **Update Workflows** (if using this method):
   - Edit both Humanitix workflows
   - For "Fetch Humanitix Events" and "Fetch Event Orders" nodes
   - Set Credential Type to "Header Auth"
   - Select your created credential

## Current Workflow Configuration

Your workflows are currently set up to use the environment variable method:

**Real-time Sync Workflow (7w1BMGSjVVUtadjf)**:
- ✅ Active and running every 15 minutes
- Uses `{{ $env.HUMANITIX_API_KEY }}` for authentication
- Syncs to Brevo using `{{ $env.BREVO_API_KEY }}`

**Historical Import Workflow (py2wq9zchBz0TD9j)**:
- ✅ Ready for manual execution
- Will use environment variables when configured

## Verification Steps

Once you've added the API key:

1. **Test the Real-time Sync**:
   - Check N8N "Executions" page
   - Look for successful runs every 15 minutes
   - Verify no authentication errors (401 Unauthorized)

2. **Test the Historical Import**:
   - Manually execute workflow `py2wq9zchBz0TD9j`
   - Monitor execution progress
   - Check for successful API calls to Humanitix

## API Key Format

According to the OpenAPI spec:
- **Header Name**: `x-api-key`
- **Location**: HTTP Header
- **Type**: API Key string

Example API call:
```bash
curl -H "x-api-key: YOUR_API_KEY" https://api.humanitix.com/v1/events
```

## Current Status

- ✅ **Brevo API Key**: Already configured
- ⏳ **Humanitix API Key**: Needs to be added using steps above
- ✅ **Workflows**: Fixed and ready to use environment variables
- ✅ **Real-time Sync**: Active and waiting for API key
- ✅ **Historical Import**: Ready for manual execution

Once you add the `HUMANITIX_API_KEY` environment variable, both workflows will be fully operational!