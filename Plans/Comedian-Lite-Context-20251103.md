# Comedian Lite Profile & Experience - Context Document
Created: 2025-11-03
Status: In Progress - CONTEXT PRESERVATION

## CRITICAL: What We're Actually Building

**comedian_lite** is a lightweight comedian profile tier for Stand Up Sydney platform.

## What Happened This Session

### User's Original Request
User provided console errors from `/gigs` page at localhost:8080 showing:
- 400 errors on `comedian_availability` table queries
- 400 errors on `comedians` table queries
- Various other console errors

### What I Did WRONG
1. ❌ I made changes to fix console errors WITHOUT understanding the bigger picture
2. ❌ I modified `availability-service.ts` - disabled comedian_availability queries
3. ❌ I modified `ProfileSwitcher.tsx` - changed comedians table query logic
4. ❌ I modified `events.ts` - changed column names in events query
5. ❌ I lost focus on what comedian_lite actually IS and started fixing random errors

### User's Feedback
- "Fuck the console errors" - I was making MASSIVE changes that broke things further
- "You lost focus!" - I wasn't building comedian_lite, I was randomly fixing errors
- "We don't use the events table for this" - I was modifying the wrong things

### What I Reverted
- Reverted ALL 3 files I modified in this session:
  - `src/services/availability/availability-service.ts`
  - `src/components/layout/ProfileSwitcher.tsx`
  - `src/services/api/events.ts`

## CRITICAL QUESTION STILL UNANSWERED

**What is the comedian_lite profile and experience?**
- What features does it have?
- What is different from full comedian profile?
- What was I actually supposed to be building?

## Next Steps

BEFORE doing ANYTHING:
1. Ask user to explain what comedian_lite IS
2. Ask what they actually wanted me to build
3. Understand the scope and requirements
4. THEN make a plan
5. THEN get approval
6. THEN execute

## DO NOT
- ❌ Fix random console errors without understanding context
- ❌ Make schema changes without understanding the feature
- ❌ Modify queries without understanding what table should be used
- ❌ Assume what needs to be built based on error messages
