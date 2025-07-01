
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Music, Image as ImageIcon, Play, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

interface ComedianMediaProps {
  comedianId: string;
}

const ComedianMedia: React.FC<ComedianMediaProps> = ({ comedianId }) => {
  // Mock media data
  const mediaContent = {
    videos: [
      {
        id: '1',
        title: '5-Minute Set at Comedy Central',
        thumbnail: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=400&h=300&fit=crop',
        duration: '5:23',
        views: '12.5K'
      },
      {
        id: '2',
        title: 'Best of Stand-up Compilation',
        thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=300&fit=crop',
        duration: '8:45',
        views: '25.1K'
      }
    ],
    audio: [
      {
        id: '1',
        title: 'Podcast Guest Appearance',
        duration: '12:30',
        plays: '5.2K'
      },
      {
        id: '2',
        title: 'Radio Interview Highlights',
        duration: '6:15',
        plays: '3.8K'
      }
    ],
    photos: [
      {
        id: '1',
        url: 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=400&h=400&fit=crop&crop=face',
        title: 'Professional Headshot'
      },
      {
        id: '2',
        url: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=400&h=400&fit=crop',
        title: 'On Stage Performance'
      },
      {
        id: '3',
        url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=400&fit=crop',
        title: 'Behind the Scenes'
      },
      {
        id: '4',
        url: 'https://images.unsplash.com/photo-1500673922987-e212871fec22?w=400&h=400&fit=crop',
        title: 'Event Photography'
      }
    ]
  };

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white text-2xl">
          <Video className="w-6 h-6 text-purple-400" />
          Media Portfolio
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="videos" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-slate-700/50 border border-slate-600">
            <TabsTrigger value="videos" className="flex items-center gap-2 text-white data-[state=active]:bg-purple-600">
              <Video className="w-4 h-4" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="audio" className="flex items-center gap-2 text-white data-[state=active]:bg-purple-600">
              <Music className="w-4 h-4" />
              Audio
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex items-center gap-2 text-white data-[state=active]:bg-purple-600">
              <ImageIcon className="w-4 h-4" />
              Photos
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="videos" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mediaContent.videos.map((video) => (
                <div key={video.id} className="group relative bg-slate-700/50 rounded-xl overflow-hidden border border-slate-600/50 hover:border-purple-500/50 transition-all duration-200">
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
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="audio" className="space-y-4">
            <div className="space-y-4">
              {mediaContent.audio.map((audio) => (
                <div key={audio.id} className="bg-slate-700/50 rounded-xl p-6 border border-slate-600/50 hover:border-purple-500/50 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Button className="bg-purple-600 hover:bg-purple-700 rounded-full w-12 h-12">
                        <Play className="w-5 h-5 text-white" />
                      </Button>
                      <div>
                        <h3 className="text-white font-semibold">{audio.title}</h3>
                        <p className="text-gray-400 text-sm">{audio.duration} • {audio.plays} plays</p>
                      </div>
                    </div>
                    <Button variant="ghost" className="text-gray-400 hover:text-white">
                      <Download className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="photos" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {mediaContent.photos.map((photo) => (
                <div key={photo.id} className="group relative aspect-square rounded-xl overflow-hidden border border-slate-600/50 hover:border-purple-500/50 transition-all duration-200">
                  <img 
                    src={photo.url} 
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button className="bg-white/20 hover:bg-white/30 border-2 border-white/50 backdrop-blur-sm">
                      View Full
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ComedianMedia;
