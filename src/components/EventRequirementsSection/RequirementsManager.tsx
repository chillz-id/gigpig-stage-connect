
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';

interface RequirementsManagerProps {
  requirements: string[];
  onRequirementsChange: (requirements: string[]) => void;
}

export const RequirementsManager: React.FC<RequirementsManagerProps> = ({
  requirements,
  onRequirementsChange
}) => {
  const [newRequirement, setNewRequirement] = useState('');

  const addRequirement = () => {
    if (newRequirement.trim()) {
      onRequirementsChange([...requirements, newRequirement.trim()]);
      setNewRequirement('');
    }
  };

  const removeRequirement = (index: number) => {
    onRequirementsChange(requirements.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addRequirement();
    }
  };

  return (
    <div>
      <Label htmlFor="newRequirement">Add Requirements</Label>
      <div className="flex gap-2">
        <Input
          id="newRequirement"
          value={newRequirement}
          onChange={(e) => setNewRequirement(e.target.value)}
          placeholder="e.g., Clean material only"
          className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
          onKeyPress={handleKeyPress}
        />
        <Button type="button" onClick={addRequirement} className="bg-purple-500 hover:bg-purple-600">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {requirements.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {requirements.map((req, index) => (
            <Badge key={index} variant="outline" className="text-white border-white/30">
              {req}
              <X 
                className="w-3 h-3 ml-1 cursor-pointer" 
                onClick={() => removeRequirement(index)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
