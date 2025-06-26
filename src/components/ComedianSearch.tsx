
import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface ComedianSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const ComedianSearch: React.FC<ComedianSearchProps> = ({ searchTerm, onSearchChange }) => {
  return (
    <div className="mb-8">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search comedians by name, location, or specialty..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-card/50 border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
};

export default ComedianSearch;
