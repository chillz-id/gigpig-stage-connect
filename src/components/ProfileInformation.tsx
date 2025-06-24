
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ProfileInformationProps {
  user: any;
  onSave: () => void;
}

export const ProfileInformation: React.FC<ProfileInformationProps> = ({
  user,
  onSave
}) => {
  return (
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

        <Button onClick={onSave} className="professional-button">
          Save Profile
        </Button>
      </CardContent>
    </Card>
  );
};
