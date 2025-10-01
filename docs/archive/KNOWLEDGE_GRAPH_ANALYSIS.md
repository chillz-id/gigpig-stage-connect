# Stand Up Sydney Knowledge Graph Analysis
Generated: January 11, 2025

## 📊 Graph Overview

**Total Nodes**: 1,121  
**Total Relationships**: ~2,000+  
**Project Start**: July 9, 2025 (based on earliest episodes)

## 🏗️ System Architecture

### Technology Stack (by usage)
1. **Supabase** (19 components) - Core backend
2. **React** (18 components) - Frontend framework
3. **TypeScript** (15 components) - Type safety
4. **Docker** (10 components) - Containerization
5. **PostgreSQL** (8 components) - Database
6. **FastMCP** (8 components) - MCP server implementation
7. **PM2** (7 components) - Process management
8. **Tailwind** (7 components) - Styling
9. **Jest** (7 components) - Testing

### Database Schema Insights
The most connected tables reveal the core business model:
- **photographer_profiles** (482 connections) - Photography service integration
- **photographer_reviews** (288 connections) - Review system
- **events** (270 connections) - Core event management
- **profiles** (265 connections) - User system
- **event_photographers** (194 connections) - Event-photographer relationships
- **batch_payments** (138 connections) - Financial processing

## 🚨 Critical Issues History

### The Profile System Catastrophe
- **Date**: July 9, 2025
- **Issue**: Complete profile system failure - ZERO profiles existed
- **Impact**: Catastrophic - no users could have profiles
- **Resolution**: Fixed through multiple attempts, knowledge graph populated

### Recurring Problem Patterns
Based on repeated fix attempts:
- **Profile issues**: 20 attempts
- **Page issues**: 20 attempts  
- **General issues**: 18 attempts
- **Shows functionality**: 4 attempts
- **Picture upload**: 3 attempts
- **Performance**: 3 attempts

## 🎯 Strategic Goals

All goals marked as "Medium" priority and "planned" status:
1. **Comedian Performance Analytics**
2. **Revenue Optimization**
3. **Predictive Event Success**
4. **Audience Segmentation**
5. **Operational Excellence**

## 🔒 Security & Architecture Patterns

### Security Patterns
- **Centralized Credential Management** (implemented 6 times)
- Stored in `/etc/standup-sydney/credentials.env`
- Synced across multiple services

### Architecture Decisions
1. **credential_sync_strategy** - Avoid unnecessary API calls
2. **deposit_flexibility** - Variable deposit requirements per event
3. **backward_compatibility** - Protect existing integrations

## 🔌 External Integrations

### Active MCPs (13)
- Supabase, GitHub, Notion, Slack, Metricool
- Xero, Canva, Context7, Filesystem, N8N
- Magic UI, Apify, Task Master

### Cloud Services
- **Vercel** - Frontend deployment
- **DigitalOcean** - Infrastructure
- **GitHub Actions** - CI/CD

## 📈 Project Evolution

### Key Features
- **Invoice Deposit Feature** - Optional deposits for events
- **Photographer Integration** - Complete photographer marketplace
- **Event Management** - Full event lifecycle
- **Review System** - Multi-entity reviews
- **Batch Payments** - Financial automation

### Known Issues & Solutions
- **Metricool Credentials** - Multiple unresolved entries
- **Environment variable mismatches** - Common pattern
- **MCP Integration Failures** - Recently fixed (Jan 11, 2025)
- **Neo4j Connection** - Recently fixed (Jan 11, 2025)

## 🧠 Business Intelligence Vision

The knowledge graph reveals plans for "Business Intelligence for Comedy":
- Performance analytics
- Revenue optimization
- Predictive modeling
- Audience insights

## 🔄 Recent Activity

### Latest Fixes (Jan 11, 2025)
1. ✅ Neo4j Connection Refused
2. ✅ MCP Integration Failures
3. ✅ Invoice Database Schema Mismatch
4. ✅ Event Templates Banner Loading
5. ✅ Applications field mapping

## 💡 Key Insights

1. **Photography-Heavy Platform**: The database schema shows this is more than comedy - it's a full event + photography marketplace

2. **Profile System Vulnerability**: The catastrophic profile failure shows the critical importance of the user system

3. **Credential Management Focus**: Multiple implementations suggest this has been a pain point

4. **Incomplete Features**: Many null values in migrations and features suggest ongoing development

5. **Data Duplication**: Many entities appear multiple times (e.g., 6x "Centralized Credential Management")

## 🎭 Comedy Platform Components

Despite heavy photographer integration, core comedy features exist:
- Events management
- Comedian bookings
- Artist management
- Agency analytics
- Manager profiles

## 📝 Recommendations

1. **Deduplicate Graph**: Remove duplicate nodes (same patterns repeated 3-6x)
2. **Complete Migrations**: Many migration entries are null
3. **Resolve Metricool**: 6 open critical issues for same problem
4. **Implement BI Features**: Strategic goals are all in "planned" state
5. **Document Features**: Many features lack descriptions

The knowledge graph reveals a complex platform that started as comedy-focused but evolved into a comprehensive event + photographer marketplace with significant technical debt from the profile system catastrophe.