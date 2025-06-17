
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Star, MapPin, Calendar, Award, Video, Plus, X, Upload } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';

const Profile = () => {
  const { user, updateUser } = useUser();
  const { toast } = useToast();
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: 'Professional comedian with 3+ years of experience. Specializing in observational humor and crowd work.',
    location: 'Sydney, Australia',
    website: 'https://comedian.com',
    phoneNumber: '+61 123 456 789',
    experienceYears: '3',
    specialties: ['Observational', 'Crowd Work', 'Storytelling'],
    languages: ['English'],
    travelRadius: '50',
    minPayRate: '50',
    availableNights: ['Wednesday', 'Friday', 'Saturday'],
    socialLinks: {
      instagram: '@comedian',
      twitter: '@comedian',
      youtube: 'comedian-channel',
      tiktok: '@comedian'
    },
    preferences: {
      emailNotifications: true,
      smsNotifications: false,
      publicProfile: true,
      showContactInfo: false,
    }
  });

  const [videos] = useState([
    { id: '1', title: 'Opening Set at Comedy Club', url: 'https://youtube.com/watch?v=123', thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=200&fit=crop' },
    { id: '2', title: 'Crowd Work Compilation', url: 'https://youtube.com/watch?v=456', thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=200&fit=crop' },
  ]);

  const [achievements] = useState([
    { id: '1', title: 'Comedy Festival Winner 2023', description: 'Won first place at Sydney Comedy Festival', date: '2023-08-15' },
    { id: '2', title: 'Regular at The Comedy Store', description: 'Became a regular performer', date: '2023-05-20' },
    { id: '3', title: '100+ Shows Performed', description: 'Milestone achievement', date: '2023-12-01' },
  ]);

  const [newSpecialty, setNewSpecialty] = useState('');

  const handleSave = () => {
    if (user) {
      updateUser({
        name: profileData.name,
        email: profileData.email,
      });
    }
    
    toast({
      title: "Profile updated!",
      description: "Your profile has been saved successfully.",
    });
  };

  const addSpecialty = () => {
    if (newSpecialty.trim() && !profileData.specialties.includes(newSpecialty.trim())) {
      setProfileData(prev => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty.trim()]
      }));
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (specialty: string) => {
    setProfileData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialty)
    }));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Please sign in to view your profile</h1>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
          <p className="text-purple-100">Manage your comedian profile and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Summary */}
          <div className="lg:col-span-1">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="p-6 text-center">
                <div className="relative inline-block mb-4">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="text-purple-900 text-2xl font-bold">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <Button size="sm" className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 bg-purple-500 hover:bg-purple-600">
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>
                
                <h2 className="text-xl font-bold">{user.name}</h2>
                <div className="flex items-center justify-center space-x-1 mb-2">
                  {user.isVerified && <Star className="w-4 h-4 text-yellow-400 fill-current" />}
                  <Badge className="bg-gradient-to-r from-pink-500 to-purple-500">
                    {user.membership.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-center space-x-1 text-purple-200 mb-4">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{profileData.location}</span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-purple-200">Shows:</span>
                    <span className="font-medium">{user.stats.totalGigs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-200">Rating:</span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="font-medium">{user.stats.averageRating}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-200">Success Rate:</span>
                    <span className="font-medium">{user.stats.successRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-purple-300" />
                  <span className="text-sm">Last show: 2 days ago</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Award className="w-4 h-4 text-purple-300" />
                  <span className="text-sm">3 applications pending</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Star className="w-4 h-4 text-purple-300" />
                  <span className="text-sm">New review received</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-sm">
                <TabsTrigger value="basic" className="data-[state=active]:bg-purple-500">Basic Info</TabsTrigger>
                <TabsTrigger value="professional" className="data-[state=active]:bg-purple-500">Professional</TabsTrigger>
                <TabsTrigger value="media" className="data-[state=active]:bg-purple-500">Media</TabsTrigger>
                <TabsTrigger value="settings" className="data-[state=active]:bg-purple-500">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="mt-6">
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription className="text-purple-200">
                      Update your basic profile information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={profileData.name}
                          onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={profileData.bio}
                        onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                        className="bg-white/10 border-white/20 text-white min-h-[100px]"
                        placeholder="Tell us about yourself and your comedy style..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={profileData.location}
                          onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={profileData.phoneNumber}
                          onChange={(e) => setProfileData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={profileData.website}
                        onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="professional" className="mt-6">
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                  <CardHeader>
                    <CardTitle>Professional Information</CardTitle>
                    <CardDescription className="text-purple-200">
                      Showcase your comedy experience and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="experience">Years of Experience</Label>
                        <Select value={profileData.experienceYears} onValueChange={(value) => setProfileData(prev => ({ ...prev, experienceYears: value }))}>
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="<1">Less than 1 year</SelectItem>
                            <SelectItem value="1">1 year</SelectItem>
                            <SelectItem value="2">2 years</SelectItem>
                            <SelectItem value="3">3 years</SelectItem>
                            <SelectItem value="4">4 years</SelectItem>
                            <SelectItem value="5+">5+ years</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="minPay">Minimum Pay Rate ($)</Label>
                        <Input
                          id="minPay"
                          value={profileData.minPayRate}
                          onChange={(e) => setProfileData(prev => ({ ...prev, minPayRate: e.target.value }))}
                          className="bg-white/10 border-white/20 text-white"
                          placeholder="50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="travelRadius">Travel Radius (km)</Label>
                        <Input
                          id="travelRadius"
                          value={profileData.travelRadius}
                          onChange={(e) => setProfileData(prev => ({ ...prev, travelRadius: e.target.value }))}
                          className="bg-white/10 border-white/20 text-white"
                          placeholder="50"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Comedy Specialties</Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          value={newSpecialty}
                          onChange={(e) => setNewSpecialty(e.target.value)}
                          placeholder="Add a specialty..."
                          className="bg-white/10 border-white/20 text-white"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                        />
                        <Button type="button" onClick={addSpecialty} className="bg-purple-500 hover:bg-purple-600">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {profileData.specialties.map((specialty, index) => (
                          <Badge key={index} variant="outline" className="text-white border-white/30">
                            {specialty}
                            <X 
                              className="w-3 h-3 ml-1 cursor-pointer" 
                              onClick={() => removeSpecialty(specialty)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Available Nights</Label>
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((night) => (
                          <div key={night} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={night}
                              checked={profileData.availableNights.includes(night)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setProfileData(prev => ({ ...prev, availableNights: [...prev.availableNights, night] }));
                                } else {
                                  setProfileData(prev => ({ ...prev, availableNights: prev.availableNights.filter(n => n !== night) }));
                                }
                              }}
                              className="text-purple-500"
                            />
                            <Label htmlFor={night} className="text-sm">{night.slice(0, 3)}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Social Media</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div>
                          <Label htmlFor="instagram" className="text-sm">Instagram</Label>
                          <Input
                            id="instagram"
                            value={profileData.socialLinks.instagram}
                            onChange={(e) => setProfileData(prev => ({ 
                              ...prev, 
                              socialLinks: { ...prev.socialLinks, instagram: e.target.value }
                            }))}
                            className="bg-white/10 border-white/20 text-white"
                            placeholder="@username"
                          />
                        </div>
                        <div>
                          <Label htmlFor="twitter" className="text-sm">Twitter/X</Label>
                          <Input
                            id="twitter"
                            value={profileData.socialLinks.twitter}
                            onChange={(e) => setProfileData(prev => ({ 
                              ...prev, 
                              socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                            }))}
                            className="bg-white/10 border-white/20 text-white"
                            placeholder="@username"
                          />
                        </div>
                        <div>
                          <Label htmlFor="youtube" className="text-sm">YouTube</Label>
                          <Input
                            id="youtube"
                            value={profileData.socialLinks.youtube}
                            onChange={(e) => setProfileData(prev => ({ 
                              ...prev, 
                              socialLinks: { ...prev.socialLinks, youtube: e.target.value }
                            }))}
                            className="bg-white/10 border-white/20 text-white"
                            placeholder="Channel name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="tiktok" className="text-sm">TikTok</Label>
                          <Input
                            id="tiktok"
                            value={profileData.socialLinks.tiktok}
                            onChange={(e) => setProfileData(prev => ({ 
                              ...prev, 
                              socialLinks: { ...prev.socialLinks, tiktok: e.target.value }
                            }))}
                            className="bg-white/10 border-white/20 text-white"
                            placeholder="@username"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="media" className="mt-6">
                <div className="space-y-6">
                  {/* Video Portfolio */}
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>Video Portfolio</CardTitle>
                          <CardDescription className="text-purple-200">
                            Showcase your best performances
                          </CardDescription>
                        </div>
                        <Button className="bg-purple-500 hover:bg-purple-600">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Video
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {videos.map((video) => (
                          <div key={video.id} className="relative group">
                            <img 
                              src={video.thumbnail} 
                              alt={video.title}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                              <Video className="w-8 h-8 text-white" />
                            </div>
                            <div className="mt-2">
                              <p className="font-medium">{video.title}</p>
                              <p className="text-sm text-purple-200">2 months ago</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Achievements */}
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>Achievements & Awards</CardTitle>
                          <CardDescription className="text-purple-200">
                            Your comedy milestones and recognition
                          </CardDescription>
                        </div>
                        <Button className="bg-purple-500 hover:bg-purple-600">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Achievement
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {achievements.map((achievement) => (
                          <div key={achievement.id} className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg">
                            <Award className="w-5 h-5 text-yellow-400 mt-1" />
                            <div className="flex-1">
                              <h4 className="font-medium">{achievement.title}</h4>
                              <p className="text-sm text-purple-200">{achievement.description}</p>
                              <p className="text-xs text-purple-300 mt-1">{achievement.date}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="mt-6">
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                  <CardHeader>
                    <CardTitle>Privacy & Notifications</CardTitle>
                    <CardDescription className="text-purple-200">
                      Control your privacy and notification preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Notifications</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Email Notifications</Label>
                            <p className="text-sm text-purple-200">Receive updates about applications and shows</p>
                          </div>
                          <Switch
                            checked={profileData.preferences.emailNotifications}
                            onCheckedChange={(checked) => setProfileData(prev => ({
                              ...prev,
                              preferences: { ...prev.preferences, emailNotifications: checked }
                            }))}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>SMS Notifications</Label>
                            <p className="text-sm text-purple-200">Get text updates for urgent matters</p>
                          </div>
                          <Switch
                            checked={profileData.preferences.smsNotifications}
                            onCheckedChange={(checked) => setProfileData(prev => ({
                              ...prev,
                              preferences: { ...prev.preferences, smsNotifications: checked }
                            }))}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Privacy</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Public Profile</Label>
                            <p className="text-sm text-purple-200">Allow others to view your profile</p>
                          </div>
                          <Switch
                            checked={profileData.preferences.publicProfile}
                            onCheckedChange={(checked) => setProfileData(prev => ({
                              ...prev,
                              preferences: { ...prev.preferences, publicProfile: checked }
                            }))}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Show Contact Information</Label>
                            <p className="text-sm text-purple-200">Display phone and email to promoters</p>
                          </div>
                          <Switch
                            checked={profileData.preferences.showContactInfo}
                            onCheckedChange={(checked) => setProfileData(prev => ({
                              ...prev,
                              preferences: { ...prev.preferences, showContactInfo: checked }
                            }))}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end mt-6">
              <Button onClick={handleSave} className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
