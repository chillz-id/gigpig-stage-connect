import React from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  usePhotographer, 
  usePhotographerPortfolio, 
  usePhotographerVouches,
  usePhotographerVouchStats 
} from '@/hooks/usePhotographers';
import PhotographerHeader from '@/components/photographer-profile/PhotographerHeader';
import PhotographerInfo from '@/components/photographer-profile/PhotographerInfo';
import PhotographerPortfolio from '@/components/photographer-profile/PhotographerPortfolio';
import PhotographerVouches from '@/components/photographer-profile/PhotographerVouches';
import PhotographerAvailability from '@/components/photographer-profile/PhotographerAvailability';
import PhotographerBooking from '@/components/photographer-profile/PhotographerBooking';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const PhotographerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { photographer, isLoading, error } = usePhotographer(id || '');
  const { portfolio } = usePhotographerPortfolio(id || '');
  const { vouches } = usePhotographerVouches(id || '');
  const { stats } = usePhotographerVouchStats(id || '');

  const getBackgroundStyles = () => {
    return 'bg-[#131b2b]';
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen ${getBackgroundStyles()}`}>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-64 w-full mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
            <div>
              <Skeleton className="h-80 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !photographer) {
    return (
      <div className={`min-h-screen ${getBackgroundStyles()}`}>
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error ? 'Error loading photographer profile' : 'Photographer not found'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${getBackgroundStyles()}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <PhotographerHeader 
          photographer={photographer} 
          averageRating={stats?.average_rating || 0}
          reviewCount={stats?.total_vouches || 0}
        />

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="portfolio" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="vouches">Vouches</TabsTrigger>
                <TabsTrigger value="availability">Availability</TabsTrigger>
              </TabsList>

              <TabsContent value="portfolio" className="mt-6">
                <PhotographerPortfolio 
                  portfolio={portfolio}
                  photographerId={photographer.id}
                />
              </TabsContent>

              <TabsContent value="about" className="mt-6">
                <PhotographerInfo photographer={photographer} />
              </TabsContent>

              <TabsContent value="vouches" className="mt-6">
                <PhotographerVouches 
                  vouches={vouches}
                  photographerId={photographer.id}
                  stats={stats}
                />
              </TabsContent>

              <TabsContent value="availability" className="mt-6">
                <PhotographerAvailability photographerId={photographer.id} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Booking */}
          <div className="lg:col-span-1">
            <PhotographerBooking photographer={photographer} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotographerProfile;