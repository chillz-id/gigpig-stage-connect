import { useState } from 'react';
import { BellRing } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NotificationFilters from '@/components/notifications/NotificationFilters';
import NotificationActions from '@/components/notifications/NotificationActions';
import NotificationList from '@/components/notifications/NotificationList';
import NotificationPreferences from '@/components/notifications/NotificationPreferences';
import { useNotificationCenter } from '@/hooks/useNotificationCenter';

const LoadingState = () => (
  <Card className="bg-white/10 backdrop-blur-sm border-white/20">
    <CardContent className="p-8 text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto" />
      <p className="text-white mt-4">Loading notifications...</p>
    </CardContent>
  </Card>
);

const NotificationCenter = () => {
  const [selectedTab, setSelectedTab] = useState<'notifications' | 'preferences'>('notifications');
  const {
    loading,
    preferences,
    filteredNotifications,
    unreadCount,
    filters,
    setSearchTerm,
    setTypeFilter,
    setPriorityFilter,
    toggleUnreadOnly,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendTestNotification,
    updatePreferences,
  } = useNotificationCenter();

  const hasActiveFilters =
    filters.searchTerm.trim().length > 0 ||
    filters.type !== 'all' ||
    filters.priority !== 'all' ||
    filters.unreadOnly;

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BellRing className="w-5 h-5" />
            Notification Center
            {unreadCount > 0 && <Badge className="bg-red-500 ml-2">{unreadCount}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as 'notifications' | 'preferences')}>
            <TabsList className="grid w-full grid-cols-2 bg-white/10">
              <TabsTrigger value="notifications" className="text-white data-[state=active]:bg-purple-600">
                Notifications
              </TabsTrigger>
              <TabsTrigger value="preferences" className="text-white data-[state=active]:bg-purple-600">
                Preferences
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notifications" className="mt-6">
              <div className="space-y-4">
                <NotificationFilters
                  searchTerm={filters.searchTerm}
                  onSearchChange={setSearchTerm}
                  typeFilter={filters.type}
                  onTypeChange={setTypeFilter}
                  priorityFilter={filters.priority}
                  onPriorityChange={setPriorityFilter}
                  showUnreadOnly={filters.unreadOnly}
                  onToggleUnreadOnly={toggleUnreadOnly}
                />
                <NotificationActions
                  totalCount={filteredNotifications.length}
                  unreadCount={unreadCount}
                  onMarkAllRead={markAllAsRead}
                  onSendTest={sendTestNotification}
                />
                <NotificationList
                  notifications={filteredNotifications}
                  hasActiveFilters={hasActiveFilters}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                />
              </div>
            </TabsContent>

            <TabsContent value="preferences" className="mt-6">
              {preferences && (
                <NotificationPreferences preferences={preferences} onUpdate={updatePreferences} />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationCenter;
