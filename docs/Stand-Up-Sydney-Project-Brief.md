# Stand Up Sydney - Comprehensive Project Brief

**Last Updated**: December 2025
**Version**: 1.0
**For**: Claude Desktop / AI Assistant Context

---

## Executive Summary

Stand Up Sydney is a **comedy industry platform** connecting comedians, photographers, videographers, venues, promoters, and managers across the Australian live comedy ecosystem. It serves as a booking marketplace, event management system, CRM, and professional profile network.

---

## Business Context

### Problem Statement

The Australian comedy industry operates with fragmented tools and manual processes:

- **Comedians** struggle to discover gigs, build professional profiles (EPKs), and manage bookings
- **Promoters/Organizations** juggle multiple ticketing platforms, spreadsheets for lineups, and manual invoicing
- **Venues** lack visibility into available acts and event coordination tools
- **Photographers/Videographers** have no centralized way to showcase work to the comedy community
- **Managers** track commissions and artist bookings across disconnected systems

### Solution

A unified platform that:
1. Centralizes comedy industry networking and booking
2. Integrates with major ticketing platforms (Humanitix, Eventbrite)
3. Automates financial workflows (invoicing, revenue splits, accounting sync)
4. Provides professional profiles and EPKs for all stakeholders
5. Offers CRM and marketing tools for audience growth

### Target Users

| Role | Primary Use Cases |
|------|-------------------|
| **Comedian** | Build EPK, discover & apply for gigs, track earnings, manage availability |
| **Comedian Lite** | Simplified profile for emerging acts |
| **Promoter/Organization** | Create events, manage lineups, handle ticketing, track sales |
| **Venue** | List space, coordinate events, manage availability |
| **Photographer** | Portfolio showcase, sell services, media management |
| **Videographer** | Reel showcase, event coverage bookings |
| **Manager** | Multi-artist management, commission tracking, negotiations |
| **Admin** | Platform oversight, analytics, dispute resolution |

---

## Current Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI framework |
| TypeScript | 5.5.3 | Type safety (strict mode) |
| Vite | 5.4.19 | Build tool & dev server |
| Tailwind CSS | 3.4.11 | Styling |
| shadcn/ui + Radix | - | Accessible component primitives |
| TanStack Query | 5.80.10 | Server state management |
| React Hook Form | 7.60.0 | Form handling |
| Zod | 3.23.8 | Schema validation |
| React Router | 6.26.2 | Client-side routing |

### Backend & Database
| Technology | Purpose |
|------------|---------|
| **Supabase** | PostgreSQL database, Auth, Realtime, Storage, Edge Functions |
| **Row-Level Security** | Multi-tenant data isolation |
| **60+ database tables** | Profiles, events, orders, invoices, CRM, analytics |

### External Integrations

#### Ticketing
| Service | Integration |
|---------|-------------|
| **Humanitix** | API + Webhooks (real-time sync) |
| **Eventbrite** | API + CSV import |

#### Financial
| Service | Integration |
|---------|-------------|
| **Stripe** | Payments, Connect (marketplace payouts) |
| **Xero** | Accounting sync, invoice creation |

#### Communication & Marketing
| Service | Integration |
|---------|-------------|
| **Resend** | Transactional emails |
| **AWS SES** | Newsletter/bulk email |
| **Meta/Facebook Ads** | Custom Audiences, Conversions API |
| **Postiz** | Social media scheduling |

#### Other
| Service | Integration |
|---------|-------------|
| **Google Maps** | Address autocomplete, geocoding |
| **Google Calendar** | Event sync |
| **Filestash** | Advanced file management |

### Infrastructure
| Component | Service |
|-----------|---------|
| Hosting | Vercel |
| Database | Supabase (Sydney region) |
| Storage | Supabase Storage (S3-compatible) |
| Email | AWS SES (Sydney) |
| CI/CD | GitHub Actions |

---

## Current Features (Implemented)

### Core Platform

#### Multi-Role Authentication
- Supabase Auth with Google OAuth
- Single account, multiple roles (comedian + photographer, etc.)
- Quick profile switching
- Role-specific dashboards and permissions

