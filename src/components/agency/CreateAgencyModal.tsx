import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { X } from 'lucide-react';
import { useCreateAgency } from '../../hooks/useAgency';
import type { AgencyType, CreateAgencyRequest } from '../../types/agency';
import LoadingSpinner from '../LoadingSpinner';

interface CreateAgencyModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CreateAgencyModal: React.FC<CreateAgencyModalProps> = ({ open, onClose, onSuccess }) => {
  console.log('CreateAgencyModal render, open:', open);
  
  const [formData, setFormData] = useState<CreateAgencyRequest>({
    name: '',
    legal_name: '',
    agency_type: 'talent_agency',
    email: '',
    phone: '',
    website_url: '',
    address: '',
    city: '',
    state: '',
    country: 'Australia',
    description: '',
    specialties: [],
    commission_rate: 15
  });
  
  const [newSpecialty, setNewSpecialty] = useState('');
  const createAgencyMutation = useCreateAgency();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createAgencyMutation.mutateAsync(formData);
      onSuccess?.();
      onClose();
      // Reset form
      setFormData({
        name: '',
        legal_name: '',
        agency_type: 'talent_agency',
        email: '',
        phone: '',
        website_url: '',
        address: '',
        city: '',
        state: '',
        country: 'Australia',
        description: '',
        specialties: [],
        commission_rate: 15
      });
    } catch (error) {
      console.error('Error creating agency:', error);
    }
  };

  const handleInputChange = (field: keyof CreateAgencyRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addSpecialty = () => {
    if (newSpecialty.trim() && !formData.specialties?.includes(newSpecialty.trim())) {
      setFormData(prev => ({
        ...prev,
        specialties: [...(prev.specialties || []), newSpecialty.trim()]
      }));
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties?.filter(s => s !== specialty) || []
    }));
  };

  const agencyTypes: { value: AgencyType; label: string }[] = [
    { value: 'talent_agency', label: 'Talent Agency' },
    { value: 'booking_agency', label: 'Booking Agency' },
    { value: 'management_company', label: 'Management Company' },
    { value: 'hybrid', label: 'Hybrid Agency' }
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Agency</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Agency Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter agency name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="legal_name">Legal Name</Label>
                <Input
                  id="legal_name"
                  value={formData.legal_name || ''}
                  onChange={(e) => handleInputChange('legal_name', e.target.value)}
                  placeholder="Legal business name"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="agency_type">Agency Type *</Label>
              <Select
                value={formData.agency_type}
                onValueChange={(value: AgencyType) => handleInputChange('agency_type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {agencyTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your agency's services and expertise"
                rows={3}
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Contact Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="contact@agency.com"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+61 2 9876 5432"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="website_url">Website</Label>
              <Input
                id="website_url"
                type="url"
                value={formData.website_url || ''}
                onChange={(e) => handleInputChange('website_url', e.target.value)}
                placeholder="https://www.agency.com"
              />
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Address</h3>
            
            <div>
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                value={formData.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="123 Business Street"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city || ''}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Sydney"
                />
              </div>
              
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state || ''}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="NSW"
                />
              </div>
              
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country || ''}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  placeholder="Australia"
                />
              </div>
            </div>
          </div>

          {/* Specialties */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Specialties</h3>
            
            <div className="flex gap-2">
              <Input
                value={newSpecialty}
                onChange={(e) => setNewSpecialty(e.target.value)}
                placeholder="Add specialty (e.g., Comedy, Music, Corporate)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSpecialty();
                  }
                }}
              />
              <Button type="button" onClick={addSpecialty}>
                Add
              </Button>
            </div>
            
            {formData.specialties && formData.specialties.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.specialties.map((specialty) => (
                  <Badge key={specialty} variant="secondary" className="flex items-center gap-1">
                    {specialty}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeSpecialty(specialty)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Commission Rate */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Financial Settings</h3>
            
            <div>
              <Label htmlFor="commission_rate">Default Commission Rate (%)</Label>
              <Input
                id="commission_rate"
                type="number"
                min="0"
                max="50"
                step="0.01"
                value={formData.commission_rate || ''}
                onChange={(e) => handleInputChange('commission_rate', parseFloat(e.target.value))}
                placeholder="15.00"
              />
              <p className="text-sm text-gray-600 mt-1">
                Default commission rate for new artist contracts (0-50%)
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createAgencyMutation.isPending || !formData.name.trim()}
            >
              {createAgencyMutation.isPending ? (
                <>
                  <LoadingSpinner />
                  Creating...
                </>
              ) : (
                'Create Agency'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAgencyModal;