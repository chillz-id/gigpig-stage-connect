
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
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ContactSettings } from '@/components/ContactSettings';
import { VouchSystem } from '@/components/VouchSystem';
import { ProfileCalendarView } from '@/components/ProfileCalendarView';
import { ContactRequests } from '@/components/ContactRequests';
import SubscriptionManager from '@/components/SubscriptionManager';
import { ImageCrop } from '@/components/ImageCrop';
import { ProfileHeader } from '@/components/ProfileHeader';
import { ProfileInformation } from '@/components/ProfileInformation';
import { MediaPortfolio } from '@/components/MediaPortfolio';
import { ContactInformation } from '@/components/ContactInformation';
import { FinancialInformation } from '@/components/FinancialInformation';
import { InvoiceManagement } from '@/components/InvoiceManagement';
import { AccountSettings } from '@/components/AccountSettings';
import { User, MapPin, Calendar, Mail, Phone, Shield, Settings, Award, Users, MessageSquare, Trophy, LogOut, Camera, Youtube, CreditCard, Plus, Eye, Image, Building, X, Ticket } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';

const Profile = () => {
  const { user, logout, updateUser } = useUser();
  const { hasRole } = useAuth();
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

  // Mock tickets data for consumer users
  const mockTickets = [
    {
      id: 1,
      eventTitle: "Comedy Night Downtown",
      venue: "The Laugh Track",
      date: "2024-07-15",
      time: "8:00 PM",
      ticketType: "General Admission",
      quantity: 2,
      totalPrice: 50.00,
      status: "confirmed"
    },
    {
      id: 2,
      eventTitle: "Friday Night Laughs",
      venue: "The Comedy Corner",
      date: "2024-08-02",
      time: "9:00 PM",
      ticketType: "VIP Package",
      quantity: 1,
      totalPrice: 65.00,
      status: "confirmed"
    }
  ];

  const TicketsSection = () => (
    <Card className="bg-card/50 backdrop-blur-sm border-border text-foreground">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="w-5 h-5" />
          My Tickets
        </CardTitle>
        <CardDescription>
          Your purchased event tickets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockTickets.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No tickets purchased yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {mockTickets.map((ticket) => (
              <div key={ticket.id} className="p-4 border rounded-lg bg-background/50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{ticket.eventTitle}</h3>
                    <p className="text-sm text-muted-foreground">{ticket.venue}</p>
                  </div>
                  <Badge variant={ticket.status === 'confirmed' ? 'default' : 'secondary'}>
                    {ticket.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p>{new Date(ticket.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Time</p>
                    <p>{ticket.time}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ticket Type</p>
                    <p>{ticket.ticketType}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Quantity</p>
                    <p>{ticket.quantity}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t">
                  <span className="font-semibold">Total: ${ticket.totalPrice.toFixed(2)}</span>
                  <Button variant="outline" size="sm">
                    View Ticket
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <ProfileHeader 
          user={user}
          onImageSelect={handleImageSelect}
          onLogout={handleLogout}
        />

        {/* Profile Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            {/* Show Invoices for industry users, Tickets for consumer users */}
            <TabsTrigger value={isIndustryUser ? "invoices" : "tickets"}>
              {isIndustryUser ? "Invoices" : "Tickets"}
            </TabsTrigger>
            <TabsTrigger value="vouches">Vouches</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <ProfileInformation user={user} onSave={handleSaveProfile} />
            <MediaPortfolio />
            <ContactInformation />
            <FinancialInformation />
          </TabsContent>

          <TabsContent value="calendar">
            <ProfileCalendarView />
          </TabsContent>

          {/* Conditional tab content based on user type */}
          {isIndustryUser ? (
            <TabsContent value="invoices">
              <InvoiceManagement />
            </TabsContent>
          ) : (
            <TabsContent value="tickets">
              <TicketsSection />
            </TabsContent>
          )}

          <TabsContent value="vouches">
            <VouchSystem />
          </TabsContent>

          <TabsContent value="requests">
            <ContactRequests />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <SubscriptionManager />
            <AccountSettings />
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
