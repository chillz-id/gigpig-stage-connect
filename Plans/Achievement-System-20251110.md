# Achievement System: Profile-Type-Specific Gamification
Created: 2025-11-10
Status: Pending

## Overview
Design and implement a comprehensive achievement/badge system for the Stand Up Sydney platform with profile-type-specific achievements for Comedians, Promoters, Photographers, Agencies, and Venues. The system will gamify user engagement and milestone recognition across different user journeys.

## Inspiration
From the mock notification data in the original system:
```
{
  type: 'achievement',
  title: 'Achievement Unlocked',
  message: 'Congratulations! You\'ve performed 50 shows',
  timestamp: '1 week ago',
  isRead: true,
}
```

## Achievement Categories

### 1. Comedian Achievements

**Performance Milestones**
- 🎤 **First Timer** - Performed your first show
- 🎤 **Regular** - Performed 10 shows
- 🎤 **Veteran** - Performed 50 shows
- 🎤 **Legend** - Performed 100 shows
- 🎤 **Icon** - Performed 250 shows

**Crowd Work**
- 😂 **Crowd Pleaser** - Received 10+ five-star reviews
- 😂 **Audience Favorite** - Received 50+ five-star reviews
- 😂 **Standing Ovation** - Achieved perfect score average across 20+ shows

**Booking Success**
- 📅 **Fully Booked** - Confirmed 5 gigs in a single month
- 📅 **Weekend Warrior** - Performed Friday, Saturday, Sunday in one weekend
- 📅 **Marathon Runner** - Performed 30+ shows in a single month

**Financial Milestones**
- 💰 **First Paycheck** - Earned first $1 from comedy
- 💰 **Side Hustle** - Earned $1,000 total
- 💰 **Going Pro** - Earned $5,000 total
- 💰 **Full Time** - Earned $20,000 total

**Network Building**
- 🤝 **Networker** - Received 10 vouches
- 🤝 **Well Connected** - Received 25 vouches
- 🤝 **Community Leader** - Received 50 vouches

### 2. Promoter Achievements

**Event Organization**
- 🎪 **Event Starter** - Created first event
- 🎪 **Organizer** - Created 10 events
- 🎪 **Producer** - Created 50 events
- 🎪 **Impresario** - Created 100 events

**Ticket Sales**
- 🎟️ **Sold Out** - Sold out first show
- 🎟️ **Consistent Draw** - Sold out 10 shows
- 🎟️ **Box Office Gold** - Sold 1,000 total tickets
- 🎟️ **Blockbuster** - Sold 5,000 total tickets

**Talent Scouting**
- 👀 **Talent Spotter** - Booked 25 different comedians
- 👀 **Curator** - Booked 50 different comedians
- 👀 **Kingmaker** - Booked 100 different comedians

**Community Building**
- 🌟 **Scene Builder** - Hosted shows with 50+ unique comedians
- 🌟 **Comedy Hub** - Hosted 100+ shows in a single venue

### 3. Photographer Achievements

**Portfolio Building**
- 📸 **First Shoot** - Completed first comedy photoshoot
- 📸 **Building Portfolio** - Shot 10 different comedians
- 📸 **Established Shooter** - Shot 50 different comedians
- 📸 **Scene Photographer** - Shot 100+ comedians

**Coverage**
- 🎬 **Event Documenter** - Covered 25 live shows
- 🎬 **Resident Photographer** - Covered 100 live shows
- 🎬 **Archive Builder** - Uploaded 500+ photos

**Client Satisfaction**
- ⭐ **Trusted Eye** - Received 25 five-star reviews
- ⭐ **Go-To Photographer** - Received 50 five-star reviews

### 4. Agency/Manager Achievements

**Roster Building**
- 👥 **Agency Starter** - Signed first comedian
- 👥 **Growing Stable** - Representing 5 comedians
- 👥 **Full Roster** - Representing 15 comedians
- 👥 **Comedy Empire** - Representing 30+ comedians

**Bookings Management**
- 📋 **Deal Maker** - Secured 50 bookings for roster
- 📋 **Power Broker** - Secured 200 bookings for roster

**Revenue Generation**
- 💼 **First Commission** - Earned first commission
- 💼 **Profitable** - Generated $10,000 in bookings
- 💼 **Major Player** - Generated $50,000 in bookings

### 5. Venue Achievements

**Event Hosting**
- 🏛️ **Open for Comedy** - Hosted first show
- 🏛️ **Regular Venue** - Hosted 25 shows
- 🏛️ **Comedy Club** - Hosted 100 shows
- 🏛️ **Institution** - Hosted 500 shows

