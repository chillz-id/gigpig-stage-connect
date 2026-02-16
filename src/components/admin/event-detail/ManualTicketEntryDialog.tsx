import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, DollarSign, Ticket, Calculator } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTicketingPartners } from '@/hooks/useTicketingPartners';
import { useManualTicketEntries } from '@/hooks/useManualTicketEntries';
import LoadingSpinner from '@/components/LoadingSpinner';

interface ManualTicketEntryDialogProps {
  open: boolean;
  onClose: () => void;
  eventId: string;
  onSuccess?: () => void;
}

interface FormData {
  partnerId: string;
  ticketCount: string;
  grossRevenue: string;
  entryDate: Date;
  referenceId: string;
  notes: string;
}

const initialFormData: FormData = {
  partnerId: '',
  ticketCount: '',
  grossRevenue: '',
  entryDate: new Date(),
  referenceId: '',
  notes: '',
};

export function ManualTicketEntryDialog({
  open,
  onClose,
  eventId,
  onSuccess,
}: ManualTicketEntryDialogProps) {
  const { activePartners, isLoading: partnersLoading } = useTicketingPartners();
  const { createEntry, isCreating } = useManualTicketEntries(eventId);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  // Get selected partner's commission rate
  const selectedPartner = useMemo(
    () => activePartners.find(p => p.id === formData.partnerId),
    [activePartners, formData.partnerId]
  );

  // Calculate commission and net revenue
  const calculations = useMemo(() => {
    const gross = parseFloat(formData.grossRevenue) || 0;
    const rate = selectedPartner?.commission_rate || 0;
    const commission = gross * (rate / 100);
    const net = gross - commission;

    return {
      commissionRate: rate,
      commissionAmount: commission,
      netRevenue: net,
    };
  }, [formData.grossRevenue, selectedPartner?.commission_rate]);

  const handleClose = () => {
    setFormData(initialFormData);
    onClose();
  };

  const handleSubmit = () => {
    if (!formData.partnerId || !formData.ticketCount || !formData.grossRevenue) {
      return;
    }

    const ticketCount = parseInt(formData.ticketCount, 10);
    const grossRevenue = parseFloat(formData.grossRevenue);

    if (isNaN(ticketCount) || ticketCount <= 0) return;
    if (isNaN(grossRevenue) || grossRevenue < 0) return;

    createEntry(
      {
        event_id: eventId,
        partner_id: formData.partnerId,
        ticket_count: ticketCount,
        gross_revenue: grossRevenue,
        commission_rate: calculations.commissionRate,
        entry_date: format(formData.entryDate, 'yyyy-MM-dd'),
        reference_id: formData.referenceId || null,
        notes: formData.notes || null,
      },
      {
        onSuccess: () => {
          handleClose();
          onSuccess?.();
        },
      }
    );
  };

  const isValid =
    formData.partnerId &&
    formData.ticketCount &&
    parseInt(formData.ticketCount, 10) > 0 &&
    formData.grossRevenue &&
    parseFloat(formData.grossRevenue) >= 0;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="bg-gray-900 border-white/20 text-white sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            Add Manual Ticket Sale
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Record ticket sales from a ticketing partner for this event.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Partner Selection */}
          <div className="space-y-2">
            <Label htmlFor="partner" className="text-white">
              Ticketing Partner *
            </Label>
            <Select
              value={formData.partnerId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, partnerId: value }))
              }
            >
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Select a partner..." />
              </SelectTrigger>
              <SelectContent>
                {partnersLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : (
                  activePartners.map((partner) => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.name} ({partner.commission_rate}%)
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Ticket Count and Gross Revenue */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ticketCount" className="text-white">
                Ticket Count *
              </Label>
              <Input
                id="ticketCount"
                type="number"
                min="1"
                value={formData.ticketCount}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, ticketCount: e.target.value }))
                }
                placeholder="e.g., 10"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grossRevenue" className="text-white">
                Gross Revenue *
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                <Input
                  id="grossRevenue"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.grossRevenue}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, grossRevenue: e.target.value }))
                  }
                  placeholder="e.g., 500.00"
                  className="pl-8 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
              </div>
            </div>
          </div>

          {/* Live Calculation Preview */}
          {selectedPartner && formData.grossRevenue && (
            <div className="p-4 bg-white/5 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
                <Calculator className="w-4 h-4" />
                Commission Calculation
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-white/60">Commission Rate</div>
                  <div className="text-white font-medium">
                    {calculations.commissionRate}%
                  </div>
                </div>
                <div>
                  <div className="text-white/60">Commission</div>
                  <div className="text-red-400 font-medium">
                    -${calculations.commissionAmount.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-white/60">Net Revenue</div>
                  <div className="text-green-400 font-medium">
                    ${calculations.netRevenue.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Entry Date */}
          <div className="space-y-2">
            <Label className="text-white">Entry Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-start text-left font-normal bg-white/10 border border-white/20 hover:bg-white/20',
                    !formData.entryDate && 'text-white/40'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.entryDate ? (
                    format(formData.entryDate, 'PPP')
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.entryDate}
                  onSelect={(date) =>
                    date && setFormData((prev) => ({ ...prev, entryDate: date }))
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Reference ID */}
          <div className="space-y-2">
            <Label htmlFor="referenceId" className="text-white">
              Reference ID (optional)
            </Label>
            <Input
              id="referenceId"
              value={formData.referenceId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, referenceId: e.target.value }))
              }
              placeholder="Partner's booking reference..."
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-white">
              Notes (optional)
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Additional notes..."
              rows={2}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={handleClose}
            className="text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isCreating}
            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
          >
            {isCreating ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Saving...
              </>
            ) : (
              'Save Entry'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
