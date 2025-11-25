import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

import type { CreateTourStopRequest, TourStop } from '@/types/tour';

interface TourStopDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stop: TourStop | null;
  isEditable: boolean;
  onUpdate: (data: Partial<CreateTourStopRequest>) => void;
  isLoading: boolean;
}

export function TourStopDetailsModal({
  isOpen,
  onClose,
  stop,
  isEditable,
  onUpdate,
  isLoading
}: TourStopDetailsModalProps) {
  if (!stop) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {stop.venue_name} - {stop.venue_city}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailSection title="Event Details">
              <DetailRow label="Date" value={new Date(stop.event_date).toLocaleDateString()} />
              <DetailRow label="Show Time" value={stop.show_time} />
              <DetailRow label="Duration" value={`${stop.show_duration_minutes} minutes`} />
              <DetailRow label="Capacity" value={stop.venue_capacity?.toLocaleString() || 'TBD'} />
            </DetailSection>

            <DetailSection title="Sales & Revenue">
              <DetailRow label="Tickets Sold" value={stop.tickets_sold.toLocaleString()} />
              <DetailRow label="Revenue" value={`$${stop.revenue.toLocaleString()}`} />
              <DetailRow label="Expenses" value={`$${stop.expenses.toLocaleString()}`} />
              <DetailRow label="Ticket Price" value={stop.ticket_price ? `$${stop.ticket_price}` : 'TBD'} />
            </DetailSection>
          </div>

          <div className="flex gap-3 pt-6">
            <Button
              className="professional-button"
              onClick={onClose}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Close
            </Button>
            {isEditable && (
              <Button
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                onClick={() => onUpdate({})}
              >
                Edit Details
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="font-semibold mb-3">{title}</h4>
      <div className="space-y-2 text-sm">{children}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="text-gray-400">{label}:</span> {value}
    </p>
  );
}
