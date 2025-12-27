/**
 * AssignExtraDialog Component
 *
 * Dialog for assigning production staff or visual artists to an extra spot.
 * - Photographers/Videographers: searches visual_artist_profiles
 * - Door Staff/Audio Tech/Lighting Tech: searches production_staff_profiles
 * - Shows saved hourly/flat rates from profile (displayed but not editable here)
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OptimizedAvatar } from '@/components/ui/OptimizedAvatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, UserPlus, X, DollarSign, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAssignExtraToSpot, useUnassignExtraFromSpot } from '@/hooks/useEventSpots';
import type { ExtraType } from '@/types/spot';
import { EXTRA_TYPE_LABELS } from '@/types/spot';

interface AssignExtraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  spotId: string;
  extraType: ExtraType;
  currentStaffId?: string;
}

interface StaffOption {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  hourlyRate?: number;
  flatRate?: number;
  source: 'visual_artist' | 'production_staff';
  specialty?: string;
}

export function AssignExtraDialog({
  open,
  onOpenChange,
  eventId,
  spotId,
  extraType,
  currentStaffId,
}: AssignExtraDialogProps) {
  const [search, setSearch] = useState('');
  const assignToSpot = useAssignExtraToSpot();
  const unassignFromSpot = useUnassignExtraFromSpot();

  // Determine which table to search based on extra type
  const isVisualArtist = extraType === 'photographer' || extraType === 'videographer';

  // Fetch visual artists for photographers/videographers
  const { data: visualArtists, isLoading: vaLoading } = useQuery({
    queryKey: ['visual-artists-search', search, extraType],
    queryFn: async () => {
      if (!isVisualArtist) return [];

      let query = supabase
        .from('visual_artist_profiles')
        .select(`
          id,
          user_id,
          specialty,
          hourly_rate,
          event_rate,
          is_available,
          profile:profiles!visual_artist_profiles_user_id_fkey (
            id,
            stage_name,
            avatar_url
          )
        `)
        .eq('is_available', true);

      // Filter by specialty for photographers vs videographers
      if (extraType === 'photographer') {
        query = query.in('specialty', ['photographer', 'both']);
      } else if (extraType === 'videographer') {
        query = query.in('specialty', ['videographer', 'both']);
      }

      // Apply name search if provided
      if (search && search.length >= 2) {
        // We need to filter by profile.stage_name - Supabase doesn't support nested filters well
        // So we fetch all and filter client-side
      }

      const { data, error } = await query.limit(30);

      if (error) throw error;

      let results = (data || [])
        .filter((va: any) => va.profile) // Only include those with valid profiles
        .map((va: any) => ({
          id: va.id,
          userId: va.user_id,
          name: va.profile?.stage_name || 'Unknown',
          avatar: va.profile?.avatar_url,
          hourlyRate: va.hourly_rate,
          flatRate: va.event_rate,
          source: 'visual_artist' as const,
          specialty: va.specialty,
        })) as StaffOption[];

      // Client-side name filter
      if (search && search.length >= 2) {
        results = results.filter((r) =>
          r.name.toLowerCase().includes(search.toLowerCase())
        );
      }

      return results;
    },
    enabled: open && isVisualArtist,
  });

  // Fetch production staff for door/audio/lighting
  const { data: productionStaff, isLoading: psLoading } = useQuery({
    queryKey: ['production-staff-search', search, extraType],
    queryFn: async () => {
      if (isVisualArtist) return [];

      // Map extra type to production staff specialty
      const specialtyMap: Record<string, string> = {
        door_staff: 'door_staff',
        audio_tech: 'audio_tech',
        lighting_tech: 'lighting_tech',
      };

      const specialty = specialtyMap[extraType];
      if (!specialty) return [];

      const query = supabase
        .from('production_staff_profiles')
        .select(`
          id,
          user_id,
          specialty,
          hourly_rate,
          flat_rate,
          is_available,
          profile:profiles!production_staff_profiles_user_id_fkey (
            id,
            stage_name,
            avatar_url
          )
        `)
        .eq('specialty', specialty)
        .eq('is_available', true);

      const { data, error } = await query.limit(30);

      if (error) {
        // Table might not exist yet - return empty
        console.warn('Production staff query failed:', error.message);
        return [];
      }

      let results = (data || [])
        .filter((ps: any) => ps.profile)
        .map((ps: any) => ({
          id: ps.id,
          userId: ps.user_id,
          name: ps.profile?.stage_name || 'Unknown',
          avatar: ps.profile?.avatar_url,
          hourlyRate: ps.hourly_rate,
          flatRate: ps.flat_rate,
          source: 'production_staff' as const,
          specialty: ps.specialty,
        })) as StaffOption[];

      // Client-side name filter
      if (search && search.length >= 2) {
        results = results.filter((r) =>
          r.name.toLowerCase().includes(search.toLowerCase())
        );
      }

      return results;
    },
    enabled: open && !isVisualArtist,
  });

  // Combine and filter results
  const staffOptions = useMemo(() => {
    if (isVisualArtist) {
      return visualArtists || [];
    }
    return productionStaff || [];
  }, [isVisualArtist, visualArtists, productionStaff]);

  const isLoading = vaLoading || psLoading;
  const isPending = assignToSpot.isPending || unassignFromSpot.isPending;

  const handleAssign = (staff: StaffOption) => {
    assignToSpot.mutate(
      {
        spotId,
        staffId: staff.id,
        staffName: staff.name,
        staffAvatar: staff.avatar,
        eventId,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  const handleUnassign = () => {
    unassignFromSpot.mutate(
      { spotId, eventId },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  const formatRate = (staff: StaffOption) => {
    if (staff.hourlyRate && staff.flatRate) {
      return `$${staff.hourlyRate}/hr or $${staff.flatRate} flat`;
    }
    if (staff.hourlyRate) {
      return `$${staff.hourlyRate}/hr`;
    }
    if (staff.flatRate) {
      return `$${staff.flatRate} flat`;
    }
    return 'Rate not set';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign {EXTRA_TYPE_LABELS[extraType]}</DialogTitle>
          <DialogDescription>
            Search for available {EXTRA_TYPE_LABELS[extraType].toLowerCase()} on the platform.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={`Search ${EXTRA_TYPE_LABELS[extraType].toLowerCase()}s...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Staff List */}
        <div className="max-h-[350px] overflow-y-auto space-y-2">
          {isLoading ? (
            <>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </>
          ) : staffOptions.length > 0 ? (
            staffOptions.map((staff) => (
              <button
                key={staff.id}
                onClick={() => handleAssign(staff)}
                disabled={isPending}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg border transition-colors",
                  staff.id === currentStaffId
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                <OptimizedAvatar
                  src={staff.avatar}
                  name={staff.name}
                  className="h-10 w-10"
                />
                <div className="flex-1 text-left">
                  <p className="font-medium">{staff.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <DollarSign className="h-3 w-3" />
                    <span>{formatRate(staff)}</span>
                  </div>
                </div>
                {staff.id === currentStaffId ? (
                  <Badge className="gap-1">Current</Badge>
                ) : (
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <UserPlus className="h-10 w-10 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">
                {search.length >= 2
                  ? `No ${EXTRA_TYPE_LABELS[extraType].toLowerCase()}s found matching "${search}"`
                  : `No available ${EXTRA_TYPE_LABELS[extraType].toLowerCase()}s found`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Staff members need to create a profile to appear here
              </p>
            </div>
          )}
        </div>

        {/* Unassign Option */}
        {currentStaffId && (
          <Button
            variant="secondary"
            onClick={handleUnassign}
            disabled={isPending}
            className="w-full gap-2 text-destructive hover:text-destructive"
          >
            <X className="h-4 w-4" />
            Remove Assignment
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default AssignExtraDialog;
