
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ContactSettings } from '@/components/ContactSettings';
import { VouchSystemEnhanced } from '@/components/VouchSystemEnhanced';
import { ProfileCalendarView } from '@/components/ProfileCalendarView';
import { ContactRequests } from '@/components/ContactRequests';
import { ImageCrop } from '@/components/ImageCrop';
import { ProfileHeader } from '@/components/ProfileHeader';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProfileData } from '@/hooks/useProfileData';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { cleanupOldProfileImages } from '@/utils/profileImageCleanup';

const Profile = () => {
  const { user, profile, signOut, updateProfile, hasRole } = useAuth();
  const { theme } = useTheme();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get tab from URL parameter or default to 'profile'
  const urlParams = new URLSearchParams(location.search);
  const initialTab = urlParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);
  
  const [showImageCrop, setShowImageCrop] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [avatarKey, setAvatarKey] = useState(Date.now()); // Force avatar refresh

  // Update avatarKey whenever profile.avatar_url changes to bust cache
  useEffect(() => {
    if (profile?.avatar_url) {
      setAvatarKey(Date.now());
    }
  }, [profile?.avatar_url]);

  // Check if user is industry user (comedian/promoter/admin)
  const isIndustryUser = hasRole('comedian') || hasRole('comedian_lite') || hasRole('admin');

  // Get profile data using custom hook
  const { userInterests, mockTickets } = useProfileData(user?.id);

  // Tab configuration for industry users (comedians, promoters, etc.)
  const availableTabs = ['profile', 'calendar', isIndustryUser ? 'invoices' : 'tickets', 'vouches', 'settings'];

  // Sync tab state from URL when location.search changes
  // This handles both initial mount and external navigation (e.g., sidebar clicks)
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get('tab') || 'profile';

    // Set tab if it's valid, otherwise use 'profile'
    if (availableTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    } else {
      setActiveTab('profile');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]); // Re-run when URL search params change

  const getBackgroundStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-gradient-to-br from-gray-800 via-gray-900 to-red-900';
    }
    return 'bg-gradient-to-br from-gray-800 via-gray-900 to-red-900';
  };

  if (!user) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center p-4", getBackgroundStyles())}>
        <div className="text-center max-w-md w-full">
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-4">Please sign in to view your profile</h1>
          <Button className="w-full">Sign In</Button>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async (formData: any) => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Map form data to profile update format
      const profileUpdate = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        stage_name: formData.stageName || null,
        name_display_preference: formData.nameDisplayPreference || 'real',
        email: formData.email,
        phone: formData.phone || null,
        bio: formData.bio || null,
        location: formData.location || null,
        country: formData.country || 'Australia',
        years_experience: formData.yearsExperience ? parseInt(formData.yearsExperience) : null,
        custom_show_types: formData.customShowTypes || [],
        instagram_url: formData.instagramUrl || null,
        twitter_url: formData.twitterUrl || null,
        website_url: formData.websiteUrl || null,
        youtube_url: formData.youtubeUrl || null,
        facebook_url: formData.facebookUrl || null,
        tiktok_url: formData.tiktokUrl || null,
      };

      await updateProfile(profileUpdate);
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error; // Re-throw so the component can handle the error
    }
  };

  const handleLogout = async () => {
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out.",
    });
    await signOut();
    navigate('/');
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setShowImageCrop(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCroppedImage = async (croppedImage: string) => {
    try {
      // Convert base64 to blob
      const base64Response = await fetch(croppedImage);
      const blob = await base64Response.blob();
      
      // Create a unique filename
      const fileExt = 'png';
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;
      
      console.log('Uploading profile image:', { filePath, blobSize: blob.size });
      
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(filePath, blob, {
          contentType: 'image/png',
          upsert: true
        });
      
      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);
      
      console.log('Public URL:', publicUrl);
      
      // Update profile with the public URL
      console.log('Updating profile with new avatar URL:', publicUrl);
      const updateResult = await updateProfile({ avatar_url: publicUrl });
      
      if (updateResult.error) {
        console.error('Profile update error:', updateResult.error);
        throw updateResult.error;
      }
      
      console.log('Profile update successful');

      // Close the modal after successful update
      setShowImageCrop(false);

      // Note: Avatar will automatically update via the useEffect watching profile.avatar_url
      
      // Clean up old profile images in the background
      // We keep 2 images: the new one and the most recent previous one
      // This helps with caching issues - users will still see their previous pic if needed
      cleanupOldProfileImages(user.id, filePath).then(deletedCount => {
        if (deletedCount > 0) {
          console.log(`Cleaned up ${deletedCount} old profile images`);
        }
      }).catch(error => {
        console.error('Failed to cleanup old images:', error);
      });
      
      // Show success message
      toast({
        title: "Profile Picture Updated",
        description: "Your profile picture has been successfully updated.",
      });
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle tab changes with validation and URL update
  const handleTabChange = (newTab: string) => {

    // Validate the tab is available for current view
    if (availableTabs.includes(newTab)) {
      setActiveTab(newTab);

      // Update URL using React Router's navigate
      const searchParams = new URLSearchParams(location.search);
      if (newTab === 'profile') {
        searchParams.delete('tab');
      } else {
        searchParams.set('tab', newTab);
      }

      // Use navigate with replace to update URL without adding to history
      const newSearch = searchParams.toString();
      navigate({
        pathname: location.pathname,
        search: newSearch ? `?${newSearch}` : ''
      }, { replace: true });
    }
  };

  // Create a user object that matches the expected interface for ProfileHeader and ProfileTabs
  const userForComponents = {
    id: user.id,
    email: user.email || '',
    name: profile?.name || '',
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    stage_name: profile?.stage_name || '',
    name_display_preference: profile?.name_display_preference || 'real',
    bio: profile?.bio || '',
    location: profile?.location || '',
    country: profile?.country || 'Australia',
    phone: profile?.phone || '',
    instagram_url: profile?.instagram_url || '',
    twitter_url: profile?.twitter_url || '',
    website_url: profile?.website_url || '',
    youtube_url: profile?.youtube_url || '',
    facebook_url: profile?.facebook_url || '',
    tiktok_url: profile?.tiktok_url || '',
    custom_show_types: profile?.custom_show_types || [],
    avatar: profile?.avatar_url ? `${profile.avatar_url}?t=${avatarKey}` : '',
    role: hasRole('admin') ? 'admin' : 'comedian',
    isVerified: profile?.is_verified || false,
    joinDate: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' }) : 'Recently',
    membership: profile?.membership_tier || 'basic',
    stats: {
      showsPerformed: profile?.shows_performed || 0
    }
  };

  return (
    <div className={cn("min-h-screen", getBackgroundStyles())}>
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Profile Header */}
        <ProfileHeader 
          user={userForComponents}
          onImageSelect={handleImageSelect}
          onLogout={handleLogout}
        />

        {/* Profile Tabs */}
        <ProfileTabs
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          isIndustryUser={isIndustryUser}
          isComedianLite={hasRole('comedian_lite')}
          user={userForComponents}
          userInterests={userInterests}
          mockTickets={mockTickets}
          onSave={handleSaveProfile}
        />

        {/* Image Crop Modal */}
        <ImageCrop
          isOpen={showImageCrop}
          onClose={() => setShowImageCrop(false)}
          onCrop={handleCroppedImage}
          imageUrl={selectedImage}
        />
      </div>
    </div>
  );
};

export default Profile;
