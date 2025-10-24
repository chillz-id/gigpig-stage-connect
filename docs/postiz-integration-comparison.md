# Postiz Social Media Scheduling Integration
# Technical Comparison & Implementation Guide

**Date**: 2025-10-20
**Status**: Research Phase - Decision Required
**Purpose**: Compare Self-Hosted vs Hybrid integration approaches for user decision

---

## Executive Summary

Postiz is an open-source social media scheduling tool that supports 19+ platforms. We need to choose between:
1. **Self-Hosted Deployment** - Run Postiz as separate service with full UI
2. **Hybrid Integration** - Custom UI with Postiz NodeJS SDK backend

Both approaches will be deployed on test servers with Stand Up Sydney branding for comparison.

---

## Postiz Overview

### Key Features
- **Platforms Supported**: Instagram, X/Twitter, Facebook, LinkedIn, TikTok, YouTube, Reddit, Pinterest, Threads, Bluesky, Discord, Slack, Mastodon, Dribbble, and more (19+ total)
- **AI-Powered Content**: Built-in AI for content creation and optimization
- **Team Collaboration**: Multi-user support with comments and approvals
- **Analytics**: Engagement, reach, and audience demographics tracking
- **Canva-like Editor**: Built-in graphics, infographics, and video creation
- **Open Source**: AGPL-3.0 license, almost 14k GitHub stars, 3M+ Docker downloads

### Tech Stack
- **Frontend**: Next.js (React framework)
- **Backend**: NestJS (Node.js framework)
- **Database**: PostgreSQL via Prisma ORM
- **Queue**: Redis with BullMQ
- **Monorepo**: NX workspace

### Current Popularity
- **GitHub Stars**: ~14,000 (as of Oct 2025)
- **Docker Downloads**: 3M+
- **Monthly Views**: 20k+
- **Created**: September 2024
- **Latest Version**: 1.6.7+ (actively maintained)

---

## Option 1: Self-Hosted Deployment

### Architecture
```
┌─────────────────────────────────────────┐
│   Stand Up Sydney (Main App)            │
│   - Event Management                    │
│   - Media Library                       │
│   - User Profiles                       │
└─────────────────┬───────────────────────┘
                  │
                  │ (Link/Embed)
                  ▼
┌─────────────────────────────────────────┐
│   Postiz (Separate Service)             │
│   subdomain: social.standupsydney.com   │
│                                          │
│   ┌──────────────┐  ┌────────────┐     │
│   │ Postiz App   │  │ PostgreSQL │     │
│   │ (Next.js)    │──│ Database   │     │
│   └──────┬───────┘  └────────────┘     │
│          │                               │
│          │          ┌────────────┐      │
│          └──────────│   Redis    │      │
│                     └────────────┘      │
└─────────────────────────────────────────┘
```

### System Requirements
- **OS**: Ubuntu 24.04+ (tested on 2GB RAM, 2 vCPU VM)
- **Node.js**: v22+ (required)
- **PostgreSQL**: v17+ (alpine image)
- **Redis**: v7.2+
- **Docker**: Docker Compose recommended

### Installation Steps

#### 1. Docker Compose Setup
```yaml
version: '3.8'

services:
  postiz-postgres:
    image: postgres:17-alpine
    container_name: postiz-postgres
    environment:
      POSTGRES_USER: postiz-user
      POSTGRES_PASSWORD: postiz-password
      POSTGRES_DB: postiz-db-local
    volumes:
      - postiz-postgres-data:/var/lib/postgresql/data
    networks:
      - postiz-network

  postiz-redis:
    image: redis:7.2-alpine
    container_name: postiz-redis
    networks:
      - postiz-network

  postiz-app:
    image: ghcr.io/gitroomhq/postiz-app:latest
    container_name: postiz-app
    environment:
      DATABASE_URL: postgresql://postiz-user:postiz-password@postiz-postgres:5432/postiz-db-local
      REDIS_URL: redis://postiz-redis:6379
      IS_GENERAL: "true"
      # Custom branding
      NEXT_PUBLIC_BRAND_NAME: "Stand Up Sydney Social"
      # Add social platform OAuth credentials
    ports:
      - "5000:5000"
    depends_on:
      - postiz-postgres
      - postiz-redis
    networks:
      - postiz-network

networks:
  postiz-network:
    driver: bridge

volumes:
  postiz-postgres-data:
```

#### 2. Environment Configuration
```bash
# Required Environment Variables
DATABASE_URL=postgresql://postiz-user:postiz-password@postiz-postgres:5432/postiz-db-local
REDIS_URL=redis://postiz-redis:6379
IS_GENERAL=true

# OAuth Credentials (per platform)
# Instagram, Facebook, X/Twitter, LinkedIn, etc.
# Each requires separate OAuth app setup
```

