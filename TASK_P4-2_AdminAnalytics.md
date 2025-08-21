# P4.2: Admin Analytics Overhaul

## **🎯 TASK OVERVIEW**
**Priority:** HIGH - Business intelligence critical
**Component:** Admin dashboard analytics
**Current Issue:** Analytics don't match business needs

## **🔍 PROBLEM DETAILS**
- Current analytics show user growth/distribution (not useful)
- Need tickets by ticketing provider analytics
- Need tickets by suburb wheel charts
- Need Facebook Ads ROAS if API available
- Replace "Total Users" with "Total Tickets Sold"
- Need actionable business metrics

## **📁 FILES TO CHECK**
- `src/pages/Admin/Analytics.tsx` - Main analytics page
- `src/components/Admin/Analytics/` - Analytics components directory
- `src/hooks/useAdminAnalytics.ts` - Analytics data management
- `src/lib/facebookAds.ts` - Facebook Ads API integration
- Ticket sales and provider data queries

## **✅ ACCEPTANCE CRITERIA**
1. Replace user growth with tickets by provider chart
2. Add tickets by suburb wheel/pie chart
3. Show "Total Tickets Sold" instead of "Total Users"
4. Facebook Ads ROAS integration (if API available)
5. Date range filtering for all analytics
6. Export functionality for reports
7. Real-time or near real-time data updates

## **🔧 TECHNICAL REQUIREMENTS**
1. **Tickets by Provider Analytics:**
   ```typescript
   interface TicketProviderData {
     provider: 'Humanitix' | 'Eventbrite' | 'TryBooking' | 'Direct';
     ticketsSold: number;
     revenue: number;
     percentage: number;
     growth: number; // vs previous period
   }
   ```

2. **Tickets by Suburb Analytics:**
   ```typescript
   interface SuburbData {
     suburb: string;
     ticketsSold: number;
     revenue: number;
     percentage: number;
     coordinates?: { lat: number; lng: number };
   }
   ```

3. **Facebook Ads ROAS:**
   ```typescript
   interface FacebookAdsData {
     spend: number;
     revenue: number;
     roas: number; // Revenue / Spend
     impressions: number;
     clicks: number;
     conversions: number;
     ctr: number; // Click Through Rate
     cpc: number; // Cost Per Click
   }
   ```

## **🔍 IMPLEMENTATION STRATEGY**
1. **Analytics dashboard redesign:**
   ```typescript
   // src/pages/Admin/Analytics.tsx
   const AdminAnalytics = () => {
     return (
       <div className="admin-analytics">
         {/* Key Metrics Cards */}
         <div className="metrics-grid">
           <MetricCard title="Total Tickets Sold" value={totalTickets} />
           <MetricCard title="Total Revenue" value={totalRevenue} />
           <MetricCard title="Events This Month" value={eventsCount} />
           <MetricCard title="Facebook ROAS" value={facebookROAS} />
         </div>
         
         {/* Charts Section */}
         <div className="charts-grid">
           <TicketsByProviderChart data={providerData} />
           <TicketsBySuburbChart data={suburbData} />
           <RevenueGrowthChart data={revenueData} />
           <FacebookAdsChart data={facebookData} />
         </div>
       </div>
     );
   };
   ```

2. **Ticket provider analytics:**
   ```sql
   -- Query for tickets by provider
   SELECT 
     ticket_provider,
     COUNT(*) as tickets_sold,
     SUM(price) as revenue,
     COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
   FROM tickets t
   JOIN events e ON t.event_id = e.id
   WHERE t.created_at >= $1 AND t.created_at <= $2
   GROUP BY ticket_provider
   ORDER BY tickets_sold DESC;
   ```

3. **Suburb analytics:**
   ```sql
   -- Query for tickets by suburb (from customer data)
   SELECT 
     customer_suburb,
     COUNT(*) as tickets_sold,
     SUM(price) as revenue,
     COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
   FROM tickets t
   JOIN customers c ON t.customer_id = c.id
   WHERE t.created_at >= $1 AND t.created_at <= $2
     AND customer_suburb IS NOT NULL
   GROUP BY customer_suburb
   ORDER BY tickets_sold DESC
   LIMIT 20;
   ```

