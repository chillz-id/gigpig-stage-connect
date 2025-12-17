
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { MapPin, Shield } from 'lucide-react';

interface ComedianBasicInfoProps {
  name: string | null;
  location: string | null;
  tagline?: string | null;
  is_verified: boolean;
}

const ComedianBasicInfo: React.FC<ComedianBasicInfoProps> = ({
  name,
  location,
  tagline,
  is_verified
}) => {
  return (
    <div className="flex-1 min-w-0 text-center">
      {/* Name - centered, scales to fit */}
      <div className="flex flex-col items-center gap-1 mb-2">
        <h1
          className="font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent w-full px-2"
          style={{
            fontSize: 'clamp(1.25rem, 6vw, 2.5rem)',
            lineHeight: 1.2,
            wordBreak: 'break-word'
          }}
        >
          {name || 'Unknown Comedian'}
        </h1>
        {is_verified && (
          <div className="flex items-center gap-1">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-200 border-blue-400/30 text-xs">
              Verified
            </Badge>
          </div>
        )}
      </div>

      {/* Location - centered */}
      {location && (
        <div className="flex items-center justify-center gap-2 mb-2 text-gray-300">
          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
          <span className="text-sm sm:text-base">{location}</span>
        </div>
      )}

      {/* Profile tagline - centered */}
      {tagline && (
        <p className="text-sm sm:text-base md:text-lg text-gray-200 max-w-2xl mx-auto font-light leading-relaxed line-clamp-2 sm:line-clamp-none">
          {tagline}
        </p>
      )}
    </div>
  );
};

export default ComedianBasicInfo;
