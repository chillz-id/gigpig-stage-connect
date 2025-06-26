
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell } from 'lucide-react';
import { ProfileInformation } from '@/components/ProfileInformation';
import { MediaPortfolio } from '@/components/MediaPortfolio';
import { ContactInformation } from '@/components/ContactInformation';
import { FinancialInformation } from '@/components/FinancialInformation';
import { ProfileCalendarView } from '@/components/ProfileCalendarView';
import { InvoiceManagement } from '@/components/InvoiceManagement';
import { VouchSystem } from '@/components/VouchSystem';
import { ContactRequests } from '@/components/ContactRequests';
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
  onSave: () => void;
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
  const industryTabs = ['profile', 'calendar', isIndustryUser ? 'invoices' : 'tickets', 'vouches', 'requests', 'settings'];
  
  const availableTabs = isMemberView ? memberTabs : industryTabs;

  return (
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
        <ProfileInformation user={user} onSave={onSave} />
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
            <TicketsSection tickets={mockTickets} isMemberView={isMemberView} />
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
              <TicketsSection tickets={mockTickets} isMemberView={isMemberView} />
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
  );
};
