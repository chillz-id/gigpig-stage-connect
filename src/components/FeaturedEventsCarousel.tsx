
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useFeaturedEvents } from '@/hooks/useFeaturedEvents';
import { FeaturedEventCard } from './FeaturedEventCard';
import { cn } from '@/lib/utils';

export const FeaturedEventsCarousel = () => {
  const { data: featuredEvents, isLoading, error } = useFeaturedEvents();
  const [api, setApi] = useState<any>(null);
  const [isPaused, setIsPaused] = useState(false);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll on mobile
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    
    if (isMobile && api && featuredEvents && featuredEvents.length > 1 && !isPaused) {
      scrollIntervalRef.current = setInterval(() => {
        if (api.canScrollNext()) {
          api.scrollNext();
        } else {
          // Loop back to start
          api.scrollTo(0);
        }
      }, 3000); // Scroll every 3 seconds
    }

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, [api, featuredEvents, isPaused]);

  console.log('FeaturedEventsCarousel:', { featuredEvents, isLoading, error });

  if (isLoading) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Featured Shows</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-white/10 backdrop-blur-sm border-white/20 animate-pulse">
              <div className="aspect-video bg-white/5 rounded-t-lg" />
              <CardContent className="p-4">
                <div className="h-4 bg-white/10 rounded mb-2" />
                <div className="h-3 bg-white/10 rounded w-2/3 mb-2" />
                <div className="h-3 bg-white/10 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Featured Shows</h2>
        <div className="bg-white/10 backdrop-blur-sm border-white/20 rounded-lg p-6 text-center">
          <p className="text-white/80">Error loading featured events</p>
        </div>
      </div>
    );
  }

  if (!featuredEvents || featuredEvents.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Featured Shows</h2>
        <div className="bg-white/10 backdrop-blur-sm border-white/20 rounded-lg p-6 text-center">
          <p className="text-white/80">No upcoming events available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-white mb-4">Featured Shows</h2>
      <div 
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setTimeout(() => setIsPaused(false), 2000)} // Resume after 2 seconds
      >
        <Carousel
          setApi={setApi}
          opts={{
            align: "start",
            loop: true,
            dragFree: true,
          }}
          className="relative"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {featuredEvents.map((event) => (
              <CarouselItem key={event.id} className="pl-2 md:pl-4 basis-full sm:basis-4/5 lg:basis-1/2 xl:basis-1/3">
                <FeaturedEventCard event={event} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  );
};
