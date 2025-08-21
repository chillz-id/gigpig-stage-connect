import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, X } from 'lucide-react';
import { Control, Controller, FieldErrors, useWatch } from 'react-hook-form';
import { EventFormData } from '@/types/eventTypes';
import { useState } from 'react';

interface PerformerRequirementsProps {
  control: Control<EventFormData>;
  errors: FieldErrors<EventFormData>;
}

export const PerformerRequirements: React.FC<PerformerRequirementsProps> = ({ 
  control, 
  errors 
}) => {
  const [newRequirement, setNewRequirement] = useState('');
  
  // Watch requirements to manage them
  const requirements = useWatch({
    control,
    name: 'requirements',
    defaultValue: []
  });

  const addRequirement = () => {
    if (newRequirement.trim()) {
      const currentRequirements = requirements || [];
      const updatedRequirements = [...currentRequirements, newRequirement.trim()];
      
      // Update the form value properly
      control.setValue('requirements', updatedRequirements);
      setNewRequirement('');
    }
  };

  const removeRequirement = (index: number) => {
    const currentRequirements = requirements || [];
    const updatedRequirements = currentRequirements.filter((_, i) => i !== index);
    control.setValue('requirements', updatedRequirements);
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Performer Requirements & Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="spots">Number of Spots *</Label>
            <Controller
              name="spots"
              control={control}
              rules={{ 
                required: 'Number of spots is required',
                min: { value: 1, message: 'At least 1 spot is required' }
              }}
              render={({ field }) => (
                <Input
                  {...field}
                  id="spots"
                  type="number"
                  min="1"
                  placeholder="5"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                />
              )}
            />
            {errors.spots && (
              <p className="text-red-400 text-sm mt-1">{errors.spots.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="showLevel">Show Level</Label>
            <Controller
              name="showLevel"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select show level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open-mic">Open Mic</SelectItem>
                    <SelectItem value="new-material">New Material</SelectItem>
                    <SelectItem value="regular">Regular Show</SelectItem>
                    <SelectItem value="pro">Professional Show</SelectItem>
                    <SelectItem value="mixed">Mixed Level</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="showType">Show Type</Label>
            <Controller
              name="showType"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select show type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stand-up">Stand-up Comedy</SelectItem>
                    <SelectItem value="improv">Improv</SelectItem>
                    <SelectItem value="sketch">Sketch Comedy</SelectItem>
                    <SelectItem value="storytelling">Storytelling</SelectItem>
                    <SelectItem value="mixed">Mixed Format</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div>
            <Label htmlFor="ageRestriction">Age Restriction</Label>
            <Controller
              name="ageRestriction"
              control={control}
              defaultValue="18+"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-ages">All Ages</SelectItem>
                    <SelectItem value="15+">15+</SelectItem>
                    <SelectItem value="18+">18+</SelectItem>
                    <SelectItem value="21+">21+</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="dresscode">Dress Code</Label>
          <Controller
            name="dresscode"
            control={control}
            defaultValue="Casual"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Casual">Casual</SelectItem>
                  <SelectItem value="Smart Casual">Smart Casual</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Formal">Formal</SelectItem>
                  <SelectItem value="Costume/Theme">Costume/Theme</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Event Settings */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Event Settings</Label>
          
          <div className="flex items-center space-x-2">
            <Controller
              name="allowRecording"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <Checkbox
                  id="allowRecording"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="border-white/20"
                />
              )}
            />
            <Label htmlFor="allowRecording" className="text-sm">
              Allow recording and photography
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Controller
              name="isPaid"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <Checkbox
                  id="isPaid"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="border-white/20"
                />
              )}
            />
            <Label htmlFor="isPaid" className="text-sm">
              This is a paid event
            </Label>
          </div>
        </div>

        {/* Requirements Management */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Specific Requirements</Label>
          
          <div className="flex gap-2">
            <Input
              value={newRequirement}
              onChange={(e) => setNewRequirement(e.target.value)}
              placeholder="Add a requirement (e.g., 'Clean material only')"
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-300 flex-1"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
            />
            <Button
              type="button"
              onClick={addRequirement}
              size="sm"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {requirements?.map((requirement, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="bg-white/10 text-white border-white/20 pr-1"
              >
                {requirement}
                <Button
                  type="button"
                  onClick={() => removeRequirement(index)}
                  size="sm"
                  variant="ghost"
                  className="h-auto p-0 ml-2 hover:bg-red-500/20"
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};