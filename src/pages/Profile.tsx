
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ContactSettings } from '@/components/ContactSettings';
import { VouchSystem } from '@/components/VouchSystem';
import { ProfileCalendarView } from '@/components/ProfileCalendarView';
import { ContactRequests } from '@/components/ContactRequests';
import { ImageCrop } from '@/components/ImageCrop';
import { ProfileHeader } from '@/components/ProfileHeader';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';
import { useProfileData } from '@/hooks/useProfileData';

const Profile = () => {
  const { user, profile, signOut, updateProfile, hasRole } = useAuth();
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
    
    console.log('Profile: Initial URL tab param:', tabParam, 'Available tabs:', availableTabs);
    
    // Set initial tab if it's valid, otherwise use 'profile'
    if (availableTabs.includes(tabParam)) {
      console.log('Profile: Setting initial tab from URL:', tabParam);
      setActiveTab(tabParam);
    } else {
      console.log('Profile: Invalid tab in URL, using default profile tab');
      setActiveTab('profile');
    }
  }, []); // Empty dependency array - only run on mount

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md w-full">
          <h1 className="text-xl sm:text-2xl font-bold mb-4">Please sign in to view your profile</h1>
          <Button className="w-full">Sign In</Button>
        </div>
      </div>
    );
  }

  const handleSaveProfile = () => {
    toast({
      title: "Profile Updated",
      description: "Your profile has been successfully updated.",
    });
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
    console.log('Profile: Tab change requested:', newTab, 'Available tabs:', availableTabs);
    
    // Validate the tab is available for current view
    if (availableTabs.includes(newTab)) {
      console.log('Profile: Updating tab to:', newTab);
      setActiveTab(newTab);
      
      // Update URL without triggering useEffect
      const newUrl = new URL(window.location.href);
      if (newTab === 'profile') {
        newUrl.searchParams.delete('tab');
      } else {
        newUrl.searchParams.set('tab', newTab);
      }
      window.history.replaceState({}, '', newUrl.toString());
      console.log('Profile: URL updated for tab:', newTab);
    } else {
      console.log('Profile: Invalid tab requested:', newTab, 'Available:', availableTabs);
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
    <div className="min-h-screen bg-background">
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
