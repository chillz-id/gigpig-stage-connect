import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Plus, 
  Image as ImageIcon, 
  Video, 
  Trash2,
  ExternalLink,
  Star
} from 'lucide-react';
import { PortfolioItem } from '@/types/photographer';
import { useAuth } from '@/contexts/AuthContext';
import { useDeletePortfolioItem } from '@/hooks/usePhotographers';
import { useToast } from '@/hooks/use-toast';

interface PhotographerPortfolioProps {
  portfolio: PortfolioItem[];
  photographerId: string;
}

const PhotographerPortfolio: React.FC<PhotographerPortfolioProps> = ({
  portfolio,
  photographerId
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const deletePortfolioItem = useDeletePortfolioItem();

  const isOwnProfile = user?.id === photographerId;

  const handleDelete = async (item: PortfolioItem) => {
    if (window.confirm('Are you sure you want to delete this portfolio item?')) {
      deletePortfolioItem.mutate({
        id: item.id,
        photographerId: item.photographer_id
      });
    }
  };

  const handleAddItem = () => {
    toast({
      title: 'Coming soon',
      description: 'Portfolio upload will be available soon',
    });
  };

  const featuredItems = portfolio.filter(item => item.is_featured);
  const regularItems = portfolio.filter(item => !item.is_featured);

  if (portfolio.length === 0 && !isOwnProfile) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No portfolio items yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Item Button */}
      {isOwnProfile && (
        <div className="flex justify-end">
          <Button onClick={handleAddItem}>
            <Plus className="w-4 h-4 mr-2" />
            Add Portfolio Item
          </Button>
        </div>
      )}

      {/* Featured Items */}
      {featuredItems.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Featured Work
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featuredItems.map(item => (
              <PortfolioCard
                key={item.id}
                item={item}
                onView={() => setSelectedItem(item)}
                onDelete={isOwnProfile ? () => handleDelete(item) : undefined}
                featured
              />
            ))}
          </div>
        </div>
      )}

      {/* Regular Items */}
      {regularItems.length > 0 && (
        <div>
          {featuredItems.length > 0 && (
            <h3 className="text-lg font-semibold mb-4">All Work</h3>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {regularItems.map(item => (
              <PortfolioCard
                key={item.id}
                item={item}
                onView={() => setSelectedItem(item)}
                onDelete={isOwnProfile ? () => handleDelete(item) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State for Own Profile */}
      {portfolio.length === 0 && isOwnProfile && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No portfolio items yet</p>
              <Button onClick={handleAddItem}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Item
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedItem.title}</DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                {selectedItem.media_type === 'image' ? (
                  <img
                    src={selectedItem.media_url}
                    alt={selectedItem.title}
                    className="w-full rounded-lg"
                  />
                ) : (
                  <video
                    src={selectedItem.media_url}
                    controls
                    className="w-full rounded-lg"
                  />
                )}
                {selectedItem.description && (
                  <p className="mt-4 text-gray-700">{selectedItem.description}</p>
                )}
                {selectedItem.event_type && (
                  <Badge className="mt-4" variant="secondary">
                    {selectedItem.event_type}
                  </Badge>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface PortfolioCardProps {
  item: PortfolioItem;
  onView: () => void;
  onDelete?: () => void;
  featured?: boolean;
}

const PortfolioCard: React.FC<PortfolioCardProps> = ({
  item,
  onView,
  onDelete,
  featured
}) => {
  return (
    <Card 
      className={`group cursor-pointer overflow-hidden ${
        featured ? 'h-80' : 'h-48'
      }`}
      onClick={onView}
    >
      <div className="relative h-full">
        {/* Thumbnail */}
        {item.media_type === 'image' ? (
          <img
            src={item.thumbnail_url || item.media_url}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="relative h-full bg-gray-100 flex items-center justify-center">
            <img
              src={item.thumbnail_url || '/placeholder-video.jpg'}
              alt={item.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/50 rounded-full p-3">
                <Video className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <p className="font-medium truncate">{item.title}</p>
            {item.event_type && (
              <p className="text-sm opacity-80">{item.event_type}</p>
            )}
          </div>

          {/* Actions */}
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                onView();
              }}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
            {onDelete && (
              <Button
                size="sm"
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Media Type Badge */}
        <Badge 
          className="absolute top-2 left-2"
          variant={item.media_type === 'video' ? 'destructive' : 'default'}
        >
          {item.media_type === 'video' ? (
            <Video className="w-3 h-3 mr-1" />
          ) : (
            <ImageIcon className="w-3 h-3 mr-1" />
          )}
          {item.media_type}
        </Badge>
      </div>
    </Card>
  );
};

export default PhotographerPortfolio;