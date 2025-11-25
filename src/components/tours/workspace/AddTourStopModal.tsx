import { useState } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

import type { CreateTourStopRequest } from '@/types/tour';

interface AddTourStopModalProps {
  isOpen: boolean;
  onClose: () => void;
  tourId: string;
  nextOrderIndex: number;
  onSubmit: (data: CreateTourStopRequest) => void;
  isLoading: boolean;
}

export function AddTourStopModal({
  isOpen,
  onClose,
  tourId,
  nextOrderIndex,
  onSubmit,
  isLoading
}: AddTourStopModalProps) {
  const [formData, setFormData] = useState<Partial<CreateTourStopRequest>>({
    tour_id: tourId,
    order_index: nextOrderIndex,
    venue_country: 'Australia',
    show_duration_minutes: 120
  });

  const resetForm = () => {
    setFormData({
      tour_id: tourId,
      order_index: nextOrderIndex,
      venue_country: 'Australia',
      show_duration_minutes: 120
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (formData.venue_name && formData.venue_city && formData.event_date && formData.show_time) {
      onSubmit(formData as CreateTourStopRequest);
      resetForm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Add Tour Stop</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Venue Name *"
              required
              placeholder="e.g., The Comedy Store"
              value={formData.venue_name || ''}
              onChange={(value) => setFormData(prev => ({ ...prev, venue_name: value }))}
            />
            <InputField
              label="City *"
              required
              placeholder="e.g., Sydney"
              value={formData.venue_city || ''}
              onChange={(value) => setFormData(prev => ({ ...prev, venue_city: value }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Event Date *"
              required
              type="date"
              value={formData.event_date || ''}
              onChange={(value) => setFormData(prev => ({ ...prev, event_date: value }))}
            />
            <InputField
              label="Show Time *"
              required
              type="time"
              value={formData.show_time || ''}
              onChange={(value) => setFormData(prev => ({ ...prev, show_time: value }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Venue Capacity"
              type="number"
              placeholder="0"
              value={formData.venue_capacity || ''}
              onChange={(value) => setFormData(prev => ({
                ...prev,
                venue_capacity: value ? parseInt(value, 10) : undefined
              }))}
            />
            <InputField
              label="Ticket Price"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.ticket_price || ''}
              onChange={(value) => setFormData(prev => ({
                ...prev,
                ticket_price: value ? parseFloat(value) : undefined
              }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Venue Address</label>
            <Textarea
              placeholder="Full venue address..."
              value={formData.venue_address || ''}
              onChange={(event) => setFormData(prev => ({ ...prev, venue_address: event.target.value }))}
              className="bg-slate-900/50 border-slate-600/50 text-white h-20 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-6">
            <Button
              type="button"
              className="professional-button"
              onClick={() => { onClose(); resetForm(); }}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isLoading ? 'Adding...' : 'Add Stop'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface InputFieldProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  step?: string;
}

function InputField({ label, value, onChange, type = 'text', required, placeholder, step }: InputFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <Input
        required={required}
        type={type}
        step={step}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="bg-slate-900/50 border-slate-600/50 text-white"
      />
    </div>
  );
}
