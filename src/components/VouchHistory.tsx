import { useMemo, useState, useEffect } from 'react';
import { Crown, Users, Edit2, Trash2, Search, User, Building2 } from 'lucide-react';
import { VouchCard } from './VouchCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useVouches } from '@/hooks/useVouches';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useOrganizationProfiles } from '@/hooks/useOrganizationProfiles';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface VouchHistoryProps {
  userId: string;
  mode: 'received' | 'given';
}

export function VouchHistory({ userId, mode }: VouchHistoryProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    loading,
    getReceivedVouches,
    getGivenVouches,
    updateVouch,
    deleteVouch,
    fetchVouches,
  } = useVouches(userId);

  // Get user's organizations for "vouch as" selector
  const { data: organizations } = useOrganizationProfiles();
  const orgList = organizations ? Object.values(organizations) : [];

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Edit dialog state
  const [editingVouch, setEditingVouch] = useState<any>(null);
  const [editMessage, setEditMessage] = useState('');
  const [editVouchAs, setEditVouchAs] = useState<string>('personal');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation state
  const [deleteVouchId, setDeleteVouchId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const allVouches = useMemo(() => {
    return mode === 'received' ? getReceivedVouches() : getGivenVouches();
  }, [mode, getReceivedVouches, getGivenVouches]);

  // Filter vouches based on search query
  const vouches = useMemo(() => {
    if (!searchQuery.trim()) return allVouches;

    const query = searchQuery.toLowerCase();
    return allVouches.filter(vouch => {
      if (mode === 'received') {
        // Search by voucher's name/stage_name
        const voucherName = vouch.voucher_profile?.stage_name || vouch.voucher_profile?.name || '';
        return voucherName.toLowerCase().includes(query) ||
               vouch.message.toLowerCase().includes(query);
      } else {
        // Search by vouchee's name/stage_name
        const voucheeName = vouch.vouchee_profile?.stage_name || vouch.vouchee_profile?.name || '';
        return voucheeName.toLowerCase().includes(query) ||
               vouch.message.toLowerCase().includes(query);
      }
    });
  }, [allVouches, searchQuery, mode]);

  // Edit handlers
  const handleEditClick = (vouch: any) => {
    setEditingVouch(vouch);
    setEditMessage(vouch.message);
    // Set initial vouchAs based on existing organization_id
    setEditVouchAs(vouch.organization_id || 'personal');
    setIsEditDialogOpen(true);
  };

  const handleUpdateVouch = async () => {
    if (!editingVouch || !editMessage.trim()) return;

    setIsSubmitting(true);
    try {
      await updateVouch(editingVouch.id, {
        message: editMessage.trim(),
        rating: 5,
        organization_id: editVouchAs !== 'personal' ? editVouchAs : null,
      });
      toast({
        title: "Vouch Updated",
        description: "Your vouch has been updated successfully.",
      });
      setIsEditDialogOpen(false);
      setEditingVouch(null);
      setEditMessage('');
      setEditVouchAs('personal');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update vouch",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete handlers
  const handleDeleteClick = (vouchId: string) => {
    setDeleteVouchId(vouchId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteVouchId) return;

    try {
      await deleteVouch(deleteVouchId);
      toast({
        title: mode === 'given' ? "Vouch Deleted" : "Vouch Removed",
        description: mode === 'given'
          ? "Your vouch has been deleted."
          : "The vouch has been removed from your profile.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete vouch",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setDeleteVouchId(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading vouches...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={mode === 'received' ? "Search by name or message..." : "Search by recipient or message..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Results count when searching */}
      {searchQuery && (
        <p className="text-sm text-muted-foreground">
          Showing {vouches.length} of {allVouches.length} vouches
        </p>
      )}

      {/* Vouches list */}
      {vouches.length === 0 ? (
        <div className="text-center py-8">
          {searchQuery ? (
            <p className="text-muted-foreground">No vouches match your search.</p>
          ) : mode === 'received' ? (
            <>
              <Crown className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No vouches received yet.</p>
            </>
          ) : (
            <>
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No vouches given yet.</p>
            </>
          )}
        </div>
      ) : (
        vouches.map((vouch) => (
          <div key={vouch.id} className="relative">
            <VouchCard
              vouch={mode === 'received' ? {
                id: vouch.id,
                fromUser: {
                  name: vouch.voucher_profile?.stage_name || vouch.voucher_profile?.name || 'Unknown User',
                  avatar: vouch.voucher_profile?.avatar_url || '',
                  role: vouch.voucher_profile?.roles?.[0] || 'User'
                },
                rating: vouch.rating,
                comment: vouch.message,
                date: vouch.created_at,
                type: 'received' as const,
                organization: vouch.organization_profile ? {
                  id: vouch.organization_profile.id,
                  display_name: vouch.organization_profile.display_name,
                  logo_url: vouch.organization_profile.logo_url,
                } : null,
              } : {
                id: vouch.id,
                fromUser: {
                  name: vouch.voucher_profile?.stage_name || vouch.voucher_profile?.name || user?.name || 'You',
                  avatar: vouch.voucher_profile?.avatar_url || '',
                  role: vouch.voucher_profile?.roles?.[0] || 'You'
                },
                toUser: {
                  name: vouch.vouchee_profile?.stage_name || vouch.vouchee_profile?.name || 'Unknown User',
                  avatar: vouch.vouchee_profile?.avatar_url || '',
                  role: vouch.vouchee_profile?.roles?.[0] || 'User'
                },
                rating: vouch.rating,
                comment: vouch.message,
                date: vouch.created_at,
                type: 'given' as const,
                organization: vouch.organization_profile ? {
                  id: vouch.organization_profile.id,
                  display_name: vouch.organization_profile.display_name,
                  logo_url: vouch.organization_profile.logo_url,
                } : null,
              }}
            />
            {/* Action buttons */}
            <div className="absolute top-4 right-4 flex gap-1">
              {mode === 'given' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditClick(vouch)}
                  title="Edit your vouch"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleDeleteClick(vouch.id)}
                title={mode === 'given' ? "Delete your vouch" : "Remove this vouch"}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Vouch</DialogTitle>
            <DialogDescription>
              Update your vouch message below.
            </DialogDescription>
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

            {/* Organization selector - only show if user has organizations */}
            {orgList.length > 0 && (
              <div>
                <Label htmlFor="editVouchAs">Vouch as</Label>
                <Select value={editVouchAs} onValueChange={setEditVouchAs}>
                  <SelectTrigger id="editVouchAs" className="mt-1">
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
                  {editVouchAs === 'personal'
                    ? 'This vouch will appear as coming from you personally.'
                    : 'This vouch will display your organization\'s logo and name.'}
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="editMessage">Message</Label>
              <Textarea
                id="editMessage"
                placeholder="Share your experience working with this person..."
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdateVouch}
                disabled={isSubmitting || !editMessage.trim()}
              >
                {isSubmitting ? 'Updating...' : 'Update Vouch'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {mode === 'given' ? 'Delete Your Vouch?' : 'Remove This Vouch?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {mode === 'given'
                ? 'This will permanently delete the vouch you gave. This action cannot be undone.'
                : 'This will remove this vouch from your profile. This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {mode === 'given' ? 'Delete Vouch' : 'Remove Vouch'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
