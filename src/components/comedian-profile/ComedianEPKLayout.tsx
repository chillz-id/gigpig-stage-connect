
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, GripVertical, Monitor, Tablet, Smartphone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAnalyticsTracking } from '@/hooks/useAnalyticsTracking';
import { useProfileAnalytics } from '@/hooks/useProfileAnalytics';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { useComedianProfile } from './ComedianProfileLayout';
import ComedianHeader from './ComedianHeader';
import ComedianSocialLinks from './ComedianSocialLinks';
import ComedianBio from './ComedianBio';
import ComedianMedia from './ComedianMedia';
import ComedianUpcomingShows from './ComedianUpcomingShows';
import ComedianAccomplishments from './ComedianAccomplishments';
import ComedianContact from './ComedianContact';
import { CustomLinks } from './CustomLinks';
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
import { useEPKSectionOrder } from '@/hooks/useEPKSectionOrder';

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

const ComedianEPKLayout: React.FC = () => {
  // Get comedian data from context (provided by ComedianProfileLayout parent)
  const comedian = useComedianProfile();
  const { user, hasRole } = useAuth();
  const { theme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  // Check if this is the user's own profile
  const isOwnProfile = user?.id === comedian.id;

  // Preview mode state - allows profile owner to see public view
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Device preview type - desktop/tablet/mobile simulation
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Get device preview container styles
  const getDevicePreviewStyles = () => {
    if (!isPreviewMode) return {};
    switch (previewDevice) {
      case 'mobile':
        return { maxWidth: '375px', margin: '0 auto' };
      case 'tablet':
        return { maxWidth: '768px', margin: '0 auto' };
      default:
        return {};
    }
  };

  // Section ordering hook - only fetch if this is the user's own profile
  const { sections, isLoading: sectionsLoading, updateAllSections } = useEPKSectionOrder(
    isOwnProfile ? comedian.id : ''
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
  const validTabsForOwner = ['epk', 'links', 'analytics'];
  const validTabsForPublic = ['epk', 'links'];
  const validTabs = isOwnProfile && !isPreviewMode ? validTabsForOwner : validTabsForPublic;
  const initialTab = tabParam && validTabs.includes(tabParam)
    ? tabParam
    : 'epk';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  // Track analytics for profile views
  const { trackInteraction } = useAnalyticsTracking({
    profileId: comedian.id,
    trackView: !isOwnProfile, // Don't track own profile views
    trackEngagement: !isOwnProfile,
  });

  const handleShare = async () => {
    trackInteraction('share');
    const url = window.location.href;
    const title = `${comedian.name} - Comedian Profile`;
    const text = `Check out ${comedian.name}'s comedy profile on Stand Up Sydney`;

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
    // Track the interaction - modal is handled inside ComedianHeader
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
            <ComedianBio comedian={comedian} />
          </SortableEPKSection>
        );
      case 'contact':
        return (
          <SortableEPKSection key="contact" sectionId="contact" isDraggable={isDraggable}>
            <ComedianContact
              comedian={comedian}
              trackInteraction={isDraggable ? undefined : trackInteraction}
            />
          </SortableEPKSection>
        );
      case 'media':
        return (
          <SortableEPKSection key="media" sectionId="media" isDraggable={isDraggable}>
            <ComedianMedia
              comedianId={comedian.id}
              isOwnProfile={isDraggable ? isOwnProfile : false}
              trackInteraction={trackInteraction}
              mediaLayout={comedian.media_layout || 'slider'}
            />
          </SortableEPKSection>
        );
      case 'shows':
        return (
          <SortableEPKSection key="shows" sectionId="shows" isDraggable={isDraggable}>
            <ComedianUpcomingShows
              comedianId={comedian.id}
              isOwnProfile={isDraggable ? (isOwnProfile && !isPreviewMode) : false}
            />
          </SortableEPKSection>
        );
      case 'accomplishments':
        return (
          <SortableEPKSection key="accomplishments" sectionId="accomplishments" isDraggable={isDraggable}>
            <ComedianAccomplishments
              comedianId={comedian.id}
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
          {/* Preview Mode Controls - Only visible to profile owner */}
          {isOwnProfile && (
            <div className="flex items-center justify-end gap-3 mb-4">
              {/* Device Preview Toggle - Only show when in preview mode */}
              {isPreviewMode && (
                <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1">
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={cn(
                      "p-2 rounded-md transition-colors",
                      previewDevice === 'desktop'
                        ? "bg-purple-600 text-white"
                        : "text-gray-400 hover:text-white hover:bg-slate-700"
                    )}
                    title="Desktop preview"
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('tablet')}
                    className={cn(
                      "p-2 rounded-md transition-colors",
                      previewDevice === 'tablet'
                        ? "bg-purple-600 text-white"
                        : "text-gray-400 hover:text-white hover:bg-slate-700"
                    )}
                    title="Tablet preview (768px)"
                  >
                    <Tablet className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={cn(
                      "p-2 rounded-md transition-colors",
                      previewDevice === 'mobile'
                        ? "bg-purple-600 text-white"
                        : "text-gray-400 hover:text-white hover:bg-slate-700"
                    )}
                    title="Mobile preview (375px)"
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>
              )}

              <Button
                onClick={() => {
                  setIsPreviewMode(!isPreviewMode);
                  if (isPreviewMode) setPreviewDevice('desktop'); // Reset on exit
                }}
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

          {/* Show tabs for own profile to include analytics (unless in preview mode) */}
          {isOwnProfile && !isPreviewMode ? (
            <>
              {/* Header Section */}
              <ComedianHeader
                comedian={comedian}
                isOwnProfile={true}
                onShare={handleShare}
                onContact={handleContact}
              />

              {/* Social Links - Centered Linktree style */}
              <div className="flex justify-center py-4">
                <ComedianSocialLinks
                  instagram_url={comedian.instagram_url}
                  youtube_url={comedian.youtube_url}
                  twitter_url={comedian.twitter_url}
                  facebook_url={comedian.facebook_url}
                  tiktok_url={comedian.tiktok_url}
                  website_url={comedian.website_url}
                  className="flex items-center gap-5"
                />
              </div>

            <Tabs value={initialTab} onValueChange={handleTabChange} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="epk">EPK</TabsTrigger>
                <TabsTrigger value="links">Links</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="epk" className="space-y-8">
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
                  userId={comedian.id}
                  isOwnProfile={true}
                />
              </TabsContent>

              <TabsContent value="analytics">
                <AnalyticsDashboard profileId={comedian.id} />
              </TabsContent>
            </Tabs>
            </>
          ) : (
            /* Public view / Preview mode - may have device simulation */
            <div
              style={getDevicePreviewStyles()}
              className={cn(
                "transition-all duration-300",
                isPreviewMode && previewDevice !== 'desktop' && "bg-slate-950 rounded-lg shadow-2xl border border-slate-700 p-2"
              )}
            >
              {/* Header Section - inside device preview container */}
              <ComedianHeader
                comedian={comedian}
                isOwnProfile={false}
                onShare={handleShare}
                onContact={handleContact}
              />

              {/* Social Links - Centered Linktree style */}
              <div className="flex justify-center py-4">
                <ComedianSocialLinks
                  instagram_url={comedian.instagram_url}
                  youtube_url={comedian.youtube_url}
                  twitter_url={comedian.twitter_url}
                  facebook_url={comedian.facebook_url}
                  tiktok_url={comedian.tiktok_url}
                  website_url={comedian.website_url}
                  className="flex items-center gap-5"
                />
              </div>

              <Tabs value={initialTab} onValueChange={handleTabChange} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="epk">Profile</TabsTrigger>
                  <TabsTrigger value="links">Links</TabsTrigger>
                </TabsList>

                <TabsContent value="epk" className="space-y-8">
                  {sections.map((section) => renderSection(section.section_id, false))}
                </TabsContent>

                <TabsContent value="links" className="space-y-8">
                  <CustomLinks
                    userId={comedian.id}
                    isOwnProfile={false}
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComedianEPKLayout;
