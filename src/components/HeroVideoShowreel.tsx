import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import HeroVideoPlaceholder from './HeroVideoPlaceholder';

interface HeroVideoShowreelProps {
  videoSrc?: string;
  fallbackImage?: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  overlay?: boolean;
  onVideoLoad?: () => void;
  onVideoError?: () => void;
}

const HeroVideoShowreel: React.FC<HeroVideoShowreelProps> = ({
  videoSrc = '/videos/standup-showreel.mp4',
  fallbackImage = '/images/comedy-fallback.jpg',
  className = '',
  autoPlay = true,
  muted = true,
  loop = true,
  controls = false,
  overlay = true,
  onVideoLoad,
  onVideoError,
}) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      setIsLoading(false);
      onVideoLoad?.();
    };

    const handleError = () => {
      setHasError(true);
      setIsLoading(false);
      onVideoError?.();
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      if (autoPlay) {
        video.play().catch(() => {
          // Autoplay failed, which is expected on some browsers
          setIsPlaying(false);
        });
      }
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);
    video.addEventListener('canplay', handleCanPlay);

    // Check if video source exists, if not show placeholder
    const img = new Image();
    img.onerror = () => {
      setHasError(true);
      setIsLoading(false);
      onVideoError?.();
    };
    
    // Check if the video file exists
    fetch(videoSrc, { method: 'HEAD' })
      .then(response => {
        if (!response.ok) {
          setHasError(true);
          setIsLoading(false);
        }
      })
      .catch(() => {
        setHasError(true);
        setIsLoading(false);
      });

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [autoPlay, onVideoLoad, onVideoError, videoSrc]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleMouseEnter = () => {
    if (controls) {
      setShowControls(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  };

  const handleMouseLeave = () => {
    if (controls) {
      timeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2000);
    }
  };

  const handleMouseMove = () => {
    if (controls) {
      setShowControls(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2000);
    }
  };

  if (hasError) {
    return <HeroVideoPlaceholder className={className} />;
  }

  return (
    <div
      className={cn(
        'relative w-full h-full overflow-hidden bg-black',
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center z-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
        </div>
      )}
      
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay={autoPlay}
        muted={isMuted}
        loop={loop}
        playsInline
        poster={fallbackImage}
        preload="metadata"
      >
        <source src={videoSrc} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      )}

      {controls && (
        <div className={cn(
          'absolute bottom-4 left-4 right-4 flex items-center justify-between transition-opacity duration-300',
          showControls ? 'opacity-100' : 'opacity-0'
        )}>
          <div className="flex items-center space-x-2">
            <button
              onClick={togglePlayPause}
              className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </button>
            
            <button
              onClick={toggleMute}
              className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
              aria-label={isMuted ? 'Unmute video' : 'Mute video'}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
          </div>
          
          <div className="text-white text-sm bg-black/50 px-2 py-1 rounded">
            Live from Sydney's Comedy Scene
          </div>
        </div>
      )}
    </div>
  );
};

export default HeroVideoShowreel;
