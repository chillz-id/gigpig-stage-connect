import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { MediaLibraryShell } from '@/components/media-library';

/**
 * MediaLibrary Page
 *
 * Now embeds Filestash (Supabase Storage backed) for file management.
 * Uses MediaLibraryShell for themed UI with scope selector and sidebar.
 */
const MediaLibrary = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/auth', { state: { from: location.pathname } });
    }
  }, [user, navigate, location.pathname]);

  if (!user) {
    return null; // Show nothing while redirecting
  }

  return <MediaLibraryShell />;
};

export default MediaLibrary;
