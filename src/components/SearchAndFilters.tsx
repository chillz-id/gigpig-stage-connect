
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface SearchAndFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  locationFilter: string;
  setLocationFilter: (location: string) => void;
  typeFilter: string;
  setTypeFilter: (type: string) => void;
}

export const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  locationFilter,
  setLocationFilter,
  typeFilter,
  setTypeFilter,
}) => {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search shows, venues, or locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-card/50 border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <Select onValueChange={setLocationFilter}>
          <SelectTrigger className="w-full md:w-48 bg-card/50 border-border text-foreground">
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            <SelectItem value="Sydney">Sydney, NSW</SelectItem>
            <SelectItem value="Melbourne">Melbourne, VIC</SelectItem>
            <SelectItem value="Brisbane">Brisbane, QLD</SelectItem>
            <SelectItem value="Perth">Perth, WA</SelectItem>
            <SelectItem value="Adelaide">Adelaide, SA</SelectItem>
            <SelectItem value="Gold Coast">Gold Coast, QLD</SelectItem>
            <SelectItem value="Newcastle">Newcastle, NSW</SelectItem>
            <SelectItem value="Canberra">Canberra, ACT</SelectItem>
            <SelectItem value="Hobart">Hobart, TAS</SelectItem>
            <SelectItem value="Darwin">Darwin, NT</SelectItem>
            <SelectItem value="Wollongong">Wollongong, NSW</SelectItem>
            <SelectItem value="Cairns">Cairns, QLD</SelectItem>
            <SelectItem value="Geelong">Geelong, VIC</SelectItem>
            <SelectItem value="Townsville">Townsville, QLD</SelectItem>
            <SelectItem value="Launceston">Launceston, TAS</SelectItem>
            <SelectItem value="Bendigo">Bendigo, VIC</SelectItem>
            <SelectItem value="Ballarat">Ballarat, VIC</SelectItem>
            <SelectItem value="Mackay">Mackay, QLD</SelectItem>
            <SelectItem value="Rockhampton">Rockhampton, QLD</SelectItem>
            <SelectItem value="Toowoomba">Toowoomba, QLD</SelectItem>
          </SelectContent>
        </Select>
        <Select onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full md:w-48 bg-card/50 border-border text-foreground">
            <SelectValue placeholder="Show Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="open mic">Open Mic</SelectItem>
            <SelectItem value="semi-pro">Semi-Pro</SelectItem>
            <SelectItem value="pro">Professional</SelectItem>
            <SelectItem value="mixed">Mixed</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