#### 3. Subdomain Setup
- DNS: `social.standupsydney.com` → Server IP
- Nginx reverse proxy to port 5000
- SSL certificate via Let's Encrypt/Certbot

### Customization (Stand Up Sydney Branding)

#### Theme Customization
- Modify Next.js theme files
- Update logo and brand colors
- Custom CSS overrides
- Remove "Postiz" branding

#### Limitations
- Limited customization without forking
- AGPL-3.0 requires sharing modifications if distributed
- Maintenance overhead for updates

### API Integration with Main App
```typescript
// Stand Up Sydney can call Postiz Public API
import Postiz from '@postiz/node';

const postiz = new Postiz(
  'your_api_key',
  'https://social.standupsydney.com'
);

// Schedule a post
await postiz.posts.create({
  integrationId: 'instagram_channel_id',
  content: 'Check out tonight's lineup!',
  scheduledAt: new Date('2025-10-20T19:00:00'),
});
```

### Pros ✅
- **Full Feature Set**: All Postiz features available immediately
- **Mature UI**: Well-tested, production-ready interface
- **Active Maintenance**: Regular updates and bug fixes from Postiz team
- **Community Support**: Large user base, extensive documentation
- **No Development Time**: Deploy and configure only
- **N8N Integration**: Pre-built N8N custom node available

### Cons ❌
- **Infrastructure Overhead**: Separate PostgreSQL + Redis instances
- **Limited Customization**: Hard to deeply customize without forking
- **License Constraints**: AGPL-3.0 requires open-sourcing modifications
- **Branding Effort**: Removing "Postiz" branding requires theme modifications
- **Maintenance Burden**: Must keep Postiz updated separately from main app
- **Resource Usage**: Additional ~2GB RAM, separate database
- **External Dependency**: Reliant on Postiz project continuity

### Costs
- **Infrastructure**: ~$10-20/month (VPS for Postiz + Redis)
- **Development**: ~8 hours setup + theming
- **Maintenance**: ~2 hours/month for updates

---

## Option 2: Hybrid Integration (Custom UI + SDK Backend)

### Architecture
```
┌─────────────────────────────────────────────────────┐
│        Stand Up Sydney (Single App)                 │
│                                                       │
│  ┌──────────────────────────────────────────────┐  │
│  │  Custom UI (React Components)                 │  │
│  │  - SocialScheduler.tsx                        │  │
│  │  - SocialCalendar.tsx                         │  │
│  │  - PlatformSelector.tsx                       │  │
│  │  - ContentComposer.tsx                        │  │
│  └────────────────────┬─────────────────────────┘  │
│                       │                              │
│                       ▼                              │
│  ┌──────────────────────────────────────────────┐  │
│  │  Service Layer (postiz-service.ts)           │  │
│  │  - Uses @postiz/node SDK                     │  │
│  │  - Wraps Postiz API calls                    │  │
│  └────────────────────┬─────────────────────────┘  │
│                       │                              │
│                       ▼                              │
│  ┌──────────────────────────────────────────────┐  │
│  │  Supabase Database                            │  │
│  │  - social_posts table (our schema)           │  │
│  │  - social_channels table                     │  │
│  │  - Stores scheduling metadata                │  │
│  └────────────────────┬─────────────────────────┘  │
└────────────────────────┼──────────────────────────┘
                         │
                         │ (API Calls via SDK)
                         ▼
                ┌────────────────────┐
                │  Postiz Cloud API  │
                │  (Hosted Service)  │
                └────────────────────┘
```

### System Requirements
- **No Additional Infrastructure**: Uses existing Supabase PostgreSQL
- **Node.js**: Current version (no need for v22+)
- **No Redis Required**: Queue handled by Postiz cloud service
- **SDK**: `@postiz/node` npm package

### Installation Steps

#### 1. Install NodeJS SDK
```bash
npm install @postiz/node
```

#### 2. Database Schema (Supabase)
```sql
-- Social media channels (connected platforms)
CREATE TABLE social_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- instagram, twitter, facebook, etc.
  channel_name TEXT NOT NULL,
  postiz_integration_id TEXT NOT NULL, -- Postiz's channel ID
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scheduled social media posts
CREATE TABLE social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES social_channels(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls TEXT[], -- URLs from media library
  scheduled_at TIMESTAMPTZ NOT NULL,
  posted_at TIMESTAMPTZ,
  postiz_post_id TEXT, -- Reference to Postiz's post ID
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, posted, failed
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE social_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own channels"
  ON social_channels FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own posts"
  ON social_posts FOR ALL
  USING (auth.uid() = user_id);
```

