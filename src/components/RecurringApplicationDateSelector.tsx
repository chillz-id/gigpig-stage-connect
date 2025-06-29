
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RecurringApplicationDateSelectorProps {
  event: any;
  isOpen: boolean;
  onClose: () => void;
  onApply: (event: any, selectedDates: Date[]) => void;
}

export const RecurringApplicationDateSelector: React.FC<RecurringApplicationDateSelectorProps> = ({
  event,
  isOpen,
  onClose,
  onApply
}) => {
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  if (!event) return null;

  // Generate upcoming dates for this recurring event (mock data for now)
  const upcomingDates = [
    new Date('2024-07-02'),
    new Date('2024-07-09'),
    new Date('2024-07-16'),
    new Date('2024-07-23'),
    new Date('2024-07-30'),
  ].filter(date => date >= new Date());

  const toggleDate = (dateString: string) => {
    const newSelectedDates = new Set(selectedDates);
    if (selectedDates.has(dateString)) {
      newSelectedDates.delete(dateString);
    } else {
      newSelectedDates.add(dateString);
    }
    setSelectedDates(newSelectedDates);
  };

  const handleApply = () => {
    if (selectedDates.size === 0) {
      toast({
        title: "Please select dates",
        description: "You need to select at least one date to apply.",
        variant: "destructive",
      });
      return;
    }

    const selectedDateObjects = Array.from(selectedDates).map(dateStr => new Date(dateStr));
    onApply(event, selectedDateObjects);
    onClose();
    setSelectedDates(new Set());
  };

  const handleCancel = () => {
    onClose();
    setSelectedDates(new Set());
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Select Show Dates
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">{event.title}</h3>
            <p className="text-sm text-muted-foreground">{event.venue}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Available dates:</p>
            {upcomingDates.map((date) => {
              const dateString = date.toISOString();
              const isSelected = selectedDates.has(dateString);
              
              return (
                <div
                  key={dateString}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    isSelected 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => toggleDate(dateString)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {date.toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {event.start_time || '7:30 PM'}
                      </p>
                    </div>
                    {isSelected && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedDates.size > 0 && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">
                Selected: {selectedDates.size} date{selectedDates.size !== 1 ? 's' : ''}
              </p>
              <div className="flex flex-wrap gap-1">
                {Array.from(selectedDates).map((dateStr) => (
                  <Badge key={dateStr} variant="secondary" className="text-xs">
                    {new Date(dateStr).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={handleCancel} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleApply} className="flex-1">
              Apply for Selected Dates
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
