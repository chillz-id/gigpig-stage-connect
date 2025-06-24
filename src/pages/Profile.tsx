
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ContactSettings } from '@/components/ContactSettings';
import { VouchSystem } from '@/components/VouchSystem';
import { ProfileCalendarView } from '@/components/ProfileCalendarView';
import { ContactRequests } from '@/components/ContactRequests';
import SubscriptionManager from '@/components/SubscriptionManager';
import { ImageCrop } from '@/components/ImageCrop';
import { User, MapPin, Calendar, Mail, Phone, Shield, Settings, Award, Users, MessageSquare, Trophy, LogOut, Camera, Youtube, CreditCard } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';

const Profile = () => {
  const { user, logout, updateUser } = useUser();
  const { toast } = useToast();
  const location = useLocation();
  
  // Get tab from URL parameter or default to 'profile'
  const urlParams = new URLSearchParams(location.search);
  const initialTab = urlParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);
  
  const [showImageCrop, setShowImageCrop] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');

  // Mock invoices data
  const mockInvoices = [
    {
      id: '1',
      number: 'INV-00001',
      clientName: 'Comedy Club Downtown',
      amount: 500,
      status: 'paid',
      dueDate: '2024-01-15',
      createdDate: '2024-01-01'
    },
    {
      id: '2',
      number: 'INV-00002',
      clientName: 'Laugh Factory',
      amount: 750,
      status: 'pending',
      dueDate: '2024-02-15',
      createdDate: '2024-02-01'
    },
    {
      id: '3',
      number: 'INV-00003',
      clientName: 'Open Mic Night Venue',
      amount: 200,
      status: 'overdue',
      dueDate: '2024-01-30',
      createdDate: '2024-01-15'
    }
  ];

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [location]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view your profile</h1>
          <Button>Sign In</Button>
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
    logout();
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
    updateUser({ avatar: croppedImage });
    toast({
      title: "Profile Picture Updated",
      description: "Your profile picture has been successfully updated.",
    });
  };

  const getMembershipBadgeColor = (membership: string) => {
    switch (membership) {
      case 'premium':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'pro':
        return 'bg-gradient-to-r from-blue-500 to-purple-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'overdue': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="professional-card mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="relative">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="text-2xl">{user.name[0]}</AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0">
                  <label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors shadow-lg">
                      <Camera className="w-4 h-4 text-primary-foreground" />
                    </div>
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{user.name}</h1>
                  {user.isVerified && <Shield className="w-6 h-6 text-blue-500" />}
                  <Badge className={getMembershipBadgeColor(user.membership)}>
                    {user.membership.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-4">{user.bio}</p>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{user.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Member since {user.joinDate}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Trophy className="w-4 h-4 text-yellow-400 fill-current" />
                    <span>{user.stats.showsPerformed} shows performed</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message
                </Button>
                <Button variant="outline" size="sm">
                  <Award className="w-4 h-4 mr-2" />
                  Vouch
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="vouches">Vouches</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="professional-card">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your public profile information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" defaultValue={user.name} />
                  </div>
                  <div>
                    <Label htmlFor="stage-name">Stage Name</Label>
                    <Input id="stage-name" placeholder="Your stage name" />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" defaultValue={user.bio} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" defaultValue={user.location} />
                  </div>
                  <div>
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Input id="experience" type="number" placeholder="5" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="specialties">Comedy Specialties</Label>
                  <Input id="specialties" placeholder="Observational, Dark Comedy, Storytelling..." />
                </div>

                <div>
                  <Label>Social Media Links</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <Input placeholder="Instagram @username" />
                    <Input placeholder="TikTok @username" />
                    <Input placeholder="YouTube channel" />
                    <Input placeholder="Twitter @username" />
                  </div>
                </div>

                <Button onClick={handleSaveProfile} className="professional-button">
                  Save Profile
                </Button>
              </CardContent>
            </Card>

            <Card className="professional-card">
              <CardHeader>
                <CardTitle>Media & Portfolio</CardTitle>
                <CardDescription>
                  Showcase your best work to potential promoters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <Label>Show Reel</Label>
                    <div className="mt-2 border-2 border-dashed border-border rounded-lg p-8 text-center">
                      <div className="text-muted-foreground">
                        <Youtube className="w-8 h-8 mx-auto mb-2" />
                        <p>Upload your show reel video or add YouTube link</p>
                        <Button variant="outline" className="mt-2">Add Video</Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Photo Gallery</Label>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Array.from({ length: 4 }, (_, i) => (
                        <div key={i} className="aspect-square border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                          <Button variant="ghost" size="sm">Add Photo</Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button className="professional-button">Update Media</Button>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information - Now at bottom of Profile tab */}
            <Card className="professional-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Contact Information
                </CardTitle>
                <CardDescription>
                  Your contact details for booking and collaboration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="contact-email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </Label>
                    <Input id="contact-email" defaultValue="alex@example.com" className="mt-2" />
                  </div>
                  <div>
                    <Label htmlFor="contact-phone" className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Mobile Number
                    </Label>
                    <Input id="contact-phone" defaultValue="+1 (555) 123-4567" className="mt-2" />
                  </div>
                </div>
                <Button className="professional-button mt-4">
                  Update Contact Info
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar">
            <ProfileCalendarView />
          </TabsContent>

          <TabsContent value="invoices">
            <Card className="professional-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Invoice Management
                </CardTitle>
                <CardDescription>
                  View and manage your invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockInvoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold">{invoice.number}</span>
                          <Badge className={getStatusColor(invoice.status)}>
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{invoice.clientName}</p>
                        <p className="text-xs text-muted-foreground">Due: {invoice.dueDate}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">${invoice.amount}</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vouches">
            <VouchSystem />
          </TabsContent>

          <TabsContent value="requests">
            <ContactRequests />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            {/* Subscription Manager */}
            <SubscriptionManager />

            <Card className="professional-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Account Settings
                </CardTitle>
                <CardDescription>
                  Manage your account preferences and privacy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications about new opportunities</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">Get text alerts for urgent updates</p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Profile Visibility</Label>
                      <p className="text-sm text-muted-foreground">Make your profile discoverable to promoters</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-Apply to Suitable Shows</Label>
                      <p className="text-sm text-muted-foreground">Automatically apply to shows matching your criteria</p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <Button className="professional-button">Save Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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
