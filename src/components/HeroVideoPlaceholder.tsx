import React from 'react';
import { Play, Mic, Star, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeroVideoPlaceholderProps {
  className?: string;
}

const HeroVideoPlaceholder: React.FC<HeroVideoPlaceholderProps> = ({ className }) => {
  return (
    <div className={cn(
      'relative w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-red-900 overflow-hidden',
      className
    )}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 animate-pulse">
          <Mic className="w-16 h-16 text-yellow-400" />
        </div>
        <div className="absolute top-1/2 right-1/3 animate-pulse delay-1000">
          <Star className="w-12 h-12 text-yellow-400" />
        </div>
        <div className="absolute bottom-1/3 left-1/2 animate-pulse delay-2000">
          <Users className="w-14 h-14 text-yellow-400" />
        </div>
      </div>
      
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="grid grid-cols-12 grid-rows-8 h-full w-full">
          {Array.from({ length: 96 }).map((_, i) => (
            <div key={i} className="border border-white/20"></div>
          ))}
        </div>
      </div>
      
      {/* Central Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="mb-6">
            <div className="w-24 h-24 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-red-500/30">
              <Mic className="w-12 h-12 text-red-400 animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Stand Up Sydney</h3>
            <p className="text-gray-300 max-w-md mx-auto mb-4">
              Sydney's Premier Comedy Platform
            </p>
            <p className="text-sm text-gray-400 bg-black/30 px-4 py-2 rounded-full inline-block">
              Video content coming soon
            </p>
          </div>
          
          <div className="text-sm text-gray-400 mt-8">
            🎭 Connecting Comedians & Venues
          </div>
        </div>
      </div>
      
      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
    </div>
  );
};

export default HeroVideoPlaceholder;