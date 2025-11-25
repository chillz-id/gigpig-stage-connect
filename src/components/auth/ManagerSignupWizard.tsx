import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Search, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ManagerSignupWizardProps {
  userId: string;
  onComplete: () => void;
  onSkip: () => void;
}

const MANAGER_TYPES = [
  { value: 'social_media', label: 'Social Media Management' },
  { value: 'finance', label: 'Financial Management' },
  { value: 'tour', label: 'Tour Management' },
  { value: 'booking', label: 'Booking & Scheduling' },
  { value: 'content', label: 'Content Creation' },
  { value: 'general', label: 'General Management' },
];

type ClientType = 'comedian' | 'organization';

export const ManagerSignupWizard: React.FC<ManagerSignupWizardProps> = ({
  userId,
  onComplete,
  onSkip,
}) => {
  const [step, setStep] = useState<'profile' | 'clients'>('profile');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manager profile fields
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [specializations, setSpecializations] = useState('');

  // Client search fields
  const [clientType, setClientType] = useState<ClientType>('comedian');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedClients, setSelectedClients] = useState<any[]>([]);
  const [requestMessage, setRequestMessage] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const { toast } = useToast();

  const handleTypeToggle = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleCreateProfile = async () => {
    if (selectedTypes.length === 0) {
      toast({
        title: "Select management types",
        description: "Please select at least one type of management you offer.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const specializationsArray = specializations
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const { error } = await supabase.from('comedy_manager_profiles').insert({
        user_id: userId,
        manager_types: selectedTypes,
        bio: bio || null,
        years_experience: yearsExperience ? parseInt(yearsExperience, 10) : null,
        specializations: specializationsArray.length > 0 ? specializationsArray : null,
        availability_status: 'available',
      });

      if (error) throw error;

      toast({
        title: "Manager profile created!",
        description: "Your manager profile has been set up successfully.",
      });

      setStep('clients');
    } catch (error: any) {
      console.error('Create manager profile error:', error);
      toast({
        title: "Failed to create profile",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Enter search term",
        description: `Please enter a ${clientType} name to search.`,
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      if (clientType === 'comedian') {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, display_name, role')
          .contains('role', ['comedian'])
          .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
          .limit(10);

        if (error) throw error;
        setSearchResults(data || []);
      } else {
        const { data, error } = await supabase
          .from('organizations')
          .select('id, name, type, description')
          .ilike('name', `%${searchQuery}%`)
          .limit(10);

        if (error) throw error;
        setSearchResults(data || []);
      }

      if (!searchResults || searchResults.length === 0) {
        toast({
          title: "No results found",
          description: "Try a different search term.",
        });
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleClientToggle = (client: any) => {
    setSelectedClients((prev) =>
      prev.find((c) => c.id === client.id)
        ? prev.filter((c) => c.id !== client.id)
        : [...prev, client]
    );
  };

  const handleSendRequests = async () => {
    if (selectedClients.length === 0) {
      toast({
        title: "Select clients",
        description: "Please select at least one client to send requests to.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const requests = selectedClients.map((client) => ({
        manager_id: userId,
        client_id: client.id,
        client_type: clientType,
        manager_types: selectedTypes,
        message: requestMessage || null,
        status: 'pending',
      }));

      const { error } = await supabase.from('manager_client_requests').insert(requests);

      if (error) throw error;

      toast({
        title: "Requests sent!",
        description: `Your management requests have been sent to ${selectedClients.length} ${clientType}(s).`,
      });

      onComplete();
    } catch (error: any) {
      console.error('Send requests error:', error);

      if (error.code === '23505') {
        toast({
          title: "Duplicate request",
          description: "You have already sent a request to one or more of these clients.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to send requests",
          description: error.message || "Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'profile') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-6 w-6" />
            Manager Profile Setup
          </CardTitle>
          <CardDescription>
            Tell us about your management services and experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Management Types *</Label>
            <div className="space-y-2">
              {MANAGER_TYPES.map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type.value}`}
                    checked={selectedTypes.includes(type.value)}
                    onCheckedChange={() => handleTypeToggle(type.value)}
                  />
                  <Label
                    htmlFor={`type-${type.value}`}
                    className="font-normal cursor-pointer"
                  >
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell clients about your management style and experience..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience">Years of Experience</Label>
            <Input
              id="experience"
              type="number"
              min="0"
              value={yearsExperience}
              onChange={(e) => setYearsExperience(e.target.value)}
              placeholder="e.g., 5"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specializations">Additional Specializations</Label>
            <Input
              id="specializations"
              value={specializations}
              onChange={(e) => setSpecializations(e.target.value)}
              placeholder="e.g., International tours, Festival booking (comma separated)"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button className="professional-button" onClick={onSkip} disabled={isSubmitting}>
              Skip for now
            </Button>
            <Button onClick={handleCreateProfile} disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Creating...' : 'Continue'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'clients') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-6 w-6" />
            Connect with Clients
          </CardTitle>
          <CardDescription>
            Search for comedians or organizations you'd like to manage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Client Type</Label>
            <div className="flex gap-2">
              <Button
                variant={clientType === 'comedian' ? 'default' : 'secondary'}
                onClick={() => {
                  setClientType('comedian');
                  setSearchResults([]);
                  setSelectedClients([]);
                }}
                className="flex-1"
              >
                Comedians
              </Button>
              <Button
                variant={clientType === 'organization' ? 'default' : 'secondary'}
                onClick={() => {
                  setClientType('organization');
                  setSearchResults([]);
                  setSelectedClients([]);
                }}
                className="flex-1"
              >
                Organizations
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="search">Search {clientType === 'comedian' ? 'Comedians' : 'Organizations'}</Label>
            <div className="flex gap-2">
              <Input
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Enter ${clientType} name...`}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                disabled={isSearching}
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2">
              <Label>Select Clients to Request</Label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {searchResults.map((client) => {
                  const isSelected = selectedClients.some((c) => c.id === client.id);
                  const displayName =
                    clientType === 'comedian'
                      ? client.display_name || `${client.first_name} ${client.last_name}`
                      : client.name;

                  return (
                    <Card
                      key={client.id}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => handleClientToggle(client)}
                    >
                      <CardContent className="p-4 flex items-center gap-3">
                        <Checkbox checked={isSelected} />
                        <div className="flex-1">
                          <div className="font-semibold">{displayName}</div>
                          {clientType === 'organization' && client.type && (
                            <div className="text-sm text-muted-foreground capitalize">
                              {client.type}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {selectedClients.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="Introduce yourself and explain your management services..."
                rows={3}
                disabled={isSubmitting}
              />
              <div className="text-sm text-muted-foreground">
                Selected: {selectedClients.length} {clientType}(s)
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button className="professional-button" onClick={onComplete} disabled={isSubmitting}>
              Skip for now
            </Button>
            <Button
              onClick={handleSendRequests}
              disabled={selectedClients.length === 0 || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Sending...' : `Send Request${selectedClients.length > 1 ? 's' : ''}`}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};
