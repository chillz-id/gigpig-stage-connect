import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Award, Star, Plus, Search, Edit2, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { VouchCard } from './VouchCard';
import { useToast } from '@/hooks/use-toast';
import { useVouches } from '@/hooks/useVouches';
import { useAuth } from '@/contexts/AuthContext';
import { VouchFormData, UserSearchResult, Vouch } from '@/types/vouch';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export const VouchSystemEnhanced: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    loading,
    vouches,
    stats,
    searchUsers,
    checkExistingVouch,
    createVouch,
    updateVouch,
    deleteVouch,
    getReceivedVouches,
    getGivenVouches
  } = useVouches();

  // Form state
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [existingVouch, setExistingVouch] = useState<Vouch | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingVouch, setEditingVouch] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Get formatted vouch lists
  const receivedVouches = useMemo(() => getReceivedVouches(), [getReceivedVouches]);
  const givenVouches = useMemo(() => getGivenVouches(), [getGivenVouches]);

  // Handle user search
  useEffect(() => {
    const handleSearch = async () => {
      if (searchQuery.trim().length > 0) {
        const results = await searchUsers(searchQuery);
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
          setRating(existing.rating);
          setMessage(existing.message);
          setIsEditing(true);
        } else {
          setIsEditing(false);
          setRating(0);
          setMessage('');
        }
      }
    };
    checkExisting();
  }, [selectedUser, checkExistingVouch]);

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
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

    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating before submitting.",
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
        rating
      };

      if (isEditing && existingVouch) {
        await updateVouch(existingVouch.id, formData);
      } else {
        await createVouch(formData);
      }

      // Reset form
      setRating(0);
      setMessage('');
      setSelectedUser(null);
      setSearchQuery('');
      setExistingVouch(null);
      setIsEditing(false);
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

  const handleEditVouch = (vouch: any) => {
    setEditingVouch(vouch);
    setRating(vouch.rating);
    setMessage(vouch.message);
    setIsEditDialogOpen(true);
  };

  const handleUpdateEditingVouch = async () => {
    if (!editingVouch) return;

    setSubmitting(true);
    try {
      await updateVouch(editingVouch.id, {
        message: message.trim(),
        rating
      });
      setIsEditDialogOpen(false);
      setEditingVouch(null);
      setRating(0);
      setMessage('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update vouch",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVouch = async (vouchId: string) => {
    try {
      await deleteVouch(vouchId);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete vouch",
        variant: "destructive",
      });
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
    setRating(0);
    setMessage('');
  };

  const renderStars = (interactive = false, currentRating = 0) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-6 h-6 cursor-pointer transition-colors ${
          i < currentRating ? 'text-yellow-400 fill-current' : 'text-gray-300 hover:text-yellow-200'
        }`}
        onClick={interactive ? () => handleStarClick(i + 1) : undefined}
      />
    ));
  };

  if (!user) {
    return (
      <Card className="professional-card">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-amber-600" />
          <h3 className="text-lg font-semibold text-amber-800 mb-2">Authentication Required</h3>
          <p className="text-amber-700">
            Please sign in to access the vouch system.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Vouch Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Award className="w-5 h-5 text-blue-600 mr-2" />
                <span className="text-2xl font-bold">{stats.total_received}</span>
              </div>
              <p className="text-sm text-muted-foreground">Received</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-2xl font-bold">{stats.total_given}</span>
              </div>
              <p className="text-sm text-muted-foreground">Given</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Star className="w-5 h-5 text-yellow-600 mr-2" />
                <span className="text-2xl font-bold">
                  {stats.average_rating_received > 0 ? stats.average_rating_received.toFixed(1) : '—'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Avg Rating</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600 mr-2" />
                <span className="text-2xl font-bold">{stats.recent_vouches_received}</span>
              </div>
              <p className="text-sm text-muted-foreground">Recent (30d)</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Give a Vouch */}
      <Card className="professional-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            {isEditing ? 'Edit Your Vouch' : 'Give a Vouch'}
          </CardTitle>
          <CardDescription>
            {isEditing 
              ? 'Update your existing vouch for this person'
              : 'Vouch for a comedian or promoter you\'ve worked with'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="vouchUser">User to Vouch For</Label>
            <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
              <PopoverTrigger asChild>
                <div className="relative">
                  <Input
                    id="vouchUser"
                    placeholder="Search for comedian or promoter..."
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
                <Command>
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
                                <Badge key={role} variant="outline" className="text-xs">
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
                        <Badge key={role} variant="outline" className="text-xs">
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
          
          <div>
            <Label>Rating</Label>
            <div className="flex items-center gap-1 mt-2">
              {renderStars(true, rating)}
            </div>
          </div>

          <div>
            <Label htmlFor="vouchMessage">Message</Label>
            <Textarea
              id="vouchMessage"
              placeholder="Share your experience working with this person..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>

          <Button 
            onClick={handleSubmitVouch} 
            className="professional-button"
            disabled={submitting || !selectedUser}
          >
            {submitting ? 'Submitting...' : (isEditing ? 'Update Vouch' : 'Submit Vouch')}
          </Button>
        </CardContent>
      </Card>

      {/* Vouch History */}
      <Card className="professional-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Vouch History
          </CardTitle>
          <CardDescription>
            View vouches you've received and given
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="received" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="received">
                Received ({receivedVouches.length})
              </TabsTrigger>
              <TabsTrigger value="given">
                Given ({givenVouches.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="received" className="space-y-4 mt-4">
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading vouches...</p>
                </div>
              ) : receivedVouches.length === 0 ? (
                <div className="text-center py-8">
                  <Award className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No vouches received yet.</p>
                </div>
              ) : (
                receivedVouches.map((vouch) => (
                  <VouchCard 
                    key={vouch.id} 
                    vouch={{
                      id: vouch.id,
                      fromUser: {
                        name: vouch.voucher_profile?.stage_name || vouch.voucher_profile?.name || 'Unknown User',
                        avatar: vouch.voucher_profile?.avatar_url || '',
                        role: 'User' // We could enhance this with role info
                      },
                      rating: vouch.rating,
                      comment: vouch.message,
                      date: vouch.created_at,
                      type: 'received' as const
                    }} 
                  />
                ))
              )}
            </TabsContent>
            
            <TabsContent value="given" className="space-y-4 mt-4">
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading vouches...</p>
                </div>
              ) : givenVouches.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No vouches given yet.</p>
                </div>
              ) : (
                givenVouches.map((vouch) => (
                  <div key={vouch.id} className="relative">
                    <VouchCard 
                      vouch={{
                        id: vouch.id,
                        fromUser: {
                          name: user?.name || 'You',
                          avatar: '',
                          role: 'You'
                        },
                        toUser: {
                          name: vouch.vouchee_profile?.stage_name || vouch.vouchee_profile?.name || 'Unknown User',
                          avatar: vouch.vouchee_profile?.avatar_url || '',
                          role: 'User'
                        },
                        rating: vouch.rating,
                        comment: vouch.message,
                        date: vouch.created_at,
                        type: 'given' as const
                      }} 
                    />
                    <div className="absolute top-4 right-4 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditVouch(vouch)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Vouch Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Vouch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editingVouch && (
              <div className="p-3 bg-muted rounded-lg flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={editingVouch.vouchee_profile?.avatar_url} />
                  <AvatarFallback>
                    {(editingVouch.vouchee_profile?.name || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {editingVouch.vouchee_profile?.stage_name || editingVouch.vouchee_profile?.name || 'Unknown User'}
                  </p>
                </div>
              </div>
            )}
            
            <div>
              <Label>Rating</Label>
              <div className="flex items-center gap-1 mt-2">
                {renderStars(true, rating)}
              </div>
            </div>

            <div>
              <Label htmlFor="editMessage">Message</Label>
              <Textarea
                id="editMessage"
                placeholder="Share your experience working with this person..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateEditingVouch}
                disabled={submitting}
              >
                {submitting ? 'Updating...' : 'Update Vouch'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
