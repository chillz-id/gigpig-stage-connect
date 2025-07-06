// Promoter Header - Header section for promoter profiles
import React from 'react';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Share, 
  Mail, 
  MapPin, 
  Calendar, 
  Users, 
  Star,
  Phone,
  Globe,
  CheckCircle,
  Building2,
  Clock
} from 'lucide-react';
import PromoterAvatar from './PromoterAvatar';
import PromoterSocialLinks from './PromoterSocialLinks';

interface PromoterHeaderProps {
  promoter: {
    id: string;
    name: string | null;
    company_name: string | null;
    promoter_bio: string | null;
    location: string | null;
    avatar_url: string | null;
    is_verified: boolean;
    email: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    website_url: string | null;
    years_experience: number | null;
    service_areas: string[] | null;
    specialties: string[] | null;
    // Stats data that would come from the joined query
    stats?: {
      total_events_hosted: number;
      average_event_rating: number;
      success_rate: number;
      response_time_hours: number;
    };
  };
  onShare: () => void;
  onContact: () => void;
  onBookEvent: () => void;
}

const PromoterHeader: React.FC<PromoterHeaderProps> = ({ 
  promoter, 
  onShare, 
  onContact, 
  onBookEvent 
}) => {
  const displayName = promoter.company_name || promoter.name || 'Unnamed Promoter';
  const hasContact = promoter.contact_email || promoter.email;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 rounded-2xl">
      {/* Background pattern */}
      <div 
        className="absolute inset-0 opacity-40" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='60' cy='60' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />
      
      <CardContent className="relative p-12">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Company Avatar/Logo */}
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="w-48 h-48 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-1">
                <PromoterAvatar 
                  name={displayName} 
                  avatar_url={promoter.avatar_url}
                  isCompany={!!promoter.company_name}
                />
              </div>
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl -z-10" />
              
              {/* Verification Badge */}
              {promoter.is_verified && (
                <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-2">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 text-center lg:text-left text-white">
            {/* Company/Promoter Name */}
            <div className="mb-4">
              <h1 className="text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                {displayName}
              </h1>
              
              {/* Individual name if company name exists */}
              {promoter.company_name && promoter.name && (
                <p className="text-xl text-blue-200 mb-2">
                  Managed by {promoter.name}
                </p>
              )}

              {/* Verification Status */}
              {promoter.is_verified && (
                <Badge variant="secondary" className="bg-green-500/20 text-green-200 border-green-500/30">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified Promoter
                </Badge>
              )}
            </div>

            {/* Key Information */}
            <div className="flex flex-wrap gap-4 mb-6 text-blue-200">
              {promoter.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{promoter.location}</span>
                </div>
              )}
              
              {promoter.years_experience && (
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span>{promoter.years_experience} years experience</span>
                </div>
              )}

              {promoter.stats && (
                <>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{promoter.stats.total_events_hosted} events hosted</span>
                  </div>
                  
                  {promoter.stats.average_event_rating > 0 && (
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{promoter.stats.average_event_rating.toFixed(1)} rating</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>~{promoter.stats.response_time_hours}h response time</span>
                  </div>
                </>
              )}
            </div>

            {/* Specialties */}
            {promoter.specialties && promoter.specialties.length > 0 && (
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  {promoter.specialties.slice(0, 4).map((specialty, index) => (
                    <Badge key={index} variant="outline" className="text-blue-200 border-blue-400/30">
                      {specialty}
                    </Badge>
                  ))}
                  {promoter.specialties.length > 4 && (
                    <Badge variant="outline" className="text-blue-200 border-blue-400/30">
                      +{promoter.specialties.length - 4} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Service Areas */}
            {promoter.service_areas && promoter.service_areas.length > 0 && (
              <div className="mb-6">
                <p className="text-sm text-blue-300 mb-2">Service Areas:</p>
                <div className="flex flex-wrap gap-2">
                  {promoter.service_areas.slice(0, 3).map((area, index) => (
                    <Badge key={index} variant="secondary" className="bg-blue-500/20 text-blue-200">
                      {area}
                    </Badge>
                  ))}
                  {promoter.service_areas.length > 3 && (
                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-200">
                      +{promoter.service_areas.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Bio Snippet */}
            {promoter.promoter_bio && (
              <p className="text-blue-100 text-lg leading-relaxed mb-8 max-w-2xl">
                {promoter.promoter_bio.length > 150 
                  ? `${promoter.promoter_bio.substring(0, 150)}...` 
                  : promoter.promoter_bio
                }
              </p>
            )}
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <Button 
                onClick={onBookEvent}
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Book Event
              </Button>
              
              {hasContact && (
                <Button 
                  onClick={onContact}
                  variant="outline" 
                  size="lg"
                  className="border-blue-400/30 text-blue-200 hover:bg-blue-500/20"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Contact
                </Button>
              )}

              {promoter.contact_phone && (
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-blue-400/30 text-blue-200 hover:bg-blue-500/20"
                  onClick={() => window.open(`tel:${promoter.contact_phone}`)}
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Call
                </Button>
              )}

              {promoter.website_url && (
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-blue-400/30 text-blue-200 hover:bg-blue-500/20"
                  onClick={() => window.open(promoter.website_url, '_blank')}
                >
                  <Globe className="w-5 h-5 mr-2" />
                  Website
                </Button>
              )}
              
              <Button 
                onClick={onShare}
                variant="ghost" 
                size="lg"
                className="text-blue-200 hover:bg-blue-500/20"
              >
                <Share className="w-5 h-5 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
        
        {/* Social Links positioned at bottom */}
        <div className="mt-8">
          <PromoterSocialLinks promoterId={promoter.id} />
        </div>
      </CardContent>
    </div>
  );
};

export default PromoterHeader;