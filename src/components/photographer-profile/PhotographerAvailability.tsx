import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, CheckCircle, XCircle } from 'lucide-react';
import { usePhotographerAvailability } from '@/hooks/usePhotographers';
import { useAuth } from '@/contexts/AuthContext';
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface PhotographerAvailabilityProps {
  photographerId: string;
}

const PhotographerAvailability: React.FC<PhotographerAvailabilityProps> = ({
  photographerId
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  
  const startDate = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');
  
  const { availability, isLoading } = usePhotographerAvailability(
    photographerId,
    startDate,
    endDate
  );

  const isOwnProfile = user?.id === photographerId;

  const availableDates = React.useMemo(() => {
    return availability
      .filter(a => a.is_available)
      .map(a => new Date(a.date));
  }, [availability]);

  const unavailableDates = React.useMemo(() => {
    return availability
      .filter(a => !a.is_available)
      .map(a => new Date(a.date));
  }, [availability]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date || !isOwnProfile) return;
    
    toast({
      title: 'Coming soon',
      description: 'Availability management will be available soon',
    });
  };

  const handleMonthChange = (increment: number) => {
    setSelectedMonth(prev => addMonths(prev, increment));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            Availability Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMonthChange(-1)}
            >
              Previous
            </Button>
            <h3 className="font-medium">
              {format(selectedMonth, 'MMMM yyyy')}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMonthChange(1)}
            >
              Next
            </Button>
          </div>

          {/* Calendar */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <Calendar
              mode="single"
              selected={undefined}
              onSelect={handleDateSelect}
              month={selectedMonth}
              onMonthChange={setSelectedMonth}
              className="rounded-md border"
              modifiers={{
                available: availableDates,
                unavailable: unavailableDates,
              }}
              modifiersStyles={{
                available: {
                  backgroundColor: 'rgb(34 197 94 / 0.1)',
                  color: 'rgb(34 197 94)',
                  fontWeight: 'bold',
                },
                unavailable: {
                  backgroundColor: 'rgb(239 68 68 / 0.1)',
                  color: 'rgb(239 68 68)',
                  textDecoration: 'line-through',
                },
              }}
              disabled={(date) => date < new Date()}
            />
          )}

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500/10 rounded border border-green-500"></div>
              <span className="text-sm">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500/10 rounded border border-red-500"></div>
              <span className="text-sm">Unavailable</span>
            </div>
          </div>

          {isOwnProfile && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Click on any date to toggle your availability. 
                This helps event organizers know when you're available for bookings.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Availability Notes */}
      {availability.some(a => a.notes) && (
        <Card>
          <CardHeader>
            <CardTitle>Availability Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {availability
                .filter(a => a.notes)
                .map(a => (
                  <div key={a.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Badge variant={a.is_available ? 'success' : 'destructive'}>
                      {a.is_available ? (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      ) : (
                        <XCircle className="w-3 h-3 mr-1" />
                      )}
                      {format(new Date(a.date), 'MMM d')}
                    </Badge>
                    <p className="text-sm text-gray-700">{a.notes}</p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PhotographerAvailability;