
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star } from 'lucide-react';
import { AddressAutocomplete } from './AddressAutocomplete';

interface EventBasicInfoProps {
  formData: {
    title: string;
    venue: string;
    address: string;
    city: string;
    state: string;
    country: string;
    description: string;
    capacity?: number;
  };
  onFormDataChange: (updates: Partial<EventBasicInfoProps['formData']>) => void;
}

export const EventBasicInfo: React.FC<EventBasicInfoProps> = ({ formData, onFormDataChange }) => {
  const handleAddressSelect = (address: string, placeDetails?: any) => {
    
    // Update address
    onFormDataChange({ address });
    
    // Extract city and state from place details if available
    if (placeDetails?.address_components) {
      let city = '';
      let state = '';
      
      placeDetails.address_components.forEach((component: any) => {
        if (component.types.includes('locality')) {
          city = component.long_name;
        }
        if (component.types.includes('administrative_area_level_1')) {
          state = component.short_name;
        }
      });
      
      if (city || state) {
        onFormDataChange({ 
          city: city || formData.city, 
          state: state || formData.state 
        });
      }
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5" />
          Event Title & Venue Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => onFormDataChange({ title: e.target.value })}
              placeholder="Wednesday Night Comedy"
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="venue">Venue Name *</Label>
              <Input
                id="venue"
                value={formData.venue}
                onChange={(e) => onFormDataChange({ venue: e.target.value })}
                placeholder="The Comedy Club"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                required
              />
            </div>
            <div>
              <Label htmlFor="capacity">Capacity *</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                value={formData.capacity || ''}
                onChange={(e) => onFormDataChange({ capacity: parseInt(e.target.value) || 0 })}
                placeholder="150"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Event Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => onFormDataChange({ description: e.target.value })}
            placeholder="Describe your comedy event, atmosphere, and what comedians can expect..."
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-300 min-h-[100px]"
          />
        </div>

        <div>
          <Label htmlFor="address">Full Address</Label>
          <AddressAutocomplete
            onAddressSelect={handleAddressSelect}
            placeholder="Start typing to search for an address..."
            defaultValue={formData.address}
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => onFormDataChange({ city: e.target.value })}
              placeholder="Sydney"
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
              required
            />
          </div>
          <div>
            <Label htmlFor="state">State *</Label>
            <Select value={formData.state} onValueChange={(value) => onFormDataChange({ state: value })}>
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
          </div>
          <div>
            <Label htmlFor="country">Country</Label>
            <Select value={formData.country} onValueChange={(value) => onFormDataChange({ country: value })}>
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
