import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CalendarDays, Clock, Plus, X } from 'lucide-react';
import { useComedianAvailability } from '@/hooks/useComedianAvailability';
import { useAuth } from '@/contexts/AuthContext';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, isBefore } from 'date-fns';

interface ComedianAvailabilityCalendarProps {
  comedianId: string;
}

const ComedianAvailabilityCalendar: React.FC<ComedianAvailabilityCalendarProps> = ({ comedianId }) => {
  const { user } = useAuth();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showBlockedForm, setShowBlockedForm] = useState(false);
  const [blockedDateForm, setBlockedDateForm] = useState({
    start_date: '',
    end_date: '',
    reason: ''
  });

  const {
    availability,
    blockedDates,
    isLoading,
    setAvailability,
    setBlockedDates,
    removeBlockedDate,
    isDateAvailable
  } = useComedianAvailability(comedianId);

  const isOwnProfile = user?.id === comedianId;

  // Get the week range
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Start on Monday
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const goToPreviousWeek = () => {
    setCurrentWeek(addDays(currentWeek, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeek(addDays(currentWeek, 7));
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  const toggleDayAvailability = async (date: Date) => {
    if (!isOwnProfile) return;
    
    const dateString = format(date, 'yyyy-MM-dd');
    const currentlyAvailable = isDateAvailable(dateString);
    
    await setAvailability({
      date: dateString,
      is_available: !currentlyAvailable,
      time_start: '18:00', // Default evening availability
      time_end: '23:00',
      recurring_type: 'none'
    });
  };

  const handleAddBlockedPeriod = async () => {
    if (!isOwnProfile || !blockedDateForm.start_date || !blockedDateForm.end_date) return;

    await setBlockedDates({
      start_date: blockedDateForm.start_date,
      end_date: blockedDateForm.end_date,
      reason: blockedDateForm.reason,
      recurring_type: 'none'
    });

    // Reset form
    setBlockedDateForm({ start_date: '', end_date: '', reason: '' });
    setShowBlockedForm(false);
  };

  const getDayStatus = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const isPast = isBefore(date, new Date()) && !isToday(date);
    
    // Check if date is in a blocked period
    const isBlocked = blockedDates?.some(blocked => {
      const blockStart = new Date(blocked.start_date);
      const blockEnd = new Date(blocked.end_date);
      return date >= blockStart && date <= blockEnd;
    });

    if (isBlocked) return 'blocked';
    if (isPast) return 'past';
    
    const available = isDateAvailable(dateString);
    return available ? 'available' : 'unavailable';
  };

  const getDayClasses = (date: Date) => {
    const status = getDayStatus(date);
    const baseClasses = 'w-full aspect-square flex flex-col items-center justify-center text-sm border rounded-lg transition-colors cursor-pointer';
    
    switch (status) {
      case 'blocked':
        return `${baseClasses} bg-red-900/30 border-red-600 text-red-300`;
      case 'past':
        return `${baseClasses} bg-gray-800/30 border-gray-600 text-gray-500 cursor-not-allowed`;
      case 'available':
        return `${baseClasses} bg-green-900/30 border-green-600 text-green-300 hover:bg-green-800/40`;
      case 'unavailable':
        return `${baseClasses} bg-orange-900/30 border-orange-600 text-orange-300 hover:bg-orange-800/40`;
      default:
        return `${baseClasses} bg-gray-700/30 border-gray-600 text-gray-300 hover:bg-gray-600/40`;
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <Calendar className="w-8 h-8 animate-spin text-purple-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white text-2xl">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-purple-400" />
            Availability Calendar
          </div>
          {isOwnProfile && (
            <Button
              onClick={() => setShowBlockedForm(!showBlockedForm)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Block Dates
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Blocked Dates Form */}
        {showBlockedForm && isOwnProfile && (
          <Card className="bg-slate-700/50 border-slate-600">
            <CardContent className="p-4 space-y-4">
              <h4 className="text-white font-medium">Block Unavailable Period</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-300">Start Date</label>
                  <input
                    type="date"
                    value={blockedDateForm.start_date}
                    onChange={(e) => setBlockedDateForm(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full p-2 rounded bg-slate-600 text-white border border-slate-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-300">End Date</label>
                  <input
                    type="date"
                    value={blockedDateForm.end_date}
                    onChange={(e) => setBlockedDateForm(prev => ({ ...prev, end_date: e.target.value }))}
                    className="w-full p-2 rounded bg-slate-600 text-white border border-slate-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-300">Reason (optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Vacation, Festival tour..."
                  value={blockedDateForm.reason}
                  onChange={(e) => setBlockedDateForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full p-2 rounded bg-slate-600 text-white border border-slate-500"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddBlockedPeriod} size="sm">
                  Block Period
                </Button>
                <Button onClick={() => setShowBlockedForm(false)} variant="outline" size="sm">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <Button onClick={goToPreviousWeek} variant="outline" size="sm">
            Previous Week
          </Button>
          <div className="text-white font-medium">
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </div>
          <div className="flex gap-2">
            <Button onClick={goToCurrentWeek} variant="outline" size="sm">
              Today
            </Button>
            <Button onClick={goToNextWeek} variant="outline" size="sm">
              Next Week
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-300 p-2">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {daysOfWeek.map(date => {
            const status = getDayStatus(date);
            const isPast = isBefore(date, new Date()) && !isToday(date);
            
            return (
              <div
                key={date.toISOString()}
                className={getDayClasses(date)}
                onClick={() => {
                  if (!isPast && isOwnProfile) {
                    toggleDayAvailability(date);
                  }
                }}
              >
                <span className={isToday(date) ? 'font-bold' : ''}>
                  {format(date, 'd')}
                </span>
                <div className="mt-1">
                  {status === 'blocked' && <Badge variant="destructive" className="text-xs px-1">Blocked</Badge>}
                  {status === 'available' && <Badge variant="default" className="text-xs px-1 bg-green-600">Available</Badge>}
                  {status === 'unavailable' && !isPast && <Badge variant="secondary" className="text-xs px-1 bg-orange-600">Unavailable</Badge>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-600 rounded"></div>
            <span className="text-gray-300">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-600 rounded"></div>
            <span className="text-gray-300">Unavailable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-600 rounded"></div>
            <span className="text-gray-300">Blocked Period</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-600 rounded"></div>
            <span className="text-gray-300">Past Date</span>
          </div>
        </div>

        {/* Blocked Periods List */}
        {blockedDates && blockedDates.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-white font-medium">Blocked Periods</h4>
            {blockedDates.map(blocked => (
              <div key={blocked.id} className="flex items-center justify-between bg-slate-700/50 p-3 rounded">
                <div>
                  <div className="text-white">
                    {format(new Date(blocked.start_date), 'MMM d')} - {format(new Date(blocked.end_date), 'MMM d, yyyy')}
                  </div>
                  {blocked.reason && (
                    <div className="text-gray-400 text-sm">{blocked.reason}</div>
                  )}
                </div>
                {isOwnProfile && (
                  <Button
                    onClick={() => removeBlockedDate(blocked.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Instructions for own profile */}
        {isOwnProfile && (
          <div className="text-sm text-gray-400 bg-slate-700/30 p-3 rounded">
            <p><strong>Click on dates</strong> to toggle your availability. Green = Available, Orange = Unavailable.</p>
            <p>Use "Block Dates" to mark longer unavailable periods like vacations or tours.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ComedianAvailabilityCalendar;