#### Profile System
- **Comedian/Comedian Lite**: EPK with bio, media, social links, testimonials, availability calendar
- **Manager**: Artist roster, commission tracking, deal management
- **Photographer/Videographer**: Portfolio galleries, work samples
- **Organization**: Team management, event creation, branding
- **Venue**: Space details, availability, event hosting

#### Event Management
- Full event CRUD with rich details
- Ticketing integration (Humanitix + Eventbrite dual sync)
- Lineup/spot management (MC, Feature, Headliner, Guest positions)
- Event series and recurring shows
- Timeline visualization
- Application workflow for comedians

### Booking & Financial

#### Booking Workflow
- Comedian application submission
- Spot confirmation with deadline tracking
- Promoter review and approval
- Multi-party deal management
- Revenue split calculation

#### Financial Management
- Invoice generation (PDF export)
- Stripe payment processing
- Xero accounting sync
- Deal pipeline with participant confirmations
- Manager commission tracking
- Bulk invoice operations

### CRM & Marketing

#### Contact Management
- Customer database from ticket sales
- Segmentation and tagging
- Activity timeline and audit trails
- Task dashboard with deadline monitoring

#### Marketing Integration
- Meta Custom Audiences sync (17,695 customers)
- Facebook Conversions API
- Newsletter integration (AWS SES)

### Media & Content

#### Media Library
- Album organization with permissions
- Image upload to Supabase Storage
- Filestash integration for advanced file management
- Photo sharing between users
- Tagging and search

### Analytics & Reporting
- Event analytics dashboard
- Ticket sales tracking
- Revenue analytics by event/artist
- Performer statistics
- Platform-wide admin analytics

### Additional Features
- PWA (Progressive Web App) with offline support
- Google Calendar sync
- Custom profile links (Linktree-style)
- Roadmap and guided tours
- Bug tracking and error logging

---

## Planned Features & Roadmap

### In Progress
1. **Meta Signals Gateway** - Server-side tracking for improved ad attribution
2. **Organization Role Completion** - Final 15% of features
3. **Mobile Optimization** - Progressive enhancement
4. **Achievement System** - Gamification for engagement

### Planned
1. **Advanced Analytics** - BigQuery integration, Gemini AI insights
2. **Comedian Marketplace** - Public booking requests
3. **Automated Matching** - AI-powered comedian-event recommendations
4. **Multi-Currency Support** - International expansion
5. **API for Partners** - Third-party integrations

---

## Meta Credentials & Marketing

| Credential | Value |
|------------|-------|
| User ID | `100087754161818` |
| Ad Account ID | `act_706965793592736` |
| Pixel ID | `199052578865232` |
| Custom Audience | Created (17,695 customers synced) |

### Current Marketing Data
- **Total Customers**: 17,695 unique emails
- **With Phone**: 9,080 (51%)
- **With DOB**: 1,076 (6%)
- **Total Customer Value**: $509,091 AUD
- **Sources**: Humanitix orders, Eventbrite orders, CRM imports

---

## Meta Signals Gateway Project

### Overview

Self-hosted Meta Signals Gateway for server-side event tracking, improving:
- Data accuracy (bypass ad blockers)
- Event Match Quality scores
- Attribution for conversions
- Multi-site tracking (Stand Up Sydney + comedian partner sites)

### Current Status: **Platform Selection**

Evaluating cloud providers for deployment:

### Option A: AWS

| Component | Service | Monthly Cost |
|-----------|---------|--------------|
| Compute | EC2 t3.small | ~$15-20 |
| Load Balancer | ALB | ~$20-30 |
| Data Transfer | - | ~$5-10 |
| **Total** | | **~$40-60** |

**Pros**:
- Consolidates with existing AWS SES
- Familiar infrastructure

**Cons**:
- No native AI/analytics integration
- Separate tooling for data analysis

### Option B: Google Cloud Platform

| Component | Service | Monthly Cost |
|-----------|---------|--------------|
| Compute | Compute Engine e2-small | ~$12-18 |
| Load Balancer | Cloud Load Balancing | ~$18-25 |
| Data Transfer | - | ~$5-10 |
| **Total** | | **~$35-55** |

**Pros**:
- BigQuery for unified analytics
- Gemini AI integration for insights
- Looker Studio dashboards
- Native GCP ecosystem benefits

