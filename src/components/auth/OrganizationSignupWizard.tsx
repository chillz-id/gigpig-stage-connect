import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Search, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface OrganizationSignupWizardProps {
  userId: string;
  onComplete: () => void;
  onSkip: () => void;
}

type WizardStep = 'choice' | 'create' | 'join';

export const OrganizationSignupWizard: React.FC<OrganizationSignupWizardProps> = ({
  userId,
  onComplete,
  onSkip,
}) => {
  const [step, setStep] = useState<WizardStep>('choice');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create org fields
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState<'venue' | 'production' | 'agency'>('venue');
  const [orgDescription, setOrgDescription] = useState('');

  // Join org fields
  const [joinMessage, setJoinMessage] = useState('');
  const [requestedRole, setRequestedRole] = useState<'member' | 'admin' | 'manager'>('member');

  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Enter organization name",
        description: "Please enter a name to search for organizations.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('organization_profiles')
        .select('id, organization_name, organization_type, bio')
        .ilike('organization_name', `%${searchQuery}%`)
        .limit(10);

      if (error) throw error;

      // Map to expected format for UI compatibility
      const mapped = (data || []).map(org => ({
        id: org.id,
        name: org.organization_name,
        type: Array.isArray(org.organization_type) ? org.organization_type[0] : org.organization_type,
        description: org.bio,
      }));
      setOrganizations(mapped);

      if (!data || data.length === 0) {
        toast({
          title: "No organizations found",
          description: "Try a different search term or create a new organization.",
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: "Could not search for organizations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateOrganization = async () => {
    if (!orgName.trim()) {
      toast({
        title: "Organization name required",
        description: "Please enter a name for your organization.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Map org type to organization_profiles format (array)
      const orgTypeMap: Record<string, string> = {
        'venue': 'venue',
        'production': 'event_promoter',
        'agency': 'artist_agency',
      };

      // Create organization profile (id auto-generates, owner_id links to user's profile)
      const { data: newOrg, error: orgError } = await supabase
        .from('organization_profiles')
        .insert({
          organization_name: orgName,
          display_name: orgName,
          organization_type: [orgTypeMap[orgType] || 'event_promoter'],
          bio: orgDescription || null,
          owner_id: userId,
          contact_email: `pending@gigpigs.app`,
          is_active: true,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Add user as admin team member
      const { error: memberError } = await supabase
        .from('organization_team_members')
        .insert({
          organization_id: newOrg.id,
          user_id: userId,
          role: 'admin',
        });

      if (memberError) throw memberError;

      toast({
        title: "Organization created!",
        description: `${orgName} has been created successfully.`,
      });

      onComplete();
    } catch (error: any) {
      console.error('Create organization error:', error);
      toast({
        title: "Failed to create organization",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinRequest = async () => {
    if (!selectedOrg) {
      toast({
        title: "Select an organization",
        description: "Please select an organization to join.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('organization_join_requests')
        .insert({
          organization_id: selectedOrg.id,
          requester_id: userId,
          requested_role: requestedRole,
          message: joinMessage,
          status: 'pending',
        });

      if (error) {
        // Check for duplicate request error
        if (error.code === '23505') {
          toast({
            title: "Request already exists",
            description: "You have already requested to join this organization.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Request submitted!",
        description: `Your request to join ${selectedOrg.name} has been sent.`,
      });

      onComplete();
    } catch (error: any) {
      console.error('Join request error:', error);
      toast({
        title: "Failed to submit request",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'choice') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Organization Setup
          </CardTitle>
          <CardDescription>
            Would you like to create a new organization or join an existing one?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              className="professional-button h-32 flex flex-col items-center justify-center gap-3"
              onClick={() => setStep('create')}
            >
              <Plus className="h-8 w-8" />
              <div className="text-center">
                <div className="font-semibold">Create New Organization</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Start your own venue, production company, or agency
                </div>
              </div>
            </Button>

            <Button
              className="professional-button h-32 flex flex-col items-center justify-center gap-3"
              onClick={() => setStep('join')}
            >
              <Search className="h-8 w-8" />
              <div className="text-center">
                <div className="font-semibold">Join Existing Organization</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Request to join an organization you work with
                </div>
              </div>
            </Button>
          </div>

          <div className="pt-4 border-t">
            <Button variant="ghost" onClick={onSkip} className="w-full">
              Skip for now
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'create') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Create New Organization</CardTitle>
          <CardDescription>
            Set up your venue, production company, or agency profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization Name *</Label>
            <Input
              id="org-name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Sydney Comedy Club"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label>Organization Type *</Label>
            <RadioGroup value={orgType} onValueChange={(value: any) => setOrgType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="venue" id="type-venue" />
                <Label htmlFor="type-venue" className="font-normal cursor-pointer">
                  Venue - Comedy club, theater, bar
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="production" id="type-production" />
                <Label htmlFor="type-production" className="font-normal cursor-pointer">
                  Production Company - Event production
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="agency" id="type-agency" />
                <Label htmlFor="type-agency" className="font-normal cursor-pointer">
                  Agency - Representation, tour management
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-description">Description</Label>
            <Textarea
              id="org-description"
              value={orgDescription}
              onChange={(e) => setOrgDescription(e.target.value)}
              placeholder="Brief description of your organization..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button className="professional-button" onClick={() => setStep('choice')} disabled={isSubmitting}>
              Back
            </Button>
            <Button onClick={handleCreateOrganization} disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Creating...' : 'Create Organization'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'join') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Join an Organization</CardTitle>
          <CardDescription>
            Search for and request to join an existing organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search Organizations</Label>
            <div className="flex gap-2">
              <Input
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter organization name..."
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                disabled={isSearching}
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>

          {organizations.length > 0 && (
            <div className="space-y-2">
              <Label>Select Organization</Label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {organizations.map((org) => (
                  <Card
                    key={org.id}
                    className={`cursor-pointer transition-colors ${
                      selectedOrg?.id === org.id ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => setSelectedOrg(org)}
                  >
                    <CardContent className="p-4">
                      <div className="font-semibold">{org.name}</div>
                      <div className="text-sm text-muted-foreground capitalize">{org.type}</div>
                      {org.description && (
                        <div className="text-sm mt-1">{org.description}</div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {selectedOrg && (
            <>
              <div className="space-y-2">
                <Label>Requested Role</Label>
                <RadioGroup value={requestedRole} onValueChange={(value: any) => setRequestedRole(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="member" id="role-member" />
                    <Label htmlFor="role-member" className="font-normal cursor-pointer">
                      Member - Basic access
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="manager" id="role-manager" />
                    <Label htmlFor="role-manager" className="font-normal cursor-pointer">
                      Manager - Can manage events and content
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="admin" id="role-admin" />
                    <Label htmlFor="role-admin" className="font-normal cursor-pointer">
                      Admin - Full organization control
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message to Organization (Optional)</Label>
                <Textarea
                  id="message"
                  value={joinMessage}
                  onChange={(e) => setJoinMessage(e.target.value)}
                  placeholder="Introduce yourself and explain why you'd like to join..."
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
            </>
          )}

          <div className="flex gap-2 pt-4">
            <Button className="professional-button" onClick={() => setStep('choice')} disabled={isSubmitting}>
              Back
            </Button>
            <Button
              onClick={handleJoinRequest}
              disabled={!selectedOrg || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};
