
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthFilterProps {
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number, year: number) => void;
}

export const MonthFilter: React.FC<MonthFilterProps> = ({
  selectedMonth,
  selectedYear,
  onMonthChange
}) => {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Show months from current month onwards
  const availableMonths = [];
  for (let i = 0; i < 12; i++) {
    const monthIndex = (currentMonth + i) % 12;
    const year = currentYear + Math.floor((currentMonth + i) / 12);
    availableMonths.push({ month: monthIndex, year, label: months[monthIndex] });
  }

  const goToPreviousMonth = () => {
    const newMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const newYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
    if (newYear > currentYear || (newYear === currentYear && newMonth >= currentMonth)) {
      onMonthChange(newMonth, newYear);
    }
  };

  const goToNextMonth = () => {
    const newMonth = selectedMonth === 11 ? 0 : selectedMonth + 1;
    const newYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
    onMonthChange(newMonth, newYear);
  };

  const canGoPrevious = selectedYear > currentYear || (selectedYear === currentYear && selectedMonth > currentMonth);

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={goToPreviousMonth}
          disabled={!canGoPrevious}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-xl font-semibold">
          {months[selectedMonth]} {selectedYear}
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={goToNextMonth}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="flex gap-1 overflow-x-auto">
        {availableMonths.slice(0, 8).map(({ month, year, label }) => (
          <Button
            key={`${month}-${year}`}
            variant={selectedMonth === month && selectedYear === year ? "default" : "outline"}
            size="sm"
            onClick={() => onMonthChange(month, year)}
            className="min-w-[60px]"
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
};
