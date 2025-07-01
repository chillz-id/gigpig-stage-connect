
import React from 'react';
import { Button } from '@/components/ui/button';
import { Instagram, Twitter, Youtube, Facebook } from 'lucide-react';

const ComedianSocialLinks: React.FC = () => {
  return (
    <div className="flex items-center justify-center md:justify-start gap-2 mt-4">
      <Button variant="ghost" size="icon" className="w-8 h-8">
        <Instagram className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon" className="w-8 h-8">
        <Twitter className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon" className="w-8 h-8">
        <Youtube className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon" className="w-8 h-8">
        <Facebook className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default ComedianSocialLinks;
