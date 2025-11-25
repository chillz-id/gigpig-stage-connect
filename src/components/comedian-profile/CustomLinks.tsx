import React, { useMemo, useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useCustomLinks, CustomLink } from '@/hooks/useCustomLinks';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CustomLinksProps {
  userId: string;
  isOwnProfile?: boolean;
  compact?: boolean; // Minimal styling for dedicated links page
  className?: string;
}

export const CustomLinks: React.FC<CustomLinksProps> = ({
  userId,
  isOwnProfile = false,
  compact = false,
  className,
}) => {
  const { links, isLoading, error } = useCustomLinks({
    userId,
    includeHidden: isOwnProfile,
  });

  // Group links by section
  const { sectionedLinks, unsectionedLinks } = useMemo(() => {
    const visibleLinks = links.filter(link => isOwnProfile || link.is_visible);

    const sectioned = new Map<string, { section: any; links: CustomLink[] }>();
    const unsectioned: CustomLink[] = [];

    visibleLinks.forEach(link => {
      if (link.section_id && link.section) {
        const existing = sectioned.get(link.section_id);
        if (existing) {
          existing.links.push(link);
        } else {
          sectioned.set(link.section_id, {
            section: link.section,
            links: [link],
          });
        }
      } else {
        unsectioned.push(link);
      }
    });

    // Sort sections by display_order
    const sortedSectioned = Array.from(sectioned.values()).sort(
      (a, b) => a.section.display_order - b.section.display_order
    );

    return {
      sectionedLinks: sortedSectioned,
      unsectionedLinks: unsectioned,
    };
  }, [links, isOwnProfile]);

  // Get thumbnail URL with priority: custom > auto > fallback
  const getThumbnailUrl = (link: CustomLink): string | null => {
    return link.custom_thumbnail_url || link.thumbnail_url || null;
  };

  // Get icon component from Lucide by name (legacy support)
  const getIcon = (iconType: string | null) => {
    if (!iconType) return null;

    // Check if it's an emoji (single character or emoji sequence)
    if (iconType.length <= 4 && !/^[a-zA-Z]+$/.test(iconType)) {
      return <span className="text-xl">{iconType}</span>;
    }

    // Try to get Lucide icon
    const IconComponent = (Icons as any)[iconType];
    if (IconComponent) {
      return <IconComponent className="w-5 h-5" />;
    }

    // Fallback to ExternalLink icon
    return <ExternalLink className="w-5 h-5" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-400">
        <p>Failed to load custom links</p>
      </div>
    );
  }

  if (links.length === 0) {
    if (isOwnProfile) {
      return (
        <div className="text-center py-12 text-gray-400">
          <ExternalLink className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg mb-2">No custom links yet</p>
          <p className="text-sm">Add custom links to share your favorite content</p>
        </div>
      );
    }
    return null; // Don't show anything on public profile if no links
  }

  // Render stacked layout (Linktree-style horizontal cards)
  const renderStackedLink = (link: CustomLink) => (
    <StackedLinkCard key={link.id} link={link} isOwnProfile={isOwnProfile} getIcon={getIcon} getThumbnailUrl={getThumbnailUrl} />
  );

  // Render grid layout (ShowCard-style vertical cards)
  const renderGridLink = (link: CustomLink) => (
    <GridLinkCard key={link.id} link={link} isOwnProfile={isOwnProfile} getIcon={getIcon} getThumbnailUrl={getThumbnailUrl} />
  );

  // Render a section with its links
  const renderSection = (section: any, links: CustomLink[]) => {
    const isStacked = section.layout === 'stacked';

    return (
      <div key={section.id} className="space-y-3">
        {/* Section heading */}
        <h3 className="text-lg font-semibold text-white px-1">{section.title}</h3>

        {/* Links in section */}
        {isStacked ? (
          <div className="space-y-3">
            {links.map(renderStackedLink)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {links.map(renderGridLink)}
          </div>
        )}
      </div>
    );
  };

  // Compact mode (for dedicated links page) - always stacked
  if (compact) {
    return (
      <div className={cn('space-y-6 w-full', className)}>
        {/* Sectioned links */}
        {sectionedLinks.map(({ section, links }) => renderSection(section, links))}

        {/* Unsectioned links */}
        {unsectionedLinks.length > 0 && (
          <div className="space-y-3">
            {unsectionedLinks.map(renderStackedLink)}
          </div>
        )}
      </div>
    );
  }

  // Full card mode (for EPK profile tab)
  return (
    <Card className={cn('bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700', className)}>
      <CardContent className="p-6 space-y-6">
        {/* Sectioned links */}
        {sectionedLinks.map(({ section, links }) => renderSection(section, links))}

        {/* Unsectioned links */}
        {unsectionedLinks.length > 0 && (
          <div className="space-y-3">
            {sectionedLinks.length > 0 && (
              <h3 className="text-lg font-semibold text-white px-1">Other Links</h3>
            )}
            <div className="space-y-3">
              {unsectionedLinks.map(renderStackedLink)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Stacked link card component
const StackedLinkCard: React.FC<{
  link: CustomLink;
  isOwnProfile: boolean;
  getIcon: (iconType: string | null) => React.ReactNode;
  getThumbnailUrl: (link: CustomLink) => string | null;
}> = ({ link, isOwnProfile, getIcon, getThumbnailUrl }) => {
  const thumbnailUrl = getThumbnailUrl(link);
  const [imageError, setImageError] = useState(false);

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative overflow-hidden rounded-xl border-2 border-slate-600
                 hover:border-purple-500 hover:scale-[1.02] transition-all duration-200
                 bg-gradient-to-br from-slate-800 to-slate-900 shadow-md hover:shadow-lg"
    >
      <div className="relative flex items-center gap-4 px-6 py-4">
        {/* Thumbnail or Icon */}
        <div className="flex-shrink-0">
          {thumbnailUrl && !imageError ? (
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/10 border border-white/10">
              <img
                src={thumbnailUrl}
                alt={link.title}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10">
              {getIcon(link.icon_type)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-grow text-left min-w-0">
          <div className="font-semibold text-white truncate">{link.title}</div>
          {link.description && (
            <div className="text-sm text-white/70 truncate">{link.description}</div>
          )}
        </div>

        {/* External link indicator */}
        <div className="flex-shrink-0 text-white/40 group-hover:text-white/60 transition-colors">
          <ExternalLink className="w-4 h-4" />
        </div>

        {/* Hidden badge */}
        {!link.is_visible && isOwnProfile && (
          <div className="absolute top-2 right-2">
            <span className="text-xs bg-yellow-500/20 text-yellow-200 px-2 py-1 rounded border border-yellow-500/30">
              Hidden
            </span>
          </div>
        )}
      </div>
    </a>
  );
};

// Grid link card component
const GridLinkCard: React.FC<{
  link: CustomLink;
  isOwnProfile: boolean;
  getIcon: (iconType: string | null) => React.ReactNode;
  getThumbnailUrl: (link: CustomLink) => string | null;
}> = ({ link, isOwnProfile, getIcon, getThumbnailUrl }) => {
  const thumbnailUrl = getThumbnailUrl(link);
  const [imageError, setImageError] = useState(false);

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group overflow-hidden rounded-xl border-2 border-slate-600
                 hover:border-purple-500 hover:scale-[1.02] hover:shadow-lg
                 transition-all duration-200 bg-gradient-to-br from-slate-800 to-slate-900
                 shadow-md relative"
    >
      {/* Thumbnail */}
      <div className="aspect-[2/1] overflow-hidden relative">
        {thumbnailUrl && !imageError ? (
          <img
            src={thumbnailUrl}
            alt={link.title}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-500/30 via-pink-500/20 to-purple-600/30 flex items-center justify-center">
            <div className="text-white/60 scale-150">
              {getIcon(link.icon_type)}
            </div>
          </div>
        )}

        {/* Title overlay */}
        <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
          <h3 className="font-semibold text-white text-sm truncate">{link.title}</h3>
          {link.description && (
            <p className="text-xs text-white/80 truncate mt-0.5">{link.description}</p>
          )}
        </div>

        {/* Hidden badge */}
        {!link.is_visible && isOwnProfile && (
          <div className="absolute top-2 right-2">
            <span className="text-xs bg-yellow-500/20 text-yellow-200 px-2 py-1 rounded border border-yellow-500/30">
              Hidden
            </span>
          </div>
        )}
      </div>
    </a>
  );
};
