
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, MapPin, User, Star, Check, X, MessageCircle, Search, Filter } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';

interface Application {
  id: string;
  comedianId: string;
  comedianName: string;
  comedianAvatar: string;
  comedianRating: number;
  comedianExperience: string;
  showId: string;
  showTitle: string;
  venue: string;
  date: string;
  time: string;
  appliedDate: string;
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  setLength?: string;
  portfolio?: string[];
  bio?: string;
}

const mockApplications: Application[] = [
  {
    id: '1',
    comedianId: '1',
    comedianName: 'Sarah Johnson',
    comedianAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face',
    comedianRating: 4.8,
    comedianExperience: '3 years',
    showId: '1',
    showTitle: 'Wednesday Comedy Night',
    venue: 'The Laugh Track',
    date: '2024-12-20',
    time: '19:30',
    appliedDate: '2024-12-18',
    status: 'pending',
    message: 'Hi! I\'d love to perform at your show. I have great crowd work skills and clean material.',
    setLength: '5 minutes',
    bio: 'Professional comedian with 3 years experience. Specializes in observational humor and crowd work.',
    portfolio: ['Comedy Central appearance', 'Won local comedy competition 2023']
  },
  {
    id: '2',
    comedianId: '2',
    comedianName: 'Mike Chen',
    comedianAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    comedianRating: 4.5,
    comedianExperience: '2 years',
    showId: '1',
    showTitle: 'Wednesday Comedy Night',
    venue: 'The Laugh Track',
    date: '2024-12-20',
    time: '19:30',
    appliedDate: '2024-12-17',
    status: 'accepted',
    message: 'Looking forward to a great show! I have solid 5-minute set ready.',
    setLength: '5 minutes',
    bio: 'Up-and-coming comedian focusing on tech humor and millennial experiences.',
    portfolio: ['Regular at Comedy Store', 'Featured in local comedy festival']
  },
  {
    id: '3',
    comedianId: '3',
    comedianName: 'Emma Wilson',
    comedianAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    comedianRating: 4.2,
    comedianExperience: '1 year',
    showId: '2',
    showTitle: 'Friday Headliner Showcase',
    venue: 'Comedy Central Club',
    date: '2024-12-22',
    time: '20:00',
    appliedDate: '2024-12-15',
    status: 'declined',
    message: 'Hi, I\'m relatively new but very passionate. Would love the opportunity!',
    setLength: '15 minutes',
    bio: 'New comedian with fresh perspective on dating and social media.',
    portfolio: ['Open mic regular', 'Comedy workshop graduate']
  }
];

const Applications = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const [applications, setApplications] = useState(mockApplications);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilter, setShowFilter] = useState('all');

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.comedianName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.showTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesShow = showFilter === 'all' || app.showId === showFilter;
    
    return matchesSearch && matchesStatus && matchesShow;
  });

  const handleApplicationAction = (applicationId: string, action: 'accept' | 'decline') => {
    setApplications(prev => prev.map(app => 
      app.id === applicationId 
        ? { ...app, status: action === 'accept' ? 'accepted' : 'declined' }
        : app
    ));

    const application = applications.find(app => app.id === applicationId);
    toast({
      title: `Application ${action}ed`,
      description: `${application?.comedianName}'s application has been ${action}ed.`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-500';
      case 'declined': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  const ApplicationCard = ({ application }: { application: Application }) => (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-start space-x-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={application.comedianAvatar} alt={application.comedianName} />
              <AvatarFallback>{application.comedianName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{application.comedianName}</CardTitle>
              <div className="flex items-center space-x-2 text-sm text-purple-200">
                <Star className="w-4 h-4 fill-current text-yellow-400" />
                <span>{application.comedianRating}</span>
                <span>•</span>
                <span>{application.comedianExperience} experience</span>
              </div>
              <CardDescription className="text-purple-100 mt-1">
                Applied for: {application.showTitle} • {application.venue}
              </CardDescription>
            </div>
          </div>
          <Badge className={getStatusColor(application.status)}>
            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>{application.date}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{application.time}</span>
          </div>
          <div className="flex items-center space-x-1">
            <MapPin className="w-4 h-4" />
            <span>{application.venue}</span>
          </div>
          <div className="flex items-center space-x-1">
            <User className="w-4 h-4" />
            <span>{application.setLength}</span>
          </div>
        </div>

        {application.bio && (
          <div>
            <p className="text-sm font-medium text-purple-200 mb-1">Bio:</p>
            <p className="text-sm text-purple-100">{application.bio}</p>
          </div>
        )}

        {application.message && (
          <div>
            <p className="text-sm font-medium text-purple-200 mb-1">Application Message:</p>
            <p className="text-sm text-purple-100 italic">"{application.message}"</p>
          </div>
        )}

        {application.portfolio && application.portfolio.length > 0 && (
          <div>
            <p className="text-sm font-medium text-purple-200 mb-1">Portfolio:</p>
            <div className="flex flex-wrap gap-2">
              {application.portfolio.map((item, index) => (
                <Badge key={index} variant="outline" className="text-white border-white/30 text-xs">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-purple-300">
          Applied on {application.appliedDate}
        </p>

        {application.status === 'pending' && (
          <div className="flex gap-2">
            <Button 
              onClick={() => handleApplicationAction(application.id, 'accept')}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Check className="w-4 h-4 mr-2" />
              Accept
            </Button>
            <Button 
              onClick={() => handleApplicationAction(application.id, 'decline')}
              variant="destructive"
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Decline
            </Button>
            <Button variant="outline" className="text-white border-white/30 hover:bg-white/10">
              <MessageCircle className="w-4 h-4" />
            </Button>
          </div>
        )}

        {application.status !== 'pending' && (
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 text-white border-white/30 hover:bg-white/10">
              View Profile
            </Button>
            <Button variant="outline" className="text-white border-white/30 hover:bg-white/10">
              <MessageCircle className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const stats = {
    total: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    accepted: applications.filter(app => app.status === 'accepted').length,
    declined: applications.filter(app => app.status === 'declined').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Applications</h1>
          <p className="text-purple-100">Manage comedian applications for your events</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-purple-200">Total Applications</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
              <div className="text-sm text-purple-200">Pending Review</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.accepted}</div>
              <div className="text-sm text-purple-200">Accepted</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{stats.declined}</div>
              <div className="text-sm text-purple-200">Declined</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search comedians or shows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48 bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
              <Select value={showFilter} onValueChange={setShowFilter}>
                <SelectTrigger className="w-full md:w-48 bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Filter by show" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Shows</SelectItem>
                  <SelectItem value="1">Wednesday Comedy Night</SelectItem>
                  <SelectItem value="2">Friday Headliner Showcase</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Applications List */}
        <div className="space-y-4">
          {filteredApplications.length === 0 ? (
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="p-8 text-center">
                <h3 className="text-xl font-semibold mb-2">No applications found</h3>
                <p className="text-purple-100">Try adjusting your search criteria</p>
              </CardContent>
            </Card>
          ) : (
            filteredApplications.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Applications;
