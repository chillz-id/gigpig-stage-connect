import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AddGigDialog } from '@/components/comedian/AddGigDialog';
import { CalendarSubscriptionDialog } from '@/components/calendar/CalendarSubscriptionDialog';
import { useMyGigs } from '@/hooks/useMyGigs';
import { Plus, Calendar, MapPin, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function MyGigs() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const { manualGigs, isLoading, deleteGig, isDeleting } = useMyGigs();

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'EEE, MMM d, yyyy h:mm a');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Gigs</h1>
          <p className="text-muted-foreground mt-1">
            Manage your personal gig schedule
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setSubscriptionDialogOpen(true)}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Subscribe to Calendar
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Gig
          </Button>
        </div>
      </div>

      {/* Calendar Subscription Dialog */}
      <CalendarSubscriptionDialog
        open={subscriptionDialogOpen}
        onOpenChange={setSubscriptionDialogOpen}
      />

      {/* Confirmed Platform Gigs Section */}
      <Card>
        <CardHeader>
          <CardTitle>Confirmed Platform Gigs</CardTitle>
          <CardDescription>
            Gigs you've been confirmed for through the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Coming soon: Your confirmed spots will appear here
          </p>
        </CardContent>
      </Card>

      {/* Manual Gigs Section */}
      <Card>
        <CardHeader>
          <CardTitle>My Manual Gigs</CardTitle>
          <CardDescription>
            Gigs you've added manually for personal tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : manualGigs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No manual gigs yet. Add your first gig to get started!
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Gig
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {manualGigs.map((gig) => (
                <Card key={gig.id} className="border-l-4 border-l-green-500">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 space-y-2">
                        <h3 className="font-semibold text-lg">{gig.title}</h3>

                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="mr-2 h-4 w-4" />
                          <span>{formatDate(gig.start_datetime)}</span>
                          {gig.end_datetime && (
                            <span className="ml-2">
                              - {format(new Date(gig.end_datetime), 'h:mm a')}
                            </span>
                          )}
                        </div>

                        {gig.venue_name && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="mr-2 h-4 w-4" />
                            <span>
                              {gig.venue_name}
                              {gig.venue_address && ` - ${gig.venue_address}`}
                            </span>
                          </div>
                        )}

                        {gig.notes && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {gig.notes}
                          </p>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this gig?')) {
                            deleteGig(gig.id);
                          }
                        }}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddGigDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
    </div>
  );
}