**Cons**:
- Email stays on AWS SES (split infrastructure)

### Architecture (Cloud-Agnostic)

```
┌─────────────────────────────────────────────────────────────────┐
│                         DATA SOURCES                             │
├─────────────────────────────────────────────────────────────────┤
│  [Framer Sites]        [React App]         [Comedian Sites]     │
│  standupsydney.com     agents.sus.com      partner sites        │
│        │                    │                    │               │
│        └────────────────────┼────────────────────┘               │
│                             │                                    │
│                    [1P Pixel / Browser Events]                   │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUD INFRASTRUCTURE                          │
│                    (AWS or GCP - TBD)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   [DNS]  →  [Load Balancer + SSL]  →  [Signals Gateway VM]      │
│   sg.standupsydney.com                    Docker Container       │
│                                                                  │
│                            Gateway Admin UI: /hub/capig          │
│                                                                  │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DESTINATIONS                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   [Meta Conversions API]     [Meta Custom Audiences]             │
│   Purchase events            Customer lists                      │
│   Add to cart                Retargeting                         │
│   Page views                 Lookalike audiences                 │
│                                                                  │
│   [Analytics Layer - BigQuery/Athena TBD]                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation Phases

**Phase 1: Infrastructure Setup**
- Provision compute instance (AWS EC2 or GCP Compute Engine)
- Configure load balancer with SSL
- Set up DNS: `sg.standupsydney.com`

**Phase 2: Meta Integration**
- Start Signals Gateway setup in Meta Events Manager
- Deploy container with Meta credentials
- Configure Admin UI access

**Phase 3: Website Integration**
- Generate 1P Pixel from Gateway
- Install on Stand Up Sydney (Framer)
- Install on agents.standupsydney.com (React)
- Verify events in Meta Events Manager

**Phase 4: Multi-Site Expansion**
- Onboard comedian partner sites
- Create per-site pipelines
- Documentation for self-service setup

**Phase 5: Analytics Integration (GCP Path)**
- Stream events to BigQuery
- Build Looker Studio dashboards
- Configure Gemini AI insights

### Expected Benefits
| Current (Pixel Only) | With Signals Gateway |
|---------------------|----------------------|
| Browser-side tracking | Server-side + Browser |
| Blocked by ad blockers | Bypasses most blockers |
| ~60-70% data capture | ~90-95% data capture |
| Single pixel per site | Centralized management |
| Manual comedian setup | Streamlined onboarding |

**Expected improvement**: 133% decrease in cost per result (Meta benchmark data)

---

## Key URLs & Resources

| Resource | URL |
|----------|-----|
| Production App | https://agents.standupsydney.com |
| Marketing Site | https://standupsydney.com |
| Supabase Dashboard | https://supabase.com/dashboard/project/pdikjpfulhhpqpxzpgtu |
| Meta Events Manager | https://business.facebook.com/events_manager |
| Meta Signals Gateway Docs | https://developers.facebook.com/docs/marketing-api/gateway-products/signals-gateway/ |

---

## Development Quick Reference

```bash
cd /root/agents

# Development
npm run dev                    # Dev server (port 8080)
npm run build                  # Production build
npm run lint                   # ESLint + TypeScript

# Testing
npm test                       # Jest unit tests
npm run test:e2e               # Playwright E2E

# Database
npm run migrate:dry-run        # Test migration
npm run migrate:safe           # Run migration
```

---

## File Structure

```
/root/agents/
├── src/
│   ├── pages/           # 62 React pages
│   ├── components/      # 605+ components
│   ├── services/        # 50+ service files
│   ├── hooks/           # 70+ custom hooks
│   ├── contexts/        # Auth, User, Profile, Theme
│   └── types/           # TypeScript definitions
├── supabase/
│   ├── migrations/      # 50+ SQL migrations
│   └── functions/       # Edge Functions
├── tests/               # Jest + Playwright
├── Plans/               # Implementation plans
└── Architecture/        # System documentation
```

---

## Contact & Ownership

**Platform**: Stand Up Sydney
**Domain**: standupsydney.com
**Primary App**: agents.standupsydney.com

---

*This document provides comprehensive context for AI assistants working on Stand Up Sydney projects. Update as features and infrastructure evolve.*
