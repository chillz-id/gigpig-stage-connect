
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Bell, User, Calendar, Receipt, Crown, Settings, Ticket, Heart, Image as ImageIcon, Mail, Building, FileText, Trophy, Link as LinkIcon } from 'lucide-react';
import { ProfileInformation } from '@/components/ProfileInformation';
import ComedianMedia from '@/components/comedian-profile/ComedianMedia';
import { ContactInformation } from '@/components/ContactInformation';
import { FinancialInformation } from '@/components/FinancialInformation';
import { ProfileCalendarView } from '@/components/ProfileCalendarView';
import { InvoiceManagement } from '@/components/InvoiceManagement';
import { GiveVouchForm } from '@/components/GiveVouchForm';
import { VouchHistory } from '@/components/VouchHistory';
import { AccountSettings } from '@/components/AccountSettings';
import { TicketsSection } from './TicketsSection';
import { PressReviewsManager } from './PressReviewsManager';
import { CareerHighlightsManager } from './CareerHighlightsManager';
import { CustomLinksManager } from '@/components/comedian-profile/CustomLinksManager';

interface ProfileTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isIndustryUser: boolean;
  isComedianLite?: boolean;
  user: any;
  userInterests: any[];
  mockTickets: any[];
  onSave: (data: any) => Promise<void>;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({
  activeTab,
  setActiveTab,
  isIndustryUser,
  isComedianLite = false,
  user,
  userInterests,
  mockTickets,
  onSave
}) => {
  // Tab configuration for industry users (comedians, promoters, etc.)
  const availableTabs = ['profile', 'calendar', isIndustryUser ? 'invoices' : 'tickets', 'vouches', 'settings'];

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
      <TabsList className="grid w-full mb-8 grid-cols-5">
        <TabsTrigger value="profile" className="flex items-center gap-2">
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">Profile</span>
        </TabsTrigger>
        <TabsTrigger value="calendar" className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span className="hidden sm:inline">Calendar</span>
        </TabsTrigger>
        <TabsTrigger
          value={isIndustryUser ? "invoices" : "tickets"}
          className="flex items-center gap-2 relative"
        >
          {isIndustryUser ? <Receipt className="w-4 h-4" /> : <Ticket className="w-4 h-4" />}
          <span className="hidden sm:inline">
            {isIndustryUser ? "Invoices" : "Tickets"}
          </span>
        </TabsTrigger>
        <TabsTrigger value="vouches" className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-yellow-500" />
          <span className="hidden sm:inline">Vouches</span>
        </TabsTrigger>
        <TabsTrigger value="settings" className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Settings</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="space-y-6">
        <Card className="professional-card">
          <CardContent className="p-6">
            <Accordion type="multiple" defaultValue={['personal']} className="w-full">

              {/* Personal Information Section */}
              <AccordionItem value="personal">
                <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    <span>Personal Information</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pt-4">
                    <ProfileInformation user={user} onSave={onSave} />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Media Portfolio Section */}
              <AccordionItem value="media">
                <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-primary" />
                    <span>Media Portfolio</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pt-4">
                    <ComedianMedia comedianId={user?.id} isOwnProfile={true} />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Contact Information Section */}
              <AccordionItem value="contact">
                <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary" />
                    <span>Contact Information</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pt-4">
                    <ContactInformation />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Financial Information Section */}
              <AccordionItem value="financial">
                <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-primary" />
                    <span>Financial Information</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pt-4">
                    <FinancialInformation />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Career Highlights Section */}
              <AccordionItem value="career-highlights">
                <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    <span>Career Highlights</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pt-4">
                    <CareerHighlightsManager />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Press Reviews Section */}
              <AccordionItem value="press-reviews">
                <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <span>Press Reviews</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pt-4">
                    <PressReviewsManager />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Custom Links Section */}
              <AccordionItem value="custom-links">
                <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-5 h-5 text-primary" />
                    <span>Custom Links</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pt-4">
                    <CustomLinksManager />
                  </div>
                </AccordionContent>
              </AccordionItem>

            </Accordion>
          </CardContent>
        </Card>
      </TabsContent>

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

      <TabsContent value="vouches" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Give a Vouch
            </CardTitle>
            <CardDescription>
              Endorse someone in your network by giving them a vouch
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GiveVouchForm userId={user?.id} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Vouch History
            </CardTitle>
            <CardDescription>
              View vouches you've received and given
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="received" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="received">Received</TabsTrigger>
                <TabsTrigger value="given">Given</TabsTrigger>
              </TabsList>
              <TabsContent value="received" className="space-y-4 mt-4">
                <VouchHistory userId={user?.id} mode="received" />
              </TabsContent>
              <TabsContent value="given" className="space-y-4 mt-4">
                <VouchHistory userId={user?.id} mode="given" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Settings Tab */}
      <TabsContent value="settings" className="space-y-6">
        <AccountSettings />
      </TabsContent>
    </Tabs>
  );
};
