
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, DollarSign, Users, MapPin, Star, Plus, X } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const CreateEvent = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    venue: '',
    address: '',
    city: '',
    state: '',
    country: 'Australia',
    date: '',
    time: '',
    endTime: '',
    type: '',
    spots: 5,
    duration: '5',
    pay: 'Free',
    description: '',
    requirements: [] as string[],
    isVerifiedOnly: false,
    isPaid: false,
    allowRecording: false,
    ageRestriction: '18+',
    dresscode: 'Casual',
  });

  const [newRequirement, setNewRequirement] = useState('');

  if (!user || !user.roles.includes('promoter')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-purple-100 mb-4">You need promoter access to create events.</p>
            <Button onClick={() => navigate('/pricing')} className="bg-gradient-to-r from-pink-500 to-purple-500">
              Upgrade to Premium
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.venue || !formData.date || !formData.time) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const eventData = {
      id: Date.now().toString(),
      ...formData,
      promoterId: user.id,
      promoterName: user.name,
      appliedSpots: 0,
      status: 'open' as const,
      createdAt: new Date().toISOString(),
    };

    console.log('Creating event:', eventData);
    
    toast({
      title: "Event created successfully!",
      description: `"${formData.title}" has been created and is now live.`,
    });

    navigate('/dashboard');
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()]
      }));
      setNewRequirement('');
    }
  };

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create New Event</h1>
          <p className="text-purple-100">Set up your comedy show and start receiving applications</p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
          {/* Basic Information */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Wednesday Night Comedy"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="venue">Venue Name *</Label>
                  <Input
                    id="venue"
                    value={formData.venue}
                    onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
                    placeholder="The Comedy Club"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Sydney"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Select onValueChange={(value) => setFormData(prev => ({ ...prev, state: value }))}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NSW">New South Wales</SelectItem>
                      <SelectItem value="VIC">Victoria</SelectItem>
                      <SelectItem value="QLD">Queensland</SelectItem>
                      <SelectItem value="WA">Western Australia</SelectItem>
                      <SelectItem value="SA">South Australia</SelectItem>
                      <SelectItem value="TAS">Tasmania</SelectItem>
                      <SelectItem value="NT">Northern Territory</SelectItem>
                      <SelectItem value="ACT">Australian Capital Territory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Select value={formData.country} onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Australia">Australia</SelectItem>
                      <SelectItem value="USA">United States</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                      <SelectItem value="Ireland">Ireland</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="address">Full Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Comedy Street, Sydney NSW 2000"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                />
              </div>
            </CardContent>
          </Card>

          {/* Date & Time */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Date & Time
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="time">Start Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Details */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Event Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="type">Show Type *</Label>
                  <Select onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open Mic">Open Mic</SelectItem>
                      <SelectItem value="Semi-Pro">Semi-Pro</SelectItem>
                      <SelectItem value="Pro">Professional</SelectItem>
                      <SelectItem value="Mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="spots">Available Spots *</Label>
                  <Input
                    id="spots"
                    type="number"
                    min="1"
                    max="50"
                    value={formData.spots}
                    onChange={(e) => setFormData(prev => ({ ...prev, spots: parseInt(e.target.value) || 1 }))}
                    className="bg-white/10 border-white/20 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Set Duration (minutes)</Label>
                  <Select value={formData.duration} onValueChange={(value) => setFormData(prev => ({ ...prev, duration: value }))}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 minutes</SelectItem>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="7">7 minutes</SelectItem>
                      <SelectItem value="10">10 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="20">20 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="pay">Payment</Label>
                  <Input
                    id="pay"
                    value={formData.pay}
                    onChange={(e) => setFormData(prev => ({ ...prev, pay: e.target.value }))}
                    placeholder="$50 or Free"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Event Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your comedy event, atmosphere, and what comedians can expect..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-300 min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Requirements & Settings */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <CardTitle>Requirements & Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="newRequirement">Add Requirements</Label>
                <div className="flex gap-2">
                  <Input
                    id="newRequirement"
                    value={newRequirement}
                    onChange={(e) => setNewRequirement(e.target.value)}
                    placeholder="e.g., Clean material only"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                  />
                  <Button type="button" onClick={addRequirement} className="bg-purple-500 hover:bg-purple-600">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formData.requirements.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.requirements.map((req, index) => (
                      <Badge key={index} variant="outline" className="text-white border-white/30">
                        {req}
                        <X 
                          className="w-3 h-3 ml-1 cursor-pointer" 
                          onClick={() => removeRequirement(index)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isVerifiedOnly">Verified Comedians Only</Label>
                    <Switch
                      id="isVerifiedOnly"
                      checked={formData.isVerifiedOnly}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isVerifiedOnly: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isPaid">Paid Event</Label>
                    <Switch
                      id="isPaid"
                      checked={formData.isPaid}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPaid: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="allowRecording">Allow Recording</Label>
                    <Switch
                      id="allowRecording"
                      checked={formData.allowRecording}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowRecording: checked }))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ageRestriction">Age Restriction</Label>
                    <Select value={formData.ageRestriction} onValueChange={(value) => setFormData(prev => ({ ...prev, ageRestriction: value }))}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All ages">All ages</SelectItem>
                        <SelectItem value="18+">18+</SelectItem>
                        <SelectItem value="21+">21+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="dresscode">Dress Code</Label>
                    <Select value={formData.dresscode} onValueChange={(value) => setFormData(prev => ({ ...prev, dresscode: value }))}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Casual">Casual</SelectItem>
                        <SelectItem value="Smart casual">Smart Casual</SelectItem>
                        <SelectItem value="Formal">Formal</SelectItem>
                        <SelectItem value="No specific dress code">No Specific Dress Code</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4 justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
              className="text-white border-white/30 hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            >
              Create Event
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;
