
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
import { useLocation } from 'react-router-dom';
import { useProfileData } from '@/hooks/useProfileData';
import { cn } from '@/lib/utils';

const Profile = () => {
  const { user, profile, signOut, updateProfile, hasRole } = useAuth();
  const { theme } = useTheme();
  const { toast } = useToast();
  const location = useLocation();
  
  // Get tab from URL parameter or default to 'profile'
  const urlParams = new URLSearchParams(location.search);
  const initialTab = urlParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);
  
  const [showImageCrop, setShowImageCrop] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');

  // Check if user is industry user (comedian/promoter/admin)
  const isIndustryUser = hasRole('comedian') || hasRole('promoter') || hasRole('admin');
  
  // For now, set isMemberView to false since we're removing the member view concept
  const isMemberView = false;

  // Get profile data using custom hook
  const { userInterests, mockTickets } = useProfileData(user?.id, isMemberView);

  // Tab configuration based on view mode
  const memberTabs = ['profile', 'tickets', 'notifications', 'book-comedian', 'settings'];
  const industryTabs = ['profile', 'calendar', isIndustryUser ? 'invoices' : 'tickets', 'vouches', 'settings'];
  const availableTabs = isMemberView ? memberTabs : industryTabs;

  // Only sync from URL on component mount, not on every URL change
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get('tab') || 'profile';
    
    
    // Set initial tab if it's valid, otherwise use 'profile'
    if (availableTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    } else {
      setActiveTab('profile');
    }
  }, []); // Empty dependency array - only run on mount

  const getBackgroundStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900';
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
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        phone: formData.phone || null,
        bio: formData.bio || null,
        location: formData.location || null,
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

  const handleLogout = () => {
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out.",
    });
    signOut();
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

  const handleCroppedImage = (croppedImage: string) => {
    updateProfile({ avatar_url: croppedImage });
    toast({
      title: "Profile Picture Updated",
      description: "Your profile picture has been successfully updated.",
    });
  };

  // Handle tab changes with validation and URL update
  const handleTabChange = (newTab: string) => {
    
    // Validate the tab is available for current view
    if (availableTabs.includes(newTab)) {
      setActiveTab(newTab);
      
      // Update URL without triggering useEffect
      const newUrl = new URL(window.location.href);
      if (newTab === 'profile') {
        newUrl.searchParams.delete('tab');
      } else {
        newUrl.searchParams.set('tab', newTab);
      }
      window.history.replaceState({}, '', newUrl.toString());
    } else {
    }
  };

  // Create a user object that matches the expected interface for ProfileHeader and ProfileTabs
  const userForComponents = {
    id: user.id,
    email: user.email || '',
    name: profile?.name || '',
    avatar: profile?.avatar_url || '',
    role: hasRole('admin') ? 'admin' : hasRole('promoter') ? 'promoter' : 'comedian',
    isVerified: profile?.is_verified || false
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
          isMemberView={isMemberView}
          isIndustryUser={isIndustryUser}
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
