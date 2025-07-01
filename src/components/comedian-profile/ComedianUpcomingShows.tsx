
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin, Clock, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ComedianUpcomingShowsProps {
  comedianId: string;
}

const ComedianUpcomingShows: React.FC<ComedianUpcomingShowsProps> = ({ comedianId }) => {
  // Mock upcoming shows data
  const upcomingShows = [
    {
      id: '1',
      title: 'Sydney Comedy Festival - Late Night Show',
      venue: 'The Comedy Store',
      location: 'Sydney, NSW',
      date: '2024-01-15',
      time: '22:00',
      type: 'Solo Shows',
      status: 'confirmed',
      fee: '$500'
    },
    {
      id: '2',
      title: 'Melbourne International Comedy Festival',
      venue: 'Forum Theatre',
      location: 'Melbourne, VIC',
      date: '2024-01-22',
      time: '20:30',
      type: 'Showcases',
      status: 'confirmed',
      fee: '$750'
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
      fee: '$300'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white text-2xl">
          <Calendar className="w-6 h-6 text-purple-400" />
          Confirmed Upcoming Shows
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcomingShows.map((show) => (
            <div key={show.id} className="bg-slate-700/50 rounded-xl p-6 border border-slate-600/50 hover:border-purple-500/50 transition-colors duration-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-semibold text-white mb-1">{show.title}</h3>
                    <Badge className={getStatusColor(show.status)}>
                      Confirmed
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-300">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-purple-400" />
                      <span>{show.venue}, {show.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-400" />
                      <span>{new Date(show.date).toLocaleDateString()} at {show.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      <span className="text-green-300 font-semibold">{show.fee}</span>
                    </div>
                    <Badge variant="outline" className="w-fit text-purple-300 border-purple-500/50">
                      {show.type}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {upcomingShows.length === 0 && (
            <div className="text-center text-gray-400 py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No upcoming shows confirmed yet</p>
              <p className="text-sm">Contact for booking availability</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ComedianUpcomingShows;
