
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Globe, Instagram, Twitter, Youtube, Facebook } from 'lucide-react';

interface ComedianContactProps {
  comedian: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    website_url: string | null;
    instagram_url: string | null;
    twitter_url: string | null;
    youtube_url: string | null;
    facebook_url: string | null;
    show_contact_in_epk: boolean | null;
  };
}

const ComedianContact: React.FC<ComedianContactProps> = ({ comedian }) => {
  // Don't show contact section if comedian hasn't enabled it
  if (!comedian.show_contact_in_epk) {
    return null;
  }

  const contactMethods = [
    {
      icon: Mail,
      label: 'Email',
      value: comedian.email,
      href: comedian.email ? `mailto:${comedian.email}` : null,
      primary: true
    },
    {
      icon: Phone,
      label: 'Phone',
      value: comedian.phone,
      href: comedian.phone ? `tel:${comedian.phone}` : null,
      primary: true
    },
    {
      icon: Globe,
      label: 'Website',
      value: comedian.website_url,
      href: comedian.website_url,
      primary: false
    }
  ];

  const socialLinks = [
    {
      icon: Instagram,
      label: 'Instagram',
      url: comedian.instagram_url,
      color: 'text-pink-600'
    },
    {
      icon: Twitter,
      label: 'Twitter',
      url: comedian.twitter_url,
      color: 'text-blue-400'
    },
    {
      icon: Youtube,
      label: 'YouTube',
      url: comedian.youtube_url,
      color: 'text-red-600'
    },
    {
      icon: Facebook,
      label: 'Facebook',
      url: comedian.facebook_url,
      color: 'text-blue-600'
    }
  ];

  const hasContactInfo = contactMethods.some(method => method.value);
  const hasSocialLinks = socialLinks.some(link => link.url);

  if (!hasContactInfo && !hasSocialLinks) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Primary Contact Methods */}
          {hasContactInfo && (
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Get in Touch</h4>
              <div className="space-y-2">
                {contactMethods.map((method, index) => {
                  if (!method.value) return null;
                  
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <method.icon className="w-5 h-5 text-muted-foreground" />
                      {method.href ? (
                        <a
                          href={method.href}
                          className="text-foreground hover:text-primary transition-colors"
                          target={method.label === 'Website' ? '_blank' : undefined}
                          rel={method.label === 'Website' ? 'noopener noreferrer' : undefined}
                        >
                          {method.value}
                        </a>
                      ) : (
                        <span className="text-foreground">{method.value}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Social Media Links */}
          {hasSocialLinks && (
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Follow Me</h4>
              <div className="flex flex-wrap gap-2">
                {socialLinks.map((link, index) => {
                  if (!link.url) return null;
                  
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      asChild
                      className="flex items-center gap-2"
                    >
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <link.icon className={`w-4 h-4 ${link.color}`} />
                        {link.label}
                      </a>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Booking Call-to-Action */}
          {comedian.email && (
            <div className="pt-4 border-t">
              <Button
                className="w-full"
                onClick={() => {
                  const subject = encodeURIComponent(`Booking Inquiry - ${comedian.name}`);
                  const body = encodeURIComponent(`Hi ${comedian.name},\n\nI'm interested in booking you for a comedy show. Please let me know your availability and rates.\n\nThank you!`);
                  window.location.href = `mailto:${comedian.email}?subject=${subject}&body=${body}`;
                }}
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Booking Inquiry
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ComedianContact;
