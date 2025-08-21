
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface PerformanceNotesFieldProps {
  value: string;
  onChange: (value: string) => void;
}

const PerformanceNotesField: React.FC<PerformanceNotesFieldProps> = ({ value, onChange }) => {
  return (
    <div>
      <Label htmlFor="performance_notes" className="text-white">Performance Notes</Label>
      <Textarea
        id="performance_notes"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
        placeholder="Any special notes about this performance..."
        rows={3}
      />
    </div>
  );
};

export default PerformanceNotesField;
