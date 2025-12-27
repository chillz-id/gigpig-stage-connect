
import React from 'react';
import { Instagram, Youtube, Facebook, Globe, type LucideIcon } from 'lucide-react';
import { XIcon } from '@/components/icons/XIcon';
import { TikTokIcon } from '@/components/icons/TikTokIcon';

interface ComedianSocialLinksProps {
  instagram_url?: string | null;
  twitter_url?: string | null;
  facebook_url?: string | null;
  youtube_url?: string | null;
  tiktok_url?: string | null;
  website_url?: string | null;
  className?: string;
}

const ComedianSocialLinks: React.FC<ComedianSocialLinksProps> = ({
  instagram_url,
  twitter_url,
  facebook_url,
  youtube_url,
  tiktok_url,
  website_url,
  className,
}) => {
  // Build social links array with only URLs that exist
  const socialLinks: Array<{
    icon: LucideIcon | React.FC<{ className?: string }>;
    href: string;
    label: string;
    color: string;
  }> = [];

  if (instagram_url) {
    socialLinks.push({
      icon: Instagram,
      href: instagram_url,
      label: 'Instagram',
      color: 'hover:text-pink-400',
    });
  }

  if (youtube_url) {
    socialLinks.push({
      icon: Youtube,
      href: youtube_url,
      label: 'YouTube',
      color: 'hover:text-red-400',
    });
  }

  if (twitter_url) {
    socialLinks.push({
      icon: XIcon,
      href: twitter_url,
      label: 'X (Twitter)',
      color: 'hover:text-blue-400',
    });
  }

  if (facebook_url) {
    socialLinks.push({
      icon: Facebook,
      href: facebook_url,
      label: 'Facebook',
      color: 'hover:text-blue-500',
    });
  }

  if (tiktok_url) {
    socialLinks.push({
      icon: TikTokIcon,
      href: tiktok_url,
      label: 'TikTok',
      color: 'hover:text-pink-400',
    });
  }

  if (website_url) {
    socialLinks.push({
      icon: Globe,
      href: website_url,
      label: 'Website',
      color: 'hover:text-emerald-400',
    });
  }

  // Don't render anything if no social links exist
  if (socialLinks.length === 0) {
    return null;
  }

  return (
    <div className={className || "flex items-center gap-4"}>
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
          <Icon className="w-10 h-10" />
        </a>
      ))}
    </div>
  );
};

export default ComedianSocialLinks;