**Audience Building**
- 🎭 **Packed House** - Sold out 10 shows
- 🎭 **Consistent Draw** - Average 80%+ capacity across 20 shows
- 🎭 **Must-See Venue** - Sold out 50 shows

**Talent Relations**
- 🤝 **Comedian's Favorite** - Received 50+ positive reviews from performers
- 🤝 **Premier Venue** - Hosted headliners from 10+ different countries

## Technical Implementation

### Database Schema

**achievements table**
```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL, -- e.g., 'comedian_first_show'
  profile_type TEXT NOT NULL, -- 'comedian' | 'promoter' | 'photographer' | 'manager' | 'venue'
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL, -- emoji or icon identifier
  tier TEXT NOT NULL, -- 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
  points INTEGER DEFAULT 0, -- gamification points
  requirement JSONB NOT NULL, -- flexible requirement structure
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_achievements_profile_type ON achievements(profile_type);
CREATE INDEX idx_achievements_code ON achievements(code);
```

**user_achievements table**
```sql
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  progress JSONB DEFAULT '{}', -- for tracking progress towards next achievement
  notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_unlocked_at ON user_achievements(unlocked_at);
CREATE INDEX idx_user_achievements_notified ON user_achievements(notified) WHERE notified = false;
```

**achievement_progress table** (for multi-step achievements)
```sql
CREATE TABLE achievement_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  current_value INTEGER DEFAULT 0,
  target_value INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  last_updated TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_achievement_progress_user_id ON achievement_progress(user_id);
```

### Requirement Structure Examples

**Simple Count Requirement**
```json
{
  "type": "count",
  "metric": "shows_performed",
  "threshold": 50
}
```

**Complex Multi-Condition Requirement**
```json
{
  "type": "complex",
  "conditions": [
    {"metric": "shows_performed", "operator": ">=", "value": 100},
    {"metric": "average_rating", "operator": ">=", "value": 4.5}
  ],
  "operator": "AND"
}
```

**Time-Based Requirement**
```json
{
  "type": "time_based",
  "metric": "shows_performed",
  "threshold": 30,
  "timeframe": "month"
}
```

### Services & Hooks

**AchievementService** (`src/services/achievementService.ts`)
- `checkAndUnlockAchievements(userId, profileType)` - Check all pending achievements
- `unlockAchievement(userId, achievementCode)` - Manually unlock an achievement
- `getAchievements(profileType)` - Get all achievements for a profile type
- `getUserAchievements(userId)` - Get unlocked achievements for user
- `getAchievementProgress(userId, achievementCode)` - Get progress towards achievement
- `updateAchievementProgress(userId, achievementCode, value)` - Update progress

**useAchievements Hook** (`src/hooks/useAchievements.ts`)
```typescript
export const useAchievements = () => {
  const { user, profile } = useAuth();

  // Get all achievements for current profile type
  const { data: availableAchievements } = useQuery(...)

  // Get user's unlocked achievements
  const { data: unlockedAchievements } = useQuery(...)

  // Get achievements with progress
  const { data: achievementProgress } = useQuery(...)

  return {
    availableAchievements,
    unlockedAchievements,
    achievementProgress,
    totalPoints,
    completionPercentage
  };
};
```

### UI Components

**AchievementBadge Component** (`src/components/achievements/AchievementBadge.tsx`)
- Display achievement icon, name, description
- Show locked/unlocked state
- Progress bar for in-progress achievements
- Tooltip with details

**AchievementModal Component** (`src/components/achievements/AchievementModal.tsx`)
- Celebration animation when achievement unlocked
- Share to social media
- View all achievements

**AchievementsPanel Component** (`src/components/achievements/AchievementsPanel.tsx`)
- Grid view of all achievements
- Filter by: All, Unlocked, Locked, In Progress
- Sort by: Recent, Points, Difficulty
- Search achievements

**ProfileAchievementsSection** (`src/components/profile/ProfileAchievementsSection.tsx`)
- Display top 3-5 achievements on profile
- Total achievement count badge
- Link to full achievements page

### Achievement Trigger Points

**Automatic Triggers** (via database triggers or event handlers):
1. **After gig confirmation** → Check show count achievements
2. **After payment received** → Check earnings achievements
3. **After review submitted** → Check rating achievements
4. **After vouch given** → Check network achievements
5. **After event created** → Check promoter achievements
6. **After ticket sale** → Check ticket sales achievements
7. **After photo upload** → Check photographer achievements

**Scheduled Checks** (via cron job):
- Daily: Check time-based achievements (monthly targets, etc.)
- Weekly: Aggregate metrics and check complex achievements

### Notification Integration

