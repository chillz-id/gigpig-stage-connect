import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Users, Handshake, Trophy, Globe2, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ContactList } from '@/components/crm/ContactList';
import type { CRMContact, ContactRole } from '@/hooks/useContacts';
import { useContacts } from '@/hooks/useContacts';

type ContactTab = {
  value: ContactRole;
  label: string;
  description: string;
};

const CONTACT_TABS: ContactTab[] = [
  {
    value: 'organizer',
    label: 'Organizers',
    description: 'Promoters and booking partners actively scheduling shows.',
  },
  {
    value: 'venue_manager',
    label: 'Venues',
    description: 'Venue managers and coordinators responsible for logistics.',
  },
  {
    value: 'sponsor',
    label: 'Sponsors',
    description: 'Brand partners supporting current tours and campaigns.',
  },
  {
    value: 'agency_manager',
    label: 'Agencies',
    description: 'Agency representatives coordinating talent and routing.',
  },
];

const TAB_TO_PATH: Record<ContactRole, string> = {
  organizer: '/crm/organizers',
  venue_manager: '/crm/venues',
  sponsor: '/crm/sponsors',
  agency_manager: '/crm/agencies',
};

const PATH_TO_TAB: Record<string, ContactRole> = {
  '/crm/relationships': 'organizer',
  '/crm/organizers': 'organizer',
  '/crm/venues': 'venue_manager',
  '/crm/sponsors': 'sponsor',
  '/crm/agencies': 'agency_manager',
};

const resolveInitialTab = (pathname: string): ContactRole => PATH_TO_TAB[pathname] ?? 'organizer';

const buildSummary = (contacts: CRMContact[]) => {
  const total = contacts.length;
  const withEvents = contacts.filter((contact) => (contact.totalEventsHosted ?? 0) > 0).length;
  const averageSuccess =
    total > 0
      ? Math.round(
          contacts.reduce((acc, contact) => acc + (contact.successRate ?? 0), 0) / total
        )
      : 0;
  const averageAttendance =
    total > 0
      ? Math.round(
          contacts.reduce((acc, contact) => acc + (contact.averageAttendance ?? 0), 0) / total
        )
      : 0;

  const coverage = contacts.reduce((set, contact) => {
    contact.serviceAreas?.forEach((area) => set.add(area));
    return set;
  }, new Set<string>()).size;

  return {
    total,
    withEvents,
    averageSuccess,
    averageAttendance,
    coverage,
  };
};

export const RelationshipsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<ContactRole>(resolveInitialTab(location.pathname));
  const [search, setSearch] = useState('');

  useEffect(() => {
    const nextTab = resolveInitialTab(location.pathname);
    setActiveTab(nextTab);
  }, [location.pathname]);

  const {
    data: contacts = [],
    isLoading,
    error,
  } = useContacts({
    role: activeTab,
    search,
  });

  const summary = useMemo(() => buildSummary(contacts), [contacts]);

  const handleTabChange = (value: string) => {
    const nextValue = value as ContactRole;
    setActiveTab(nextValue);
    setSearch('');

    const targetPath = TAB_TO_PATH[nextValue];
    if (targetPath && targetPath !== location.pathname) {
      navigate(targetPath, { replace: false });
    }
  };

  const handleCreateTask = (contact: CRMContact) => {
    navigate(`/crm/tasks?assignee=${contact.id}`);
  };

  const handleViewDeals = (contact: CRMContact) => {
    navigate(`/crm/deals?contact=${contact.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Relationships</h1>
          <p className="text-sm text-muted-foreground">
            Track promoters, venues, sponsors, and agencies coordinating upcoming shows.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Total contacts</p>
              <p className="text-2xl font-semibold">{summary.total}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Coverage across {summary.coverage} regions
              </p>
            </div>
            <Users className="h-8 w-8 text-purple-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Active relationships</p>
              <p className="text-2xl font-semibold">{summary.withEvents}</p>
            </div>
            <Handshake className="h-8 w-8 text-blue-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Avg. success rate</p>
              <p className="text-2xl font-semibold">{summary.averageSuccess}%</p>
            </div>
            <Trophy className="h-8 w-8 text-emerald-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Avg. attendance</p>
              <p className="text-2xl font-semibold">{summary.averageAttendance}</p>
            </div>
            <Globe2 className="h-8 w-8 text-orange-500" />
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className="border-destructive/40 bg-destructive/10">
          <CardContent className="flex items-center gap-3 p-4 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span>{error.message}</span>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {CONTACT_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex flex-col gap-1 py-3">
              <span className="text-sm font-medium">{tab.label}</span>
              <span className="text-[11px] text-muted-foreground">{tab.description}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {CONTACT_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="space-y-6">
            <ContactList
              contacts={tab.value === activeTab ? contacts : []}
              isLoading={isLoading && tab.value === activeTab}
              searchValue={tab.value === activeTab ? search : ''}
              onSearchChange={setSearch}
              onCreateTask={handleCreateTask}
              onViewDeals={handleViewDeals}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
