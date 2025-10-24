/**
 * Deal Pipeline Page
 *
 * Visual kanban board for deal management with:
 * - Columns: proposed, negotiating, counter-offer, accepted, declined
 * - Drag-and-drop status updates
 * - Card shows: deal_type, artist, promoter, proposed_fee, deadline
 * - Filters: deal_type, agency, artist, date range
 * - Click card to open DealNegotiationEngine modal
 */
export const DealPipelinePage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Deal Pipeline</h1>
          <p className="text-muted-foreground">Manage active deals and negotiations</p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">Deal pipeline coming soon...</p>
      </div>
    </div>
  );
};
