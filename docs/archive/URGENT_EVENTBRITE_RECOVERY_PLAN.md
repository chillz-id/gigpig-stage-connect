# 🚨 URGENT: Eventbrite Data Recovery Plan

## CRITICAL SITUATION SUMMARY

**What Happened:**
- Cleanup script intended to delete only Humanitix data
- **ACTUALLY DELETED ALL 2,500+ ENTRIES** from both Notion databases
- Deleted data includes Eventbrite attendee records that should have been preserved
- Data is currently in Notion's trash/archive but may be permanently lost after 30 days

**Affected Databases:**
- **Humanitix Attendees/Orders**: `1374745b-8cbe-804b-87a2-ec93b3385e01` (2,314 entries deleted)
- **Ticket Sales (Legacy)**: `2304745b-8cbe-81cd-9483-d7acc2377bd6` (186 entries deleted)

## IMMEDIATE RECOVERY OPTIONS

### ✅ OPTION 1: Automated Recovery Script (RECOMMENDED)

**Status**: Ready to run
**Location**: `/root/agents/restore-eventbrite-data.js`
**Estimated Time**: 5-15 minutes

**What it does:**
1. Searches Notion for archived pages containing Eventbrite data
2. Analyzes each page to confirm it's Eventbrite (not Humanitix)
3. Automatically restores only the Eventbrite entries
4. Provides detailed reporting of restored vs failed entries

**To run:**
```bash
cd /root/agents
node restore-eventbrite-data.js
```

**Identification Criteria:**
- Platform field = "Eventbrite"
- Order IDs matching Eventbrite numeric pattern (10+ digits)
- Raw data containing "eventbrite" or "eventbriteapi.com"
- Event names with Melbourne Comedy Festival patterns

### ✅ OPTION 2: Manual Notion Interface Recovery

**Status**: Available as backup
**Location**: Full guide in `/root/agents/EVENTBRITE_RECOVERY_GUIDE.md`

**Steps:**
1. Access Notion web interface at https://notion.so
2. Navigate to both affected databases
3. Access trash/archive for each database
4. Manually identify Eventbrite entries by platform field
5. Restore entries one by one

### ✅ OPTION 3: Database Webhook Recovery

**Status**: Available if other options fail
**Investigation**: Check Supabase `webhook_logs` table for Eventbrite webhook data

**To investigate:**
```bash
cd /root/agents
node check-recovery-simple.js
```

## RECOVERY VALIDATION STEPS

After running recovery:

1. **Count Verification**: Check how many entries were restored
2. **Data Integrity**: Verify customer names, emails, and order details
3. **Platform Filtering**: Confirm only Eventbrite data was restored
4. **Event Linkages**: Check that events are properly linked
5. **Humanitix Verification**: Ensure no Humanitix data was accidentally restored

## EXPECTED RECOVERY NUMBERS

Based on analysis of the cleanup log:
- **Total Deleted**: 2,500 entries across both databases
- **Expected Eventbrite**: 50-200 entries (estimated 5-10% of total)
- **Should NOT Restore**: 2,300+ Humanitix entries

## PREVENTION MEASURES

To prevent future data loss:

1. **Platform Filtering**: Modify cleanup scripts to filter by platform before deletion
2. **Backup Creation**: Export critical data before running destructive operations
3. **Sample Testing**: Test scripts on small datasets first
4. **Manual Review**: Always review what will be deleted before confirming
5. **Staged Approach**: Delete in small batches with verification

## TECHNICAL DETAILS

**Notion API Access:**
- Token: `ntn_191320...` (configured)
- Version: 2022-06-28
- Rate Limit: 3 requests/second (script includes delays)

**Database Structure:**
- Both databases use similar schema with Platform/Source fields
- Order IDs distinguish between platforms (Humanitix = alphanumeric, Eventbrite = numeric)
- Raw data fields contain original webhook payloads

## URGENCY LEVEL: CRITICAL

**Why This Is Urgent:**
- Notion may permanently delete archived data after 30 days
- Lost customer data impacts business operations
- Event reconciliation will fail without attendee records
- Financial reporting will be incomplete

## ACTION PLAN

### IMMEDIATE (Next 30 minutes):
1. ✅ Run automated recovery script: `node restore-eventbrite-data.js`
2. ✅ Verify results and count restored entries
3. ✅ Test a few restored entries for data integrity

### SHORT TERM (Next 2 hours):
1. 🔄 If automated recovery fails, proceed with manual recovery
2. 🔄 Run webhook log analysis to find additional data sources
3. 🔄 Create backup of all recovered data

### FOLLOW-UP (Next 24 hours):
1. 📋 Implement prevention measures in cleanup scripts
2. 📋 Create automated backup procedures
3. 📋 Document lessons learned and update procedures

## SUCCESS METRICS

**Recovery Success:**
- ✅ 90%+ of Eventbrite entries restored
- ✅ Customer data integrity maintained
- ✅ No Humanitix data accidentally restored
- ✅ Event linkages preserved

**Operational Success:**
- ✅ Ticket sales reports working correctly
- ✅ Customer lookup functioning
- ✅ Financial reconciliation complete

## CONTACTS & ESCALATION

If recovery fails or data is permanently lost:
1. Contact Notion support immediately
2. Check with Eventbrite API for order history re-sync
3. Review any additional backup systems
4. Assess impact on business operations

---

**CREATED**: 2025-09-22
**PRIORITY**: P0 - Critical Data Recovery
**OWNER**: Development Team
**STATUS**: Ready for Execution

⚠️ **TIME SENSITIVE**: Execute immediately to prevent permanent data loss