
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';

interface EventRequirementsSectionProps {
  formData: {
    type: string;
    requirements: string[];
    isVerifiedOnly: boolean;
    isPaid: boolean;
    allowRecording: boolean;
    ageRestriction: string;
    dresscode: string;
  };
  onFormDataChange: (updates: Partial<EventRequirementsSectionProps['formData']>) => void;
}

export const EventRequirementsSection: React.FC<EventRequirementsSectionProps> = ({
  formData,
  onFormDataChange
}) => {
  const [newRequirement, setNewRequirement] = useState('');

  const addRequirement = () => {
    if (newRequirement.trim()) {
      onFormDataChange({
        requirements: [...formData.requirements, newRequirement.trim()]
      });
      setNewRequirement('');
    }
  };

  const removeRequirement = (index: number) => {
    onFormDataChange({
      requirements: formData.requirements.filter((_, i) => i !== index)
    });
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
      <CardHeader>
        <CardTitle>Requirements & Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="type">Show Type</Label>
          <Select value={formData.type} onValueChange={(value) => onFormDataChange({ type: value })}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Open Mic">Open Mic</SelectItem>
              <SelectItem value="Semi-Pro">Semi-Pro</SelectItem>
              <SelectItem value="Pro">Professional</SelectItem>
              <SelectItem value="Mixed">Mixed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="newRequirement">Add Requirements</Label>
          <div className="flex gap-2">
            <Input
              id="newRequirement"
              value={newRequirement}
              onChange={(e) => setNewRequirement(e.target.value)}
              placeholder="e.g., Clean material only"
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
            />
            <Button type="button" onClick={addRequirement} className="bg-purple-500 hover:bg-purple-600">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {formData.requirements.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.requirements.map((req, index) => (
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="isVerifiedOnly">Verified Comedians Only</Label>
              <Switch
                id="isVerifiedOnly"
                checked={formData.isVerifiedOnly}
                onCheckedChange={(checked) => onFormDataChange({ isVerifiedOnly: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="isPaid">Paid Event</Label>
              <Switch
                id="isPaid"
                checked={formData.isPaid}
                onCheckedChange={(checked) => onFormDataChange({ isPaid: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="allowRecording">Allow Recording</Label>
              <Switch
                id="allowRecording"
                checked={formData.allowRecording}
                onCheckedChange={(checked) => onFormDataChange({ allowRecording: checked })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="ageRestriction">Age Restriction</Label>
              <Select 
                value={formData.ageRestriction} 
                onValueChange={(value) => onFormDataChange({ ageRestriction: value })}
              >
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
              <Select 
                value={formData.dresscode} 
                onValueChange={(value) => onFormDataChange({ dresscode: value })}
              >
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
      </CardContent>
    </Card>
  );
};
