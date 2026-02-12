import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Calendar, Eye, EyeOff, GripVertical } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAnalyticsTracking } from '@/hooks/useAnalyticsTracking';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import OrganizationHeader from './OrganizationHeader';
import OrganizationBio from './OrganizationBio';
import OrganizationMedia from './OrganizationMedia';
import OrganizationUpcomingEvents from './OrganizationUpcomingEvents';
import OrganizationHighlights from './OrganizationHighlights';
import OrganizationContact from './OrganizationContact';
import { CustomLinks } from '@/components/comedian-profile/CustomLinks';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useProfileSectionOrder } from '@/hooks/useProfileSectionOrder';

// Sortable wrapper component for EPK sections
const SortableEPKSection: React.FC<{
  sectionId: string;
  children: React.ReactNode;
  isDraggable: boolean;
}> = ({ sectionId, children, isDraggable }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sectionId, disabled: !isDraggable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {isDraggable && (
        <button
          {...attributes}
          {...listeners}
          className="absolute -left-8 top-4 cursor-grab active:cursor-grabbing text-gray-400 hover:text-white p-1 z-10"
          aria-label={`Drag to reorder ${sectionId} section`}
        >
          <GripVertical className="w-5 h-5" />
        </button>
      )}
      {children}
    </div>
  );
};

interface OrganizationProfileLayoutProps {
  organization: any;
}

const OrganizationProfileLayout: React.FC<OrganizationProfileLayoutProps> = ({ organization }) => {
  const { user, hasRole } = useAuth();
  const { isOwner, isAdmin, isMember } = useOrganization();
  const [searchParams, setSearchParams] = useSearchParams();

  // Check if this is the user's organization (owner, admin, or member)
  const isOwnProfile = isOwner || isAdmin || isMember;

  // Preview mode state - allows profile owner to see public view
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Section ordering hook - only fetch if this is the user's own profile
  const { sections, isLoading: sectionsLoading, updateAllSections } = useProfileSectionOrder(
    'organization',
    organization.id,
    isOwnProfile
  );

  // Setup drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts (prevents accidental drags)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Tab deep linking - read ?tab= parameter from URL
  const tabParam = searchParams.get('tab');
  const validTabsForOwner = ['profile', 'links', 'analytics'];
  const validTabsForPublic = ['profile', 'links'];
  const validTabs = isOwnProfile && !isPreviewMode ? validTabsForOwner : validTabsForPublic;
  const initialTab = tabParam && validTabs.includes(tabParam) ? tabParam : 'profile';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  // Track analytics for profile views
  const { trackInteraction } = useAnalyticsTracking({
    profileId: organization.id,
    trackView: !isOwnProfile, // Don't track own profile views
    trackEngagement: !isOwnProfile,
  });

  const handleShare = async () => {
    trackInteraction('share');
    const url = window.location.href;
    const title = `${organization.organization_name} - Organization Profile`;
    const text = `Check out ${organization.organization_name} on Stand Up Sydney`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (error) {
        // Fallback to copying URL
        navigator.clipboard.writeText(url);
        toast({
          title: "Link Copied",
          description: "Profile link has been copied to clipboard",
        });
      }
    } else {
      navigator.clipboard.writeText(url);
      toast({
        title: "Link Copied",
        description: "Profile link has been copied to clipboard",
      });
    }
  };

  const handleContact = () => {
    // Track the interaction - modal is handled inside OrganizationHeader
    trackInteraction('contact_view');
    trackInteraction('booking_request', { method: 'modal' });
  };

  // Handle drag end event for section reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s.section_id === active.id);
    const newIndex = sections.findIndex((s) => s.section_id === over.id);

    if (oldIndex !== newIndex) {
      const newSections = arrayMove(sections, oldIndex, newIndex);

      // Update display_order for all sections
      const updatedSections = newSections.map((section, index) => ({
        ...section,
        display_order: index,
      }));

      // Persist to database
      updateAllSections(updatedSections);
    }
  };

  // Map section IDs to their corresponding components
  const renderSection = (sectionId: string, isDraggable: boolean = false) => {
    switch (sectionId) {
      case 'bio':
        return (
          <SortableEPKSection key="bio" sectionId="bio" isDraggable={isDraggable}>
            <OrganizationBio organization={organization} />
          </SortableEPKSection>
        );
      case 'contact':
        return (
          <SortableEPKSection key="contact" sectionId="contact" isDraggable={isDraggable}>
            <OrganizationContact
              organization={organization}
              trackInteraction={isDraggable ? undefined : trackInteraction}
            />
          </SortableEPKSection>
        );
      case 'media':
        return (
          <SortableEPKSection key="media" sectionId="media" isDraggable={isDraggable}>
            <OrganizationMedia
              organizationId={organization.id}
              isOwnProfile={isDraggable ? isOwnProfile : false}
              trackInteraction={trackInteraction}
              mediaLayout={organization.media_layout || 'grid'}
            />
          </SortableEPKSection>
        );
      case 'events':
        return (
          <SortableEPKSection key="events" sectionId="events" isDraggable={isDraggable}>
            <OrganizationUpcomingEvents organizationId={organization.id} />
          </SortableEPKSection>
        );
      case 'highlights':
        return (
          <SortableEPKSection key="highlights" sectionId="highlights" isDraggable={isDraggable}>
            <OrganizationHighlights
              organizationId={organization.id}
              isOwnProfile={isDraggable ? (isOwnProfile && !isPreviewMode) : false}
            />
          </SortableEPKSection>
        );
      default:
        return null;
    }
  };

  const getBackgroundStyles = () => {
    return 'bg-[#131b2b]';
  };

  return (
    <div className={cn("min-h-screen", getBackgroundStyles())}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8 relative">
          {/* Action Buttons positioned absolutely */}
          {hasRole('admin') && (
            <div className="absolute top-0 left-0 z-10 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          )}

          {/* Preview Mode Toggle Button - Only visible to profile owner */}
          {isOwnProfile && (
            <div className="flex justify-end mb-4">
              <Button
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className="professional-button"
                size="sm"
              >
                {isPreviewMode ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Exit Public View
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    View as Public
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Header Section */}
          <OrganizationHeader
            organization={organization}
            isOwnProfile={isOwnProfile && !isPreviewMode}
            onShare={handleShare}
            onContact={handleContact}
          />

          {/* Show tabs for own profile to include analytics (unless in preview mode) */}
          {isOwnProfile && !isPreviewMode ? (
            <Tabs defaultValue={initialTab} onValueChange={handleTabChange} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="links">Links</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-8">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={sections.map((s) => s.section_id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-8 pl-8">
                      {sections.map((section) => renderSection(section.section_id, true))}
                    </div>
                  </SortableContext>
                </DndContext>
              </TabsContent>

              <TabsContent value="links" className="space-y-8">
                <CustomLinks
                  userId={organization.id}
                  isOwnProfile={true}
                />
              </TabsContent>

              <TabsContent value="analytics">
                <AnalyticsDashboard profileId={organization.id} />
              </TabsContent>
            </Tabs>
          ) : (
            <Tabs defaultValue={initialTab} onValueChange={handleTabChange} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="links">Links</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-8">
                {sections.map((section) => renderSection(section.section_id, false))}
              </TabsContent>

              <TabsContent value="links" className="space-y-8">
                <CustomLinks
                  userId={organization.id}
                  isOwnProfile={false}
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganizationProfileLayout;
