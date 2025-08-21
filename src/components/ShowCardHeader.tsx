
import React from 'react';
import { Button } from '@/components/ui/button';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart } from 'lucide-react';
import { ShowCardBadges } from './ShowCardBadges';

interface ShowCardHeaderProps {
  show: any;
  isInterested: boolean;
  isShowFull: boolean;
  onToggleInterested: (show: any) => void;
}

export const ShowCardHeader: React.FC<ShowCardHeaderProps> = ({
  show,
  isInterested,
  isShowFull,
  onToggleInterested,
}) => {
  return (
    <>
      {show.image_url && (
        <div className="aspect-[2/1] relative overflow-hidden">
          <img 
            src={show.image_url} 
            alt={show.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute top-2 right-2">
            <ShowCardBadges 
              show={show} 
              isShowFull={isShowFull} 
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={`absolute top-2 right-2 ${
              isInterested 
                ? 'text-red-500 hover:text-red-600' 
                : 'text-white hover:text-red-500'
            }`}
            onClick={() => onToggleInterested(show)}
          >
            <Heart className={`w-5 h-5 ${isInterested ? 'fill-current' : ''}`} />
          </Button>
        </div>
      )}
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{show.title}</CardTitle>
            <CardDescription className="text-muted-foreground">
              {show.venue} • {show.city}, {show.state}
            </CardDescription>
          </div>
          {!show.image_url && (
            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                size="sm"
                className={`${
                  isInterested 
                    ? 'text-red-500 hover:text-red-600' 
                    : 'text-muted-foreground hover:text-red-500'
                }`}
                onClick={() => onToggleInterested(show)}
              >
                <Heart className={`w-5 h-5 ${isInterested ? 'fill-current' : ''}`} />
              </Button>
              <ShowCardBadges 
                show={show} 
                isShowFull={isShowFull} 
              />
            </div>
          )}
        </div>
      </CardHeader>
    </>
  );
};