#### 3. Service Layer Implementation
```typescript
// src/services/social/postiz-service.ts
import Postiz from '@postiz/node';
import { supabase } from '@/integrations/supabase/client';

const POSTIZ_API_KEY = import.meta.env.VITE_POSTIZ_API_KEY;

class PostizService {
  private client: Postiz;

  constructor() {
    this.client = new Postiz(POSTIZ_API_KEY);
  }

  /**
   * Schedule a social media post
   */
  async schedulePost(params: {
    userId: string;
    channelId: string;
    content: string;
    mediaUrls?: string[];
    scheduledAt: Date;
  }) {
    try {
      // Get channel details from our database
      const { data: channel } = await supabase
        .from('social_channels')
        .select('postiz_integration_id')
        .eq('id', params.channelId)
        .single();

      if (!channel) throw new Error('Channel not found');

      // Create post via Postiz API
      const postizResponse = await this.client.posts.create({
        integrationId: channel.postiz_integration_id,
        content: params.content,
        media: params.mediaUrls,
        scheduledAt: params.scheduledAt,
      });

      // Store in our database
      const { data: post } = await supabase
        .from('social_posts')
        .insert({
          user_id: params.userId,
          channel_id: params.channelId,
          content: params.content,
          media_urls: params.mediaUrls || [],
          scheduled_at: params.scheduledAt.toISOString(),
          postiz_post_id: postizResponse.id,
          status: 'scheduled',
        })
        .select()
        .single();

      return post;
    } catch (error) {
      console.error('Failed to schedule post:', error);
      throw error;
    }
  }

  /**
   * Get user's connected channels
   */
  async getChannels(userId: string) {
    const { data, error } = await supabase
      .from('social_channels')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;
    return data;
  }

  /**
   * Get scheduled posts
   */
  async getScheduledPosts(userId: string) {
    const { data, error } = await supabase
      .from('social_posts')
      .select(`
        *,
        social_channels(platform, channel_name)
      `)
      .eq('user_id', userId)
      .order('scheduled_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  /**
   * Connect a new social platform
   */
  async connectPlatform(params: {
    userId: string;
    platform: string;
    channelName: string;
  }) {
    // Initiate OAuth flow via Postiz
    const authUrl = await this.client.integrations.getAuthUrl({
      platform: params.platform,
    });

    return { authUrl };
  }
}

export const postizService = new PostizService();
```

#### 4. UI Component Example
```typescript
// src/components/social/SocialScheduler.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { postizService } from '@/services/social/postiz-service';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';

export const SocialScheduler: React.FC = () => {
  const { user } = useAuth();
  const [channels, setChannels] = useState([]);
  const [content, setContent] = useState('');
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [scheduledDate, setScheduledDate] = useState(new Date());

  useEffect(() => {
    if (user?.id) {
      postizService.getChannels(user.id).then(setChannels);
    }
  }, [user?.id]);

  const handleSchedule = async () => {
    if (!selectedChannel || !content) return;

    await postizService.schedulePost({
      userId: user.id,
      channelId: selectedChannel.id,
      content,
      scheduledAt: scheduledDate,
    });

    // Reset form
    setContent('');
    toast({ title: 'Post scheduled successfully!' });
  };

  return (
    <Card className="professional-card">
      <CardHeader>
        <CardTitle>Schedule Social Post</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Channel selector */}
        <Select
          value={selectedChannel?.id}
          onValueChange={(id) =>
            setSelectedChannel(channels.find(c => c.id === id))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select platform" />
          </SelectTrigger>
          <SelectContent>
            {channels.map((channel) => (
              <SelectItem key={channel.id} value={channel.id}>
                {channel.platform} - {channel.channel_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Content composer */}
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's happening?"
          className="min-h-[120px]"
        />

        {/* Date picker */}
        <Calendar
          mode="single"
          selected={scheduledDate}
          onSelect={setScheduledDate}
        />

        {/* Schedule button */}
        <Button onClick={handleSchedule} className="w-full">
          Schedule Post
        </Button>
      </CardContent>
    </Card>
  );
};
```

### Customization (Stand Up Sydney Design)
- **Full Control**: Components match existing design system
- **Seamless UX**: Integrated into main app navigation
- **Branded**: No external "Postiz" references
- **Flexible**: Easy to add custom features

### Pros ✅
- **Seamless Integration**: Feels like native Stand Up Sydney feature
- **Design Consistency**: Matches our existing Tailwind/shadcn UI
- **No Infrastructure Overhead**: No Redis, uses existing Supabase
- **Data Ownership**: Scheduling data in our database
- **Flexibility**: Easy to add custom features and workflows
- **No License Concerns**: Only using SDK as library (not distributing)
- **Lower Resource Usage**: No separate app instance
- **Single Codebase**: Easier maintenance and updates

