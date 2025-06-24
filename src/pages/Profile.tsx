
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ContactSettings } from '@/components/ContactSettings';
import { VouchSystem } from '@/components/VouchSystem';
import { ProfileCalendarView } from '@/components/ProfileCalendarView';
import { ContactRequests } from '@/components/ContactRequests';
import SubscriptionManager from '@/components/SubscriptionManager';
import { ImageCrop } from '@/components/ImageCrop';
import { User, MapPin, Calendar, Mail, Phone, Shield, Settings, Award, Users, MessageSquare, Trophy, LogOut, Camera, Youtube, CreditCard, Plus, Eye, Image, Building, X } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';

const Profile = () => {
  const { user, logout, updateUser } = useUser();
  const { toast } = useToast();
  const location = useLocation();
  
  // Get tab from URL parameter or default to 'profile'
  const urlParams = new URLSearchParams(location.search);
  const initialTab = urlParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);
  
  const [showImageCrop, setShowImageCrop] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');

  // Contact settings state
  const [contactSettings, setContactSettings] = useState({
    email: { show: true, value: 'alex@example.com' },
    phone: { show: false, value: '+1 (555) 123-4567' },
    managerEmail: { show: true, value: 'manager@agency.com' },
    managerPhone: { show: false, value: '+1 (555) 987-6543' },
  });

  // Additional contact fields
  const [additionalContacts, setAdditionalContacts] = useState<Array<{ id: string, label: string, value: string, show: boolean }>>([]);

  // Financial information state
  const [financialInfo, setFinancialInfo] = useState({
    accountName: '',
    bsb: '',
    accountNumber: '',
    abn: '',
  });

  // Mock invoices data
  const mockInvoices = [
    {
      id: '1',
      number: 'INV-00001',
      clientName: 'Comedy Club Downtown',
      amount: 500,
      status: 'paid',
      dueDate: '2024-01-15',
      createdDate: '2024-01-01'
    },
    {
      id: '2',
      number: 'INV-00002',
      clientName: 'Laugh Factory',
      amount: 750,
      status: 'pending',
      dueDate: '2024-02-15',
      createdDate: '2024-02-01'
    },
    {
      id: '3',
      number: 'INV-00003',
      clientName: 'Open Mic Night Venue',
      amount: 200,
      status: 'overdue',
      dueDate: '2024-01-30',
      createdDate: '2024-01-15'
    }
  ];

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [location]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view your profile</h1>
          <Button>Sign In</Button>
        </div>
      </div>
    );
  }

  const handleSaveProfile = () => {
    toast({
      title: "Profile Updated",
      description: "Your profile has been successfully updated.",
    });
  };

  const handleLogout = () => {
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out.",
    });
    logout();
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setShowImageCrop(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCroppedImage = (croppedImage: string) => {
    updateUser({ avatar: croppedImage });
    toast({
      title: "Profile Picture Updated",
      description: "Your profile picture has been successfully updated.",
    });
  };

  const updateContactSetting = (key: string, field: 'show' | 'value', value: boolean | string) => {
    setContactSettings(prev => ({
      ...prev,
      [key]: {
        ...prev[key as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const addContactDetail = () => {
    const newContact = {
      id: `contact_${Date.now()}`,
      label: 'New Contact',
      value: '',
      show: false
    };
    setAdditionalContacts(prev => [...prev, newContact]);
  };

  const updateAdditionalContact = (id: string, field: 'label' | 'value' | 'show', value: string | boolean) => {
    setAdditionalContacts(prev => 
      prev.map(contact => 
        contact.id === id ? { ...contact, [field]: value } : contact
      )
    );
  };

  const removeAdditionalContact = (id: string) => {
    setAdditionalContacts(prev => prev.filter(contact => contact.id !== id));
  };

  const updateFinancialInfo = (field: keyof typeof financialInfo, value: string) => {
    setFinancialInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveContactSettings = () => {
    console.log('Saving contact settings:', contactSettings);
    console.log('Saving additional contacts:', additionalContacts);
    console.log('Saving financial info:', financialInfo);
    toast({
      title: "Contact Settings Saved",
      description: "Your contact visibility preferences have been updated.",
    });
  };

  const getMembershipBadgeColor = (membership: string) => {
    switch (membership) {
      case 'premium':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'pro':
        return 'bg-gradient-to-r from-blue-500 to-purple-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'overdue': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="professional-card mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="relative">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="text-2xl">{user.name[0]}</AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0">
                  <label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors shadow-lg">
                      <Camera className="w-4 h-4 text-primary-foreground" />
                    </div>
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{user.name}</h1>
                  {user.isVerified && <Shield className="w-6 h-6 text-blue-500" />}
                  <Badge className={getMembershipBadgeColor(user.membership)}>
                    {user.membership.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-4">{user.bio}</p>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{user.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Member since {user.joinDate}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Trophy className="w-4 h-4 text-yellow-400 fill-current" />
                    <span>{user.stats.showsPerformed} shows performed</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message
                </Button>
                <Button variant="outline" size="sm">
                  <Award className="w-4 h-4 mr-2" />
                  Vouch
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="vouches">Vouches</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="professional-card">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your public profile information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" defaultValue={user.name} />
                  </div>
                  <div>
                    <Label htmlFor="stage-name">Stage Name</Label>
                    <Input id="stage-name" placeholder="Your stage name" />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" defaultValue={user.bio} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" defaultValue={user.location} />
                  </div>
                  <div>
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Input id="experience" type="number" placeholder="5" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="specialties">Comedy Specialties</Label>
                  <Input id="specialties" placeholder="Observational, Dark Comedy, Storytelling..." />
                </div>

                <div>
                  <Label>Social Media Links</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <Input placeholder="Instagram @username" />
                    <Input placeholder="TikTok @username" />
                    <Input placeholder="YouTube channel" />
                    <Input placeholder="Twitter @username" />
                  </div>
                </div>

                <Button onClick={handleSaveProfile} className="professional-button">
                  Save Profile
                </Button>
              </CardContent>
            </Card>

            <Card className="professional-card">
              <CardHeader>
                <CardTitle>Media & Portfolio</CardTitle>
                <CardDescription>
                  Showcase your best work to potential promoters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <Label>Show Reel</Label>
                    <div className="mt-2 border-2 border-dashed border-border rounded-lg p-8 text-center">
                      <div className="text-muted-foreground">
                        <Youtube className="w-8 h-8 mx-auto mb-2" />
                        <p>Upload your show reel video or add YouTube link</p>
                        <Button variant="outline" className="mt-2">Add Video</Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Photo Gallery</Label>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Array.from({ length: 4 }, (_, i) => (
                        <div key={i} className="aspect-square border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                          <Button variant="outline" size="sm" className="flex items-center gap-2">
                            <Image className="w-4 h-4" />
                            Add Photo
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button className="professional-button">Update Media</Button>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information with Visibility Controls */}
            <Card className="professional-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Contact Information
                </CardTitle>
                <CardDescription>
                  Your contact details for booking and collaboration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Personal Contact */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-4 h-4" />
                    <h3 className="font-semibold">Personal Contact</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1 mr-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="w-4 h-4" />
                          <Label htmlFor="email" className="text-sm">Email</Label>
                          {contactSettings.email.show && <Badge variant="outline" className="text-xs">Visible</Badge>}
                        </div>
                        <Input
                          id="email"
                          value={contactSettings.email.value}
                          onChange={(e) => updateContactSetting('email', 'value', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <Switch
                        checked={contactSettings.email.show}
                        onCheckedChange={(checked) => updateContactSetting('email', 'show', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1 mr-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Phone className="w-4 h-4" />
                          <Label htmlFor="phone" className="text-sm">Phone</Label>
                          {contactSettings.phone.show && <Badge variant="outline" className="text-xs">Visible</Badge>}
                        </div>
                        <Input
                          id="phone"
                          value={contactSettings.phone.value}
                          onChange={(e) => updateContactSetting('phone', 'value', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <Switch
                        checked={contactSettings.phone.show}
                        onCheckedChange={(checked) => updateContactSetting('phone', 'show', checked)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Manager Contact */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-4 h-4" />
                    <h3 className="font-semibold">Manager Contact</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1 mr-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="w-4 h-4" />
                          <Label htmlFor="managerEmail" className="text-sm">Manager Email</Label>
                          {contactSettings.managerEmail.show && <Badge variant="outline" className="text-xs">Visible</Badge>}
                        </div>
                        <Input
                          id="managerEmail"
                          value={contactSettings.managerEmail.value}
                          onChange={(e) => updateContactSetting('managerEmail', 'value', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <Switch
                        checked={contactSettings.managerEmail.show}
                        onCheckedChange={(checked) => updateContactSetting('managerEmail', 'show', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1 mr-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Phone className="w-4 h-4" />
                          <Label htmlFor="managerPhone" className="text-sm">Manager Phone</Label>
                          {contactSettings.managerPhone.show && <Badge variant="outline" className="text-xs">Visible</Badge>}
                        </div>
                        <Input
                          id="managerPhone"
                          value={contactSettings.managerPhone.value}
                          onChange={(e) => updateContactSetting('managerPhone', 'value', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <Switch
                        checked={contactSettings.managerPhone.show}
                        onCheckedChange={(checked) => updateContactSetting('managerPhone', 'show', checked)}
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Contact Details */}
                {additionalContacts.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Plus className="w-4 h-4" />
                        <h3 className="font-semibold">Additional Contact Details</h3>
                      </div>
                      <div className="space-y-4">
                        {additionalContacts.map((contact) => (
                          <div key={contact.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1 mr-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Input
                                  value={contact.label}
                                  onChange={(e) => updateAdditionalContact(contact.id, 'label', e.target.value)}
                                  placeholder="Contact Type"
                                  className="text-sm max-w-32"
                                />
                                {contact.show && <Badge variant="outline" className="text-xs">Visible</Badge>}
                              </div>
                              <Input
                                value={contact.value}
                                onChange={(e) => updateAdditionalContact(contact.id, 'value', e.target.value)}
                                placeholder="Contact value"
                                className="text-sm"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={contact.show}
                                onCheckedChange={(checked) => updateAdditionalContact(contact.id, 'show', checked)}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeAdditionalContact(contact.id)}
                                className="h-8 w-8 p-0"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="flex justify-between items-center pt-4">
                  <Button variant="outline" onClick={addContactDetail} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add More Contact Details
                  </Button>
                  <Button onClick={handleSaveContactSettings} className="professional-button">
                    Save Contact Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card className="professional-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Financial Information
                </CardTitle>
                <CardDescription>
                  Required for invoicing and payment processing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="accountName">Account Name *</Label>
                    <Input
                      id="accountName"
                      value={financialInfo.accountName}
                      onChange={(e) => updateFinancialInfo('accountName', e.target.value)}
                      placeholder="Your full legal name or business name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="bsb">BSB *</Label>
                    <Input
                      id="bsb"
                      value={financialInfo.bsb}
                      onChange={(e) => updateFinancialInfo('bsb', e.target.value)}
                      placeholder="123-456"
                      maxLength={7}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="accountNumber">Account Number *</Label>
                    <Input
                      id="accountNumber"
                      value={financialInfo.accountNumber}
                      onChange={(e) => updateFinancialInfo('accountNumber', e.target.value)}
                      placeholder="Your bank account number"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="abn">ABN *</Label>
                    <Input
                      id="abn"
                      value={financialInfo.abn}
                      onChange={(e) => updateFinancialInfo('abn', e.target.value)}
                      placeholder="12 345 678 901"
                      maxLength={14}
                      required
                    />
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>* Required fields for processing invoices and payments</p>
                </div>

                <Button onClick={handleSaveContactSettings} className="professional-button">
                  Save Financial Information
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar">
            <ProfileCalendarView />
          </TabsContent>

          <TabsContent value="invoices">
            <Card className="professional-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Invoice Management
                </CardTitle>
                <CardDescription>
                  View and manage your invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockInvoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold">{invoice.number}</span>
                          <Badge className={getStatusColor(invoice.status)}>
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{invoice.clientName}</p>
                        <p className="text-xs text-muted-foreground">Due: {invoice.dueDate}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">${invoice.amount}</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vouches">
            <VouchSystem />
          </TabsContent>

          <TabsContent value="requests">
            <ContactRequests />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            {/* Subscription Manager */}
            <SubscriptionManager />

            <Card className="professional-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Account Settings
                </CardTitle>
                <CardDescription>
                  Manage your account preferences and privacy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications about new opportunities</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">Get text alerts for urgent updates</p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Profile Visibility</Label>
                      <p className="text-sm text-muted-foreground">Make your profile discoverable to promoters</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-Apply to Suitable Shows</Label>
                      <p className="text-sm text-muted-foreground">Automatically apply to shows matching your criteria</p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <Button className="professional-button">Save Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Image Crop Modal */}
        <ImageCrop
          isOpen={showImageCrop}
          onClose={() => setShowImageCrop(false)}
          onCrop={handleCroppedImage}
          imageUrl={selectedImage}
        />
      </div>
    </div>
  );
};

export default Profile;
