
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
import { MemberAccountSettings } from '@/components/MemberAccountSettings';
import { Ticket, Calendar as CalendarIcon, MapPin, Clock } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { useViewMode } from '@/contexts/ViewModeContext';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';

const Profile = () => {
  const { user, logout, updateUser } = useUser();
  const { hasRole } = useAuth();
  const { isMemberView } = useViewMode();
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

  // Mock tickets data for member users with event images
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
      eventImage: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=400&h=200&fit=crop"
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
      eventImage: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=200&fit=crop"
    }
  ];

  // Mock interested events for member calendar
  const mockInterestedEvents = [
    {
      id: 'interested-1',
      title: 'Rooftop Comedy Under Stars',
      venue: 'Sky High Comedy',
      date: '2024-08-10',
      time: '7:00 PM',
      type: 'interested'
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
              <div key={ticket.id} className="border rounded-lg bg-background/50 overflow-hidden">
                <div className="aspect-[2/1] relative">
                  <img 
                    src={ticket.eventImage} 
                    alt={ticket.eventTitle}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{ticket.eventTitle}</h3>
                      <p className="text-sm text-muted-foreground">{ticket.venue}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
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
                  <div className="flex justify-between items-center pt-3 border-t">
                    <span className="font-semibold">Total: ${ticket.totalPrice.toFixed(2)}</span>
                    <Button variant="outline" size="sm">
                      View Ticket
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const MemberCalendarSection = () => (
    <Card className="bg-card/50 backdrop-blur-sm border-border text-foreground">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          My Events
        </CardTitle>
        <CardDescription>
          Events you've purchased tickets for or marked as interested
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <h4 className="font-medium">Purchased Tickets</h4>
          {mockTickets.map((ticket) => (
            <div key={ticket.id} className="p-3 border rounded-lg bg-background/30">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-medium">{ticket.eventTitle}</h5>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{ticket.venue}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(ticket.date).toLocaleDateString()} at {ticket.time}</span>
                    </div>
                  </div>
                </div>
                <Badge className="bg-green-600">Ticketed</Badge>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h4 className="font-medium">Interested Events</h4>
          {mockInterestedEvents.map((event) => (
            <div key={event.id} className="p-3 border rounded-lg bg-background/30">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-medium">{event.title}</h5>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{event.venue}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(event.date).toLocaleDateString()} at {event.time}</span>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="border-orange-400 text-orange-400">Interested</Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  // Tab configuration based on view mode
  const memberTabs = ['profile', 'tickets', 'calendar', 'settings'];
  const industryTabs = ['profile', 'calendar', isIndustryUser ? 'invoices' : 'tickets', 'vouches', 'requests', 'settings'];
  
  const availableTabs = isMemberView ? memberTabs : industryTabs;

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
          <TabsList className={`grid w-full mb-8 ${isMemberView ? 'grid-cols-4' : 'grid-cols-6'}`}>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value={isMemberView ? "tickets" : "calendar"}>
              {isMemberView ? "Tickets" : "Calendar"}
            </TabsTrigger>
            <TabsTrigger value={isMemberView ? "calendar" : (isIndustryUser ? "invoices" : "tickets")}>
              {isMemberView ? "Calendar" : (isIndustryUser ? "Invoices" : "Tickets")}
            </TabsTrigger>
            {!isMemberView && <TabsTrigger value="vouches">Vouches</TabsTrigger>}
            {!isMemberView && <TabsTrigger value="requests">Requests</TabsTrigger>}
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <ProfileInformation user={user} onSave={handleSaveProfile} />
            {!isMemberView && (
              <>
                <MediaPortfolio />
                <ContactInformation />
                <FinancialInformation />
              </>
            )}
          </TabsContent>

          {isMemberView ? (
            <>
              <TabsContent value="tickets">
                <TicketsSection />
              </TabsContent>
              <TabsContent value="calendar">
                <MemberCalendarSection />
              </TabsContent>
            </>
          ) : (
            <>
              <TabsContent value="calendar">
                <ProfileCalendarView />
              </TabsContent>
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
            </>
          )}

          <TabsContent value="settings" className="space-y-6">
            {isMemberView ? (
              <MemberAccountSettings />
            ) : (
              <>
                <SubscriptionManager />
                <AccountSettings />
              </>
            )}
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
