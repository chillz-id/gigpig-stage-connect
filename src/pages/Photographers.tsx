import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Camera, 
  Video, 
  MapPin,
  DollarSign,
  SlidersHorizontal
} from 'lucide-react';
import { usePhotographers } from '@/hooks/usePhotographers';
import PhotographerCard from '@/components/PhotographerCard';
import { PhotographerFilters, PHOTOGRAPHER_SPECIALTIES, PHOTOGRAPHER_SERVICES } from '@/types/photographer';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

const Photographers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [filters, setFilters] = useState<PhotographerFilters>({
    search: '',
    sortBy: 'name',
    available_for_events: true,
  });
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [maxRate, setMaxRate] = useState<number>(500);
  const [contactingId, setContactingId] = useState<string | null>(null);

  const { photographers, isLoading, error } = usePhotographers({
    ...filters,
    specialties: selectedSpecialties,
    services: selectedServices,
    max_rate: maxRate,
  });

  const getBackgroundStyles = () => {
    // Always use business theme for now
    return 'bg-gradient-to-br from-gray-800 via-gray-900 to-red-900';
  };

  const getCardStyles = () => {
    // Always use business theme for now
    return 'bg-gray-800/90 border-gray-600 text-gray-100';
  };

  const getHeaderTextStyles = () => {
    // Always use business theme for now
    return 'text-gray-100';
  };

  const getSubtextStyles = () => {
    // Always use business theme for now
    return 'text-gray-300';
  };

  const handleContact = async (photographerId: string, photographerEmail: string) => {
    setContactingId(photographerId);
    try {
      // Navigate to message composer or open email client
      if (photographerEmail) {
        window.location.href = `mailto:${photographerEmail}?subject=Photography/Videography Inquiry`;
      } else {
        toast({
          title: 'Contact information not available',
          description: 'Please check back later or view their profile for more details.',
          variant: 'destructive',
        });
      }
    } finally {
      setContactingId(null);
    }
  };

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties(prev =>
      prev.includes(specialty)
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  };

  const toggleService = (service: string) => {
    setSelectedServices(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  return (
    <div className={`min-h-screen ${getBackgroundStyles()}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`text-4xl font-bold mb-4 ${getHeaderTextStyles()}`}>
            Photographers & Videographers
          </h1>
          <p className={`${getSubtextStyles()} max-w-2xl mx-auto`}>
            Find professional photographers and videographers for your shows
          </p>
        </div>

        {/* Search and Filters */}
        <div className={`${getCardStyles()} rounded-lg shadow-sm p-4 mb-6`}>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by name, location, or specialty..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>

            {/* Sort */}
            <Select 
              value={filters.sortBy} 
              onValueChange={(value: any) => setFilters({ ...filters, sortBy: value })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="experience">Experience</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="rate">Rate</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button className="professional-button">
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filters
                  {(selectedSpecialties.length > 0 || selectedServices.length > 0) && (
                    <Badge className="ml-2" variant="secondary">
                      {selectedSpecialties.length + selectedServices.length}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filter Photographers</SheetTitle>
                </SheetHeader>
                
                <div className="space-y-6 mt-6">
                  {/* Specialties */}
                  <div>
                    <h3 className="font-medium mb-3">Specialties</h3>
                    <div className="space-y-2">
                      {PHOTOGRAPHER_SPECIALTIES.map(specialty => (
                        <div key={specialty} className="flex items-center space-x-2">
                          <Checkbox
                            id={specialty}
                            checked={selectedSpecialties.includes(specialty)}
                            onCheckedChange={() => toggleSpecialty(specialty)}
                          />
                          <Label 
                            htmlFor={specialty} 
                            className="text-sm font-normal cursor-pointer"
                          >
                            {specialty}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Services */}
                  <div>
                    <h3 className="font-medium mb-3">Services</h3>
                    <div className="space-y-2">
                      {PHOTOGRAPHER_SERVICES.map(service => (
                        <div key={service} className="flex items-center space-x-2">
                          <Checkbox
                            id={service}
                            checked={selectedServices.includes(service)}
                            onCheckedChange={() => toggleService(service)}
                          />
                          <Label 
                            htmlFor={service} 
                            className="text-sm font-normal cursor-pointer"
                          >
                            {service.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Max Rate */}
                  <div>
                    <h3 className="font-medium mb-3">Maximum Rate</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Up to</span>
                        <span className="text-sm font-medium">${maxRate}/hour</span>
                      </div>
                      <Slider
                        value={[maxRate]}
                        onValueChange={([value]) => setMaxRate(value)}
                        min={50}
                        max={1000}
                        step={50}
                      />
                    </div>
                  </div>

                  {/* Available for Events */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="available"
                      checked={filters.available_for_events}
                      onCheckedChange={(checked) => 
                        setFilters({ ...filters, available_for_events: !!checked })
                      }
                    />
                    <Label htmlFor="available" className="text-sm font-normal cursor-pointer">
                      Available for events
                    </Label>
                  </div>

                  {/* Clear Filters */}
                  <Button
                    className="professional-button w-full"
                    onClick={() => {
                      setSelectedSpecialties([]);
                      setSelectedServices([]);
                      setMaxRate(500);
                      setFilters({
                        search: '',
                        sortBy: 'name',
                        available_for_events: true,
                      });
                    }}
                  >
                    Clear all filters
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Active Filters */}
          {(selectedSpecialties.length > 0 || selectedServices.length > 0) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {selectedSpecialties.map(specialty => (
                <Badge 
                  key={specialty} 
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => toggleSpecialty(specialty)}
                >
                  {specialty} ×
                </Badge>
              ))}
              {selectedServices.map(service => (
                <Badge 
                  key={service} 
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => toggleService(service)}
                >
                  {service.replace(/_/g, ' ')} ×
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-400 mx-auto"></div>
            <p className={`mt-4 ${getSubtextStyles()}`}>Loading photographers...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400">Error loading photographers. Please try again.</p>
          </div>
        ) : photographers.length === 0 ? (
          <div className="text-center py-12">
            <Camera className={`w-12 h-12 ${getSubtextStyles()} mx-auto mb-4`} />
            <p className={`${getSubtextStyles()}`}>No photographers found matching your criteria.</p>
            <Button
              className="professional-button mt-4"
              onClick={() => {
                setFilters({ search: '', sortBy: 'name', available_for_events: true });
                setSelectedSpecialties([]);
                setSelectedServices([]);
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {photographers.map((photographer) => (
              <PhotographerCard
                key={photographer.id}
                photographer={photographer}
                isContacting={contactingId === photographer.id}
                onContact={handleContact}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Photographers;