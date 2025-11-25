import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Crown, Search, Building2, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useVouches } from '@/hooks/useVouches';
import { VouchFormData, UserSearchResult, Vouch } from '@/types/vouch';
import { useOrganizationProfiles } from '@/hooks/useOrganizationProfiles';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface GiveVouchFormProps {
  userId: string;
  onSuccess?: () => void;
}

export function GiveVouchForm({ userId, onSuccess }: GiveVouchFormProps) {
  const { toast } = useToast();
  const {
    searchUsers,
    checkExistingVouch,
    createVouch,
    updateVouch,
  } = useVouches(userId); // Pass userId to hook for profile-scoped vouching

  // Get user's organizations for "vouch as" selector
  const { data: organizations } = useOrganizationProfiles();
  const orgList = organizations ? Object.values(organizations) : [];

  // Form state
  const [hasVouch, setHasVouch] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [existingVouch, setExistingVouch] = useState<Vouch | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Organization selection - 'personal' or org UUID
  const [vouchAs, setVouchAs] = useState<string>('personal');

  // Handle user search
  useEffect(() => {
    const handleSearch = async () => {
      if (searchQuery.trim().length > 0) {
        console.log('[GiveVouchForm] Searching for:', searchQuery);
        const results = await searchUsers(searchQuery);
        console.log('[GiveVouchForm] Search results:', results);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    };

    const timeoutId = setTimeout(handleSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchUsers]);

  // Check for existing vouch when user is selected
  useEffect(() => {
    const checkExisting = async () => {
      if (selectedUser) {
        const existing = await checkExistingVouch(selectedUser.id);
        setExistingVouch(existing);
        if (existing) {
          setHasVouch(true);
          setMessage(existing.message);
          setIsEditing(true);
        } else {
          setIsEditing(false);
          setHasVouch(false);
          setMessage('');
        }
      }
    };
    checkExisting();
  }, [selectedUser, checkExistingVouch]);

  const handleCrownClick = () => {
    setHasVouch(!hasVouch);
  };

  const handleSubmitVouch = async () => {
    if (!selectedUser) {
      toast({
        title: "User Required",
        description: "Please select a user to vouch for.",
        variant: "destructive",
      });
      return;
    }

    if (!hasVouch) {
      toast({
        title: "Vouch Required",
        description: "Please click the crown to give a vouch.",
        variant: "destructive",
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Message Required",
        description: "Please write a message about your experience.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const formData: VouchFormData = {
        vouchee_id: selectedUser.id,
        message: message.trim(),
        rating: 5, // Always give 5 stars since we're using crown system
        // Include organization_id if vouching on behalf of an org
        organization_id: vouchAs !== 'personal' ? vouchAs : null
      };

      if (isEditing && existingVouch) {
        await updateVouch(existingVouch.id, formData);
        toast({
          title: "Vouch Updated",
          description: "Your vouch has been updated successfully.",
        });
      } else {
        await createVouch(formData);
        toast({
          title: "Vouch Submitted",
          description: "Your vouch has been submitted successfully.",
        });
      }

      // Reset form
      setHasVouch(false);
      setMessage('');
      setSelectedUser(null);
      setSearchQuery('');
      setExistingVouch(null);
      setIsEditing(false);
      setVouchAs('personal');

      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit vouch",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUserSelect = (user: UserSearchResult) => {
    setSelectedUser(user);
    setSearchQuery(user.name);
    setIsSearchOpen(false);
  };

  const clearSelection = () => {
    setSelectedUser(null);
    setSearchQuery('');
    setExistingVouch(null);
    setIsEditing(false);
    setHasVouch(false);
    setMessage('');
  };

  const renderCrown = () => {
    const crownClasses = hasVouch || isHovering || message.trim().length > 0
      ? 'h-10 w-10 text-yellow-500 fill-yellow-500 transition-all duration-300'
      : 'h-10 w-10 text-muted-foreground transition-all duration-300';

    return (
      <div className="flex items-center justify-center">
        <Crown
          className={`${crownClasses} cursor-pointer hover:text-yellow-500 hover:fill-yellow-500`}
          onClick={handleCrownClick}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="vouchUser">Search for Comedian or Org</Label>
        <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Input
                id="vouchUser"
                placeholder="Search for comedian or organization..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                className="pr-8"
              />
              <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput placeholder="Search users..." value={searchQuery} onValueChange={setSearchQuery} />
              <CommandList>
                <CommandEmpty>No users found.</CommandEmpty>
                <CommandGroup>
                  {searchResults.map((user) => (
                    <CommandItem
                      key={user.id}
                      onSelect={() => handleUserSelect(user)}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{user.stage_name || user.name}</p>
                        <div className="flex gap-1 mt-1">
                          {user.roles.map(role => (
                            <Badge key={role} variant="secondary" className="text-xs">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {selectedUser && (
          <div className="mt-2 p-3 bg-muted rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={selectedUser.avatar_url} />
                <AvatarFallback>{selectedUser.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{selectedUser.stage_name || selectedUser.name}</p>
                <div className="flex gap-1">
                  {selectedUser.roles.map(role => (
                    <Badge key={role} variant="secondary" className="text-xs">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              Clear
            </Button>
          </div>
        )}

        {existingVouch && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-medium">
              You already have a vouch for this person. You can edit it below.
            </p>
          </div>
        )}
      </div>

      {/* Organization selector - only show if user has organizations */}
      {orgList.length > 0 && (
        <div>
          <Label htmlFor="vouchAs">Vouch as</Label>
          <Select value={vouchAs} onValueChange={setVouchAs}>
            <SelectTrigger id="vouchAs" className="mt-1">
              <SelectValue placeholder="Select who is vouching" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>Personal (as yourself)</span>
                </div>
              </SelectItem>
              {orgList.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <span>{org.display_name || org.organization_name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            {vouchAs === 'personal'
              ? 'This vouch will appear as coming from you personally.'
              : 'This vouch will display your organization\'s logo and name, with your name shown underneath.'}
          </p>
        </div>
      )}

      <div>
        <Label htmlFor="vouchMessage">Message</Label>
        <Textarea
          id="vouchMessage"
          placeholder="Share your experience working with this person..."
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            // Auto-fill crown when user starts typing
            if (e.target.value.trim().length > 0 && !hasVouch) {
              setHasVouch(true);
            }
          }}
          className="mt-1"
          rows={3}
        />
      </div>

      <div className="flex items-center justify-between">
        {renderCrown()}
        <Button
          onClick={handleSubmitVouch}
          className="professional-button"
          disabled={submitting || !selectedUser}
        >
          {submitting ? 'Submitting...' : (isEditing ? 'Update Vouch' : 'Submit Vouch')}
        </Button>
      </div>
    </div>
  );
}
