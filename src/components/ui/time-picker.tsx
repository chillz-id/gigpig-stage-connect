
import React, { useState } from 'react';
import { Button } from './button';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface TimePickerProps {
  value?: { hours: number; minutes: number };
  onChange: (time: { hours: number; minutes: number }) => void;
  className?: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({ 
  value = { hours: 0, minutes: 5 }, 
  onChange, 
  className = "" 
}) => {
  const [time, setTime] = useState(value);

  const adjustTime = (field: 'hours' | 'minutes', increment: boolean) => {
    const newTime = { ...time };
    
    if (field === 'minutes') {
      if (increment) {
        newTime.minutes += 1;
        if (newTime.minutes >= 60) {
          newTime.minutes = 0;
          newTime.hours += 1;
        }
      } else {
        newTime.minutes -= 1;
        if (newTime.minutes < 0) {
          newTime.minutes = 59;
          newTime.hours = Math.max(0, newTime.hours - 1);
        }
      }
    } else {
      if (increment) {
        newTime.hours += 1;
      } else {
        newTime.hours = Math.max(0, newTime.hours - 1);
      }
    }
    
    setTime(newTime);
    onChange(newTime);
  };

  const formatDisplay = () => {
    if (time.hours === 0) {
      return `${time.minutes}min`;
    }
    return `${time.hours}h ${time.minutes}min`;
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex flex-col items-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => adjustTime('minutes', true)}
          className="h-6 w-6 p-0"
        >
          <ChevronUp className="w-3 h-3" />
        </Button>
        <div className="min-w-[80px] text-center text-sm font-medium bg-muted rounded px-2 py-1">
          {formatDisplay()}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => adjustTime('minutes', false)}
          className="h-6 w-6 p-0"
        >
          <ChevronDown className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};
