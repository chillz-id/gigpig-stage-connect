import React from 'react';
import { Upload } from 'lucide-react';

interface BannerImageProps {
  banner_url: string | null;
  banner_position?: { x: number; y: number; scale: number } | null; // Kept for backwards compat, ignored
  isOwnProfile: boolean;
  onEditClick: () => void;
  onRepositionSave?: (position: { x: number; y: number; scale: number }) => void; // Deprecated, kept for compat
}

export const BannerImage: React.FC<BannerImageProps> = ({
  banner_url,
  isOwnProfile,
  onEditClick,
}) => {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {banner_url ? (
        // Display the cropped banner image - it's already at the correct aspect ratio
        <img
          src={banner_url}
          alt="Profile banner"
          className="w-full h-full object-cover"
        />
      ) : (
        // Fallback gradient if no banner image
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='60' cy='60' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>
      )}

      {/* Upload button - only visible for own profile */}
      {isOwnProfile && (
        <div className="absolute bottom-4 right-4 z-10">
          <button
            onClick={onEditClick}
            className="bg-white/90 hover:bg-white text-gray-900 rounded-full p-3 shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-110"
            aria-label="Upload banner"
          >
            <Upload className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
