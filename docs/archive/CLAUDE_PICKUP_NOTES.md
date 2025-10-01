# Claude Code Pickup Notes - For Next Session

## Current State (January 7, 2025)
The Stand Up Sydney platform has been significantly enhanced with PWA capabilities and a complete invoicing system. All code is committed to main branch.

## Immediate Tasks for Next Session

### 1. Complete Service File Tracking
The following files were created but may not be in git:
- `/src/services/invoiceService.ts` - Complete invoice service implementation
- `/src/services/xeroService.ts` - Xero OAuth2 and API integration
- `/src/hooks/useInvoiceOperations.ts` - Invoice operations hook

**Action**: Run `git add` for these files if they show as untracked.

### 2. Generate PWA Icons
```bash
cd /root/agents
node scripts/generate-pwa-icons.js
# Follow instructions to create icons from existing logo
```

### 3. Configure Xero Integration
1. Add to Supabase environment:
   - `VITE_XERO_CLIENT_ID`
   - `VITE_XERO_CLIENT_SECRET`
2. Set up Xero app with redirect URI
3. Test OAuth flow in production

### 4. Run Database Migration
```sql
-- Execute migration at:
-- /root/agents/supabase/migrations/20250706230000_complete_invoicing_system.sql
```

### 5. Fix Service Worker
The service worker is temporarily disabled in `pwaService.ts` (lines 52-69). 
Uncomment to enable PWA functionality.

## Important Context

### File Structure
- Working directory: `/root/agents`
- Backend MCP: `/opt/standup-sydney-mcp`
- All frontend code in `src/`

### Recent Implementations
1. **PWA System**: Full offline support, caching, installation
2. **Invoicing**: Complete with Xero sync, automatic generation, tax handling
3. **Previous work**: Tours, tasks, flight tracking, promoter profiles

### Integration Points
- Invoices can be generated from ticket sales
- Xero syncs automatically on invoice create/update
- PWA caches all critical data for offline use
- Background sync handles offline actions

### Known Issues
1. Google OAuth users not saving properly (existing issue)
2. Service worker registration commented out for debugging
3. Invoice service files might need manual git add

## Quick Commands
```bash
# Start dev server
cd /root/agents && npm run dev

# Build for production
npm run build

# Run tests
npm test

# Deploy to production
./deploy.sh
```

## Key Files to Review
1. `/root/agents/CLAUDE.md` - Project instructions
2. `/root/agents/CLAUDE_SESSION_SUMMARY_07JAN2025.md` - Detailed session summary
3. `/root/agents/src/services/invoiceService.ts` - Core invoice logic
4. `/root/agents/src/services/xeroService.ts` - Xero integration

The platform is ready for production deployment once the environment variables are configured and migrations are run!