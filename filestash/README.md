# Filestash Integration (Supabase Storage S3)

Self-hosted Filestash file manager connected to Supabase Storage via S3-compatible API. Users get scoped access to their profile/organization folders through JWT tokens.

## Architecture

```
Browser (iframe)
    ↓
Caddy Reverse Proxy (:8080)
    ├── /filestash/* → Filestash (:8334)
    └── /s3/*        → S3 Auth Proxy (:9000)
                          ↓ (validates JWT, enforces scopes)
                     Supabase Storage S3 API
```

**Key insight**: Supabase Storage is S3-compatible, so Filestash can connect using its built-in S3 backend. The S3 auth proxy sits in between to:
1. Validate user tokens from the `filestash-token` Edge Function
2. Enforce path-based scopes (users only access their folders)
3. Forward valid requests to Supabase Storage S3 endpoint

## Scope Mapping

Each user gets access based on their profiles and organization memberships:

| Role | Storage Path |
|------|-------------|
| Comedian / Comedian Lite | `profiles/comedian/{slug}/` |
| Manager | `profiles/manager/{slug}/` |
| Photographer | `profiles/photographer/{slug}/` |
| Videographer | `profiles/videographer/{slug}/` |
| Venue | `profiles/venue/{slug}/` |
| Organization (owner) | `orgs/{org_slug}/` |

## Quick Start

### 1. Generate S3 Access Keys

In Supabase Dashboard:
1. Go to **Settings > Storage > S3 Access Keys**
2. Click **Generate new access key**
3. Save the Access Key ID and Secret Key

### 2. Configure Environment

Add these to your main `.env` file:

```bash
# Filestash S3 Proxy
SUPABASE_PROJECT_REF=pdikjpfulhhpqpxzpgtu
SUPABASE_S3_ACCESS_KEY=your-s3-access-key
SUPABASE_S3_SECRET_KEY=your-s3-secret-key
SUPABASE_STORAGE_BUCKET=media-library
FILESTASH_SESSION_SECRET=your-secret  # generate with: openssl rand -base64 32
```

### 3. Set Edge Function Secret

The `filestash-token` Edge Function needs the same session secret:

```bash
# Set the secret in Supabase
npx supabase secrets set FILESTASH_SESSION_SECRET=your-secret-here

# Deploy the function (if not already deployed)
npx supabase functions deploy filestash-token
```

### 4. Start Docker Services

```bash
cd /root/agents
docker compose -f docker-compose.filestash.yml up -d
```

Services will be available at:
- **Caddy proxy**: http://localhost:8080
- **Filestash**: http://localhost:8080/filestash/
- **S3 proxy health**: http://localhost:8080/s3/health

### 5. Configure Filestash S3 Backend

On first access, configure Filestash to use S3:

1. Go to http://localhost:8080/filestash/
2. In admin settings, add S3 backend with:
   - **Endpoint**: `http://s3-proxy:9000` (internal Docker network)
   - **Access Key**: Your Supabase S3 access key
   - **Secret Key**: Your Supabase S3 secret key
   - **Bucket**: `media-library`
   - **Region**: `us-east-1` (or your project region)

## Directory Structure

```
filestash/
├── Caddyfile              # Reverse proxy config
├── README.md              # This file
└── s3-proxy/
    ├── Dockerfile         # Node.js container
    ├── index.js           # Auth proxy server
    └── package.json       # Dependencies (jsonwebtoken)
```

## Frontend Integration

The `FilestashEmbed.tsx` component handles token fetching and iframe embedding:

```tsx
import { FilestashEmbed } from '@/components/filestash/FilestashEmbed';

// In your page
<FilestashEmbed profileType="comedian" profileSlug="chillz-skinner" />
```

The component:
1. Calls the `filestash-token` Edge Function with user's auth
2. Gets a scoped JWT token (valid 15 minutes)
3. Renders Filestash in an iframe with the token

## Environment Variables

All vars go in the main `.env` file:

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_PROJECT_REF` | Project reference from URL | `pdikjpfulhhpqpxzpgtu` |
| `SUPABASE_S3_ACCESS_KEY` | S3 access key from Dashboard | `abc123...` |
| `SUPABASE_S3_SECRET_KEY` | S3 secret key from Dashboard | `xyz789...` |
| `SUPABASE_STORAGE_BUCKET` | Target bucket name | `media-library` |
| `FILESTASH_SESSION_SECRET` | JWT signing secret (must match Edge Function) | `openssl rand -base64 32` |

## Token Flow

1. User authenticates with Supabase Auth
2. Frontend calls `filestash-token` Edge Function
3. Edge Function:
   - Validates user's Supabase JWT
   - Queries user's profiles and org memberships
   - Creates scoped token: `{ sub: userId, scopes: ["profiles/comedian/slug", "orgs/my-org"], exp: 15min }`
4. Frontend passes token to Filestash via query param or header
5. Filestash makes S3 requests to the proxy
6. S3 proxy validates token and checks path against scopes
7. Valid requests forwarded to Supabase Storage S3

## Production Deployment

For production, update `docker-compose.filestash.yml`:

```yaml
services:
  caddy:
    ports:
      - "443:443"  # HTTPS
    volumes:
      - ./filestash/Caddyfile.prod:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
```

And create `Caddyfile.prod` with your domain and TLS:

```caddyfile
your-domain.com {
    handle /filestash/* {
        reverse_proxy filestash:8334
    }
    handle /s3/* {
        uri strip_prefix /s3
        reverse_proxy s3-proxy:9000
    }
}
```

## Troubleshooting

### "No token provided" (401)
- Ensure token is passed via `x-filestash-token` header or `?token=` query param

### "Access denied: path outside allowed scopes" (403)
- User doesn't have access to requested folder
- Check token scopes match the path being accessed

### "Invalid token" (401)
- Token expired (15 min TTL)
- Session secrets don't match between proxy and Edge Function

### S3 proxy not connecting to Supabase
- Verify `SUPABASE_PROJECT_REF` is correct
- Check S3 credentials are valid in Supabase Dashboard
- Ensure `media-library` bucket exists

## References

- [Filestash](https://github.com/mickael-kerjean/filestash) - Self-hosted file manager
- [Supabase Storage S3](https://supabase.com/docs/guides/storage/s3) - S3-compatible API docs
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions) - Serverless functions
