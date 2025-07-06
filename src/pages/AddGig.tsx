import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, ArrowLeft, Plus } from 'lucide-react';
import { useComedianGigs } from '@/hooks/useComedianGigs';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const AddGig = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { theme } = useTheme();
  const { addGig, isAddingGig } = useComedianGigs();

  const [formData, setFormData] = useState({
    title: '',
    venue: '',
    event_date: '',
    event_time: '19:00',
    status: 'confirmed' as 'confirmed' | 'pending'
  });

  // Redirect if not a comedian
  if (!user || !hasRole('comedian')) {
    navigate('/profile');
    return null;
  }

  const getBackgroundStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900';
    }
    return 'bg-gradient-to-br from-gray-800 via-gray-900 to-red-900';
  };

  const getCardStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-white/10 backdrop-blur-sm border-white/20';
    }
    return 'bg-gray-800/90 border-gray-600';
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.venue.trim() || !formData.event_date) {
      return;
    }

    try {
      // Combine date and time
      const eventDateTime = new Date(`${formData.event_date}T${formData.event_time}:00`).toISOString();

      await addGig({
        title: formData.title.trim(),
        venue: formData.venue.trim(),
        event_date: eventDateTime,
        status: formData.status
      });

      // Navigate back to profile
      navigate('/profile?tab=calendar');
    } catch (error) {
      console.error('Failed to add gig:', error);
    }
  };

  const isFormValid = formData.title.trim() && formData.venue.trim() && formData.event_date;

  return (
    <div className={cn("min-h-screen", getBackgroundStyles())}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-white">Add New Show</h1>
          </div>

          {/* Form */}
          <Card className={cn(getCardStyles(), "text-white")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-6 h-6 text-purple-400" />
                Show Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Show Title */}
                <div>
                  <Label htmlFor="title" className="text-white">Show Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Comedy Night at The Laugh Track"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                    required
                  />
                </div>

                {/* Venue */}
                <div>
                  <Label htmlFor="venue" className="text-white">Venue *</Label>
                  <Input
                    id="venue"
                    value={formData.venue}
                    onChange={(e) => handleInputChange('venue', e.target.value)}
                    placeholder="e.g., The Comedy Store Sydney"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                    required
                  />
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="event_date" className="text-white">Date *</Label>
                    <Input
                      id="event_date"
                      type="date"
                      value={formData.event_date}
                      onChange={(e) => handleInputChange('event_date', e.target.value)}
                      className="bg-white/10 border-white/20 text-white"
                      min={format(new Date(), 'yyyy-MM-dd')}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="event_time" className="text-white">Time</Label>
                    <Input
                      id="event_time"
                      type="time"
                      value={formData.event_time}
                      onChange={(e) => handleInputChange('event_time', e.target.value)}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <Label htmlFor="status" className="text-white">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value: 'confirmed' | 'pending') => handleInputChange('status', value)}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="pending">Pending Confirmation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!isFormValid || isAddingGig}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    {isAddingGig ? 'Adding...' : 'Add Show'}
                  </Button>
                </div>

                {/* Help Text */}
                <div className="text-sm text-gray-300 bg-white/5 p-4 rounded-lg">
                  <p className="font-medium mb-2">Tips for adding shows:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Include the venue name and location for clarity</li>
                    <li>• Use descriptive titles like "Open Mic Night" or "Comedy Showcase"</li>
                    <li>• Mark as "Pending" if the booking isn't fully confirmed yet</li>
                    <li>• You can always edit or remove shows later from your profile</li>
                  </ul>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AddGig;