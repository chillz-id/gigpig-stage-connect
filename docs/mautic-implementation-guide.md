# Mautic Marketing Platform Implementation Guide

## Project Overview

**Goal:** Set up Mautic as a self-hosted marketing automation platform on a DigitalOcean Droplet, using AWS SES for email delivery and syncing contacts bidirectionally with Supabase.

**Admin URL:** `https://mautic.gigpigs.app`

## System Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| RAM | 2GB | 4GB |
| Disk | 10GB | 20GB |
| Docker | Required | Latest |
| Docker Compose | Required | v2+ |

---

## Part 1: Infrastructure Setup (On Droplet)

### Step 1.1: Check System Resources

```bash
# Check available RAM
free -h

# Check disk space
df -h

# Check if Docker is installed
docker --version
docker compose version
```

### Step 1.2: Install Docker (If Not Present)

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose plugin
sudo apt install docker-compose-plugin -y

# Verify installation
docker compose version
```

### Step 1.3: Create Mautic Directory Structure

```bash
# Create directory for Mautic
sudo mkdir -p /opt/mautic
cd /opt/mautic

# Create environment file
sudo nano .env
```

Add to `.env`:
```env
# Database
MYSQL_ROOT_PASSWORD=your_secure_root_password_here
MAUTIC_DB_PASSWORD=your_secure_db_password_here

# Mautic
MAUTIC_DB_HOST=db
MAUTIC_DB_NAME=mautic
MAUTIC_DB_USER=mautic

# AWS SES SMTP Credentials (get from AWS Console)
SES_SMTP_USERNAME=your_ses_smtp_username
SES_SMTP_PASSWORD=your_ses_smtp_password
```

### Step 1.4: Create Docker Compose File

```bash
sudo nano docker-compose.yml
```

Add this content:
```yaml
version: '3.8'

services:
  mautic:
    image: mautic/mautic:5-apache
    container_name: mautic
    restart: unless-stopped
    ports:
      - "127.0.0.1:8080:80"
    environment:
      - MAUTIC_DB_HOST=${MAUTIC_DB_HOST}
      - MAUTIC_DB_NAME=${MAUTIC_DB_NAME}
      - MAUTIC_DB_USER=${MAUTIC_DB_USER}
      - MAUTIC_DB_PASSWORD=${MAUTIC_DB_PASSWORD}
      - MAUTIC_RUN_CRON_JOBS=true
    volumes:
      - mautic_data:/var/www/html
    depends_on:
      - db
    networks:
      - mautic_network

  db:
    image: mysql:8.0
    container_name: mautic_db
    restart: unless-stopped
    environment:
      - MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
      - MYSQL_DATABASE=${MAUTIC_DB_NAME}
      - MYSQL_USER=${MAUTIC_DB_USER}
      - MYSQL_PASSWORD=${MAUTIC_DB_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
    command: --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
    networks:
      - mautic_network

volumes:
  mautic_data:
  mysql_data:

networks:
  mautic_network:
    driver: bridge
```

### Step 1.5: Start Mautic Containers

```bash
cd /opt/mautic

# Start containers
sudo docker compose up -d

# Check status
sudo docker compose ps

# View logs
sudo docker compose logs -f mautic
```

Wait for Mautic to fully initialize (may take 2-3 minutes on first run).

---

## Part 2: Nginx Reverse Proxy Setup

### Step 2.1: Install Nginx and Certbot

```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

### Step 2.2: Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/mautic.gigpigs.app
```

Add this content:
```nginx
server {
    listen 80;
    server_name mautic.gigpigs.app;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support (for real-time features)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffer settings
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }

    # Increase max upload size for email templates/assets
    client_max_body_size 64M;
}
```

### Step 2.3: Enable Site and Get SSL Certificate

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/mautic.gigpigs.app /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Get SSL certificate (after DNS is configured)
sudo certbot --nginx -d mautic.gigpigs.app
```

---

## Part 3: DNS Configuration

### Required DNS Record

Add this A record to `gigpigs.app` DNS settings:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | mautic | [Droplet IP Address] | 300 |

**Get Droplet IP:**
```bash
curl -s ifconfig.me
```

Wait for DNS propagation (5-15 minutes), then verify:
```bash
dig mautic.gigpigs.app +short
```

---

## Part 4: Mautic Initial Configuration

### Step 4.1: Access Web Installer

1. Open browser: `https://mautic.gigpigs.app`
2. Follow the installation wizard

### Step 4.2: Database Configuration (Pre-filled from env)

- Database Host: `db`
- Database Name: `mautic`
- Database User: `mautic`
- Database Password: [from .env file]

### Step 4.3: Admin User Setup

Create your admin account during installation.

### Step 4.4: Configure AWS SES Email Transport

After installation, go to **Settings > Configuration > Email Settings**:

| Setting | Value |
|---------|-------|
| Mailer Transport | SMTP |
| Host | `email-smtp.ap-southeast-2.amazonaws.com` |
| Port | `587` |
| Encryption | TLS |
| Authentication Mode | Login |
| Username | [SES SMTP Username from AWS] |
| Password | [SES SMTP Password from AWS] |

### Step 4.5: Set Up Sending Channels

Go to **Settings > Configuration > Email Settings > Channels**

Create three channels:

**Channel 1: Sydney Newsletter**
- Name: Sydney Newsletter
- From Email: `mail@standupsydney.com`
- From Name: Stand Up Sydney

**Channel 2: Melbourne Newsletter**
- Name: Melbourne Newsletter
- From Email: `mail@standupmelbourne.com`
- From Name: Stand Up Melbourne

