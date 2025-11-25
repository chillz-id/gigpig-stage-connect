import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { FilestashEmbed } from '@/components/filestash/FilestashEmbed';

/**
 * MediaLibrary Page
 *
 * Now embeds Filestash (Supabase Storage backed) for file management.
 */
const MediaLibrary = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const getBackgroundStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900';
    }
    return 'bg-gradient-to-br from-gray-800 via-gray-900 to-red-900';
  };

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/auth', { state: { from: location.pathname } });
    }
  }, [user, navigate, location.pathname]);

  if (!user) {
    return null; // Show nothing while redirecting
  }

  return (
    <div className={cn('min-h-screen', getBackgroundStyles())}>
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Media Library</h1>
          <p className="text-gray-300">
            Upload, organize, and manage your media content
          </p>
        </div>

        <div className="bg-background rounded-lg p-4 shadow-sm">
          <FilestashEmbed />
        </div>
      </div>
    </div>
  );
};

export default MediaLibrary;
