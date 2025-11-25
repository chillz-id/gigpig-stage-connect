import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Globe, Instagram, Twitter, Youtube, Facebook, Linkedin } from 'lucide-react';

interface OrganizationContactProps {
  organization: {
    id: string;
    organization_name: string | null;
    email: string | null;
    phone: string | null;
    website: string | null;
    instagram_url: string | null;
    twitter_url: string | null;
    youtube_url: string | null;
    facebook_url: string | null;
    linkedin_url: string | null;
    show_contact_info: boolean | null;
  };
  trackInteraction?: (action: string, details?: any) => void;
}

const OrganizationContact: React.FC<OrganizationContactProps> = ({ organization, trackInteraction }) => {
  // Don't show contact section if organization hasn't enabled it
  if (!organization.show_contact_info) {
    return null;
  }

  const contactMethods = [
    {
      icon: Mail,
      label: 'Email',
      value: organization.email,
      href: organization.email ? `mailto:${organization.email}` : null,
      primary: true
    },
    {
      icon: Phone,
      label: 'Phone',
      value: organization.phone,
      href: organization.phone ? `tel:${organization.phone}` : null,
      primary: true
    },
    {
      icon: Globe,
      label: 'Website',
      value: organization.website,
      href: organization.website,
      primary: false
    }
  ];

  const socialLinks = [
    {
      icon: Instagram,
      label: 'Instagram',
      url: organization.instagram_url,
      color: 'text-pink-600'
    },
    {
      icon: Twitter,
      label: 'Twitter',
      url: organization.twitter_url,
      color: 'text-blue-400'
    },
    {
      icon: Youtube,
      label: 'YouTube',
      url: organization.youtube_url,
      color: 'text-red-600'
    },
    {
      icon: Facebook,
      label: 'Facebook',
      url: organization.facebook_url,
      color: 'text-blue-600'
    },
    {
      icon: Linkedin,
      label: 'LinkedIn',
      url: organization.linkedin_url,
      color: 'text-blue-700'
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
              <h4 className="font-semibold text-foreground">Follow Us</h4>
              <div className="flex flex-wrap gap-2">
                {socialLinks.map((link, index) => {
                  if (!link.url) return null;

                  return (
                    <Button
                      key={index}
                      className="professional-button"
                      size="sm"
                      asChild
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

          {/* Contact Call-to-Action */}
          {organization.email && (
            <div className="pt-4 border-t">
              <Button
                className="w-full"
                onClick={() => {
                  const subject = encodeURIComponent(`Inquiry - ${organization.organization_name}`);
                  const body = encodeURIComponent(`Hi ${organization.organization_name},\n\nI'm interested in learning more about your organization and services.\n\nThank you!`);
                  window.location.href = `mailto:${organization.email}?subject=${subject}&body=${body}`;
                }}
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Inquiry
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrganizationContact;
