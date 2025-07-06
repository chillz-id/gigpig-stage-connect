
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin, Clock, Plus, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useComedianGigs } from '@/hooks/useComedianGigs';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface ComedianUpcomingShowsProps {
  comedianId: string;
}

const ComedianUpcomingShows: React.FC<ComedianUpcomingShowsProps> = ({ comedianId }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState('All');
  const { gigs, isLoading, getUpcomingGigs, getGigsByStatus } = useComedianGigs(comedianId);
  
  const isOwnProfile = user?.id === comedianId;
  const upcomingGigs = getUpcomingGigs();
  
  // Transform gigs to match the expected format
  const upcomingShows = upcomingGigs.map(gig => ({
    id: gig.id,
    title: gig.title,
    venue: gig.venue,
    location: gig.event?.city ? `${gig.event.city}, ${gig.event.state}` : 'Location TBA',
    date: gig.event_date.split('T')[0],
    time: gig.event?.start_time || '19:00',
    type: gig.event_spot?.spot_name || 'Performance',
    status: gig.status,
    banner_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=225&fit=crop',
    payment: gig.event_spot?.is_paid ? gig.event_spot.payment_amount : null,
    duration: gig.event_spot?.duration_minutes,
    calendar_sync_status: gig.calendar_sync_status
  }));

  // Get unique show types and status filters
  const availableTypes = useMemo(() => {
    const types = [...new Set(upcomingShows.map(show => show.type))];
    return ['All', 'Confirmed', 'Pending', ...types];
  }, [upcomingShows]);

  // Filter shows based on active filter
  const filteredShows = useMemo(() => {
    if (activeFilter === 'All') return upcomingShows;
    if (activeFilter === 'Confirmed') return upcomingShows.filter(show => show.status === 'confirmed');
    if (activeFilter === 'Pending') return upcomingShows.filter(show => show.status === 'pending');
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

  const handleShowClick = (show: any) => {
    // Navigate to event details page if it's a real event
    if (show.id.startsWith('spot-')) {
      const eventId = upcomingGigs.find(g => g.id === show.id)?.event_id;
      if (eventId) {
        navigate(`/events/${eventId}`);
      }
    } else {
      navigate(`/events/${show.id}`);
    }
  };

  const handleGetTickets = (e: React.MouseEvent, show: any) => {
    e.stopPropagation();
    // For confirmed spots, navigate to event page
    if (show.id.startsWith('spot-')) {
      const gig = upcomingGigs.find(g => g.id === show.id);
      if (gig?.event_id) {
        navigate(`/events/${gig.event_id}`);
      }
    }
  };

  const handleAddGig = () => {
    // Navigate to add gig page or open modal
    navigate('/dashboard/gigs/add');
  };

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white text-2xl">
            <Calendar className="w-6 h-6 text-purple-400" />
            Upcoming Shows
          </CardTitle>
          {isOwnProfile && (
            <Button
              onClick={handleAddGig}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Show
            </Button>
          )}
        </div>
        
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
              onClick={() => handleShowClick(show)}
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
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-white line-clamp-2">
                        {show.title}
                      </h3>
                      <Badge 
                        variant={show.status === 'confirmed' ? 'default' : 'secondary'}
                        className={show.status === 'confirmed' ? 'bg-green-600' : 'bg-yellow-600'}
                      >
                        {show.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-gray-300 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-purple-400" />
                        <span>{show.venue}, {show.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-purple-400" />
                        <span>{formatDate(show.date)} | {formatTime(show.time)}</span>
                      </div>
                      {show.payment && (
                        <div className="text-green-400 text-sm font-medium">
                          ${show.payment} • {show.duration}min
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        {show.type && (
                          <Badge variant="outline" className="text-xs">
                            {show.type}
                          </Badge>
                        )}
                        {/* Calendar Sync Status */}
                        {show.calendar_sync_status && isOwnProfile && (
                          <div className="flex items-center gap-1">
                            {show.calendar_sync_status === 'synced' && (
                              <CheckCircle className="w-3 h-3 text-green-400" title="Synced to calendar" />
                            )}
                            {show.calendar_sync_status === 'pending' && (
                              <RefreshCw className="w-3 h-3 text-yellow-400 animate-spin" title="Syncing to calendar" />
                            )}
                            {show.calendar_sync_status === 'failed' && (
                              <AlertCircle className="w-3 h-3 text-red-400" title="Sync failed" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <div className="flex justify-center mt-4">
                    <Button 
                      onClick={(e) => handleGetTickets(e, show)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2"
                      size="sm"
                    >
                      View Event
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="text-center text-gray-400 py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50 animate-spin" />
              <p className="text-lg">Loading shows...</p>
            </div>
          )}
          
          {!isLoading && filteredShows.length === 0 && (
            <div className="text-center text-gray-400 py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No upcoming shows in this category</p>
              {isOwnProfile ? (
                <>
                  <p className="text-sm mb-4">Start building your comedy career by adding your first show</p>
                  <Button onClick={handleAddGig} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Show
                  </Button>
                </>
              ) : (
                <p className="text-sm">Check back later for new events</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ComedianUpcomingShows;
