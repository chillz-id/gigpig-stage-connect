import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export type ShowType = 'all' | 'showcase' | 'solo' | 'live_podcast' | 'other';

interface ShowTypeFilterProps {
  value: ShowType;
  onChange: (value: ShowType) => void;
  className?: string;
}

export const ShowTypeFilter: React.FC<ShowTypeFilterProps> = ({
  value,
  onChange,
  className
}) => {
  return (
    <div className={className}>
      <Label htmlFor="show-type-filter" className="text-sm font-medium mb-2 block">
        Show Type
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="show-type-filter" className="w-full">
          <SelectValue placeholder="Select show type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="showcase">Showcase</SelectItem>
          <SelectItem value="solo">Solo Show</SelectItem>
          <SelectItem value="live_podcast">Live Podcast</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
