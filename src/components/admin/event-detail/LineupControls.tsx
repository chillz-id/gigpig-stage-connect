
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, FileText } from 'lucide-react';

interface LineupControlsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onCreateInvoices: () => void;
  isProcessingInvoices: boolean;
}

const LineupControls: React.FC<LineupControlsProps> = ({
  searchTerm,
  onSearchChange,
  selectedCount,
  totalCount,
  onSelectAll,
  onCreateInvoices,
  isProcessingInvoices,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
        <Input
          placeholder="Search comedians..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
        />
      </div>
      
      <div className="flex gap-2">
        <Button
          onClick={onSelectAll}
          className="professional-button border-white/20 text-white hover:bg-white/10"
        >
          {selectedCount === totalCount ? 'Deselect All' : 'Select All'}
        </Button>
        
        {selectedCount > 0 && (
          <Button
            onClick={onCreateInvoices}
            disabled={isProcessingInvoices}
            className="bg-green-600 hover:bg-green-700"
          >
            <FileText className="w-4 h-4 mr-2" />
            {isProcessingInvoices ? 'Processing...' : `Invoice ${selectedCount} Selected`}
          </Button>
        )}
        
        <Button
          className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Book Comedian
        </Button>
      </div>
    </div>
  );
};

export default LineupControls;
