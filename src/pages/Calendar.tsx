
import React, { useState } from 'react';
import { ProfileCalendarView } from '@/components/ProfileCalendarView';

const Calendar = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Calendar</h1>
          <p className="text-muted-foreground">
            View your upcoming events and schedule
          </p>
        </div>
        
        <ProfileCalendarView />
      </div>
    </div>
  );
};

export default Calendar;