When achievement is unlocked:
```typescript
await notificationService.createNotification({
  user_id: userId,
  type: 'achievement',
  title: 'Achievement Unlocked!',
  message: `Congratulations! You've unlocked: ${achievement.name}`,
  data: {
    achievement_id: achievement.id,
    achievement_code: achievement.code,
    achievement_icon: achievement.icon,
    points_earned: achievement.points
  },
  action_url: '/profile?tab=achievements',
  action_label: 'View Achievement'
});
```

## Gamification Elements

### Point System
- Bronze: 10 points
- Silver: 25 points
- Gold: 50 points
- Platinum: 100 points
- Diamond: 250 points

### Levels/Ranks (based on total points)
- Level 1: Newcomer (0-99 points)
- Level 2: Rising Star (100-499 points)
- Level 3: Established (500-999 points)
- Level 4: Professional (1,000-2,499 points)
- Level 5: Elite (2,500-4,999 points)
- Level 6: Legend (5,000+ points)

### Leaderboards
- Top achievers by profile type
- Monthly achievement leaders
- Fastest to unlock specific achievements

## UI/UX Considerations

### Achievement Display Locations
1. **Profile page** - Dedicated achievements tab
2. **Dashboard** - Recent achievements widget
3. **Notifications** - Achievement unlock notifications
4. **Profile header** - Total achievement count badge
5. **Public profile** - Display showcased achievements (user can select top 3)

### Visual Design
- Use existing Stand Up Sydney color scheme
- Gradient backgrounds for achievement cards based on tier:
  - Bronze: warm orange/brown gradient
  - Silver: cool gray/white gradient
  - Gold: vibrant yellow/gold gradient
  - Platinum: purple/blue gradient
  - Diamond: rainbow/prismatic gradient
- Animated confetti/celebration when achievement unlocks
- Progress bars with professional-button styling

### Accessibility
- Screen reader support for achievement descriptions
- Keyboard navigation for achievement grid
- High contrast mode for locked/unlocked states
- Alternative text for achievement icons

## Privacy & Settings

**User preferences**:
- Show/hide achievements on public profile
- Select which achievements to showcase (top 3)
- Email notifications for achievements (on/off)
- Share achievements to social media (opt-in)

## Future Enhancements

### Phase 2 Features
- **Secret Achievements** - Hidden until unlocked
- **Time-Limited Achievements** - Seasonal or event-based
- **Collaborative Achievements** - Unlock with other users
- **Achievement Streaks** - Consecutive monthly achievements
- **Custom Badges** - Admin-awarded special recognitions
- **Achievement Marketplace** - Trade or gift achievements
- **Profile Themes** - Unlock themes based on achievements

### Integration Ideas
- **Social Sharing** - Auto-post to Instagram/Twitter when achievement unlocked
- **EPK Integration** - Display achievements on EPK
- **Booking Incentives** - Promoters see comedian achievement levels
- **Referral Achievements** - Unlock for inviting other users

## Implementation Phases

### Phase 1: Core Infrastructure (2-3 weeks)
1. Database schema & migrations
2. Achievement service & trigger system
3. Basic UI components (badge, modal)
4. Seed initial achievement definitions
5. Notification integration

### Phase 2: Profile Integration (1-2 weeks)
1. Profile achievements tab
2. Dashboard achievements widget
3. Public profile showcase
4. Settings & preferences

### Phase 3: Gamification Features (1-2 weeks)
1. Points system
2. Levels & ranks
3. Leaderboards
4. Progress tracking UI

### Phase 4: Enhancement & Polish (1 week)
1. Social sharing
2. Celebration animations
3. Achievement statistics
4. Performance optimization

## Testing Checklist
- [ ] Achievement triggers fire correctly for all event types
- [ ] Progress tracking updates accurately
- [ ] Notifications sent when achievements unlock
- [ ] No duplicate achievement unlocks
- [ ] Leaderboards calculate correctly
- [ ] Public/private visibility settings work
- [ ] Cross-profile-type achievements isolated correctly
- [ ] Performance tested with 1000+ achievements per user

## Success Metrics
- % of users with at least 1 achievement unlocked
- Average achievements per user by profile type
- Time to first achievement
- Achievement notification open rate
- Social sharing rate
- Return visits after achievement unlock
- Correlation between achievement level and platform engagement

## Notes
- Start with 5-10 achievements per profile type
- Gradually add more based on user feedback
- Monitor which achievements are most/least unlocked
- Adjust thresholds based on actual user behavior
- Consider seasonal/special event achievements for launches
- Celebrate platform milestones with community-wide achievements

## Related Documentation
- Notification System: `/root/agents/supabase/migrations/20250706160000_create_notification_system.sql`
- User Roles: `/root/agents/src/config/sidebarMenuItems.tsx`
- Profile Types: `comedian`, `promoter`, `photographer`, `manager`, `venue`
