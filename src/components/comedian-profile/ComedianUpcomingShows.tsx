
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ComedianUpcomingShowsProps {
  comedianId: string;
}

const ComedianUpcomingShows: React.FC<ComedianUpcomingShowsProps> = ({ comedianId }) => {
  const [activeFilter, setActiveFilter] = useState('All');

  // Mock upcoming shows data
  const upcomingShows = [
    {
      id: '1',
      title: 'Sydney Comedy Festival - Late Night Show',
      venue: 'The Comedy Store',
      location: 'Sydney, NSW',
      date: '2024-01-15',
      time: '20:00',
      type: 'Solo Shows',
      status: 'confirmed',
      banner_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=225&fit=crop'
    },
    {
      id: '2',
      title: 'Melbourne International Comedy Festival',
      venue: 'Forum Theatre',
      location: 'Melbourne, VIC',
      date: '2024-01-22',
      time: '19:30',
      type: 'Showcases',
      status: 'confirmed',
      banner_url: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400&h=225&fit=crop'
    },
    {
      id: '3',
      title: 'Comedy Podcast Live Recording',
      venue: 'Podcast Studio Melbourne',
      location: 'Melbourne, VIC',
      date: '2024-01-28',
      time: '19:00',
      type: 'Live Podcast',
      status: 'confirmed',
      banner_url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&h=225&fit=crop'
    }
  ];

  // Get unique show types that exist in the data
  const availableTypes = useMemo(() => {
    const types = [...new Set(upcomingShows.map(show => show.type))];
    return ['All', ...types];
  }, [upcomingShows]);

  // Filter shows based on active filter
  const filteredShows = useMemo(() => {
    if (activeFilter === 'All') return upcomingShows;
    return upcomingShows.filter(show => show.type === activeFilter);
  }, [upcomingShows, activeFilter]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    return `${day}${getOrdinalSuffix(day)} ${month}`;
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}${ampm}`;
  };

  const getOrdinalSuffix = (day: number) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const handleShowClick = (showId: string) => {
    // Navigate to event details page
    console.log('Navigate to show details:', showId);
  };

  const handleGetTickets = (e: React.MouseEvent, showId: string) => {
    e.stopPropagation();
    console.log('Get tickets for show:', showId);
  };

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white text-2xl">
          <Calendar className="w-6 h-6 text-purple-400" />
          Upcoming Shows
        </CardTitle>
        
        {/* Filter Navigation */}
        <div className="flex flex-wrap gap-6 text-lg mt-4">
          {availableTypes.map((type, index) => (
            <React.Fragment key={type}>
              <button
                onClick={() => setActiveFilter(type)}
                className={`transition-colors duration-200 relative ${
                  activeFilter === type 
                    ? 'text-white font-semibold after:content-[""] after:absolute after:w-full after:h-0.5 after:bg-purple-400 after:bottom-0 after:left-0' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {type}
              </button>
              {index < availableTypes.length - 1 && (
                <span className="text-gray-500">|</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {filteredShows.map((show) => (
            <div 
              key={show.id} 
              className="bg-slate-700/50 rounded-xl border border-slate-600/50 hover:border-purple-500/50 transition-colors duration-200 cursor-pointer overflow-hidden"
              onClick={() => handleShowClick(show.id)}
            >
              <div className="flex">
                {/* Image - 50% width, 16:9 aspect ratio */}
                <div className="w-1/2 aspect-video">
                  <img 
                    src={show.banner_url} 
                    alt={show.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Content - 50% width */}
                <div className="w-1/2 p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                      {show.title}
                    </h3>
                    
                    <div className="space-y-2 text-gray-300 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-purple-400" />
                        <span>{show.venue}, {show.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-purple-400" />
                        <span>{formatDate(show.date)} | {formatTime(show.time)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Get Tickets Button */}
                  <div className="flex justify-center mt-4">
                    <Button 
                      onClick={(e) => handleGetTickets(e, show.id)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2"
                    >
                      Get Tickets
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {filteredShows.length === 0 && (
            <div className="text-center text-gray-400 py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No upcoming shows in this category</p>
              <p className="text-sm">Check back later for new events</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ComedianUpcomingShows;
