# Postiz Self-Hosted Setup - Quick Reference

**Stand Up Sydney Social Media Scheduler**
Self-hosted deployment on social.standupsydney.com

---

## Overview

Stand Up Sydney uses **self-hosted Postiz** for social media scheduling:
- **Cost**: $0/month (vs $29-99/month for hosted)
- **API Limits**: Unlimited (vs 30 requests/hour for hosted)
- **Domain**: https://social.standupsydney.com
- **Server**: 170.64.252.55 (same server as main app)

---

## Files & Documentation

All deployment files located in `/root/postiz/`:

| File | Purpose |
|------|---------|
| **DEPLOYMENT.md** | Complete step-by-step deployment guide |
| **OAUTH_SETUP.md** | OAuth setup for 14+ social platforms |
| `docker-compose.yml` | Docker orchestration (PostgreSQL, Redis, Postiz) |
| `postiz.env` | Environment variables & OAuth credentials |
| `nginx-config.conf` | Nginx reverse proxy with SSL |
| `setup-ssl.sh` | Automated SSL certificate setup script |

---

## Quick Start

### 1. Deploy Postiz

```bash
# Navigate to Postiz directory
cd /root/postiz

# Set up SSL certificate
sudo ./setup-ssl.sh

# Start Docker containers
docker compose up -d

# Verify deployment
docker compose ps
curl https://social.standupsydney.com/health
```

### 2. Create Admin Account

1. Visit: https://social.standupsydney.com
2. Click **Sign Up**
3. Register first user (becomes admin automatically)
4. Disable registration: `DISABLE_REGISTRATION=true` in `postiz.env`

### 3. Get API Key

1. Log into Postiz
2. Go to **Settings** → **Public API**
3. Click **Create API Key**
4. Copy key (shown only once!)

### 4. Configure Stand Up Sydney

```bash
# Edit environment file
cd /root/agents
nano .env

# Add these lines:
VITE_POSTIZ_API_KEY=postiz_live_your_api_key_here
VITE_POSTIZ_INSTANCE_URL=https://social.standupsydney.com

# Rebuild application
npm run build
pm2 restart stand-up-sydney
```

### 5. Connect Social Accounts

1. In Postiz, click **Add Channel**
2. Select platform (Instagram, Facebook, etc.)
3. Complete OAuth flow
4. Verify channel appears in Stand Up Sydney

---

## OAuth Configuration

OAuth credentials required for each platform you want to use.

### Priority Platforms

1. **Instagram** - Visual comedy content
2. **Facebook** - Event promotion
3. **X/Twitter** - Quick updates
4. **LinkedIn** - Professional networking

### Setup Process

For each platform:

1. Create OAuth app in developer portal
2. Configure redirect URI: `https://social.standupsydney.com/integrations/social/{platform}`
3. Get Client ID and Secret
4. Add to `/root/postiz/postiz.env`:
   ```bash
   {PLATFORM}_CLIENT_ID=your_client_id
   {PLATFORM}_CLIENT_SECRET=your_client_secret
   ```
5. Restart: `docker compose restart postiz-app`

**Detailed instructions**: See `/root/postiz/OAUTH_SETUP.md`

---

## Architecture

```
┌─────────────────────────────────────────┐
│  Stand Up Sydney App (port 8080)        │
│  /root/agents/                          │
│  - Uses Postiz REST API                 │
│  - Displays social channels              │
│  - Creates/schedules posts               │
└──────────────┬──────────────────────────┘
               │ HTTPS API calls
               ▼
┌─────────────────────────────────────────┐
│  Nginx Reverse Proxy                    │
│  social.standupsydney.com:443           │
│  - SSL termination (Let's Encrypt)      │
│  - Proxy to Postiz on port 5000         │
│  - WebSocket support                     │
└──────────────┬──────────────────────────┘
               │ HTTP proxy
               ▼
┌─────────────────────────────────────────┐
│  Postiz Docker Containers               │
│  /root/postiz/ (127.0.0.1:5000)         │
│                                          │
│  ┌────────────────────────────────┐    │
│  │ postiz-app (main application)   │    │
│  └───┬──────────────────────┬─────┘    │
│      │                      │           │
│  ┌───▼──────────┐  ┌───────▼────┐     │
│  │ PostgreSQL   │  │   Redis     │     │
│  │ (database)   │  │   (queue)   │     │
│  └──────────────┘  └─────────────┘     │
└─────────────────────────────────────────┘
               │ OAuth flows
               ▼
┌─────────────────────────────────────────┐
│  Social Media Platforms                 │
│  Instagram, Facebook, Twitter, etc.     │
└─────────────────────────────────────────┘
```

---

## Maintenance

### Daily Operations

```bash
# Check container status
docker compose ps

# View logs
docker compose logs -f postiz-app --tail=100

# Restart if needed
docker compose restart postiz-app
```

