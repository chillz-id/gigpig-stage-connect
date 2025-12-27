import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface MonthPickerProps {
  selectedMonth: Date;
  onChange: (date: Date) => void;
  children: React.ReactNode;
}

export function MonthPicker({ selectedMonth, onChange, children }: MonthPickerProps) {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(selectedMonth.getFullYear(), monthIndex, 1);
    onChange(newDate);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="grid grid-cols-3 gap-2">
          {months.map((month, index) => (
            <Button
              key={month}
              variant={selectedMonth.getMonth() === index ? "default" : "secondary"}
              size="sm"
              onClick={() => handleMonthSelect(index)}
              className="w-full"
            >
              {month}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
