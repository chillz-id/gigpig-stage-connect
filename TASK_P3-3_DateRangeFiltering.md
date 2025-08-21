# P3.3: Date Range Filtering for Earnings

## **🎯 TASK OVERVIEW**
**Priority:** HIGH - Financial tracking essential
**Component:** Earnings filtering system
**Current Issue:** No date filtering for Total Earnings

## **🔍 PROBLEM DETAILS**
- Users can't filter earnings by date range
- Need month/year picker controls
- Should support "last month", "last year" etc.
- Currently showing all-time earnings only
- Need granular financial reporting

## **📁 FILES TO CHECK**
- `src/components/Dashboard/EarningsWidget.tsx` - Earnings display component
- `src/components/Filters/DateRangePicker.tsx` - Date range picker component
- `src/hooks/useEarnings.ts` - Earnings data management
- `src/pages/Dashboard/` - Dashboard earnings section
- Financial/earnings related API calls

## **✅ ACCEPTANCE CRITERIA**
1. Date range picker with month/year controls
2. Quick select options (This Month, Last Month, Last 3 Months, This Year, Last Year)
3. Custom date range selection
4. Earnings filtered by selected date range
5. Performance optimized for large date ranges
6. Default to current month on first load
7. Export filtered earnings data

## **🔧 TECHNICAL REQUIREMENTS**
1. **Date range picker component:**
   - Month/year dropdowns
   - Quick select presets
   - Custom range with start/end dates
   - Mobile-friendly interface

2. **Earnings query optimization:**
   ```sql
   -- Efficient earnings query with date filtering
   SELECT 
     SUM(amount) as total_earnings,
     COUNT(*) as gig_count,
     DATE_TRUNC('month', date) as month
   FROM earnings 
   WHERE comedian_id = $1 
     AND date >= $2 
     AND date <= $3
   GROUP BY DATE_TRUNC('month', date)
   ORDER BY month DESC;
   ```

3. **Date range presets:**
   ```typescript
   const DATE_PRESETS = {
     'This Month': { start: startOfMonth(new Date()), end: endOfMonth(new Date()) },
     'Last Month': { start: startOfMonth(subMonths(new Date(), 1)), end: endOfMonth(subMonths(new Date(), 1)) },
     'Last 3 Months': { start: startOfMonth(subMonths(new Date(), 3)), end: endOfMonth(new Date()) },
     'This Year': { start: startOfYear(new Date()), end: endOfYear(new Date()) },
     'Last Year': { start: startOfYear(subYears(new Date(), 1)), end: endOfYear(subYears(new Date(), 1)) },
     'All Time': { start: null, end: null }
   };
   ```

## **🔍 IMPLEMENTATION STRATEGY**
1. **Date range picker component:**
   ```typescript
   // src/components/Filters/DateRangePicker.tsx
   interface DateRangePickerProps {
     value: { start: Date | null; end: Date | null };
     onChange: (range: { start: Date | null; end: Date | null }) => void;
     presets?: Array<{ label: string; range: DateRange }>;
   }
   
   const DateRangePicker = ({ value, onChange, presets }) => {
     return (
       <div className="date-range-picker">
         {/* Quick select presets */}
         <div className="presets">
           {presets.map(preset => (
             <button onClick={() => onChange(preset.range)}>
               {preset.label}
             </button>
           ))}
         </div>
         
         {/* Custom date range */}
         <div className="custom-range">
           <input type="date" value={value.start} onChange={...} />
           <input type="date" value={value.end} onChange={...} />
         </div>
       </div>
     );
   };
   ```

2. **Earnings hook with filtering:**
   ```typescript
   // src/hooks/useEarnings.ts
   export const useEarnings = () => {
     const [dateRange, setDateRange] = useState(DATE_PRESETS['This Month']);
     const [earnings, setEarnings] = useState([]);
     
     const fetchEarnings = useCallback(async () => {
       let query = supabase
         .from('earnings')
         .select('*')
         .eq('comedian_id', user.id);
       
       if (dateRange.start) {
         query = query.gte('date', dateRange.start.toISOString());
       }
       if (dateRange.end) {
         query = query.lte('date', dateRange.end.toISOString());
       }
       
       const { data } = await query;
       setEarnings(data);
     }, [dateRange, user.id]);
     
     return { earnings, dateRange, setDateRange, fetchEarnings };
   };
   ```

## **🎨 UI/UX REQUIREMENTS**
1. **Date picker interface:**
   - Prominent position in earnings section
   - Quick select buttons for common ranges
   - Month/year dropdowns for easy navigation
   - Clear visual indication of selected range

2. **Earnings display with filtering:**
   ```
   📅 [This Month ▼] [Last Month] [Last 3 Months] [This Year] [Custom Range]
   
   💰 Total Earnings: $2,450.00
   🎤 Gigs Performed: 8
   📊 Average per Gig: $306.25
   📈 vs Previous Period: +15.3%
   ```

3. **Loading and empty states:**
   - Skeleton loader while fetching filtered data
   - "No earnings in this period" empty state
   - Error handling for invalid date ranges

## **📊 EARNINGS BREAKDOWN**
```typescript
// Earnings summary by filtered period:
interface EarningsSummary {
  totalEarnings: number;
  gigCount: number;
  averagePerGig: number;
  periodComparison: {
    previousTotal: number;
    percentageChange: number;
  };
  breakdown: {
    recurring: number;    // Weekly recurring shows
    oneTime: number;      // One-time events
    bonuses: number;      // Tips, bonuses, etc.
  };
}
```

## **🔗 INTEGRATION FEATURES**
1. **Export functionality:**
   - CSV export of filtered earnings
   - PDF report generation
   - Include gig details and payment dates

2. **Comparison features:**
   - Compare with previous period
   - Year-over-year comparison
   - Monthly trend analysis

3. **Dashboard integration:**
   - Update all earnings widgets with filtered data
   - Consistent date range across dashboard
   - Remember user's last selected range

## **🧪 TESTING INSTRUCTIONS**
1. **Test date range selection:**
   - Click "This Month" → shows current month earnings
   - Click "Last Month" → shows previous month
   - Select custom range → shows earnings for that period
   - Verify calculations are accurate

2. **Test edge cases:**
   - Period with no earnings → shows $0.00
   - Very large date range → performance acceptable
   - Invalid date range → shows error message
   - Future dates → handles gracefully

3. **Test mobile experience:**
   - Date picker works on touch devices
   - Dropdowns are touch-friendly
   - Layout responsive on small screens

4. **Test performance:**
   - Large date ranges load reasonably fast
   - No excessive API calls during selection
   - Proper loading states during fetch

## **📋 DEFINITION OF DONE**
- [ ] Date range picker with month/year controls implemented
- [ ] Quick select presets (This Month, Last Month, etc.)
- [ ] Custom date range selection working
- [ ] Earnings filter by selected date range
- [ ] Default to current month on load
- [ ] Performance optimized for large ranges
- [ ] Export functionality for filtered data
- [ ] Comparison with previous periods
- [ ] Mobile-responsive date picker
- [ ] Proper loading and error states