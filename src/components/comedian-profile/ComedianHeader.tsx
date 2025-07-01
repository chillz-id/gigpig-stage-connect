
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
    <Card>
      <CardContent className="p-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <ComedianAvatar 
            name={comedian.name} 
            avatar_url={comedian.avatar_url} 
          />
          
          <div className="flex-1">
            <ComedianBasicInfo 
              name={comedian.name}
              location={comedian.location}
              bio={comedian.bio}
              is_verified={comedian.is_verified}
            />
            
            <ComedianActions 
              email={comedian.email}
              name={comedian.name}
              onShare={onShare}
            />
            
            <ComedianSocialLinks />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComedianHeader;
