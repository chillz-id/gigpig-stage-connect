import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { AccomplishmentDialog } from './AccomplishmentDialog';

interface Accomplishment {
  id: string;
  accomplishment: string;
  display_order: number;
}

interface CareerHighlightsProps {
  accomplishments: Accomplishment[];
  isOwnProfile?: boolean;
  onAdd?: (accomplishment: string) => void;
  onEdit?: (id: string, accomplishment: string) => void;
  onDelete?: (id: string) => void;
}

const CareerHighlights: React.FC<CareerHighlightsProps> = ({
  accomplishments,
  isOwnProfile = false,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Accomplishment | null>(null);

  const handleAddClick = () => {
    setEditingItem(null);
    setDialogOpen(true);
  };

  const handleEditClick = (item: Accomplishment) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleSave = (accomplishment: string) => {
    if (editingItem && onEdit) {
      onEdit(editingItem.id, accomplishment);
    } else if (onAdd) {
      onAdd(accomplishment);
    }
    setDialogOpen(false);
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this accomplishment?')) {
      onDelete?.(id);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">Career Highlights</h3>
        {isOwnProfile && onAdd && (
          <Button
            size="sm"
            onClick={handleAddClick}
            className="professional-button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        )}
      </div>

      {accomplishments.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          {isOwnProfile
            ? 'No accomplishments yet. Click "Add" to add your first one!'
            : 'No accomplishments listed yet.'}
        </div>
      ) : (
        <div className="space-y-3">
          {accomplishments.map((item) => (
            <div key={item.id} className="flex items-start gap-3 group">
              <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-gray-300 flex-1">{item.accomplishment}</p>

              {isOwnProfile && (onEdit || onDelete) && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onEdit && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditClick(item)}
                      className="h-7 px-2"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(item.id)}
                      className="h-7 px-2 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <AccomplishmentDialog
        isOpen={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        currentAccomplishment={editingItem?.accomplishment}
        mode={editingItem ? 'edit' : 'add'}
      />
    </div>
  );
};

export default CareerHighlights;
