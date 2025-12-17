import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  UniqueIdentifier,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomLinks, CustomLink } from '@/hooks/useCustomLinks';
import { useLinkSections, LinkSection } from '@/hooks/useLinkSections';
import { useOGFetch } from '@/hooks/useOGFetch';
import type { TableAwareProps } from '@/types/universalProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus, GripVertical, Trash2, Edit, Save, X, RefreshCw,
  Eye, EyeOff, LayoutList, LayoutGrid, ChevronDown, ChevronRight
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { LinkThumbnailUpload } from './LinkThumbnailUpload';
import { LinkSectionDialog } from './LinkSectionDialog';

// Debounce utility
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Droppable unsectioned area wrapper
const DroppableUnsectionedArea: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'unsectioned-area',
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "border-2 border-dashed border-slate-700 rounded-lg p-4 transition-colors",
        isOver && "border-purple-500 bg-purple-500/10"
      )}
    >
      {children}
    </div>
  );
};

// Sortable Link Item Component
const SortableLinkItem: React.FC<{
  link: CustomLink;
  onEdit: (link: CustomLink) => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string, visible: boolean) => void;
}> = ({ link, onEdit, onDelete, onToggleVisibility }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const thumbnailUrl = link.custom_thumbnail_url || link.thumbnail_url;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-3 p-3 rounded-lg border-2 border-slate-600",
        "bg-gradient-to-br from-slate-800 to-slate-900",
        "hover:border-purple-500 transition-colors",
        isDragging && "shadow-xl ring-2 ring-purple-500"
      )}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-white p-1"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      {/* Thumbnail */}
      {thumbnailUrl && (
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/10 border border-white/10 flex-shrink-0">
          <img src={thumbnailUrl} alt={link.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Link Info */}
      <div className="flex-grow min-w-0">
        <div className="font-semibold text-white truncate">{link.title}</div>
        {link.description && (
          <div className="text-xs text-white/60 truncate">{link.description}</div>
        )}
        <div className="text-xs text-white/40 truncate">{link.url}</div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onToggleVisibility(link.id, !link.is_visible)}
        >
          {link.is_visible ? (
            <Eye className="w-4 h-4 text-green-400" />
          ) : (
            <EyeOff className="w-4 h-4 text-gray-400" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(link)}
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-400 hover:text-red-300"
          onClick={() => onDelete(link.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

// Sortable Section Component
const SortableSection: React.FC<{
  section: LinkSection;
  links: CustomLink[];
  onEdit: () => void;
  onDelete: () => void;
  onEditLink: (link: CustomLink) => void;
  onDeleteLink: (id: string) => void;
  onToggleLinkVisibility: (id: string, visible: boolean) => void;
}> = ({ section, links, onEdit, onDelete, onEditLink, onDeleteLink, onToggleLinkVisibility }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "border-2 border-slate-700 rounded-lg bg-gradient-to-br from-slate-800/50 to-slate-900/50",
        isDragging && "shadow-xl ring-2 ring-purple-500"
      )}
    >
      {/* Section Header */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-700">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-white p-1"
        >
          <GripVertical className="w-5 h-5" />
        </button>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-white hover:text-purple-400 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>

        {section.layout === 'stacked' ? (
          <LayoutList className="w-5 h-5 text-purple-400" />
        ) : (
          <LayoutGrid className="w-5 h-5 text-purple-400" />
        )}

        <h3 className="flex-grow font-semibold text-white">{section.title}</h3>

        <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded">
          {links.length} {links.length === 1 ? 'link' : 'links'}
        </span>

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-400 hover:text-red-300"
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Section Content */}
      {!isCollapsed && (
        <div className="p-4">
          {links.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm border-2 border-dashed border-slate-600 rounded-lg">
              Drag links here or create new ones
            </div>
          ) : (
            <SortableContext items={links.map(l => l.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {links.map(link => (
                  <SortableLinkItem
                    key={link.id}
                    link={link}
                    onEdit={onEditLink}
                    onDelete={onDeleteLink}
                    onToggleVisibility={onToggleLinkVisibility}
                  />
                ))}
              </div>
            </SortableContext>
          )}
        </div>
      )}
    </div>
  );
};

export const CustomLinksManager: React.FC<TableAwareProps> = ({
  tableName,
  userId,
  organizationId
}) => {
  const { user } = useAuth();
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<CustomLink | null>(null);
  const [editingSection, setEditingSection] = useState<LinkSection | null>(null);

  // Determine which ID to use (userId prop, organizationId prop, or current user)
  const profileId = userId || user?.id;
  const filterColumn = organizationId ? 'organization_id' : 'user_id';
  const filterId = organizationId || profileId;

  // NOTE: These hooks need to be updated to accept tableName and organizationId parameters
  // For now, they only support user-based queries with hardcoded table names
  const { links, addLink, updateLink, deleteLink } = useCustomLinks({
    userId: filterId || '',
    includeHidden: true,
    // TODO: Add tableName parameter when hooks are refactored
  });

  const { sections, addSection, updateSection, deleteSection } = useLinkSections({
    userId: filterId || '',
    // TODO: Add tableName parameter when hooks are refactored
  });

  const { fetchOGData, isLoading: isFetchingOG } = useOGFetch();

  const [linkForm, setLinkForm] = useState({
    title: '',
    url: '',
    description: '',
    section_id: null as string | null,
    thumbnail_url: null as string | null,        // Auto-fetched OG image
    custom_thumbnail_url: null as string | null, // User-uploaded override
    is_visible: true,
  });

  const debouncedUrl = useDebounce(linkForm.url, 500);

  // Auto-fetch OG data (title, description, and thumbnail)
  useEffect(() => {
    if (debouncedUrl && !linkForm.title && !editingLink) {
      fetchOGData(debouncedUrl).then((metadata) => {
        if (metadata) {
          setLinkForm(prev => ({
            ...prev,
            title: prev.title || metadata.title,
            description: prev.description || metadata.description || '',
            thumbnail_url: metadata.image || null,
          }));
        }
      });
    }
  }, [debouncedUrl, editingLink]);

  // Group links by section
  const groupedLinks: Record<string, CustomLink[]> = {};
  const unsectionedLinks: CustomLink[] = [];

  links.forEach(link => {
    if (link.section_id) {
      if (!groupedLinks[link.section_id]) {
        groupedLinks[link.section_id] = [];
      }
      groupedLinks[link.section_id].push(link);
    } else {
      unsectionedLinks.push(link);
    }
  });

  // Sort links within each group by display_order
  Object.keys(groupedLinks).forEach(sectionId => {
    groupedLinks[sectionId].sort((a, b) => a.display_order - b.display_order);
  });
  unsectionedLinks.sort((a, b) => a.display_order - b.display_order);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    // Check if we're dragging a section
    const isSection = sections.some(s => s.id === active.id);
    if (isSection) {
      const oldIndex = sections.findIndex(s => s.id === active.id);
      const newIndex = sections.findIndex(s => s.id === over.id);

      if (oldIndex !== newIndex) {
        const newSections = arrayMove(sections, oldIndex, newIndex);
        // Update display_order for all sections
        newSections.forEach((section, index) => {
          updateSection({ id: section.id, display_order: index });
        });
      }
      return;
    }

    // We're dragging a link
    const activeLink = links.find(l => l.id === active.id);
    if (!activeLink) return;

    // Determine target section
    const overLink = links.find(l => l.id === over.id);
    const overSection = sections.find(s => s.id === over.id);
    const isOverUnsectioned = over.id === 'unsectioned-area';

    let targetSectionId: string | null = null;
    if (isOverUnsectioned) {
      // Dropping into unsectioned area
      targetSectionId = null;
    } else if (overSection) {
      targetSectionId = overSection.id;
    } else if (overLink) {
      targetSectionId = overLink.section_id;
    }

    // Get all links in the target section
    const targetLinks = links.filter(l => l.section_id === targetSectionId);
    const oldIndex = targetLinks.findIndex(l => l.id === active.id);
    const newIndex = overLink ? targetLinks.findIndex(l => l.id === over.id) : targetLinks.length;

    // Update the link
    if (activeLink.section_id !== targetSectionId) {
      // Moving to different section
      updateLink({
        id: activeLink.id,
        section_id: targetSectionId,
        display_order: newIndex,
      });
    } else if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      // Reordering within same section
      const reorderedLinks = arrayMove(targetLinks, oldIndex, newIndex);
      reorderedLinks.forEach((link, index) => {
        updateLink({ id: link.id, display_order: index });
      });
    }
  };

  const handleAddLink = () => {
    if (!linkForm.title || !linkForm.url) return;

    addLink({
      title: linkForm.title,
      url: linkForm.url,
      description: linkForm.description || null,
      section_id: linkForm.section_id,
      thumbnail_url: linkForm.thumbnail_url,          // Auto-fetched OG image
      custom_thumbnail_url: linkForm.custom_thumbnail_url,
      is_visible: linkForm.is_visible,
      display_order: linkForm.section_id
        ? (groupedLinks[linkForm.section_id]?.length || 0)
        : unsectionedLinks.length,
    });

    setLinkForm({
      title: '',
      url: '',
      description: '',
      section_id: null,
      thumbnail_url: null,
      custom_thumbnail_url: null,
      is_visible: true,
    });
    setIsLinkDialogOpen(false);
  };

  const handleEditLink = (link: CustomLink) => {
    setEditingLink(link);
    setLinkForm({
      title: link.title,
      url: link.url,
      description: link.description || '',
      section_id: link.section_id,
      thumbnail_url: link.thumbnail_url,
      custom_thumbnail_url: link.custom_thumbnail_url,
      is_visible: link.is_visible,
    });
    setIsLinkDialogOpen(true);
  };

  const handleUpdateLink = () => {
    if (!editingLink || !linkForm.title || !linkForm.url) return;

    updateLink({
      id: editingLink.id,
      title: linkForm.title,
      url: linkForm.url,
      description: linkForm.description || null,
      section_id: linkForm.section_id,
      thumbnail_url: linkForm.thumbnail_url,          // Auto-fetched OG image
      custom_thumbnail_url: linkForm.custom_thumbnail_url,
      is_visible: linkForm.is_visible,
    });

    setEditingLink(null);
    setLinkForm({
      title: '',
      url: '',
      description: '',
      section_id: null,
      thumbnail_url: null,
      custom_thumbnail_url: null,
      is_visible: true,
    });
    setIsLinkDialogOpen(false);
  };

  const handleRefreshOG = async () => {
    if (!linkForm.url) return;
    const metadata = await fetchOGData(linkForm.url);
    if (metadata) {
      setLinkForm(prev => ({
        ...prev,
        title: metadata.title,
        description: metadata.description || '',
        thumbnail_url: metadata.image || null,
      }));
    }
  };

  const handleEditSection = (section: LinkSection) => {
    setEditingSection(section);
    setIsSectionDialogOpen(true);
  };

  const handleSaveSection = (sectionData: { title: string; layout: 'stacked' | 'grid'; display_order: number }) => {
    if (editingSection) {
      updateSection({ id: editingSection.id, ...sectionData });
      setEditingSection(null);
    } else {
      addSection(sectionData);
    }
    setIsSectionDialogOpen(false);
  };

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Custom Links</CardTitle>
            <p className="text-sm text-gray-300 mt-1">
              Organize your links with drag-and-drop sections
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setEditingLink(null);
                setLinkForm({
                  title: '',
                  url: '',
                  description: '',
                  section_id: null,
                  thumbnail_url: null,
                  custom_thumbnail_url: null,
                  is_visible: true,
                });
                setIsLinkDialogOpen(true);
              }}
              className="professional-button"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Link
            </Button>
            <Button
              onClick={() => {
                setEditingSection(null);
                setIsSectionDialogOpen(true);
              }}
              variant="secondary"
              className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Section
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-4">
            {/* Sections */}
            <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
              {sections.map(section => (
                <SortableSection
                  key={section.id}
                  section={section}
                  links={groupedLinks[section.id] || []}
                  onEdit={() => handleEditSection(section)}
                  onDelete={() => deleteSection(section.id)}
                  onEditLink={handleEditLink}
                  onDeleteLink={deleteLink}
                  onToggleLinkVisibility={(id, visible) => updateLink({ id, is_visible: visible })}
                />
              ))}
            </SortableContext>

            {/* Unsectioned Links - Always show as drop target */}
            <DroppableUnsectionedArea>
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                Unsectioned Links
                {unsectionedLinks.length > 0 && (
                  <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded">
                    {unsectionedLinks.length}
                  </span>
                )}
              </h3>
              {unsectionedLinks.length > 0 ? (
                <SortableContext items={unsectionedLinks.map(l => l.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {unsectionedLinks.map(link => (
                      <SortableLinkItem
                        key={link.id}
                        link={link}
                        onEdit={handleEditLink}
                        onDelete={deleteLink}
                        onToggleVisibility={(id, visible) => updateLink({ id, is_visible: visible })}
                      />
                    ))}
                  </div>
                </SortableContext>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">
                  Drag links here to remove them from sections
                </p>
              )}
            </DroppableUnsectionedArea>

            {sections.length === 0 && links.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <p className="text-lg mb-2">No links or sections yet</p>
                <p className="text-sm">Create sections to organize your links, or add links directly</p>
              </div>
            )}
          </div>
        </DndContext>
      </CardContent>

      {/* Link Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingLink ? 'Edit Link' : 'Add New Link'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="url" className="text-white">URL</Label>
              <div className="flex gap-2">
                <Input
                  id="url"
                  value={linkForm.url}
                  onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                  placeholder="https://example.com"
                  className="bg-white/5 border-white/20 text-white"
                />
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={handleRefreshOG}
                  disabled={isFetchingOG || !linkForm.url}
                >
                  <RefreshCw className={cn("w-4 h-4", isFetchingOG && "animate-spin")} />
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="title" className="text-white">Title</Label>
              <Input
                id="title"
                value={linkForm.title}
                onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })}
                className="bg-white/5 border-white/20 text-white"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-white">Description (optional)</Label>
              <Textarea
                id="description"
                value={linkForm.description}
                onChange={(e) => setLinkForm({ ...linkForm, description: e.target.value })}
                className="bg-white/5 border-white/20 text-white"
                rows={3}
              />
            </div>

            {/* Auto-fetched OG thumbnail preview */}
            {linkForm.thumbnail_url && !linkForm.custom_thumbnail_url && (
              <div className="space-y-2">
                <Label className="text-white">Auto-Fetched Thumbnail</Label>
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                    <img
                      src={linkForm.thumbnail_url}
                      alt="OG thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm text-white/70">Thumbnail fetched from page metadata</p>
                    <p className="text-xs text-white/50 truncate">{linkForm.thumbnail_url}</p>
                  </div>
                </div>
              </div>
            )}

            <LinkThumbnailUpload
              onThumbnailSelected={(url) => setLinkForm({ ...linkForm, custom_thumbnail_url: url })}
              currentThumbnailUrl={linkForm.custom_thumbnail_url}
              layout="grid"
            />

            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <Label className="text-white">Visible</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLinkForm({ ...linkForm, is_visible: !linkForm.is_visible })}
              >
                {linkForm.is_visible ? (
                  <Eye className="w-5 h-5 text-green-400" />
                ) : (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                )}
              </Button>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsLinkDialogOpen(false);
                  setEditingLink(null);
                }}
                className="bg-white/5 border-white/20 text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={editingLink ? handleUpdateLink : handleAddLink}
                disabled={!linkForm.title || !linkForm.url}
                className="professional-button"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingLink ? 'Update' : 'Add'} Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Section Dialog */}
      <LinkSectionDialog
        open={isSectionDialogOpen}
        onOpenChange={setIsSectionDialogOpen}
        onSave={handleSaveSection}
        section={editingSection}
        nextDisplayOrder={sections.length}
      />
    </Card>
  );
};