### Cons ❌
- **Development Time**: Must build all UI components from scratch
- **Feature Parity**: Won't have Postiz's Canva-like editor initially
- **API Rate Limits**: 30 requests/hour to Postiz API
- **Reliance on Postiz Cloud**: Depends on their hosted service uptime
- **OAuth Complexity**: Must handle OAuth flows for each platform
- **Testing Burden**: Must test all social platform integrations
- **No Community UI**: Can't leverage Postiz's battle-tested UI

### Costs
- **Infrastructure**: $0 (uses existing Supabase)
- **Postiz API**: Free tier available, Pro tier if needed
- **Development**: ~40-60 hours initial build
- **Maintenance**: ~4 hours/month for SDK updates

---

## Side-by-Side Comparison

| Aspect | Self-Hosted | Hybrid Integration |
|--------|-------------|-------------------|
| **Infrastructure** | Separate VM, PostgreSQL, Redis | Existing Supabase only |
| **Monthly Cost** | ~$15-25 | ~$0-10 |
| **Setup Time** | ~8 hours | ~40-60 hours |
| **UI Customization** | Limited (theme only) | Complete control |
| **Feature Set** | Full Postiz features | Custom features only |
| **Branding** | Requires theme work | Fully branded |
| **Maintenance** | 2 hrs/month (updates) | 4 hrs/month (SDK updates) |
| **Resource Usage** | +2GB RAM, separate DB | Minimal (SDK only) |
| **Data Location** | Postiz PostgreSQL | Our Supabase |
| **License Concerns** | AGPL-3.0 (sharing) | None (SDK usage) |
| **Future Scalability** | Good (proven platform) | Excellent (our control) |
| **User Experience** | Postiz UI style | Stand Up Sydney style |

---

## Recommended Approach: Hybrid Integration

### Rationale
1. **Better UX**: Seamless integration feels like native feature
2. **Lower Infrastructure Cost**: No additional servers needed
3. **Design Consistency**: Matches Stand Up Sydney branding perfectly
4. **Data Ownership**: All scheduling data in our Supabase
5. **Flexibility**: Easier to add custom automation workflows
6. **License Freedom**: No AGPL-3.0 concerns

### Implementation Phases

#### Phase 1: Foundation (Week 1-2)
- [ ] Install `@postiz/node` SDK
- [ ] Create database schema in Supabase
- [ ] Build `postiz-service.ts` wrapper
- [ ] Set up Postiz Cloud API account
- [ ] Test basic API connectivity

#### Phase 2: Core Features (Week 3-4)
- [ ] Build SocialScheduler component
- [ ] Platform connection flow (OAuth)
- [ ] Content composer with media library integration
- [ ] Calendar view for scheduled posts
- [ ] Post status tracking

#### Phase 3: Enhanced Features (Week 5-6)
- [ ] Multi-platform posting (post to multiple channels)
- [ ] Post templates and saved drafts
- [ ] Integration with Event system (auto-schedule event announcements)
- [ ] Integration with Media Library (select headshots/videos)
- [ ] Analytics dashboard

#### Phase 4: Automation (Week 7-8)
- [ ] N8N workflow integration
- [ ] Auto-schedule on event confirmation
- [ ] Pull content from Media Library "Headshots" folder
- [ ] Template-based post generation
- [ ] Bulk scheduling

---

## Alternative: Self-Hosted for Testing Only

If you want to **see both approaches** before committing:

### Week 1-2: Deploy Both
1. **Self-Hosted Test**: Deploy Postiz on subdomain with basic theming
2. **Hybrid Prototype**: Build minimal UI with SDK integration

### Week 3: Compare & Decide
- Test both with real use cases
- Evaluate UX, performance, customization
- Make final decision
- Proceed with winning approach

---

## Action Items

### Next Steps (Pending User Decision):
1. **Choose Approach**: Self-Hosted vs Hybrid vs Test Both
2. **Allocate Resources**: Development time and infrastructure budget
3. **Set Timeline**: Sprint dates and milestones
4. **Assign Tasks**: Developer assignments

### If Hybrid Chosen (Recommended):
- [ ] Set up Postiz Cloud account (or self-hosted for API backend only)
- [ ] Create API keys
- [ ] Begin Phase 1 implementation

### If Self-Hosted Chosen:
- [ ] Provision VPS for Postiz
- [ ] Set up Docker Compose
- [ ] Configure subdomain and SSL
- [ ] Begin theme customization

---

## Conclusion

**Hybrid Integration** is recommended for Stand Up Sydney because:
- Better aligns with our tech stack (Vite + React + Supabase)
- Provides seamless user experience
- Offers complete customization freedom
- Reduces infrastructure complexity
- Maintains data ownership and control
- Enables tighter integration with Media Library and Event automation

However, if **time-to-market** is critical, **Self-Hosted** offers faster deployment with proven UI, at the cost of infrastructure overhead and limited customization.

**User Decision Required**: Which approach should we proceed with for production?
