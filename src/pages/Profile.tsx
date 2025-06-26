
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { ContactSettings } from '@/components/ContactSettings';
import { VouchSystem } from '@/components/VouchSystem';
import { ProfileCalendarView } from '@/components/ProfileCalendarView';
import { ContactRequests } from '@/components/ContactRequests';
import { ImageCrop } from '@/components/ImageCrop';
import { ProfileHeader } from '@/components/ProfileHeader';
import { ProfileInformation } from '@/components/ProfileInformation';
import { MediaPortfolio } from '@/components/MediaPortfolio';
import { ContactInformation } from '@/components/ContactInformation';
import { FinancialInformation } from '@/components/FinancialInformation';
import { InvoiceManagement } from '@/components/InvoiceManagement';
import { AccountSettings } from '@/components/AccountSettings';
import { MemberAccountSettings } from '@/components/MemberAccountSettings';
import { BookComedianForm } from '@/components/BookComedianForm';
import { NotificationSystem } from '@/components/NotificationSystem';
import { Ticket, Calendar as CalendarIcon, MapPin, Clock, Heart, Bell } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { useViewMode } from '@/contexts/ViewModeContext';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';
import { format, isSameDay, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Check if user is industry user (comedian/promoter)
  const isIndustryUser = hasRole('comedian') || hasRole('promoter');

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [location]);

  // Fetch user interests from database
  const { data: userInterests = [] } = useQuery({
    queryKey: ['user-interests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_interests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && isMemberView,
  });

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

  // Mock tickets data for member users with much larger event images
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
      eventImage: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=600&h=400&fit=crop"
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
      eventImage: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=400&fit=crop"
    }
  ];

  const TicketsListSection = () => (
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
              <div key={ticket.id} className="border rounded-lg bg-background/50 p-6">
                <div className="flex gap-6">
                  <img 
                    src={ticket.eventImage} 
                    alt={ticket.eventTitle}
                    className="w-64 h-48 object-cover rounded flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{ticket.eventTitle}</h3>
                        <p className="text-lg text-muted-foreground">{ticket.venue}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-base mb-4">
                      <div>
                        <p className="text-muted-foreground">Date</p>
                        <p className="font-medium">{new Date(ticket.date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Time</p>
                        <p className="font-medium">{ticket.time}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Ticket Type</p>
                        <p className="font-medium">{ticket.ticketType}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Quantity</p>
                        <p className="font-medium">{ticket.quantity}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t">
                      <span className="text-xl font-semibold">Total: ${ticket.totalPrice.toFixed(2)}</span>
                      <Button variant="outline" size="sm">
                        View Tickets
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Shows Attended Counter for Members */}
        {isMemberView && (
          <Card className="bg-primary/5 border-primary/20 mt-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold mb-1">Shows Attended</h4>
                  <p className="text-muted-foreground">Your comedy show attendance history</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{mockTickets.length}</div>
                  <p className="text-sm text-muted-foreground">Events</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );

  const InterestedEventsSection = () => (
    <Card className="bg-card/50 backdrop-blur-sm border-border text-foreground">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-pink-500" />
          Events I'm Interested In
        </CardTitle>
        <CardDescription>
          Events you've marked as interested
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {userInterests.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h4 className="text-lg font-semibold mb-2">No interested events yet</h4>
            <p className="text-muted-foreground">
              Browse events and mark ones you're interested in to see them here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {userInterests.map((interest) => (
              <div key={interest.id} className="border rounded-lg bg-background/50 p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h5 className="font-medium">{interest.event_title}</h5>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      {interest.venue && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{interest.venue}</span>
                        </div>
                      )}
                      {interest.event_date && (
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3" />
                          <span>{new Date(interest.event_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      {interest.event_time && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{interest.event_time}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="border-pink-400 text-pink-400 flex items-center gap-1">
                    <Heart className="w-3 h-3 fill-pink-400" />
                    Interested
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    View Event
                  </Button>
                  <Button size="sm" variant="ghost" className="text-muted-foreground">
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Tab configuration based on view mode
  const memberTabs = ['profile', 'tickets', 'notifications', 'book-comedian', 'settings'];
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
          <TabsList className={`grid w-full mb-8 ${isMemberView ? 'grid-cols-5' : 'grid-cols-6'}`}>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value={isMemberView ? "tickets" : "calendar"}>
              {isMemberView ? "Tickets" : "Calendar"}
            </TabsTrigger>
            {isMemberView && (
              <TabsTrigger value="notifications">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </TabsTrigger>
            )}
            {isMemberView && <TabsTrigger value="book-comedian">Book Comedian</TabsTrigger>}
            {!isMemberView && (
              <TabsTrigger value={isIndustryUser ? "invoices" : "tickets"}>
                {isIndustryUser ? "Invoices" : "Tickets"}
              </TabsTrigger>
            )}
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
              <TabsContent value="tickets" className="space-y-6">
                <TicketsListSection />
                <InterestedEventsSection />
              </TabsContent>
              <TabsContent value="notifications">
                <NotificationSystem userId={user?.id} />
              </TabsContent>
              <TabsContent value="book-comedian">
                <BookComedianForm />
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
                  <TicketsListSection />
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
              <AccountSettings />
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
