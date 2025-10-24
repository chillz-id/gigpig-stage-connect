import { FormEvent } from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CustomerSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onToggleAdvanced: () => void;
  isAdvancedOpen: boolean;
  activeFilterCount: number;
}

export const CustomerSearchBar = ({
  value,
  onChange,
  onSubmit,
  onToggleAdvanced,
  isAdvancedOpen,
  activeFilterCount,
}: CustomerSearchBarProps) => (
  <form onSubmit={onSubmit} className="flex gap-2">
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search by name or email..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="pl-10"
      />
    </div>
    <Button type="submit" variant="default">
      Search
    </Button>
    <Button type="button" variant={isAdvancedOpen ? 'default' : 'outline'} onClick={onToggleAdvanced}>
      <Filter className="mr-2 h-4 w-4" />
      Filters
      {activeFilterCount > 0 && (
        <Badge variant="secondary" className="ml-2">
          {activeFilterCount}
        </Badge>
      )}
    </Button>
  </form>
);
