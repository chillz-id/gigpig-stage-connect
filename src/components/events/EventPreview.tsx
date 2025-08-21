import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Ticket, 
  DollarSign,
  Smartphone,
  Monitor,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { EventFormData, EventSpot, RecurringSettings } from '@/types/eventTypes';
import { ValidationSummary } from './ValidationFeedback';
import { validateEventFormEnhanced } from '@/utils/eventValidation.enhanced';

interface EventPreviewProps {
  open: boolean;
  onClose: () => void;
  formData: EventFormData;
  eventSpots: EventSpot[];
  recurringSettings: RecurringSettings;
  validationResult?: ReturnType<typeof validateEventFormEnhanced>;
  onPublish: () => void;
  isPublishing?: boolean;
}

export const EventPreview: React.FC<EventPreviewProps> = ({
  open,
  onClose,
  formData,
  eventSpots,
  recurringSettings,
  validationResult,
  onPublish,
  isPublishing = false
}) => {
  const [activeView, setActiveView] = useState<'desktop' | 'mobile'>('desktop');

  const formatEventDate = () => {
    if (!formData.date) return 'Date not set';
    try {
      return format(parseISO(formData.date), 'EEEE, MMMM d, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const formatEventTime = () => {
    if (!formData.time) return 'Time not set';
    const timeStr = formData.endTime 
      ? `${formData.time} - ${formData.endTime}`
      : `${formData.time}`;
    return timeStr;
  };

  const PublishChecklist = () => {
    const checks = [
      { label: 'Event title and description', completed: !!formData.title },
      { label: 'Date and time set', completed: !!formData.date && !!formData.time },
      { label: 'Venue information', completed: !!formData.venue && !!formData.address },
      { label: 'Performance spots configured', completed: eventSpots.length > 0 },
      { label: 'Ticketing information', completed: formData.ticketingType === 'external' ? !!formData.externalTicketUrl : formData.tickets.length > 0 },
      { label: 'No validation errors', completed: validationResult ? validationResult.isValid : true }
    ];

    const allChecksPass = checks.every(check => check.completed);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pre-publish Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {checks.map((check, index) => (
            <div key={index} className="flex items-center gap-2">
              {check.completed ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span className={check.completed ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                {check.label}
              </span>
            </div>
          ))}
          
          {!allChecksPass && (
            <p className="text-sm text-muted-foreground mt-4">
              Please complete all items before publishing.
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  const EventContent = () => (
    <div className={activeView === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'}>
      {/* Header Image */}
      {formData.imageUrl && (
        <div className="relative w-full h-48 md:h-64 bg-gray-200 rounded-lg overflow-hidden mb-6">
          <img 
            src={formData.imageUrl} 
            alt={formData.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Event Title & Type */}
      <div className="mb-6">
        <h1 className={`font-bold ${activeView === 'mobile' ? 'text-2xl' : 'text-3xl'} mb-2`}>
          {formData.title || 'Untitled Event'}
        </h1>
        {formData.type && (
          <Badge variant="secondary" className="mb-4">
            {formData.type.replace('_', ' ').toUpperCase()}
          </Badge>
        )}
      </div>

      {/* Key Details */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <span>{formatEventDate()}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <span>{formatEventTime()}</span>
        </div>
        
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="font-medium">{formData.venue || 'Venue not set'}</p>
            <p className="text-sm text-muted-foreground">
              {formData.address || 'Address not set'}
              {formData.city && `, ${formData.city}`}
              {formData.state && `, ${formData.state}`}
            </p>
          </div>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Description */}
      {formData.description && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">About This Event</h2>
          <p className="text-muted-foreground whitespace-pre-wrap">
            {formData.description}
          </p>
        </div>
      )}

      {/* Performance Spots */}
      {eventSpots.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Performance Spots ({eventSpots.length})
          </h2>
          <div className="space-y-2">
            {eventSpots.map((spot, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">{spot.spot_name}</p>
                  {spot.duration_minutes && (
                    <p className="text-sm text-muted-foreground">
                      {spot.duration_minutes} minutes
                    </p>
                  )}
                </div>
                {spot.is_paid && spot.payment_amount && (
                  <Badge variant="outline">
                    <DollarSign className="h-3 w-3 mr-1" />
                    {spot.payment_amount} {spot.currency}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ticketing */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
          <Ticket className="h-5 w-5" />
          Tickets
        </h2>
        {formData.ticketingType === 'external' && formData.externalTicketUrl ? (
          <Button variant="default" className="w-full" asChild>
            <a href={formData.externalTicketUrl} target="_blank" rel="noopener noreferrer">
              Get Tickets
            </a>
          </Button>
        ) : formData.tickets.length > 0 ? (
          <div className="space-y-2">
            {formData.tickets.map((ticket, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <span>{ticket.name}</span>
                <span className="font-semibold">${ticket.price}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Ticketing information not available</p>
        )}
      </div>

      {/* Additional Info */}
      <div className="space-y-2 text-sm text-muted-foreground">
        {formData.ageRestriction && (
          <p>Age restriction: {formData.ageRestriction}</p>
        )}
        {formData.dresscode && (
          <p>Dress code: {formData.dresscode}</p>
        )}
        {formData.capacity > 0 && (
          <p>Venue capacity: {formData.capacity} people</p>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Event Preview & Publishing</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="preview" className="flex-1">
          <TabsList className="grid w-full grid-cols-2 mx-6">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="validation">Validation & Publish</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="p-6 pt-4">
            {/* View Toggle */}
            <div className="flex justify-center gap-2 mb-6">
              <Button
                variant={activeView === 'desktop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveView('desktop')}
              >
                <Monitor className="h-4 w-4 mr-2" />
                Desktop
              </Button>
              <Button
                variant={activeView === 'mobile' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveView('mobile')}
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Mobile
              </Button>
            </div>

            {/* Preview Content */}
            <ScrollArea className="h-[500px] rounded-lg border p-6">
              <EventContent />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="validation" className="p-6 pt-4">
            <div className="space-y-6">
              {/* Validation Summary */}
              {validationResult && (
                <ValidationSummary
                  errors={validationResult.errors}
                  warnings={validationResult.warnings}
                />
              )}

              {/* Publish Checklist */}
              <PublishChecklist />

              {/* Recurring Events Info */}
              {recurringSettings.isRecurring && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recurring Event Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      Pattern: <span className="font-medium">{recurringSettings.pattern}</span>
                    </p>
                    {recurringSettings.pattern !== 'custom' && recurringSettings.endDate && (
                      <p className="text-sm">
                        End date: <span className="font-medium">
                          {format(parseISO(recurringSettings.endDate), 'MMMM d, yyyy')}
                        </span>
                      </p>
                    )}
                    {recurringSettings.pattern === 'custom' && (
                      <p className="text-sm">
                        Custom dates: <span className="font-medium">
                          {recurringSettings.customDates.length} selected
                        </span>
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Publish Button */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onClose}>
                  Back to Edit
                </Button>
                <Button
                  onClick={onPublish}
                  disabled={!validationResult?.isValid || isPublishing}
                >
                  {isPublishing ? 'Publishing...' : 
                   recurringSettings.isRecurring ? 'Publish All Events' : 'Publish Event'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};