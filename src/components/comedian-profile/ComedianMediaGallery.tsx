import React from 'react';
import { MediaGallery, MediaItem } from '@/components/ui/MediaGallery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera } from 'lucide-react';

interface ComedianMediaGalleryProps {
  comedianId: string;
  media?: MediaItem[];
  showCaptions?: boolean;
}

export const ComedianMediaGallery: React.FC<ComedianMediaGalleryProps> = ({
  comedianId,
  media = [],
  showCaptions = true
}) => {
  // Mock data for demonstration - replace with actual data from database
  const mockMedia: MediaItem[] = [
    {
      id: '1',
      src: `https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=800`,
      alt: 'Live performance at Comedy Club',
      caption: 'Opening night at The Comedy Store'
    },
    {
      id: '2',
      src: `https://images.unsplash.com/photo-1584704784651-8b04d7cc1429?w=800`,
      alt: 'Stand-up comedy show',
      caption: 'Headlining at Melbourne Comedy Festival'
    },
    {
      id: '3',
      src: `https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800`,
      alt: 'Audience interaction',
      caption: 'Crowd work at Sydney Opera House'
    },
    {
      id: '4',
      src: `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800`,
      alt: 'Festival performance',
      caption: 'Edinburgh Fringe Festival 2023'
    },
    {
      id: '5',
      src: `https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800`,
      alt: 'Comedy workshop',
      caption: 'Teaching at Comedy Workshop'
    },
    {
      id: '6',
      src: `https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800`,
      alt: 'TV appearance',
      caption: 'Guest spot on Late Night TV'
    }
  ];

  const galleryItems = media.length > 0 ? media : mockMedia;

  if (galleryItems.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Camera className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No media available yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Gallery</CardTitle>
      </CardHeader>
      <CardContent>
        <MediaGallery
          items={galleryItems}
          columns={3}
          gap="md"
          showCaptions={showCaptions}
          enableLightbox
          aspectRatio={1}
          imageClassName="rounded-lg"
        />
      </CardContent>
    </Card>
  );
};