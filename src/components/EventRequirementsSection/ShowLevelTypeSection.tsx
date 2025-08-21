
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ShowLevelTypeSectionProps {
  showLevel: string;
  showType: string;
  customShowTypes: string[];
  onShowLevelChange: (value: string) => void;
  onShowTypeChange: (value: string) => void;
}

export const ShowLevelTypeSection: React.FC<ShowLevelTypeSectionProps> = ({
  showLevel,
  showType,
  customShowTypes,
  onShowLevelChange,
  onShowTypeChange
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="showLevel">Show Level</Label>
        <Select value={showLevel} onValueChange={onShowLevelChange}>
          <SelectTrigger className="bg-white/10 border-white/20 text-white">
            <SelectValue placeholder="Select show level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open-mic">Open Mic</SelectItem>
            <SelectItem value="semi-pro">Semi-Pro</SelectItem>
            <SelectItem value="professional">Professional</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="showType">Show Type</Label>
        <Select value={showType} onValueChange={onShowTypeChange}>
          <SelectTrigger className="bg-white/10 border-white/20 text-white">
            <SelectValue placeholder="Select show type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lineup">Lineup</SelectItem>
            <SelectItem value="solo-show">Solo Show</SelectItem>
            <SelectItem value="live-podcast">Live Podcast</SelectItem>
            <SelectItem value="corporate">Corporate</SelectItem>
            {customShowTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
