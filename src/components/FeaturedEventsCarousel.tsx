
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useFeaturedEvents } from '@/hooks/useFeaturedEvents';
import { FeaturedEventCard } from './FeaturedEventCard';

export const FeaturedEventsCarousel = () => {
  const { data: featuredEvents, isLoading } = useFeaturedEvents();

  if (isLoading) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-4">Featured Shows</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-card/50 backdrop-blur-sm border-border animate-pulse">
              <div className="aspect-video bg-muted rounded-t-lg" />
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-3 bg-muted rounded w-2/3 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!featuredEvents || featuredEvents.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-foreground mb-4">Featured Shows</h2>
      <Carousel
        opts={{
          align: "start",
          loop: true,
          dragFree: true,
        }}
        className="relative"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {featuredEvents.map((event) => (
            <CarouselItem key={event.id} className="pl-2 md:pl-4 basis-4/5 sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
              <FeaturedEventCard event={event} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex -left-4" />
        <CarouselNext className="hidden md:flex -right-4" />
      </Carousel>
    </div>
  );
};
