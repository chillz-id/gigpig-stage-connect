/**
 * MemberOverridesDialog Component
 *
 * Allows setting per-member permission overrides for organization-level partners.
 * Each team member inherits the org's partner permissions by default.
 * Individual members can have overrides (null = inherit, true/false = explicit).
 */

import { useState, useEffect } from 'react';
import { Eye, Edit, DollarSign, Database, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { OptimizedAvatar } from '@/components/ui/OptimizedAvatar';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  usePartnerMemberOverrides,
  useSetMemberOverride,
  useRemoveMemberOverride,
} from '@/hooks/useSeriesPartnerOverrides';
import type { SeriesPartnerWithProfile } from '@/hooks/useSeriesPartners';

interface MemberOverridesDialogProps {
  partner: SeriesPartnerWithProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface OrgTeamMember {
  id: string;
  user_id: string;
  role: string;
  name: string | null;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

type PermissionKey = 'can_view_details' | 'can_edit_event' | 'can_view_financials' | 'can_manage_financials' | 'can_receive_crm_data';

const PERMISSION_LABELS: { key: PermissionKey; label: string; icon: typeof Eye }[] = [
  { key: 'can_view_details', label: 'View Details', icon: Eye },
  { key: 'can_edit_event', label: 'Edit Events', icon: Edit },
  { key: 'can_view_financials', label: 'View Financials', icon: DollarSign },
  { key: 'can_manage_financials', label: 'Manage Financials', icon: DollarSign },
  { key: 'can_receive_crm_data', label: 'CRM Data', icon: Database },
];

export default function MemberOverridesDialog({ partner, open, onOpenChange }: MemberOverridesDialogProps) {
  const orgId = partner?.partner_organization_id;

  // Fetch org team members
  const { data: teamMembers, isLoading: membersLoading } = useQuery({
    queryKey: ['org-team-members', orgId],
    queryFn: async () => {
      if (!orgId) return [];

      // Get team members
      const { data: members, error: membersError } = await supabase
        .from('organization_team_members')
        .select('id, user_id, role')
        .eq('organization_id', orgId);

      if (membersError) throw membersError;

      // Get org owner
      const { data: orgProfile } = await supabase
        .from('organization_profiles')
        .select('owner_id')
        .eq('id', orgId)
        .single();

      const userIds = [
        ...(members || []).map(m => m.user_id),
        ...(orgProfile?.owner_id ? [orgProfile.owner_id] : []),
      ];

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, display_name, email, avatar_url')
        .in('id', userIds);

      const profilesMap = (profiles || []).reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {} as Record<string, typeof profiles[0]>);

      const result: OrgTeamMember[] = [];

      // Add owner
      if (orgProfile?.owner_id) {
        const ownerProfile = profilesMap[orgProfile.owner_id];
        result.push({
          id: `owner-${orgProfile.owner_id}`,
          user_id: orgProfile.owner_id,
          role: 'owner',
          name: ownerProfile?.name || null,
          display_name: ownerProfile?.display_name || null,
          email: ownerProfile?.email || null,
          avatar_url: ownerProfile?.avatar_url || null,
        });
      }

      // Add team members (excluding owner if they're also a team member)
      for (const member of members || []) {
        if (member.user_id === orgProfile?.owner_id) continue;
        const profile = profilesMap[member.user_id];
        result.push({
          id: member.id,
          user_id: member.user_id,
          role: member.role,
          name: profile?.name || null,
          display_name: profile?.display_name || null,
          email: profile?.email || null,
          avatar_url: profile?.avatar_url || null,
        });
      }

      return result;
    },
    enabled: !!orgId && open,
  });

  // Fetch existing overrides
  const { data: overrides, isLoading: overridesLoading } = usePartnerMemberOverrides(
    open ? partner.id : undefined
  );

  const setOverride = useSetMemberOverride();
  const removeOverride = useRemoveMemberOverride();

  const getOverrideForUser = (userId: string) => {
    return overrides?.find(o => o.user_id === userId);
  };

  const getEffectivePermission = (userId: string, key: PermissionKey): boolean => {
    const override = getOverrideForUser(userId);
    if (override && override[key] !== null) {
      return override[key] as boolean;
    }
    return partner[key];
  };

  const hasOverride = (userId: string, key: PermissionKey): boolean => {
    const override = getOverrideForUser(userId);
    return override?.[key] !== null && override?.[key] !== undefined;
  };

  const handleTogglePermission = async (userId: string, key: PermissionKey) => {
    const currentValue = getEffectivePermission(userId, key);
    await setOverride.mutateAsync({
      series_partner_id: partner.id,
      user_id: userId,
      overrides: { [key]: !currentValue },
    });
  };

  const handleResetMember = async (userId: string) => {
    await removeOverride.mutateAsync({
      seriesPartnerId: partner.id,
      userId,
    });
  };

  const isLoading = membersLoading || overridesLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Member Permissions</DialogTitle>
          <DialogDescription>
            Override permissions for individual team members of{' '}
            <strong>{partner.partner_organization?.organization_name}</strong>.
            Switches in grey inherit from the organization&apos;s settings.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] space-y-4 overflow-y-auto py-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4 rounded-lg border p-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : teamMembers?.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No team members found for this organization.
            </p>
          ) : (
            teamMembers?.map((member) => {
              const memberHasOverrides = overrides?.some(o => o.user_id === member.user_id);
              return (
                <div key={member.user_id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <OptimizedAvatar
                        src={member.avatar_url || undefined}
                        name={member.display_name || member.name || 'Member'}
                        className="h-8 w-8"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">
                            {member.display_name || member.name || member.email || 'Unknown'}
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            {member.role}
                          </Badge>
                          {memberHasOverrides && (
                            <Badge variant="default" className="bg-blue-500 text-xs">
                              Overridden
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    {memberHasOverrides && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResetMember(member.user_id)}
                        disabled={removeOverride.isPending}
                        title="Reset to inherited permissions"
                      >
                        <RotateCcw className="mr-1 h-3 w-3" />
                        Reset
                      </Button>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {PERMISSION_LABELS.map(({ key, label, icon: Icon }) => {
                      const effective = getEffectivePermission(member.user_id, key);
                      const isOverridden = hasOverride(member.user_id, key);
                      return (
                        <div key={key} className="flex flex-col items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleTogglePermission(member.user_id, key)}
                            disabled={setOverride.isPending}
                            className={`flex h-8 w-8 items-center justify-center rounded-md border transition-colors ${
                              effective
                                ? isOverridden
                                  ? 'border-blue-500 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                  : 'border-green-500 bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                                : isOverridden
                                  ? 'border-red-300 bg-red-50 text-red-400 dark:bg-red-950 dark:text-red-400'
                                  : 'border-muted bg-muted/50 text-muted-foreground'
                            }`}
                            title={`${label}: ${effective ? 'Allowed' : 'Denied'}${isOverridden ? ' (overridden)' : ' (inherited)'}`}
                          >
                            <Icon className="h-4 w-4" />
                          </button>
                          <span className="text-center text-[10px] leading-tight text-muted-foreground">
                            {label.split(' ')[0]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
