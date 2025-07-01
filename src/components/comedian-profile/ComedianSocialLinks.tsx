
import React from 'react';
import { Button } from '@/components/ui/button';
import { Instagram, Youtube, Twitter, Facebook } from 'lucide-react';

const ComedianSocialLinks: React.FC = () => {
  const socialLinks = [
    { icon: Instagram, href: '#', label: 'Instagram', color: 'hover:text-pink-400' },
    { icon: Youtube, href: '#', label: 'YouTube', color: 'hover:text-red-400' },
    { icon: Twitter, href: '#', label: 'Twitter', color: 'hover:text-blue-400' },
    { icon: Facebook, href: '#', label: 'Facebook', color: 'hover:text-blue-500' },
  ];

  return (
    <div className="flex gap-3">
      {socialLinks.map(({ icon: Icon, href, label, color }) => (
        <Button
          key={label}
          variant="ghost"
          size="icon"
          asChild
          className={`text-gray-300 ${color} transition-colors duration-200 hover:bg-white/10`}
        >
          <a href={href} aria-label={label} target="_blank" rel="noopener noreferrer">
            <Icon className="w-6 h-6" />
          </a>
        </Button>
      ))}
    </div>
  );
};

export default ComedianSocialLinks;
