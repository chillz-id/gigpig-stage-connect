import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LayoutList, LayoutGrid } from 'lucide-react';
import { LinkSection } from '@/hooks/useCustomLinks';

interface LinkSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (sectionData: { title: string; layout: 'stacked' | 'grid'; display_order: number }) => void;
  section?: LinkSection | null; // If editing existing section
  nextDisplayOrder: number; // Next available display order for new sections
}

export const LinkSectionDialog: React.FC<LinkSectionDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  section,
  nextDisplayOrder,
}) => {
  const [title, setTitle] = useState('');
  const [layout, setLayout] = useState<'stacked' | 'grid'>('stacked');

  // Reset form when dialog opens/closes or section changes
  useEffect(() => {
    if (open) {
      if (section) {
        setTitle(section.title);
        setLayout(section.layout);
      } else {
        setTitle('');
        setLayout('stacked');
      }
    }
  }, [open, section]);

  const handleSave = () => {
    if (!title.trim()) {
      return;
    }

    onSave({
      title: title.trim(),
      layout,
      display_order: section?.display_order ?? nextDisplayOrder,
    });

    // Reset form
    setTitle('');
    setLayout('stacked');
    onOpenChange(false);
  };

  const handleCancel = () => {
    setTitle('');
    setLayout('stacked');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">
            {section ? 'Edit Section' : 'Add New Section'}
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Organize your links into sections with customizable layouts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Section Title */}
          <div className="space-y-2">
            <Label htmlFor="section-title" className="text-white font-medium">
              Section Heading
            </Label>
            <Input
              id="section-title"
              placeholder="e.g., Social Media, Shows & Tickets"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
            />
          </div>

          {/* Layout Toggle */}
          <div className="space-y-3">
            <Label className="text-white font-medium">
              Layout Style
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {/* Stacked Layout Option */}
              <button
                type="button"
                onClick={() => setLayout('stacked')}
                className={`
                  group relative p-4 rounded-lg border-2 transition-all
                  ${layout === 'stacked'
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-white/20 bg-white/5 hover:border-white/40'
                  }
                `}
              >
                <div className="flex flex-col items-center gap-2">
                  <LayoutList className={`w-8 h-8 ${layout === 'stacked' ? 'text-purple-400' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium ${layout === 'stacked' ? 'text-white' : 'text-gray-300'}`}>
                    Stacked
                  </span>
                  <span className="text-xs text-gray-400 text-center">
                    Vertical list with thumbnails
                  </span>
                </div>
                {layout === 'stacked' && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-purple-500 rounded-full" />
                )}
              </button>

              {/* Grid Layout Option */}
              <button
                type="button"
                onClick={() => setLayout('grid')}
                className={`
                  group relative p-4 rounded-lg border-2 transition-all
                  ${layout === 'grid'
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-white/20 bg-white/5 hover:border-white/40'
                  }
                `}
              >
                <div className="flex flex-col items-center gap-2">
                  <LayoutGrid className={`w-8 h-8 ${layout === 'grid' ? 'text-purple-400' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium ${layout === 'grid' ? 'text-white' : 'text-gray-300'}`}>
                    Grid
                  </span>
                  <span className="text-xs text-gray-400 text-center">
                    2-column cards
                  </span>
                </div>
                {layout === 'grid' && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-purple-500 rounded-full" />
                )}
              </button>
            </div>

            {/* Layout Preview Description */}
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-gray-300">
                {layout === 'stacked' ? (
                  <>
                    <strong className="text-white">Stacked Layout:</strong> Full-width cards displayed vertically, similar to Linktree.
                    Best for social media links and important actions.
                  </>
                ) : (
                  <>
                    <strong className="text-white">Grid Layout:</strong> 2-column card grid with large thumbnails.
                    Best for showcasing multiple events or products.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            className="bg-white/5 border-white/20 text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!title.trim()}
            className="professional-button"
          >
            {section ? 'Update Section' : 'Add Section'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