### Weekly Maintenance

```bash
# Backup database
mkdir -p /root/postiz/backups
docker exec postiz-postgres pg_dump -U postiz postiz-db > \
  /root/postiz/backups/postiz-db-$(date +%Y%m%d).sql

# Check disk space
df -h /root/postiz/
```

### Monthly Updates

```bash
cd /root/postiz

# Pull latest Postiz image
docker compose pull

# Recreate containers
docker compose up -d --force-recreate

# Verify
docker compose ps
```

---

## Troubleshooting

### Cannot Access https://social.standupsydney.com

```bash
# Check DNS
dig social.standupsydney.com

# Check nginx
systemctl status nginx
nginx -t

# Check containers
docker compose ps

# Check SSL certificate
certbot certificates -d social.standupsydney.com
```

### Stand Up Sydney Cannot Connect

```bash
# Verify API key works
curl -X GET \
  https://social.standupsydney.com/api/public/v1/channels \
  -H "Authorization: Bearer your_api_key_here"

# Check environment
cd /root/agents
grep POSTIZ .env

# Rebuild app
npm run build
pm2 restart stand-up-sydney
```

### OAuth Connection Fails

1. Verify redirect URI matches exactly:
   ```
   https://social.standupsydney.com/integrations/social/{platform}
   ```

2. Check credentials in `postiz.env`

3. Restart after changes:
   ```bash
   docker compose restart postiz-app
   ```

---

## Key Benefits

### Self-Hosted vs Hosted Comparison

| Feature | Self-Hosted | Hosted (Postiz.com) |
|---------|-------------|---------------------|
| **Monthly Cost** | $0 | $29-99 |
| **API Rate Limits** | Unlimited | 30 requests/hour |
| **Data Ownership** | Full control | Hosted by Postiz |
| **Customization** | Full access | Limited |
| **Infrastructure** | Manage yourself | Fully managed |
| **Updates** | Manual (docker pull) | Automatic |
| **Support** | Community | Email support |

### Why Self-Hosted for Stand Up Sydney

1. **Cost Savings**: $0/month vs $348-1,188/year
2. **No API Limits**: Unlimited post scheduling and sync
3. **Data Privacy**: All social media data stays on your server
4. **Integration Control**: Direct database access if needed
5. **Existing Infrastructure**: Already have VPS server with Docker

---

## Integration with Stand Up Sydney

### Environment Variables

**Location**: `/root/agents/.env`

```bash
# Self-hosted Postiz configuration
VITE_POSTIZ_API_KEY=postiz_live_your_api_key_here
VITE_POSTIZ_INSTANCE_URL=https://social.standupsydney.com
```

### API Usage in App

**Files**:
- `src/services/postiz-api.ts` - REST API client (lines 1-300)
- `src/hooks/usePostizChannels.ts` - Channel management hook
- `src/hooks/usePostizPosts.ts` - Post creation/scheduling hook
- `src/pages/MediaLibrary.tsx` - Social scheduler UI

### Features Enabled

1. **Channel Sync**: Import connected social accounts
2. **Post Scheduling**: Create and schedule posts to multiple platforms
3. **Media Integration**: Attach images/videos from media library
4. **Multi-Platform**: Post to Instagram, Facebook, Twitter, LinkedIn simultaneously
5. **Queue Management**: View scheduled posts, edit, delete

---

## Resources

**Documentation**:
- Complete Deployment Guide: `/root/postiz/DEPLOYMENT.md`
- OAuth Setup Guide: `/root/postiz/OAUTH_SETUP.md`
- Integration Comparison: `/root/agents/docs/postiz-integration-comparison.md`
- Phase 2 Summary: `/root/agents/docs/social-media-phase2-summary.md`

**Postiz Resources**:
- Official Docs: https://docs.postiz.com
- GitHub: https://github.com/gitroomhq/postiz-app
- Community: https://discord.gg/postiz

**Stand Up Sydney Docs**:
- Environment Setup: `/root/agents/.env.example`
- Social Media Services: `/root/agents/src/services/postiz-api.ts`

---

## Deployment Checklist

- [ ] DNS configured for social.standupsydney.com
- [ ] SSL certificate obtained (setup-ssl.sh)
- [ ] Docker containers running (docker compose ps)
- [ ] Admin account created
- [ ] Registration disabled (DISABLE_REGISTRATION=true)
- [ ] API key generated and stored securely
- [ ] Stand Up Sydney environment updated
- [ ] Application rebuilt (npm run build)
- [ ] At least one social account connected
- [ ] Test post created and scheduled
- [ ] Integration verified in Stand Up Sydney app

---

**Last Updated**: 2025-01-20
**Status**: Deployment files ready, awaiting DNS setup and OAuth configuration
**Next Steps**: Follow DEPLOYMENT.md to deploy and configure OAuth credentials
