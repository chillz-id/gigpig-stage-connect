
import React from 'react';
import { CardContent } from '@/components/ui/card';
import ComedianAvatar from './ComedianAvatar';
import ComedianBasicInfo from './ComedianBasicInfo';
import ComedianActions from './ComedianActions';
import ComedianSocialLinks from './ComedianSocialLinks';

interface ComedianHeaderProps {
  comedian: {
    id: string;
    name: string | null;
    bio: string | null;
    location: string | null;
    avatar_url: string | null;
    is_verified: boolean;
    email: string | null;
  };
  onShare: () => void;
}

const ComedianHeader: React.FC<ComedianHeaderProps> = ({ comedian, onShare }) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 rounded-2xl">
      {/* Background pattern */}
      <div 
        className="absolute inset-0 opacity-40" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='60' cy='60' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />
      
      <CardContent className="relative p-12">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Large, prominent avatar */}
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="w-48 h-48 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-1">
                <ComedianAvatar 
                  name={comedian.name} 
                  avatar_url={comedian.avatar_url}
                />
              </div>
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-xl -z-10" />
            </div>
          </div>
          
          <div className="flex-1 text-center lg:text-left text-white">
            <ComedianBasicInfo 
              name={comedian.name}
              location={comedian.location}
              bio={comedian.bio}
              is_verified={comedian.is_verified}
            />
            
            <div className="mt-8">
              <ComedianActions 
                email={comedian.email}
                name={comedian.name}
                onShare={onShare}
              />
            </div>
          </div>
        </div>
        
        {/* Social Links positioned at bottom right */}
        <ComedianSocialLinks />
      </CardContent>
    </div>
  );
};

export default ComedianHeader;
