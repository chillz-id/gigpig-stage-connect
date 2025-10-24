import { Link } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useOrganizationMedia } from '@/hooks/organization/useOrganizationMedia';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Image as ImageIcon, Video, Upload } from 'lucide-react';

export default function OrganizationMediaLibrary() {
  const { organization, orgId } = useOrganization();
  const { data: allMedia, isLoading: allLoading } = useOrganizationMedia();
  const { data: images, isLoading: imagesLoading } = useOrganizationMedia('image');
  const { data: videos, isLoading: videosLoading } = useOrganizationMedia('video');

  if (!organization) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Organization Not Found</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 py-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Media Library</h1>
          <p className="mt-1 text-gray-600">Manage {organization.organization_name}'s media files</p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Media
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({allMedia?.length || 0})</TabsTrigger>
          <TabsTrigger value="images">Images ({images?.length || 0})</TabsTrigger>
          <TabsTrigger value="videos">Videos ({videos?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {allLoading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : !allMedia || allMedia.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <ImageIcon className="mb-4 h-12 w-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-medium">No media files</h3>
                <p className="mb-4 text-sm text-gray-600">Upload images and videos to your library</p>
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Media
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
              {allMedia.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <div className="aspect-square bg-gray-100">
                    {item.file_type === 'image' ? (
                      <img src={item.file_url} alt={item.title || 'Media'} className="h-full w-full object-cover" />
                    ) : (
                      <video src={item.file_url} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <CardContent className="p-3">
                    <p className="text-sm font-medium line-clamp-1">{item.title || 'Untitled'}</p>
                    <p className="text-xs text-gray-600">{item.file_type}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="images" className="mt-6">
          {imagesLoading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : !images || images.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <ImageIcon className="mb-4 h-12 w-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-medium">No images</h3>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
              {images.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <div className="aspect-square bg-gray-100">
                    <img src={item.file_url} alt={item.title || 'Image'} className="h-full w-full object-cover" />
                  </div>
                  <CardContent className="p-3">
                    <p className="text-sm font-medium line-clamp-1">{item.title || 'Untitled'}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="videos" className="mt-6">
          {videosLoading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : !videos || videos.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Video className="mb-4 h-12 w-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-medium">No videos</h3>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
              {videos.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <div className="aspect-square bg-gray-100">
                    <video src={item.file_url} className="h-full w-full object-cover" controls />
                  </div>
                  <CardContent className="p-3">
                    <p className="text-sm font-medium line-clamp-1">{item.title || 'Untitled'}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
