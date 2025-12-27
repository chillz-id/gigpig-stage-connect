# Meta Signals Gateway - GCP Deployment

**Created**: 2025-12-09
**Status**: In Progress
**Platform**: Google Cloud Platform (Sydney region)

---

## Overview

Deploy Meta's self-hosted Signals Gateway on GCP for Stand Up Sydney's comedy platform. This enables server-side event tracking that bypasses ad blockers and improves data accuracy for Meta advertising.

**Why Signals Gateway?**
- Browser pixel blocked by ~30-40% of users (ad blockers)
- Server-side tracking captures ~90-95% of events
- Better Event Match Quality scores
- Centralized tracking for multiple sites (main site + comedian partners)
- Expected: 133% improvement in cost per result (Meta benchmark)

---

## Meta Credentials

| Credential | Value | Status |
|------------|-------|--------|
| User ID | `100087754161818` | Ready |
| Ad Account ID | `act_706965793592736` | Ready |
| Pixel ID | `199052578865232` | Ready |
| Access Token | `EAALZAWL13EWUBQOQh5HH0TavA5FBu3jWHm0OI5H706QgdIkw7oOPt5TeHD4lzMCSWZCmXawusYiGRxrh93X00JZCT9amuxdwJ8hU2gnVfVrAZCPTmhFI1CGA6pyyOBmJTWZBDiUL2a0qjTapGJOoaudrYqZCZAeBSL72sLvUlR3WkFDoM72mXnvkZCbfZBnH1IydSXwZDZD` | Ready |

---

## Infrastructure Decision: GCP

**Chosen**: Google Cloud Platform (over AWS)

| Factor | GCP | AWS |
|--------|-----|-----|
| Compute | ~$12-17/mo | ~$19/mo |
| Load Balancer | ~$18-25/mo | ~$18-25/mo |
| **Analytics** | BigQuery native | Separate service |
| **AI** | Gemini/Vertex AI native | Separate service |
| **Dashboards** | Looker Studio free | QuickSight extra |
| Email | None | SES (keep existing) |

**Final Architecture**:
- **GCP**: Signals Gateway + BigQuery + Gemini analytics
- **AWS**: SES only (newsletters - already configured)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         DATA SOURCES                             │
├─────────────────────────────────────────────────────────────────┤
│  [Framer Site]           [React App]         [Comedian Sites]   │
│  standupsydney.com       agents.sus.com      partner sites      │
│        │                      │                    │            │
│        └──────────────────────┼────────────────────┘            │
│                               │                                 │
│                      [1P Pixel / Browser Events]                │
└───────────────────────────────┼─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GCP INFRASTRUCTURE                            │
│                    (australia-southeast1)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   [Cloud DNS]  →  [Cloud Load Balancer]  →  [Compute Engine]   │
│   sg.standupsydney.com     HTTPS + Cert       Docker Container  │
│                                                                  │
│                           Gateway Admin UI: /hub/capig           │
│                                                                  │
│   [BigQuery]  ←  [Event Stream]  ←  [Gateway Logs]              │
│                                                                  │
└───────────────────────────────┼─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DESTINATIONS                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   [Meta Conversions API]     [Meta Custom Audiences]            │
│   Purchase events            Customer lists                      │
│   Add to cart                Retargeting                         │
│   Page views                 Lookalike audiences                 │
│                                                                  │
│   [Looker Studio]  ←  [BigQuery]  ←  [Gemini AI Insights]       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cost Estimate (GCP australia-southeast1)

| Component | Monthly Cost | Notes |
|-----------|--------------|-------|
| Compute Engine e2-small | ~$15 | 2 vCPU shared, 2GB RAM |
| Cloud Load Balancing | ~$20 | Forwarding rules + data |
| Data Transfer | ~$5-10 | Low traffic expected |
| BigQuery | ~$5-10 | 10GB/mo free, then $5/TB |
| Cloud DNS | ~$1 | Hosted zone |
| **Base Total** | **~$45-55/mo** | |
| Looker Studio | Free | Basic tier |
| Gemini AI (optional) | ~$10-20 | Per usage |

**With analytics stack**: ~$55-75/mo

---

## Implementation Checklist

### Phase 1: GCP Project Setup
- [ ] Create GCP project or select existing
- [ ] Enable Compute Engine, DNS, BigQuery APIs
- [ ] Create service account with required roles

**Commands:**
```bash
gcloud services enable compute.googleapis.com
gcloud services enable dns.googleapis.com
gcloud services enable bigquery.googleapis.com
gcloud services enable logging.googleapis.com
```

---

### Phase 2: Compute Engine Setup
- [ ] Create Compute Engine VM (e2-small, Sydney)
- [ ] Configure firewall rules
- [ ] Install Docker on VM

**Commands:**
```bash
# Create VM
gcloud compute instances create signals-gateway \
  --zone=australia-southeast1-b \
  --machine-type=e2-small \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=20GB \
  --tags=http-server,https-server

# Firewall - Allow from load balancer only
gcloud compute firewall-rules create allow-lb-to-gateway \
  --allow=tcp:80,tcp:443 \
  --source-ranges=130.211.0.0/22,35.191.0.0/16 \
  --target-tags=signals-gateway

# On VM - Install Docker
sudo apt update && sudo apt install -y docker.io
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

---

### Phase 3: Load Balancer + SSL
- [ ] Reserve static IP
- [ ] Create health check, backend service
- [ ] Create managed SSL certificate
- [ ] Create forwarding rules

**Commands:**
```bash
# Reserve IP
gcloud compute addresses create signals-gateway-ip --global

