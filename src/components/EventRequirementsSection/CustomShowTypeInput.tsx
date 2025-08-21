
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface CustomShowTypeInputProps {
  customShowType: string;
  onCustomShowTypeChange: (value: string) => void;
  onSubmit: () => void;
}

export const CustomShowTypeInput: React.FC<CustomShowTypeInputProps> = ({
  customShowType,
  onCustomShowTypeChange,
  onSubmit
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div>
      <Label htmlFor="customShowType">Custom Show Type</Label>
      <div className="flex gap-2">
        <Input
          id="customShowType"
          value={customShowType}
          onChange={(e) => onCustomShowTypeChange(e.target.value)}
          placeholder="Enter your custom show type"
          className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
          onKeyPress={handleKeyPress}
        />
        <Button 
          type="button" 
          onClick={onSubmit}
          className="bg-purple-500 hover:bg-purple-600"
        >
          Save
        </Button>
      </div>
    </div>
  );
};
