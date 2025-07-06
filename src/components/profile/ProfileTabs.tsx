
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, User, Calendar, Receipt, UserCheck, Settings, Ticket, Heart } from 'lucide-react';
import { ProfileInformation } from '@/components/ProfileInformation';
import ComedianMedia from '@/components/comedian-profile/ComedianMedia';
import { ContactInformation } from '@/components/ContactInformation';
import { FinancialInformation } from '@/components/FinancialInformation';
import { ProfileCalendarView } from '@/components/ProfileCalendarView';
import { InvoiceManagement } from '@/components/InvoiceManagement';
import { VouchSystem } from '@/components/VouchSystem';
import { AccountSettings } from '@/components/AccountSettings';
import { MemberAccountSettings } from '@/components/MemberAccountSettings';
import { BookComedianForm } from '@/components/BookComedianForm';
import { NotificationSystem } from '@/components/NotificationSystem';
import { TicketsSection } from './TicketsSection';
import { InterestedEventsSection } from './InterestedEventsSection';

interface ProfileTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMemberView: boolean;
  isIndustryUser: boolean;
  user: any;
  userInterests: any[];
  mockTickets: any[];
  onSave: (data: any) => Promise<void>;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({
  activeTab,
  setActiveTab,
  isMemberView,
  isIndustryUser,
  user,
  userInterests,
  mockTickets,
  onSave
}) => {
  // Tab configuration based on view mode
  const memberTabs = ['profile', 'tickets', 'notifications', 'book-comedian', 'settings'];
  const industryTabs = ['profile', 'calendar', isIndustryUser ? 'invoices' : 'tickets', 'vouches', 'settings'];
  
  const availableTabs = isMemberView ? memberTabs : industryTabs;

  // Handle tab change - validate and pass to parent
  const handleTabChange = (newTab: string) => {
    // Only pass valid tabs to parent
    if (availableTabs.includes(newTab)) {
      setActiveTab(newTab);
    }
  };

  // Ensure we have a valid active tab - fallback to first available tab
  const currentTab = availableTabs.includes(activeTab) ? activeTab : availableTabs[0];

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className={`grid w-full mb-8 ${isMemberView ? 'grid-cols-5' : 'grid-cols-5'}`}>
        <TabsTrigger value="profile" className="flex items-center gap-2">
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">Profile</span>
        </TabsTrigger>
        <TabsTrigger value={isMemberView ? "tickets" : "calendar"} className="flex items-center gap-2">
          {isMemberView ? <Ticket className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
          <span className="hidden sm:inline">{isMemberView ? "Tickets" : "Calendar"}</span>
        </TabsTrigger>
        {isMemberView && (
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
        )}
        {isMemberView && (
          <TabsTrigger value="book-comedian" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            <span className="hidden sm:inline">Book Comedian</span>
          </TabsTrigger>
        )}
        {!isMemberView && (
          <TabsTrigger value={isIndustryUser ? "invoices" : "tickets"} className="flex items-center gap-2">
            {isIndustryUser ? <Receipt className="w-4 h-4" /> : <Ticket className="w-4 h-4" />}
            <span className="hidden sm:inline">{isIndustryUser ? "Invoices" : "Tickets"}</span>
          </TabsTrigger>
        )}
        {!isMemberView && (
          <TabsTrigger value="vouches" className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Vouches</span>
          </TabsTrigger>
        )}
        <TabsTrigger value="settings" className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Settings</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="space-y-6">
        <ProfileInformation user={user} onSave={onSave} />
        {!isMemberView && (
          <>
            <ComedianMedia comedianId={user?.id} isOwnProfile={true} />
            <ContactInformation />
            <FinancialInformation />
          </>
        )}
      </TabsContent>

      {isMemberView ? (
        <>
          <TabsContent value="tickets" className="space-y-6">
            <TicketsSection isMemberView={isMemberView} />
            <InterestedEventsSection userInterests={userInterests} />
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
              <TicketsSection isMemberView={isMemberView} />
            </TabsContent>
          )}
          <TabsContent value="vouches">
            <VouchSystem />
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
  );
};