# Health check
gcloud compute health-checks create http signals-gateway-health \
  --port=80 \
  --request-path=/health

# Backend service
gcloud compute backend-services create signals-gateway-backend \
  --protocol=HTTP \
  --health-checks=signals-gateway-health \
  --global

# URL map
gcloud compute url-maps create signals-gateway-map \
  --default-service=signals-gateway-backend

# SSL certificate
gcloud compute ssl-certificates create signals-gateway-cert \
  --domains=sg.standupsydney.com \
  --global

# HTTPS proxy
gcloud compute target-https-proxies create signals-gateway-proxy \
  --url-map=signals-gateway-map \
  --ssl-certificates=signals-gateway-cert

# Forwarding rule
gcloud compute forwarding-rules create signals-gateway-https \
  --global \
  --target-https-proxy=signals-gateway-proxy \
  --ports=443 \
  --address=signals-gateway-ip
```

---

### Phase 4: DNS Configuration
- [ ] Get Load Balancer IP
- [ ] Add A record for sg.standupsydney.com
- [ ] Wait for SSL certificate provisioning (~15min)
- [ ] Verify DNS propagation

**Commands:**
```bash
# Get IP
gcloud compute addresses describe signals-gateway-ip --global

# Verify
dig sg.standupsydney.com
```

**DNS Record to Add:**
- Type: A
- Name: `sg`
- Value: `<load-balancer-ip>`
- TTL: 300

---

### Phase 5: Meta Signals Gateway Deployment
- [ ] Start setup in Meta Events Manager
- [ ] Get deployment credentials from Meta
- [ ] Deploy Docker container
- [ ] Access Admin UI and configure

**Steps:**
1. Go to Meta Events Manager → Data Sources → Pixel → Settings
2. Find "Signals Gateway" section → "Get Started" → "Host Yourself"
3. Follow wizard to get deployment package

**Example Docker Run (Meta provides actual command):**
```bash
docker run -d \
  --name signals-gateway \
  -p 80:80 \
  -e META_PIXEL_ID=199052578865232 \
  -e META_ACCESS_TOKEN=EAALZAWL13EWUBQOQh5HH0TavA5FBu3jWHm0OI5H706QgdIkw7oOPt5TeHD4lzMCSWZCmXawusYiGRxrh93X00JZCT9amuxdwJ8hU2gnVfVrAZCPTmhFI1CGA6pyyOBmJTWZBDiUL2a0qjTapGJOoaudrYqZCZAeBSL72sLvUlR3WkFDoM72mXnvkZCbfZBnH1IydSXwZDZD \
  -e GATEWAY_SECRET=<from-meta> \
  meta/signals-gateway:latest
```

**Admin UI:** `https://sg.standupsydney.com/hub/capig`

---

### Phase 6: Website Integration
- [ ] Generate 1P Pixel from Gateway Admin UI
- [ ] Install on standupsydney.com (Framer)
- [ ] Install on agents.standupsydney.com (React)
- [ ] Verify events in Meta Events Manager

**Framer Installation:**
1. Framer Dashboard → Site Settings → Custom Code
2. Paste 1P Pixel in Head section
3. Publish site

**React Installation:**
- Add to `index.html` head section
- Or create React component wrapper

---

### Phase 7: BigQuery Integration (Optional)
- [ ] Create BigQuery dataset
- [ ] Configure Gateway → BigQuery export
- [ ] Build Looker Studio dashboard

**Commands:**
```bash
bq mk --dataset \
  --location=australia-southeast1 \
  standup-sydney-signals:meta_events
```

---

### Phase 8: Multi-Site Expansion (Future)
- [ ] Create pipelines for comedian partner sites
- [ ] Generate site-specific 1P Pixels
- [ ] Document installation process

---

## Prerequisites Checklist

- [ ] **GCP Account** with billing enabled
- [ ] **gcloud CLI** installed and authenticated
- [ ] **DNS Access** to standupsydney.com
- [x] **Meta Business Manager** admin access
- [x] **Meta Access Token** with full permissions

---

## Expected Benefits

| Current (Pixel Only) | With Signals Gateway |
|---------------------|----------------------|
| Browser-side tracking | Server-side + Browser |
| Blocked by ~30-40% of users | Bypasses most blockers |
| ~60-70% data capture | ~90-95% data capture |
| Single pixel per site | Centralized management |
| Manual comedian setup | Streamlined onboarding |

**Expected**: 133% decrease in cost per result (Meta benchmark data)

---

## Reference Documentation

- **Meta Signals Gateway**: https://developers.facebook.com/docs/marketing-api/gateway-products/signals-gateway/
- **GCP Compute Engine**: https://cloud.google.com/compute/docs
- **GCP Load Balancing**: https://cloud.google.com/load-balancing/docs
- **BigQuery**: https://cloud.google.com/bigquery/docs

---

## Progress Log

| Date | Phase | Status | Notes |
|------|-------|--------|-------|
| 2025-12-09 | Planning | Complete | Plan created, Meta token obtained |
| | Phase 1 | Pending | |
| | Phase 2 | Pending | |
| | Phase 3 | Pending | |
| | Phase 4 | Pending | |
| | Phase 5 | Pending | |
| | Phase 6 | Pending | |
| | Phase 7 | Pending | |
| | Phase 8 | Pending | |
