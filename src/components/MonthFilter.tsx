
import React from 'react';

interface MonthFilterProps {
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number, year: number) => void;
}

const MonthFilter: React.FC<MonthFilterProps> = ({
  selectedMonth,
  selectedYear,
  onMonthChange
}) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-4 justify-center">
        {months.map((month, index) => (
          <button
            key={month}
            onClick={() => onMonthChange(index, selectedYear)}
            className={`text-foreground hover:text-primary transition-colors ${
              selectedMonth === index 
                ? 'underline decoration-2 underline-offset-4 font-semibold' 
                : 'hover:underline decoration-1 underline-offset-4'
            }`}
          >
            {month}
          </button>
        ))}
      </div>
    </div>
  );
};

export { MonthFilter };
