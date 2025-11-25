import { useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { CRMContact, ContactRole } from '@/hooks/useContacts';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Mail, Phone, Globe, MapPin, Calendar, Briefcase, Rocket } from 'lucide-react';

const roleLabels: Record<ContactRole, string> = {
  organizer: 'Organizer',
  venue_manager: 'Venue',
  sponsor: 'Sponsor',
  agency_manager: 'Agency',
};

const getInitials = (name: string) => {
  const parts = name.trim().split(' ');
  const first = parts[0]?.[0];
  const second = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return `${first || ''}${second || ''}`.toUpperCase();
};

interface ContactCardProps {
  contact: CRMContact;
  onCreateTask?: (contact: CRMContact) => void;
  onViewDeals?: (contact: CRMContact) => void;
}

export const ContactCard = ({ contact, onCreateTask, onViewDeals }: ContactCardProps) => {
  const initials = getInitials(contact.name);
  const isMobile = useIsMobile();
  const [isSwiped, setIsSwiped] = useState(false);
  const touchStart = useRef<number | null>(null);

  const hasPerformanceStats =
    contact.totalEventsHosted || contact.successRate || contact.averageAttendance;

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobile) return;
    touchStart.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobile || touchStart.current === null) return;
    const touch = event.touches[0];
    if (!touch) return;
    const deltaX = touch.clientX - touchStart.current;
    if (deltaX < -30) {
      setIsSwiped(true);
    } else if (deltaX > 30) {
      setIsSwiped(false);
    }
  };

  const handleTouchEnd = () => {
    if (!isMobile) return;
    touchStart.current = null;
  };

  const closeSwipe = () => setIsSwiped(false);

  const QuickActions = () => (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={(event) => {
          event.stopPropagation();
          closeSwipe();
          if (contact.email) window.open(`mailto:${contact.email}`, '_blank', 'noopener');
        }}
      >
        <Mail className="h-4 w-4" />
        <span className="sr-only">Email</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={!onCreateTask}
        onClick={(event) => {
          event.stopPropagation();
          closeSwipe();
          onCreateTask?.(contact);
        }}
      >
        <Briefcase className="h-4 w-4" />
        <span className="sr-only">Create task</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={!onViewDeals}
        onClick={(event) => {
          event.stopPropagation();
          closeSwipe();
          onViewDeals?.(contact);
        }}
      >
        <Rocket className="h-4 w-4" />
        <span className="sr-only">View deals</span>
      </Button>
    </>
  );

  return (
    <div className="relative">
      {isMobile && (
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex w-36 items-center justify-around rounded-r-lg bg-muted/80 backdrop-blur transition-opacity">
          <QuickActions />
        </div>
      )}
      <Card
        className={cn(
          'h-full overflow-hidden transition-transform',
          isMobile && isSwiped ? '-translate-x-20' : ''
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              {contact.avatarUrl && <AvatarImage src={contact.avatarUrl} alt={contact.name} />}
              <AvatarFallback>{initials || roleLabels[contact.role][0]}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base font-semibold leading-tight">
                {contact.name}
              </CardTitle>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary" className="capitalize">
                  {roleLabels[contact.role]}
                </Badge>
                {contact.company && <span>{contact.company}</span>}
              </div>
            </div>
          </div>
          <Badge className="professional-button text-xs">
            Updated {contact.updatedAt ? new Date(contact.updatedAt).toLocaleDateString() : '—'}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="space-y-2">
            {contact.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <a
                  className="truncate hover:underline"
                  href={`mailto:${contact.email}`}
                  onClick={(event) => event.stopPropagation()}
                >
                  {contact.email}
                </a>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <a
                  className="hover:underline"
                  href={`tel:${contact.phone}`}
                  onClick={(event) => event.stopPropagation()}
                >
                  {contact.phone}
                </a>
              </div>
            )}
            {contact.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{contact.location}</span>
              </div>
            )}
            {contact.websiteUrl && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="h-4 w-4" />
                <a
                  className="truncate hover:underline"
                  href={contact.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => event.stopPropagation()}
                >
                  {contact.websiteUrl.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
          </div>

          {(contact.serviceAreas?.length || contact.specialties?.length) && (
            <div className="space-y-2">
              {contact.serviceAreas?.length ? (
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Service Areas
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {contact.serviceAreas.slice(0, 4).map((area) => (
                      <Badge key={area} className="professional-button text-xs capitalize">
                        {area.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
              {contact.specialties?.length ? (
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Specialties
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {contact.specialties.slice(0, 4).map((specialty) => (
                      <Badge key={specialty} className="professional-button text-xs capitalize">
                        {specialty.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {hasPerformanceStats && (
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-md border bg-muted/40 p-3">
                <Briefcase className="mx-auto mb-2 h-4 w-4 text-purple-500" />
                <p className="font-semibold">
                  {contact.totalEventsHosted?.toLocaleString() ?? '—'}
                </p>
                <p className="text-muted-foreground">Events</p>
              </div>
              <div className="rounded-md border bg-muted/40 p-3">
                <Rocket className="mx-auto mb-2 h-4 w-4 text-blue-500" />
                <p className="font-semibold">
                  {contact.successRate !== null && contact.successRate !== undefined
                    ? `${Math.round(contact.successRate)}%`
                    : '—'}
                </p>
                <p className="text-muted-foreground">Success</p>
              </div>
              <div className="rounded-md border bg-muted/40 p-3">
                <Calendar className="mx-auto mb-2 h-4 w-4 text-emerald-500" />
                <p className="font-semibold">
                  {contact.averageAttendance?.toLocaleString() ?? '—'}
                </p>
                <p className="text-muted-foreground">Avg attendance</p>
              </div>
            </div>
          )}
        </CardContent>

        {!isMobile && (
          <CardFooter className="flex flex-wrap gap-2 border-t bg-muted/30 p-4">
            <Button className="professional-button" size="sm" asChild>
              <a
                href={contact.email ? `mailto:${contact.email}` : '#'}
                onClick={(event) => {
                  if (!contact.email) {
                    event.preventDefault();
                    event.stopPropagation();
                  }
                }}
              >
                Email
              </a>
            </Button>
            <Button
              className="professional-button"
              size="sm"
              disabled={!onCreateTask}
              onClick={(event) => {
                event.stopPropagation();
                onCreateTask?.(contact);
              }}
            >
              Create Task
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!onViewDeals}
              onClick={(event) => {
                event.stopPropagation();
                onViewDeals?.(contact);
              }}
            >
              View Deals
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export function ContactGridPlaceholder() {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
            <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="h-3 w-full bg-muted animate-pulse rounded" />
          <div className="h-3 w-5/6 bg-muted animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
  );
}
