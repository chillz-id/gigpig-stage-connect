import React from 'react';
import { Marquee } from '@/components/ui/marquee';
import VouchCard from './VouchCard';
import { VouchWithProfiles } from '@/types/vouch';

interface ComedianVouchesProps {
  vouches: VouchWithProfiles[];
}

/**
 * Get the display name for a voucher
 * Uses stage_name if available, otherwise falls back to name
 */
const getDisplayName = (profile?: { name?: string; stage_name?: string | null }): string => {
  if (!profile) return 'Anonymous';
  // Prefer stage_name for comedians, fall back to real name
  return profile.stage_name || profile.name || 'Anonymous';
};

const ComedianVouches: React.FC<ComedianVouchesProps> = ({ vouches }) => {
  // Map VouchWithProfiles to VouchCard props format
  const mappedVouches = vouches.map(vouch => ({
    id: vouch.id,
    userImg: vouch.voucher_profile?.avatar_url || `https://avatar.vercel.sh/${vouch.voucher_id}`,
    userName: getDisplayName(vouch.voucher_profile),
    body: vouch.message,
    // Include organization if this was an org vouch
    organization: vouch.organization_profile ? {
      id: vouch.organization_profile.id,
      display_name: vouch.organization_profile.display_name,
      logo_url: vouch.organization_profile.logo_url,
    } : null,
  }));

  const firstRow = mappedVouches.slice(0, Math.ceil(mappedVouches.length / 2));
  const secondRow = mappedVouches.slice(Math.ceil(mappedVouches.length / 2));

  if (vouches.length === 0) {
    return null; // Don't show section if no vouches
  }

  return (
    <div>
      <h3 className="text-xl font-semibold text-white mb-4">Vouches</h3>
      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
        <Marquee pauseOnHover className="[--duration:20s]">
          {firstRow.map((vouch) => (
            <VouchCard
              key={vouch.id}
              userImg={vouch.userImg}
              userName={vouch.userName}
              body={vouch.body}
              organization={vouch.organization}
            />
          ))}
        </Marquee>
        {secondRow.length > 0 && (
          <Marquee reverse pauseOnHover className="[--duration:20s]">
            {secondRow.map((vouch) => (
              <VouchCard
                key={vouch.id}
                userImg={vouch.userImg}
                userName={vouch.userName}
                body={vouch.body}
                organization={vouch.organization}
              />
            ))}
          </Marquee>
        )}
      </div>
    </div>
  );
};

export default ComedianVouches;
