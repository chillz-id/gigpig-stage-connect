
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Music, Image as ImageIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ComedianMediaProps {
  comedianId: string;
}

const ComedianMedia: React.FC<ComedianMediaProps> = ({ comedianId }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-5 h-5" />
          Media Showcase
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="videos" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="audio" className="flex items-center gap-2">
              <Music className="w-4 h-4" />
              Audio
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Photos
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="videos" className="space-y-4">
            <div className="text-center text-muted-foreground py-8">
              <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Video content coming soon...</p>
            </div>
          </TabsContent>
          
          <TabsContent value="audio" className="space-y-4">
            <div className="text-center text-muted-foreground py-8">
              <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Audio clips coming soon...</p>
            </div>
          </TabsContent>
          
          <TabsContent value="photos" className="space-y-4">
            <div className="text-center text-muted-foreground py-8">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Photo gallery coming soon...</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ComedianMedia;
