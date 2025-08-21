import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Info } from 'lucide-react';
import { Control, Controller, FieldErrors } from 'react-hook-form';
import { EventFormData } from '@/types/eventTypes';
import { ValidationFeedback, FieldValidationIndicator } from './ValidationFeedback';
import { useFieldValidation } from '@/hooks/useEventValidation';
import { cn } from '@/lib/utils';

interface BasicEventInfoEnhancedProps {
  control: Control<EventFormData>;
  errors: FieldErrors<EventFormData>;
  validation?: any; // From useEventValidation hook
}

export const BasicEventInfoEnhanced: React.FC<BasicEventInfoEnhancedProps> = ({ 
  control, 
  errors,
  validation
}) => {
  // Get field-specific validation if provided
  const titleValidation = validation?.getFieldValidation('title') || {};
  const typeValidation = validation?.getFieldValidation('type') || {};
  const descriptionValidation = validation?.getFieldValidation('description') || {};

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5" />
          Event Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Event Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="flex items-center gap-2">
            Event Title
            <FieldValidationIndicator 
              hasError={titleValidation.hasError}
              hasWarning={titleValidation.hasWarning}
              isRequired={true}
            />
          </Label>
          <Controller
            name="title"
            control={control}
            rules={{ required: 'Event title is required' }}
            render={({ field }) => (
              <div className="relative">
                <Input
                  {...field}
                  id="title"
                  placeholder="Wednesday Night Comedy"
                  className={cn(
                    "bg-white/10 border-white/20 text-white placeholder:text-gray-300",
                    titleValidation.hasError && "border-red-500 focus:border-red-500",
                    titleValidation.hasWarning && !titleValidation.hasError && "border-amber-500 focus:border-amber-500"
                  )}
                  onChange={(e) => {
                    field.onChange(e);
                    validation?.handleFieldChange('title', e.target.value);
                  }}
                  onBlur={(e) => {
                    field.onBlur();
                    validation?.handleFieldBlur('title', e.target.value);
                  }}
                  maxLength={100}
                />
                {field.value && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    {field.value.length}/100
                  </span>
                )}
              </div>
            )}
          />
          <ValidationFeedback
            errors={titleValidation.errors || (errors.title ? [errors.title.message!] : [])}
            warnings={titleValidation.warnings}
          />
        </div>

        {/* Event Type */}
        <div className="space-y-2">
          <Label htmlFor="type" className="flex items-center gap-2">
            Event Type
            <FieldValidationIndicator 
              hasError={typeValidation.hasError}
              hasWarning={typeValidation.hasWarning}
            />
          </Label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  validation?.handleFieldChange('type', value);
                }}
              >
                <SelectTrigger 
                  className={cn(
                    "bg-white/10 border-white/20 text-white",
                    typeValidation.hasError && "border-red-500",
                    typeValidation.hasWarning && !typeValidation.hasError && "border-amber-500"
                  )}
                >
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open_mic">Open Mic</SelectItem>
                  <SelectItem value="showcase">Showcase</SelectItem>
                  <SelectItem value="headliner">Headliner Show</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          <ValidationFeedback
            errors={typeValidation.errors}
            warnings={typeValidation.warnings}
          />
        </div>

        {/* Show Type */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="showLevel">Show Level</Label>
            <Controller
              name="showLevel"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner Friendly</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="showType">Show Format</Label>
            <Controller
              name="showType"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standup">Stand-up Comedy</SelectItem>
                    <SelectItem value="improv">Improv</SelectItem>
                    <SelectItem value="sketch">Sketch Comedy</SelectItem>
                    <SelectItem value="mixed">Mixed Format</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="flex items-center gap-2">
            Description
            <FieldValidationIndicator 
              hasError={descriptionValidation.hasError}
              hasWarning={descriptionValidation.hasWarning}
            />
          </Label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <div className="relative">
                <Textarea
                  {...field}
                  id="description"
                  placeholder="Tell people what to expect at your event..."
                  className={cn(
                    "bg-white/10 border-white/20 text-white placeholder:text-gray-300 min-h-[120px]",
                    descriptionValidation.hasError && "border-red-500 focus:border-red-500",
                    descriptionValidation.hasWarning && !descriptionValidation.hasError && "border-amber-500 focus:border-amber-500"
                  )}
                  onChange={(e) => {
                    field.onChange(e);
                    validation?.handleFieldChange('description', e.target.value);
                  }}
                  onBlur={(e) => {
                    field.onBlur();
                    validation?.handleFieldBlur('description', e.target.value);
                  }}
                  maxLength={5000}
                />
                {field.value && (
                  <span className="absolute bottom-2 right-2 text-xs text-gray-400">
                    {field.value.length}/5000
                  </span>
                )}
              </div>
            )}
          />
          <ValidationFeedback
            errors={descriptionValidation.errors}
            warnings={descriptionValidation.warnings}
            info="A good description helps comedians understand your event's vibe and audience"
          />
        </div>

        {/* Event Guidelines Info */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-400 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-medium text-blue-300">Event Title Tips:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-1">
                <li>Include the day of the week if it's a regular event</li>
                <li>Mention the venue name for recognition</li>
                <li>Keep it concise but descriptive</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};