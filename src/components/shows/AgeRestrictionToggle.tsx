import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export type AgeRestriction = 'all' | 'over_18' | 'under_18';

interface AgeRestrictionToggleProps {
  value: AgeRestriction;
  onChange: (value: AgeRestriction) => void;
  className?: string;
}

export const AgeRestrictionToggle: React.FC<AgeRestrictionToggleProps> = ({
  value,
  onChange,
  className
}) => {
  const isOver18Only = value === 'over_18';
  const isUnder18Only = value === 'under_18';

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <Label className="text-sm font-medium">Age Restriction</Label>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="over-18-toggle" className="text-sm font-normal cursor-pointer">
            Over 18 Only
          </Label>
          <Switch
            id="over-18-toggle"
            checked={isOver18Only}
            onCheckedChange={(checked) => {
              onChange(checked ? 'over_18' : 'all');
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="under-18-toggle" className="text-sm font-normal cursor-pointer">
            Under 18 Only
          </Label>
          <Switch
            id="under-18-toggle"
            checked={isUnder18Only}
            onCheckedChange={(checked) => {
              onChange(checked ? 'under_18' : 'all');
            }}
          />
        </div>
        {value === 'all' && (
          <p className="text-xs text-muted-foreground">
            Showing all ages
          </p>
        )}
      </div>
    </div>
  );
};
