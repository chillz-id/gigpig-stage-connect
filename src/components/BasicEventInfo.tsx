import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star } from 'lucide-react';
import { Control, Controller, FieldErrors, useWatch } from 'react-hook-form';
import { EventFormData } from '@/types/eventTypes';

interface BasicEventInfoProps {
  control: Control<EventFormData>;
  errors: FieldErrors<EventFormData>;
}

export const BasicEventInfo: React.FC<BasicEventInfoProps> = ({ control, errors }) => {
  // Watch the showType field to conditionally show custom input
  const showType = useWatch({ control, name: 'showType' });

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5" />
          Event Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="title">Event Title *</Label>
          <Controller
            name="title"
            control={control}
            rules={{ required: 'Event title is required' }}
            render={({ field }) => (
              <Input
                {...field}
                id="title"
                placeholder="Wednesday Night Comedy"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
              />
            )}
          />
          {errors.title && (
            <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* Show Level + Event Type in 2-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
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
                    <SelectItem value="open-mic">Open Mic</SelectItem>
                    <SelectItem value="semi-pro">Semi-Pro</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div>
            <Label htmlFor="showType">Event Type</Label>
            <Controller
              name="showType"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="showcase">Showcase</SelectItem>
                    <SelectItem value="solo-show">Solo Show</SelectItem>
                    <SelectItem value="open-mic">Open Mic</SelectItem>
                    <SelectItem value="live-podcast">Live Podcast</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        {/* Custom Event Type input - shown only when "custom" is selected */}
        {showType === 'custom' && (
          <div>
            <Label htmlFor="customShowType">Custom Event Type</Label>
            <Controller
              name="customShowType"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="customShowType"
                  placeholder="Enter custom event type"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                />
              )}
            />
          </div>
        )}

        <div>
          <Label htmlFor="description">Event Description</Label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                id="description"
                placeholder="Describe your comedy event, atmosphere, and what comedians can expect..."
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-300 min-h-[100px]"
              />
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};