## **📊 CHART COMPONENTS**
1. **Tickets by Provider Chart:**
   ```typescript
   // src/components/Admin/Analytics/TicketsByProviderChart.tsx
   const TicketsByProviderChart = ({ data }) => (
     <div className="chart-container">
       <h3>Tickets by Provider</h3>
       <BarChart data={data}>
         <XAxis dataKey="provider" />
         <YAxis />
         <Tooltip />
         <Bar dataKey="ticketsSold" fill="#8884d8" />
         <Bar dataKey="revenue" fill="#82ca9d" />
       </BarChart>
       
       {/* Summary table */}
       <table className="provider-summary">
         <thead>
           <tr>
             <th>Provider</th>
             <th>Tickets</th>
             <th>Revenue</th>
             <th>Share</th>
           </tr>
         </thead>
         <tbody>
           {data.map(provider => (
             <tr key={provider.provider}>
               <td>{provider.provider}</td>
               <td>{provider.ticketsSold}</td>
               <td>${provider.revenue}</td>
               <td>{provider.percentage}%</td>
             </tr>
           ))}
         </tbody>
       </table>
     </div>
   );
   ```

2. **Tickets by Suburb Wheel Chart:**
   ```typescript
   // src/components/Admin/Analytics/TicketsBySuburbChart.tsx
   const TicketsBySuburbChart = ({ data }) => (
     <div className="chart-container">
       <h3>Tickets by Suburb</h3>
       <PieChart>
         <Pie
           data={data}
           dataKey="ticketsSold"
           nameKey="suburb"
           cx="50%"
           cy="50%"
           outerRadius={80}
           fill="#8884d8"
           label
         />
         <Tooltip />
         <Legend />
       </PieChart>
       
       {/* Top suburbs list */}
       <div className="top-suburbs">
         <h4>Top Suburbs</h4>
         {data.slice(0, 10).map((suburb, index) => (
           <div key={suburb.suburb} className="suburb-item">
             <span>#{index + 1} {suburb.suburb}</span>
             <span>{suburb.ticketsSold} tickets</span>
           </div>
         ))}
       </div>
     </div>
   );
   ```

## **📱 FACEBOOK ADS INTEGRATION**
```typescript
// src/lib/facebookAds.ts
export const fetchFacebookAdsData = async (dateRange: DateRange) => {
  try {
    const response = await fetch('/api/facebook-ads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: 'spend,revenue,impressions,clicks,conversions',
        date_preset: 'this_month',
        access_token: process.env.FACEBOOK_ADS_TOKEN
      })
    });
    
    const data = await response.json();
    
    return {
      spend: data.spend,
      revenue: data.revenue,
      roas: data.revenue / data.spend,
      impressions: data.impressions,
      clicks: data.clicks,
      conversions: data.conversions,
      ctr: (data.clicks / data.impressions) * 100,
      cpc: data.spend / data.clicks
    };
  } catch (error) {
    console.error('Failed to fetch Facebook Ads data:', error);
    return null;
  }
};
```

## **🎨 UI/UX REQUIREMENTS**
1. **Key metrics dashboard:**
   ```
   [📊 Total Tickets Sold: 1,234]  [💰 Total Revenue: $45,678]
   [🎤 Events This Month: 23]      [📈 Facebook ROAS: 3.2x]
   ```

2. **Chart layout:**
   - Responsive grid layout
   - Charts resize based on screen size
   - Export buttons for each chart
   - Date range picker affects all charts

3. **Data visualization:**
   - Color-coded provider charts
   - Interactive suburb wheel chart
   - Trend lines for revenue growth
   - Tooltips with detailed information

## **🔗 EXPORT FUNCTIONALITY**
```typescript
// Export options for each analytics section
const exportAnalytics = {
  ticketsByProvider: () => exportToCSV(providerData, 'tickets-by-provider'),
  ticketsBySuburb: () => exportToCSV(suburbData, 'tickets-by-suburb'),
  facebookAds: () => exportToCSV(facebookData, 'facebook-ads-performance'),
  fullReport: () => generatePDFReport(allAnalyticsData)
};
```

## **🧪 TESTING INSTRUCTIONS**
1. **Test provider analytics:**
   - Verify tickets counted correctly by provider
   - Check revenue calculations match
   - Test date range filtering
   - Ensure percentages add up to 100%

2. **Test suburb analytics:**
   - Verify suburb data from customer information
   - Check pie chart displays correctly
   - Test with missing suburb data
   - Verify top suburbs list accuracy

3. **Test Facebook Ads integration:**
   - If API available, test ROAS calculation
   - Verify spend and revenue data
   - Test error handling for API failures
   - Check data refresh frequency

4. **Test overall dashboard:**
   - All metrics update with date filter
   - Export functionality works
   - Charts responsive on mobile
   - Performance acceptable with large datasets

## **📋 DEFINITION OF DONE**
- [ ] Tickets by provider analytics implemented
- [ ] Tickets by suburb wheel chart working
- [ ] "Total Tickets Sold" replaces "Total Users"
- [ ] Facebook Ads ROAS integration (if API available)
- [ ] Date range filtering for all analytics
- [ ] Export functionality for reports
- [ ] Mobile-responsive analytics dashboard
- [ ] Real-time data updates
- [ ] Proper error handling for missing data
- [ ] Performance optimized for large datasets