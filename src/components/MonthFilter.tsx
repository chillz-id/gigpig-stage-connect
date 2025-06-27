
import React from 'react';
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

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            const newMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
            const newYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
            if (newYear > currentYear || (newYear === currentYear && newMonth >= currentMonth)) {
              onMonthChange(newMonth, newYear);
            }
          }}
          disabled={selectedYear === currentYear && selectedMonth === currentMonth}
          className="p-2 hover:bg-accent rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <h2 className="text-xl font-semibold min-w-[120px] text-center">
          {months[selectedMonth]} {selectedYear}
        </h2>
        
        <button
          onClick={() => {
            const newMonth = selectedMonth === 11 ? 0 : selectedMonth + 1;
            const newYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
            onMonthChange(newMonth, newYear);
          }}
          className="p-2 hover:bg-accent rounded-lg"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex gap-6 overflow-x-auto">
        {months.map((month, index) => {
          const isSelected = selectedMonth === index && selectedYear === selectedYear;
          const isCurrentMonth = index === currentMonth && selectedYear === currentYear;
          const isDisabled = selectedYear === currentYear && index < currentMonth;
          
          return (
            <button
              key={`${month}-${selectedYear}`}
              onClick={() => !isDisabled && onMonthChange(index, selectedYear)}
              disabled={isDisabled}
              className={`
                relative px-2 py-1 text-sm font-medium cursor-pointer transition-colors
                ${isSelected 
                  ? 'text-primary' 
                  : isDisabled 
                    ? 'text-muted-foreground/50 cursor-not-allowed' 
                    : 'text-foreground hover:text-primary'
                }
              `}
            >
              {month}
              {isSelected && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
