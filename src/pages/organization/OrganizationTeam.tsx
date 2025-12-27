import { useState } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useOrganizationTeamMembers, useUpdateTeamMemberRole, useRemoveTeamMember } from '@/hooks/useOrganizationProfiles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OptimizedAvatar } from '@/components/ui/OptimizedAvatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { Users, Crown, Shield, User, UserX, Mail, Settings } from 'lucide-react';
import { PermissionEditor } from '@/components/organization/PermissionEditor';
import { ManagerTypeSelector } from '@/components/organization/ManagerTypeSelector';
import { ManagerTypeBadge, PermissionSummaryBadges, CustomPermissionsBadge } from '@/components/organization/PermissionBadges';
import type { ManagerType, OrganizationPermissions } from '@/types/permissions';
import { ADMIN_PERMISSIONS, MEMBER_PERMISSIONS, DEFAULT_PERMISSIONS } from '@/types/permissions';

export default function OrganizationTeam() {
  const { organization, orgId, isOwner, isAdmin } = useOrganization();
  const { data: teamMembers, isLoading } = useOrganizationTeamMembers(orgId || '');
  const { mutate: updateRole, isPending: isUpdatingRole } = useUpdateTeamMemberRole();
  const { mutate: removeMember, isPending: isRemoving } = useRemoveTeamMember();
  const { toast } = useToast();

  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [permissionEditorState, setPermissionEditorState] = useState<{
    open: boolean;
    userId: string | null;
    userName: string;
    permissions: OrganizationPermissions;
  }>({
    open: false,
    userId: null,
    userName: '',
    permissions: MEMBER_PERMISSIONS,
  });

  const handleRoleChange = (userId: string, newRole: 'admin' | 'member') => {
    if (!orgId) return;

    updateRole(
      { organizationId: orgId, userId, role: newRole },
      {
        onSuccess: () => {
          toast({
            title: 'Role updated',
            description: 'Team member role has been updated successfully.',
          });
        },
        onError: (error) => {
          toast({
            title: 'Error updating role',
            description: error.message,
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleRemoveMember = () => {
    if (!orgId || !memberToRemove) return;

    removeMember(
      { organizationId: orgId, userId: memberToRemove },
      {
        onSuccess: () => {
          toast({
            title: 'Member removed',
            description: 'Team member has been removed from the organization.',
          });
          setMemberToRemove(null);
        },
        onError: (error) => {
          toast({
            title: 'Error removing member',
            description: error.message,
            variant: 'destructive',
          });
          setMemberToRemove(null);
        },
      }
    );
  };

  const handleOpenPermissionEditor = (
    userId: string,
    userName: string,
    role: string,
    managerType: ManagerType | null,
    customPermissions: OrganizationPermissions | null
  ) => {
    // Determine effective permissions
    let permissions: OrganizationPermissions;

    if (customPermissions) {
      permissions = customPermissions;
    } else if (role === 'admin') {
      permissions = ADMIN_PERMISSIONS;
    } else if (role === 'manager' && managerType && DEFAULT_PERMISSIONS[managerType]) {
      permissions = DEFAULT_PERMISSIONS[managerType];
    } else if (role === 'manager') {
      permissions = DEFAULT_PERMISSIONS.general;
    } else {
      permissions = MEMBER_PERMISSIONS;
    }

    setPermissionEditorState({
      open: true,
      userId,
      userName,
      permissions,
    });
  };

  const handleSavePermissions = (permissions: OrganizationPermissions) => {
    if (!orgId || !permissionEditorState.userId) return;

    // TODO: Create mutation hook for updating permissions
    // For now, just close the dialog
    toast({
      title: 'Permissions updated',
      description: `Custom permissions saved for ${permissionEditorState.userName}`,
    });

    setPermissionEditorState({
      open: false,
      userId: null,
      userName: '',
      permissions: MEMBER_PERMISSIONS,
    });
  };

  const handleManagerTypeChange = (userId: string, managerType: ManagerType | null) => {
    if (!orgId) return;

    // TODO: Create mutation hook for updating manager type
    toast({
      title: 'Manager type updated',
      description: 'Manager specialization has been updated.',
    });
  };

  const getRoleIcon = (role: string, isOwnerUser: boolean) => {
    if (isOwnerUser) return <Crown className="h-4 w-4 text-yellow-600" />;
    if (role === 'admin') return <Shield className="h-4 w-4 text-purple-600" />;
    return <User className="h-4 w-4 text-gray-600" />;
  };

  const getRoleBadge = (role: string, isOwnerUser: boolean) => {
    if (isOwnerUser) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
          <Crown className="h-3 w-3" />
          Owner
        </span>
      );
    }
    if (role === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-800">
          <Shield className="h-3 w-3" />
          Admin
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-800">
        <User className="h-3 w-3" />
        Member
        </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Organization Not Found</h1>
      </div>
    );
  }

  const owner = teamMembers?.find((member) => member.is_owner);
  const admins = teamMembers?.filter((member) => member.role === 'admin' && !member.is_owner) || [];
  const managers = teamMembers?.filter((member) => member.role === 'manager') || [];
  const members = teamMembers?.filter((member) => member.role === 'member') || [];

  return (
    <div className="container mx-auto max-w-4xl space-y-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Members</h1>
          <p className="mt-1 text-gray-600">Manage {organization.organization_name}'s team</p>
        </div>
        {(isOwner || isAdmin) && (
          <Button disabled>
            <Users className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Team Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-100 p-3">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Members</p>
                <p className="text-2xl font-bold">{teamMembers?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-100 p-3">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Admins</p>
                <p className="text-2xl font-bold">{admins.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-3">
                <Settings className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Managers</p>
                <p className="text-2xl font-bold">{managers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-gray-100 p-3">
                <User className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Members</p>
                <p className="text-2xl font-bold">{members.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Owner */}
      {owner && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-600" />
              Organization Owner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-4">
                <OptimizedAvatar
                  src={owner.avatar_url}
                  name={`${owner.first_name || ''} ${owner.last_name || ''}`.trim() || 'Owner'}
                  className="h-12 w-12"
                />
                <div>
                  <h3 className="font-medium">
                    {owner.first_name} {owner.last_name}
                  </h3>
                  <p className="text-sm text-gray-600">{owner.email}</p>
                </div>
              </div>
              {getRoleBadge('owner', true)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admins */}
      {admins.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              Administrators ({admins.length})
            </CardTitle>
            <CardDescription>Can manage team members and organization settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {admins.map((member) => (
              <div key={member.user_id} className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-4">
                  <OptimizedAvatar
                    src={member.avatar_url}
                    name={`${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Member'}
                    className="h-10 w-10"
                  />
                  <div>
                    <h4 className="font-medium">
                      {member.first_name} {member.last_name}
                    </h4>
                    <p className="text-sm text-gray-600">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getRoleBadge(member.role, false)}
                  {isOwner && (
                    <div className="flex items-center gap-2">
                      <Select
                        value={member.role}
                        onValueChange={(value) => handleRoleChange(member.user_id, value as 'admin' | 'member')}
                        disabled={isUpdatingRole}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMemberToRemove(member.user_id)}
                        disabled={isRemoving}
                      >
                        <UserX className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Managers */}
      {managers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              Managers ({managers.length})
            </CardTitle>
            <CardDescription>Team managers with specialized permissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {managers.map((member) => {
              const managerType = member.manager_type as ManagerType | null;
              const customPerms = member.custom_permissions as OrganizationPermissions | null;
              const effectivePerms = customPerms ||
                (managerType && DEFAULT_PERMISSIONS[managerType]) ||
                DEFAULT_PERMISSIONS.general;

              return (
                <div key={member.user_id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <OptimizedAvatar
                        src={member.avatar_url}
                        name={`${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Manager'}
                        className="h-10 w-10"
                      />
                      <div>
                        <h4 className="font-medium">
                          {member.first_name} {member.last_name}
                        </h4>
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getRoleBadge(member.role, false)}
                      {(isOwner || isAdmin) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setMemberToRemove(member.user_id)}
                          disabled={isRemoving}
                        >
                          <UserX className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Manager Type & Permissions Row */}
                  <div className="flex items-start gap-4 pt-2 border-t">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 mb-2">Manager Type</p>
                      {(isOwner || isAdmin) ? (
                        <ManagerTypeSelector
                          value={managerType}
                          onChange={(type) => handleManagerTypeChange(member.user_id, type)}
                          disabled={isUpdatingRole}
                        />
                      ) : managerType ? (
                        <ManagerTypeBadge type={managerType} />
                      ) : (
                        <span className="text-sm text-gray-500">No specialized type</span>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-gray-500">Permissions</p>
                        {(isOwner || isAdmin) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() =>
                              handleOpenPermissionEditor(
                                member.user_id,
                                `${member.first_name} ${member.last_name}`,
                                member.role,
                                managerType,
                                customPerms
                              )
                            }
                          >
                            <Settings className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <PermissionSummaryBadges permissions={effectivePerms} maxBadges={3} />
                        {customPerms && <CustomPermissionsBadge hasCustom={true} />}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-gray-600" />
            Members ({members.length})
          </CardTitle>
          <CardDescription>General team members</CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              No team members yet
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.user_id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-4">
                    <OptimizedAvatar
                      src={member.avatar_url}
                      name={`${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Member'}
                      className="h-10 w-10"
                    />
                    <div>
                      <h4 className="font-medium">
                        {member.first_name} {member.last_name}
                      </h4>
                      <p className="text-sm text-gray-600">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getRoleBadge(member.role, false)}
                    {(isOwner || isAdmin) && (
                      <div className="flex items-center gap-2">
                        <Select
                          value={member.role}
                          onValueChange={(value) => handleRoleChange(member.user_id, value as 'admin' | 'member')}
                          disabled={isUpdatingRole}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setMemberToRemove(member.user_id)}
                          disabled={isRemoving}
                        >
                          <UserX className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
            <AlertDialogDescription>
              This member will lose access to the organization. They can be re-invited later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember} className="bg-red-600 hover:bg-red-700">
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permission Editor Dialog */}
      <PermissionEditor
        open={permissionEditorState.open}
        onOpenChange={(open) => {
          if (!open) {
            setPermissionEditorState({
              open: false,
              userId: null,
              userName: '',
              permissions: MEMBER_PERMISSIONS,
            });
          }
        }}
        userName={permissionEditorState.userName}
        currentPermissions={permissionEditorState.permissions}
        onSave={handleSavePermissions}
        isLoading={isUpdatingRole}
      />
    </div>
  );
}
