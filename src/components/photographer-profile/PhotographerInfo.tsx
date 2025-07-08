import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  DollarSign, 
  Clock, 
  MapPin, 
  Briefcase,
  Award,
  Settings
} from 'lucide-react';
import { PhotographerProfile } from '@/types/photographer';

interface PhotographerInfoProps {
  photographer: PhotographerProfile;
}

const PhotographerInfo: React.FC<PhotographerInfoProps> = ({ photographer }) => {
  const profile = photographer.photographer_profile;

  if (!profile) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">No photographer profile information available.</p>
        </CardContent>
      </Card>
    );
  }

  const formatRate = () => {
    if (!profile.rate_per_hour && !profile.rate_per_event) return 'Contact for rates';
    const parts = [];
    if (profile.rate_per_hour) parts.push(`$${profile.rate_per_hour}/hour`);
    if (profile.rate_per_event) parts.push(`$${profile.rate_per_event}/event`);
    return parts.join(' • ');
  };

  return (
    <div className="space-y-6">
      {/* Bio */}
      {photographer.bio && (
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{photographer.bio}</p>
          </CardContent>
        </Card>
      )}

      {/* Services & Specialties */}
      <Card>
        <CardHeader>
          <CardTitle>Services & Specialties</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.services_offered && profile.services_offered.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Services Offered
              </h4>
              <div className="flex flex-wrap gap-2">
                {profile.services_offered.map((service, index) => (
                  <Badge key={index} variant="secondary">
                    {service.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {profile.specialties && profile.specialties.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Specialties
              </h4>
              <div className="flex flex-wrap gap-2">
                {profile.specialties.map((specialty, index) => (
                  <Badge key={index} variant="outline">
                    {specialty}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rates & Details */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-gray-600">
              <DollarSign className="w-4 h-4" />
              Rates
            </span>
            <span className="font-medium">{formatRate()}</span>
          </div>

          {profile.turnaround_time_days && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                Turnaround Time
              </span>
              <span className="font-medium">{profile.turnaround_time_days} days</span>
            </div>
          )}

          {profile.travel_radius_km && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                Travel Radius
              </span>
              <span className="font-medium">{profile.travel_radius_km} km</span>
            </div>
          )}

          {profile.experience_years && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-gray-600">
                <Award className="w-4 h-4" />
                Experience
              </span>
              <span className="font-medium">{profile.experience_years}+ years</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Equipment */}
      {profile.equipment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Equipment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{profile.equipment}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PhotographerInfo;