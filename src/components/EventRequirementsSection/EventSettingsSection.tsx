
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface EventSettingsSectionProps {
  allowRecording: boolean;
  ageRestriction: string;
  dresscode: string;
  onAllowRecordingChange: (checked: boolean) => void;
  onAgeRestrictionChange: (value: string) => void;
  onDresscodeChange: (value: string) => void;
}

export const EventSettingsSection: React.FC<EventSettingsSectionProps> = ({
  allowRecording,
  ageRestriction,
  dresscode,
  onAllowRecordingChange,
  onAgeRestrictionChange,
  onDresscodeChange
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="allowRecording">Allow Recording</Label>
          <Switch
            id="allowRecording"
            checked={allowRecording}
            onCheckedChange={onAllowRecordingChange}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="ageRestriction">Age Restriction</Label>
          <Select value={ageRestriction} onValueChange={onAgeRestrictionChange}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All ages">All ages</SelectItem>
              <SelectItem value="18+">18+</SelectItem>
              <SelectItem value="21+">21+</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="dresscode">Dress Code</Label>
          <Select value={dresscode} onValueChange={onDresscodeChange}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Casual">Casual</SelectItem>
              <SelectItem value="Smart casual">Smart Casual</SelectItem>
              <SelectItem value="Formal">Formal</SelectItem>
              <SelectItem value="No specific dress code">No Specific Dress Code</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
