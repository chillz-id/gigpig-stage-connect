import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, Instagram, Youtube, Globe, Twitter, Facebook, Linkedin } from 'lucide-react';
import { FaTiktok } from 'react-icons/fa';

interface SocialMediaCollapsibleProps {
  values: {
    instagram?: string;
    youtube?: string;
    website?: string;
    twitter?: string;
    tiktok?: string;
    facebook?: string;
    linkedin?: string;
  };
  onChange: (field: string, value: string) => void;
}

export function SocialMediaCollapsible({ values, onChange }: SocialMediaCollapsibleProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Always Visible Social Media Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="instagram" className="flex items-center gap-2">
            <Instagram className="w-4 h-4" />
            Instagram
          </Label>
          <Input
            id="instagram"
            type="text"
            placeholder="@username"
            value={values.instagram || ''}
            onChange={(e) => onChange('instagram', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="youtube" className="flex items-center gap-2">
            <Youtube className="w-4 h-4" />
            YouTube
          </Label>
          <Input
            id="youtube"
            type="url"
            placeholder="https://youtube.com/@username"
            value={values.youtube || ''}
            onChange={(e) => onChange('youtube', e.target.value)}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="website" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Website
          </Label>
          <Input
            id="website"
            type="url"
            placeholder="https://yourwebsite.com"
            value={values.website || ''}
            onChange={(e) => onChange('website', e.target.value)}
          />
        </div>
      </div>

      {/* Collapsible Section for Additional Social Media */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full flex items-center justify-between p-2">
            <span className="text-sm font-medium">
              {isOpen ? 'Hide' : 'Show'} Additional Social Media
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="twitter" className="flex items-center gap-2">
                <Twitter className="w-4 h-4" />
                Twitter / X
              </Label>
              <Input
                id="twitter"
                type="text"
                placeholder="@username"
                value={values.twitter || ''}
                onChange={(e) => onChange('twitter', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tiktok" className="flex items-center gap-2">
                <FaTiktok className="w-4 h-4" />
                TikTok
              </Label>
              <Input
                id="tiktok"
                type="text"
                placeholder="@username"
                value={values.tiktok || ''}
                onChange={(e) => onChange('tiktok', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="facebook" className="flex items-center gap-2">
                <Facebook className="w-4 h-4" />
                Facebook
              </Label>
              <Input
                id="facebook"
                type="url"
                placeholder="https://facebook.com/username"
                value={values.facebook || ''}
                onChange={(e) => onChange('facebook', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin" className="flex items-center gap-2">
                <Linkedin className="w-4 h-4" />
                LinkedIn
              </Label>
              <Input
                id="linkedin"
                type="url"
                placeholder="https://linkedin.com/in/username"
                value={values.linkedin || ''}
                onChange={(e) => onChange('linkedin', e.target.value)}
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
