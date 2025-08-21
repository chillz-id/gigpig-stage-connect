# Canva MCP Server Documentation

## Overview

The Canva MCP server provides integration with Canva's design API through the Model Context Protocol, enabling AI assistants to create, manage, and manipulate designs programmatically.

**Official Repository**: [github.com/canva-public/canva-mcp-server](https://github.com/canva-public/canva-mcp-server)

## Configuration

In `/root/agents/.mcp.json`:
```json
"canva": {
  "command": "npx",
  "args": [
    "-y",
    "@canva/cli@latest",
    "mcp"
  ]
}
```

## Available Tools

### Design Management
- `create_design`: Create new design from template
- `get_design`: Retrieve design details
- `update_design`: Update design properties
- `delete_design`: Delete design
- `list_designs`: List user designs
- `duplicate_design`: Duplicate existing design

### Template Operations
- `list_templates`: Browse available templates
- `get_template`: Get template details
- `create_from_template`: Create design from template
- `search_templates`: Search templates by criteria

### Asset Management
- `upload_asset`: Upload image or media asset
- `get_asset`: Retrieve asset details
- `list_assets`: List user assets
- `delete_asset`: Delete asset

### Export Operations
- `export_design`: Export design in various formats
- `get_export_job`: Check export job status
- `download_export`: Download exported file

### Collaboration
- `share_design`: Share design with users
- `get_design_permissions`: Check design permissions
- `update_permissions`: Modify sharing permissions

### Brand Management
- `list_brand_templates`: List brand templates
- `get_brand_kit`: Retrieve brand kit details
- `apply_brand_kit`: Apply brand kit to design

## Usage Examples

### Creating Designs
```javascript
// Create design from template
await canva.create_design({
  template_id: "template_123456",
  title: "My New Design",
  width: 1920,
  height: 1080
});

// Create blank design
await canva.create_design({
  title: "Custom Design",
  width: 800,
  height: 600,
  background_color: "#ffffff"
});
```

### Template Operations
```javascript
// Search templates
const templates = await canva.search_templates({
  query: "social media",
  category: "instagram-post",
  limit: 20
});

// Get template details
const template = await canva.get_template({
  template_id: "template_123456"
});

// Create from template
await canva.create_from_template({
  template_id: "template_123456",
  title: "Instagram Post"
});
```

### Asset Management
```javascript
// Upload asset
await canva.upload_asset({
  file: fileBuffer,
  filename: "logo.png",
  asset_type: "image"
});

// List assets
const assets = await canva.list_assets({
  asset_type: "image",
  limit: 50
});
```

### Export Operations
```javascript
// Export design
const exportJob = await canva.export_design({
  design_id: "design_123456",
  format: "png",
  quality: "high"
});

// Check export status
const jobStatus = await canva.get_export_job({
  job_id: exportJob.job_id
});

// Download when ready
if (jobStatus.status === "completed") {
  const file = await canva.download_export({
    job_id: exportJob.job_id
  });
}
```

### Collaboration
```javascript
// Share design
await canva.share_design({
  design_id: "design_123456",
  recipients: ["user@example.com"],
  permission: "edit",
  message: "Please review this design"
});

// Update permissions
await canva.update_permissions({
  design_id: "design_123456",
  user_email: "user@example.com",
  permission: "view"
});
```

## Authentication

The Canva MCP server uses OAuth 2.0 authentication:

### Setting Up OAuth App
1. Go to [Canva Developer Portal](https://www.canva.com/developers)
2. Create new app
3. Configure OAuth settings
4. Get Client ID and Client Secret

### OAuth Scopes
- `design:read` - Read design data
- `design:write` - Create and modify designs
- `asset:read` - Read asset data
- `asset:write` - Upload and manage assets
- `template:read` - Access templates
- `brand:read` - Access brand kit

## Export Formats

### Image Formats
- **PNG**: High quality, transparent backgrounds
- **JPEG**: Compressed, smaller file size
- **SVG**: Vector format, scalable
- **WebP**: Modern web format

### Document Formats
- **PDF**: Print-ready documents
- **PDF_STANDARD**: Standard PDF format

### Video Formats
- **MP4**: Standard video format
- **GIF**: Animated GIF

## Common Use Cases

1. **Social Media Content**: Create posts, stories, ads
2. **Marketing Materials**: Brochures, flyers, banners
3. **Brand Assets**: Logo variations, brand materials
4. **Print Materials**: Business cards, posters
5. **Presentation Graphics**: Slides, infographics
6. **Web Graphics**: Headers, buttons, icons

## Design Dimensions

### Social Media
- **Instagram Post**: 1080x1080px
- **Instagram Story**: 1080x1920px
- **Facebook Post**: 1200x630px
- **Twitter Header**: 1500x500px

### Print
- **Business Card**: 3.5x2 inches
- **Flyer**: 8.5x11 inches
- **Poster**: 18x24 inches

### Web
- **Website Header**: 1920x1080px
- **Banner Ad**: 728x90px
- **Square Ad**: 300x300px

## Error Handling

Common errors and solutions:
- **401 Unauthorized**: Check OAuth tokens
- **403 Forbidden**: Verify API permissions
- **404 Not Found**: Check resource IDs
- **429 Rate Limited**: Implement rate limiting
- **422 Unprocessable Entity**: Validate request data

## Rate Limiting

Canva API rate limits:
- **Standard**: 100 requests per minute
- **Premium**: 1000 requests per minute
- Implement exponential backoff for retries

## Best Practices

1. **Token Management**: Securely store and refresh tokens
2. **Asset Optimization**: Optimize images before upload
3. **Error Handling**: Implement comprehensive error handling
4. **Rate Limiting**: Respect API rate limits
5. **Template Usage**: Use templates for consistent designs
6. **Brand Consistency**: Apply brand kits consistently

## Webhook Support

Canva supports webhooks for:
- Design creation/updates
- Export completion
- Collaboration changes
- Asset uploads

## Related Resources

- [Canva API Documentation](https://www.canva.com/developers/docs)
- [Canva MCP Server Repository](https://github.com/canva-public/canva-mcp-server)
- [Model Context Protocol Spec](https://modelcontextprotocol.io)
- [Canva Developer Portal](https://www.canva.com/developers)