**Channel 3: Platform Updates**
- Name: GigPigs Platform
- From Email: `mail@gigpigs.app`
- From Name: GigPigs

---

## Part 5: Custom Fields Setup

Go to **Settings > Custom Fields > Contact**

Create these custom fields:

| Field Label | Field Alias | Type | Options |
|-------------|-------------|------|---------|
| Profile Type | profile_type | Select | comedian, venue, booker, fan |
| City | city | Text | - |
| Supabase ID | supabase_id | Text | - |
| Last Sync | last_sync | DateTime | - |

---

## Part 6: Webhook Configuration for Supabase Sync

### Step 6.1: Create Webhook in Mautic

Go to **Settings > Webhooks > New**

| Setting | Value |
|---------|-------|
| Name | Supabase Sync |
| Webhook URL | `https://[your-supabase-project].supabase.co/functions/v1/mautic-webhook` |
| Secret | [Generate a secure secret] |

**Enable these events:**
- `mautic.lead_post_save` (contact updated)
- `mautic.email_on_unsubscribe` (unsubscribed)
- `mautic.email_on_bounce` (bounced)

---

## Part 7: Mautic API Setup

### Step 7.1: Enable API

Go to **Settings > Configuration > API Settings**

- Enable API: Yes
- Enable HTTP Basic Auth: Yes (for initial setup)

### Step 7.2: Create API Credentials

Go to **Settings > API Credentials > New**

- Name: Supabase Sync
- Redirect URI: `https://gigpigs.app` (not used for server-to-server)
- Grant Type: Client Credentials

Save the **Client ID** and **Client Secret** - these will be used by Supabase edge functions.

---

## Part 8: Cron Jobs Setup

Mautic requires cron jobs for campaigns, emails, and segments. The Docker image handles basic crons, but verify they're running:

```bash
# Check cron logs
sudo docker compose logs mautic | grep -i cron

# If needed, manually trigger segment rebuild
sudo docker compose exec mautic php /var/www/html/bin/console mautic:segments:update

# Manually trigger campaign processing
sudo docker compose exec mautic php /var/www/html/bin/console mautic:campaigns:trigger
```

---

## Part 9: Initial Segment Setup

Go to **Segments > New**

### Segment 1: Sydney Comedians
- Name: Sydney Comedians
- Filters:
  - `city` equals `Sydney`
  - `profile_type` equals `comedian`

### Segment 2: Melbourne Comedians
- Name: Melbourne Comedians
- Filters:
  - `city` equals `Melbourne`
  - `profile_type` equals `comedian`

### Segment 3: All Comedians
- Name: All Comedians
- Filters:
  - `profile_type` equals `comedian`

### Segment 4: Venue Contacts
- Name: Venue Contacts
- Filters:
  - `profile_type` equals `venue`

---

## Part 10: Testing

### Test 1: SMTP Connection

Go to **Settings > Configuration > Email Settings** and click **Test Connection**

### Test 2: Send Test Email

Go to **Emails > New > Quick Send**

Send a test email to yourself through each channel.

### Test 3: Contact Creation

Go to **Contacts > New**

Create a test contact and verify custom fields work.

---

## Troubleshooting

### Check Container Logs
```bash
cd /opt/mautic
sudo docker compose logs -f mautic
sudo docker compose logs -f db
```

### Restart Services
```bash
sudo docker compose restart
```

### Clear Mautic Cache
```bash
sudo docker compose exec mautic php /var/www/html/bin/console cache:clear
```

### Database Connection Issues
```bash
# Access MySQL container
sudo docker compose exec db mysql -u mautic -p

# Check database
SHOW DATABASES;
USE mautic;
SHOW TABLES;
```

### Permission Issues
```bash
# Fix file permissions
sudo docker compose exec mautic chown -R www-data:www-data /var/www/html
```

---

## Security Checklist

- [ ] Strong passwords in `.env` file
- [ ] SSL certificate installed and working
- [ ] Firewall configured (only 80, 443, 22 open)
- [ ] Regular backups configured
- [ ] Mautic admin password is strong
- [ ] API credentials stored securely

---

## Backup Commands

### Backup Database
```bash
sudo docker compose exec db mysqldump -u root -p mautic > /opt/mautic/backups/mautic_$(date +%Y%m%d).sql
```

### Backup Files
```bash
sudo docker compose exec mautic tar -czvf /tmp/mautic_files.tar.gz /var/www/html/media /var/www/html/config
sudo docker cp mautic:/tmp/mautic_files.tar.gz /opt/mautic/backups/
```

---

## Next Steps (After Mautic is Running)

1. **Supabase Edge Functions** - Will be created separately to handle:
   - Contact sync from Supabase → Mautic
   - Webhook handling from Mautic → Supabase

2. **Database Migration** - Add email preference columns to Supabase profiles table

3. **Initial Import** - Bulk import existing contacts from Supabase

---

## Summary

After completing this guide, you will have:

- ✅ Mautic running on Docker at `https://mautic.gigpigs.app`
- ✅ AWS SES configured for email delivery
- ✅ Three sending channels (Sydney, Melbourne, Platform)
- ✅ Custom fields matching Supabase schema
- ✅ Webhook endpoint ready for Supabase integration
- ✅ API credentials for programmatic access
- ✅ Basic segments for audience targeting

**Estimated Setup Time:** 1-2 hours

**Questions?** The main areas that may need clarification:
- AWS SES SMTP credentials (found in AWS Console > SES > SMTP Settings)
- DNS propagation (may take up to 24 hours in rare cases)
- Firewall configuration specific to your Droplet setup
