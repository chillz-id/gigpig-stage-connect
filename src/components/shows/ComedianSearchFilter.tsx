import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComedianSearchFilterProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export const ComedianSearchFilter: React.FC<ComedianSearchFilterProps> = ({
  value,
  onChange,
  className,
  placeholder = 'Search by comedian name...'
}) => {
  return (
    <div className={cn('relative', className)}>
      <Label htmlFor="comedian-search" className="text-sm font-medium mb-2 block">
        Search Comedians
      </Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="comedian-search"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>
      {value && (
        <p className="text-xs text-muted-foreground mt-1">
          Filtering shows with "{value}"
        </p>
      )}
    </div>
  );
};
