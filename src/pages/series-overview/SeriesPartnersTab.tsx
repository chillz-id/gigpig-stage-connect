/**
 * SeriesPartnersTab Component
 *
 * Manages series-level partners. Partners added here are automatically
 * inherited by all events in the series (synced via database triggers).
 */

import { useState } from 'react';
import { Plus, Users, UserCheck, Mail, Shield, Eye, Edit, DollarSign, Database, MoreHorizontal, Search, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { OptimizedAvatar } from '@/components/ui/OptimizedAvatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useSeriesPartners,
  useSearchSeriesPartnersToAdd,
  useAddSeriesPartner,
  useUpdateSeriesPartnerPermissions,
  useRemoveSeriesPartner,
  useDeactivateSeriesPartner,
  useReactivateSeriesPartner,
  type SeriesPartnerWithProfile,
  type SeriesPartnerPermissions,
} from '@/hooks/useSeriesPartners';

const DEFAULT_PERMISSIONS: SeriesPartnerPermissions = {
  is_admin: false,
  can_view_details: true,
  can_edit_event: false,
  can_view_financials: false,
  can_manage_financials: false,
  can_receive_crm_data: false,
};

interface SeriesPartnersTabProps {
  seriesId: string;
  userId: string;
}

export default function SeriesPartnersTab({ seriesId, userId }: SeriesPartnersTabProps) {
  const [showAddPartner, setShowAddPartner] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<SeriesPartnerWithProfile | null>(null);
  const [newPartnerPermissions, setNewPartnerPermissions] = useState<SeriesPartnerPermissions>(DEFAULT_PERMISSIONS);

  // Queries
  const { data: partners, isLoading } = useSeriesPartners(seriesId);
  const { data: searchResults, isLoading: searchLoading } = useSearchSeriesPartnersToAdd(
    showAddPartner ? seriesId : undefined,
    searchQuery
  );

  // Mutations
  const addPartner = useAddSeriesPartner();
  const updatePermissions = useUpdateSeriesPartnerPermissions();
  const removePartner = useRemoveSeriesPartner();
  const deactivatePartner = useDeactivateSeriesPartner();
  const reactivatePartner = useReactivateSeriesPartner();

  // Stats
  const activePartners = partners?.filter(p => p.status === 'active') || [];
  const pendingPartners = partners?.filter(p => p.status === 'pending_invite') || [];

  const handleAddPartner = async (profileId?: string) => {
    await addPartner.mutateAsync({
      series_id: seriesId,
      partner_profile_id: profileId,
      invited_email: profileId ? undefined : inviteEmail,
      permissions: newPartnerPermissions,
    });
    setShowAddPartner(false);
    setSearchQuery('');
    setInviteEmail('');
    setNewPartnerPermissions(DEFAULT_PERMISSIONS);
  };

  const handleUpdatePermission = async (partnerId: string, permission: keyof SeriesPartnerPermissions, value: boolean) => {
    await updatePermissions.mutateAsync({
      partner_id: partnerId,
      permissions: { [permission]: value },
    });
  };

  const handleRemovePartner = async (partnerId: string) => {
    if (confirm('Are you sure you want to remove this partner? They will be removed from all events in this series.')) {
      await removePartner.mutateAsync({ partnerId, seriesId });
    }
  };

  const handleDeactivate = async (partnerId: string) => {
    await deactivatePartner.mutateAsync({ partnerId, seriesId });
  };

  const handleReactivate = async (partnerId: string) => {
    await reactivatePartner.mutateAsync({ partnerId, seriesId });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case 'pending_invite':
        return <Badge variant="secondary">Pending Invite</Badge>;
      case 'inactive':
        return <Badge variant="secondary" className="text-muted-foreground">Inactive</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Series Partners</h2>
          <p className="text-sm text-muted-foreground">
            Manage partner access across all events in this series
          </p>
        </div>
        <Button onClick={() => setShowAddPartner(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Partner
        </Button>
      </div>

      {/* Series Inheritance Info */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Series-Level Partners</AlertTitle>
        <AlertDescription>
          Partners added here automatically gain access to <strong>all events</strong> in this series.
          Changes sync automatically to existing and future events.
        </AlertDescription>
      </Alert>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Partners</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{partners?.length || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{activePartners.length}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Mail className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{pendingPartners.length}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Partners List */}
      <Card>
        <CardHeader>
          <CardTitle>Partner List</CardTitle>
          <CardDescription>
            Users and organizations with access to all events in this series
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : partners?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">No Partners Yet</p>
              <p className="text-sm text-muted-foreground">
                Add partners to give others access to all events in this series
              </p>
              <Button onClick={() => setShowAddPartner(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add First Partner
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {partners?.map((partner) => (
                <div key={partner.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <OptimizedAvatar
                        src={partner.partner_profile?.avatar_url || undefined}
                        name={partner.partner_profile?.display_name || partner.partner_profile?.name || partner.invited_email || 'Partner'}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {partner.partner_profile?.display_name || partner.partner_profile?.name || partner.invited_email || 'Unknown'}
                          </p>
                          {getStatusBadge(partner.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {partner.partner_profile?.email || partner.invited_email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedPartner(partner)}>
                          Edit Permissions
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {partner.status === 'active' ? (
                          <DropdownMenuItem onClick={() => handleDeactivate(partner.id)}>
                            Deactivate
                          </DropdownMenuItem>
                        ) : partner.status === 'inactive' ? (
                          <DropdownMenuItem onClick={() => handleReactivate(partner.id)}>
                            Reactivate
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem
                          onClick={() => handleRemovePartner(partner.id)}
                          className="text-destructive"
                        >
                          Remove Partner
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Permissions Display */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {partner.is_admin && (
                      <Badge className="gap-1 bg-purple-500 hover:bg-purple-600">
                        <Shield className="h-3 w-3" /> Admin
                      </Badge>
                    )}
                    {partner.can_view_details && (
                      <Badge variant="secondary" className="gap-1">
                        <Eye className="h-3 w-3" /> View
                      </Badge>
                    )}
                    {partner.can_edit_event && (
                      <Badge variant="secondary" className="gap-1">
                        <Edit className="h-3 w-3" /> Edit
                      </Badge>
                    )}
                    {partner.can_view_financials && (
                      <Badge variant="secondary" className="gap-1">
                        <DollarSign className="h-3 w-3" /> Financials
                      </Badge>
                    )}
                    {partner.can_manage_financials && (
                      <Badge variant="secondary" className="gap-1">
                        <DollarSign className="h-3 w-3" /> Manage $
                      </Badge>
                    )}
                    {partner.can_receive_crm_data && (
                      <Badge variant="secondary" className="gap-1">
                        <Database className="h-3 w-3" /> CRM
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Partner Dialog */}
      <Dialog open={showAddPartner} onOpenChange={setShowAddPartner}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Series Partner</DialogTitle>
            <DialogDescription>
              This partner will gain access to all events in the series
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Search */}
            <div className="space-y-2">
              <Label>Search Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              {searchLoading && <p className="text-sm text-muted-foreground">Searching...</p>}
              {searchResults && searchResults.length > 0 && (
                <div className="mt-2 space-y-2">
                  {searchResults.map((profile) => (
                    <div
                      key={profile.id}
                      className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-muted"
                      onClick={() => handleAddPartner(profile.id)}
                    >
                      <div className="flex items-center gap-3">
                        <OptimizedAvatar
                          src={profile.avatar_url || undefined}
                          name={profile.display_name || profile.name || 'User'}
                          className="h-8 w-8"
                        />
                        <div>
                          <p className="text-sm font-medium">
                            {profile.display_name || profile.name}
                          </p>
                          <p className="text-xs text-muted-foreground">{profile.email}</p>
                        </div>
                      </div>
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}
              {searchQuery.length >= 2 && !searchLoading && searchResults?.length === 0 && (
                <p className="text-sm text-muted-foreground">No users found</p>
              )}
            </div>

            {/* Or Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or invite by email</span>
              </div>
            </div>

            {/* Email Invite */}
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <div className="flex gap-2">
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="partner@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <Button
                  onClick={() => handleAddPartner()}
                  disabled={!inviteEmail || !inviteEmail.includes('@') || addPartner.isPending}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Invite
                </Button>
              </div>
            </div>

            {/* Permissions for New Partner */}
            <div className="space-y-4">
              <Label>Initial Permissions</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-purple-50 p-2 dark:bg-purple-950/30">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-purple-500" />
                    <div>
                      <span className="text-sm font-medium">Series Admin</span>
                      <p className="text-xs text-muted-foreground">Can manage series settings, partners, and deals</p>
                    </div>
                  </div>
                  <Switch
                    checked={newPartnerPermissions.is_admin}
                    onCheckedChange={(checked) =>
                      setNewPartnerPermissions(prev => ({ ...prev, is_admin: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">View Event Details</span>
                  </div>
                  <Switch
                    checked={newPartnerPermissions.can_view_details}
                    onCheckedChange={(checked) =>
                      setNewPartnerPermissions(prev => ({ ...prev, can_view_details: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Edit className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Edit Events</span>
                  </div>
                  <Switch
                    checked={newPartnerPermissions.can_edit_event}
                    onCheckedChange={(checked) =>
                      setNewPartnerPermissions(prev => ({ ...prev, can_edit_event: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">View Financials</span>
                  </div>
                  <Switch
                    checked={newPartnerPermissions.can_view_financials}
                    onCheckedChange={(checked) =>
                      setNewPartnerPermissions(prev => ({ ...prev, can_view_financials: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Manage Financials</span>
                  </div>
                  <Switch
                    checked={newPartnerPermissions.can_manage_financials}
                    onCheckedChange={(checked) =>
                      setNewPartnerPermissions(prev => ({ ...prev, can_manage_financials: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">CRM Data Sync</span>
                  </div>
                  <Switch
                    checked={newPartnerPermissions.can_receive_crm_data}
                    onCheckedChange={(checked) =>
                      setNewPartnerPermissions(prev => ({ ...prev, can_receive_crm_data: checked }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowAddPartner(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Permissions Dialog */}
      <Dialog open={!!selectedPartner} onOpenChange={() => setSelectedPartner(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit Permissions</DialogTitle>
            <DialogDescription>
              Update permissions for {selectedPartner?.partner_profile?.display_name || selectedPartner?.partner_profile?.name || 'this partner'}
            </DialogDescription>
          </DialogHeader>

          {selectedPartner && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between rounded-lg bg-purple-50 p-2 dark:bg-purple-950/30">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-purple-500" />
                  <div>
                    <span className="text-sm font-medium">Series Admin</span>
                    <p className="text-xs text-muted-foreground">Can manage series settings, partners, and deals</p>
                  </div>
                </div>
                <Switch
                  checked={selectedPartner.is_admin}
                  onCheckedChange={(checked) =>
                    handleUpdatePermission(selectedPartner.id, 'is_admin', checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">View Event Details</span>
                </div>
                <Switch
                  checked={selectedPartner.can_view_details}
                  onCheckedChange={(checked) =>
                    handleUpdatePermission(selectedPartner.id, 'can_view_details', checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Edit Events</span>
                </div>
                <Switch
                  checked={selectedPartner.can_edit_event}
                  onCheckedChange={(checked) =>
                    handleUpdatePermission(selectedPartner.id, 'can_edit_event', checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">View Financials</span>
                </div>
                <Switch
                  checked={selectedPartner.can_view_financials}
                  onCheckedChange={(checked) =>
                    handleUpdatePermission(selectedPartner.id, 'can_view_financials', checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Manage Financials</span>
                </div>
                <Switch
                  checked={selectedPartner.can_manage_financials}
                  onCheckedChange={(checked) =>
                    handleUpdatePermission(selectedPartner.id, 'can_manage_financials', checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">CRM Data Sync</span>
                </div>
                <Switch
                  checked={selectedPartner.can_receive_crm_data}
                  onCheckedChange={(checked) =>
                    handleUpdatePermission(selectedPartner.id, 'can_receive_crm_data', checked)
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setSelectedPartner(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
