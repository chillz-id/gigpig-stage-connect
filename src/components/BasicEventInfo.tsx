import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { Control, Controller, FieldErrors } from 'react-hook-form';
import { EventFormData } from '@/types/eventTypes';

interface BasicEventInfoProps {
  control: Control<EventFormData>;
  errors: FieldErrors<EventFormData>;
}

export const BasicEventInfo: React.FC<BasicEventInfoProps> = ({ control, errors }) => {
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

        <div>
          <Label htmlFor="type">Event Type</Label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id="type"
                placeholder="Stand-up Comedy Night"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
              />
            )}
          />
        </div>

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