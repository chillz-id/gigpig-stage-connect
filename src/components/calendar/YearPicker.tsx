import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface YearPickerProps {
  selectedMonth: Date;
  onChange: (date: Date) => void;
  children: React.ReactNode;
}

export function YearPicker({ selectedMonth, onChange, children }: YearPickerProps) {
  const currentYear = selectedMonth.getFullYear();
  const [decadeStart, setDecadeStart] = useState(currentYear - 6);

  const years = Array.from({ length: 12 }, (_, i) => decadeStart + i);

  const handleYearSelect = (year: number) => {
    const newDate = new Date(year, selectedMonth.getMonth(), 1);
    onChange(newDate);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDecadeStart(prev => prev - 12)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium">
              {decadeStart} - {decadeStart + 11}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDecadeStart(prev => prev + 12)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {years.map((year) => (
              <Button
                key={year}
                variant={currentYear === year ? "default" : "secondary"}
                size="sm"
                onClick={() => handleYearSelect(year)}
                className="w-full"
              >
                {year}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
