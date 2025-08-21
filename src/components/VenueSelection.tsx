import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin } from 'lucide-react';
import { AddressAutocomplete } from './AddressAutocomplete';
import { Control, Controller, FieldErrors } from 'react-hook-form';
import { EventFormData } from '@/types/eventTypes';

interface VenueSelectionProps {
  control: Control<EventFormData>;
  errors: FieldErrors<EventFormData>;
  onAddressSelect: (address: string, placeDetails?: any) => void;
}

export const VenueSelection: React.FC<VenueSelectionProps> = ({ 
  control, 
  errors,
  onAddressSelect 
}) => {
  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Venue Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="venue">Venue Name *</Label>
            <Controller
              name="venue"
              control={control}
              rules={{ required: 'Venue name is required' }}
              render={({ field }) => (
                <Input
                  {...field}
                  id="venue"
                  placeholder="The Comedy Club"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                />
              )}
            />
            {errors.venue && (
              <p className="text-red-400 text-sm mt-1">{errors.venue.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="capacity">Capacity *</Label>
            <Controller
              name="capacity"
              control={control}
              rules={{ 
                required: 'Capacity is required',
                min: { value: 1, message: 'Capacity must be at least 1' }
              }}
              render={({ field }) => (
                <Input
                  {...field}
                  id="capacity"
                  type="number"
                  min="1"
                  placeholder="150"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              )}
            />
            {errors.capacity && (
              <p className="text-red-400 text-sm mt-1">{errors.capacity.message}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="address">Full Address *</Label>
          <Controller
            name="address"
            control={control}
            rules={{ required: 'Address is required' }}
            render={({ field }) => (
              <AddressAutocomplete
                {...field}
                onAddressSelect={(address, placeDetails) => {
                  field.onChange(address);
                  onAddressSelect(address, placeDetails);
                }}
                placeholder="Start typing to search for an address..."
                defaultValue={field.value}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
              />
            )}
          />
          {errors.address && (
            <p className="text-red-400 text-sm mt-1">{errors.address.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="city">City *</Label>
            <Controller
              name="city"
              control={control}
              rules={{ required: 'City is required' }}
              render={({ field }) => (
                <Input
                  {...field}
                  id="city"
                  placeholder="Sydney"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                />
              )}
            />
            {errors.city && (
              <p className="text-red-400 text-sm mt-1">{errors.city.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="state">State *</Label>
            <Controller
              name="state"
              control={control}
              rules={{ required: 'State is required' }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NSW">New South Wales</SelectItem>
                    <SelectItem value="VIC">Victoria</SelectItem>
                    <SelectItem value="QLD">Queensland</SelectItem>
                    <SelectItem value="WA">Western Australia</SelectItem>
                    <SelectItem value="SA">South Australia</SelectItem>
                    <SelectItem value="TAS">Tasmania</SelectItem>
                    <SelectItem value="NT">Northern Territory</SelectItem>
                    <SelectItem value="ACT">Australian Capital Territory</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.state && (
              <p className="text-red-400 text-sm mt-1">{errors.state.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="country">Country</Label>
            <Controller
              name="country"
              control={control}
              defaultValue="Australia"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Australia">Australia</SelectItem>
                    <SelectItem value="USA">United States</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                    <SelectItem value="UK">United Kingdom</SelectItem>
                    <SelectItem value="Ireland">Ireland</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};