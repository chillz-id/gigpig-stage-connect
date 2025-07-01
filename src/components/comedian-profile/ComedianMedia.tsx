
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Image as ImageIcon, Play, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface ComedianMediaProps {
  comedianId: string;
}

const ComedianMedia: React.FC<ComedianMediaProps> = ({ comedianId }) => {
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);
  const [hoveredPhoto, setHoveredPhoto] = useState<string | null>(null);
  const [downloadHovered, setDownloadHovered] = useState(false);

  // Mock media data
  const mediaContent = {
    videos: [
      {
        id: '1',
        title: '5-Minute Set at Comedy Central',
        thumbnail: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=400&h=300&fit=crop',
        duration: '5:23',
        views: '12.5K',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' // Demo video
      },
      {
        id: '2',
        title: 'Best of Stand-up Compilation',
        thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=300&fit=crop',
        duration: '8:45',
        views: '25.1K',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' // Demo video
      }
    ],
    photos: [
      {
        id: '1',
        url: 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=600&h=600&fit=crop&crop=face',
        title: 'Professional Headshot'
      },
      {
        id: '2',
        url: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=600&h=600&fit=crop',
        title: 'On Stage Performance'
      },
      {
        id: '3',
        url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&h=600&fit=crop',
        title: 'Behind the Scenes'
      },
      {
        id: '4',
        url: 'https://images.unsplash.com/photo-1500673922987-e212871fec22?w=600&h=600&fit=crop',
        title: 'Event Photography'
      }
    ]
  };

  const VideoDialog = ({ video }: { video: any }) => (
    <Dialog>
      <DialogTrigger asChild>
        <div className="group relative bg-slate-700/50 rounded-xl overflow-hidden border border-slate-600/50 hover:border-purple-500/50 transition-all duration-200 cursor-pointer">
          <div className="relative">
            <img 
              src={video.thumbnail} 
              alt={video.title}
              className="w-full h-48 object-cover"
            />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-200" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Button className="bg-white/20 hover:bg-white/30 border-2 border-white/50 backdrop-blur-sm rounded-full w-16 h-16">
                <Play className="w-6 h-6 text-white" />
              </Button>
            </div>
            <div className="absolute bottom-2 right-2">
              <span className="bg-black/80 text-white px-2 py-1 rounded text-sm font-medium">
                {video.duration}
              </span>
            </div>
          </div>
          <div className="p-4">
            <h3 className="text-white font-semibold mb-1">{video.title}</h3>
            <p className="text-gray-400 text-sm">{video.views} views</p>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <div className="aspect-video">
          <iframe
            src={video.videoUrl}
            className="w-full h-full"
            allowFullScreen
            title={video.title}
          />
        </div>
      </DialogContent>
    </Dialog>
  );

  const PhotoDialog = ({ photo }: { photo: any }) => (
    <Dialog>
      <DialogTrigger asChild>
        <div 
          className="group relative aspect-square rounded-xl overflow-hidden border border-slate-600/50 hover:border-purple-500/50 transition-all duration-200 cursor-pointer"
          onMouseEnter={() => setHoveredPhoto(photo.id)}
          onMouseLeave={() => setHoveredPhoto(null)}
        >
          <img 
            src={photo.url} 
            alt={photo.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200" />
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${hoveredPhoto === photo.id ? 'opacity-100' : 'opacity-0'}`}>
            <Button className="bg-white/20 hover:bg-white/30 border-2 border-white/50 backdrop-blur-sm">
              View Full
            </Button>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <img 
          src={photo.url} 
          alt={photo.title}
          className="w-full h-auto max-h-[80vh] object-contain"
        />
      </DialogContent>
    </Dialog>
  );

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2 text-white text-2xl">
          <Video className="w-6 h-6 text-purple-400" />
          Media Portfolio
        </CardTitle>
        
        {/* Download Icon with Animated Text */}
        <div 
          className="absolute top-4 right-4 flex items-center cursor-pointer group"
          onMouseEnter={() => setDownloadHovered(true)}
          onMouseLeave={() => setDownloadHovered(false)}
        >
          <div className={`overflow-hidden transition-all duration-300 ${downloadHovered ? 'w-24 mr-2' : 'w-0'}`}>
            <span className={`text-white text-sm whitespace-nowrap transition-transform duration-300 ${downloadHovered ? 'translate-x-0' : 'translate-x-full'}`}>
              Hi-Res Photos
            </span>
          </div>
          <Download className="w-5 h-5 text-gray-400 hover:text-white transition-colors duration-200" />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="videos" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-slate-700/50 border border-slate-600">
            <TabsTrigger value="videos" className="flex items-center gap-2 text-white data-[state=active]:bg-purple-600">
              <Video className="w-4 h-4" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex items-center gap-2 text-white data-[state=active]:bg-purple-600">
              <ImageIcon className="w-4 h-4" />
              Photos
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="videos" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mediaContent.videos.map((video) => (
                <VideoDialog key={video.id} video={video} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="photos" className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              {mediaContent.photos.map((photo) => (
                <PhotoDialog key={photo.id} photo={photo} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ComedianMedia;
