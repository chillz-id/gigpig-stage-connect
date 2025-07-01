
import React from 'react';
import { Instagram, Youtube, Twitter, Facebook } from 'lucide-react';

const ComedianSocialLinks: React.FC = () => {
  const socialLinks = [
    { icon: Instagram, href: '#', label: 'Instagram', color: 'hover:text-pink-400' },
    { icon: Youtube, href: '#', label: 'YouTube', color: 'hover:text-red-400' },
    { icon: Twitter, href: '#', label: 'Twitter', color: 'hover:text-blue-400' },
    { icon: Facebook, href: '#', label: 'Facebook', color: 'hover:text-blue-500' },
  ];

  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-3">
      {socialLinks.map(({ icon: Icon, href, label, color }, index) => (
        <a
          key={label}
          href={href}
          aria-label={label}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-gray-300 ${color} transition-all duration-200 hover:transform hover:-translate-y-0.5`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <Icon className="w-5 h-5" />
        </a>
      ))}
    </div>
  );
};

export default ComedianSocialLinks;
