
import React from 'react';
import { Marquee } from '@/components/ui/marquee';
import VouchCard from './VouchCard';

interface Vouch {
  name: string;
  username: string;
  body: string;
  img: string;
}

interface ComedianVouchesProps {
  vouches: Vouch[];
}

const ComedianVouches: React.FC<ComedianVouchesProps> = ({ vouches }) => {
  const firstRow = vouches.slice(0, vouches.length / 2);
  const secondRow = vouches.slice(vouches.length / 2);

  return (
    <div>
      <h3 className="text-xl font-semibold text-white mb-4">Comedian Vouches</h3>
      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
        <Marquee pauseOnHover className="[--duration:20s]">
          {firstRow.map((review) => (
            <VouchCard key={review.username} {...review} />
          ))}
        </Marquee>
        <Marquee reverse pauseOnHover className="[--duration:20s]">
          {secondRow.map((review) => (
            <VouchCard key={review.username} {...review} />
          ))}
        </Marquee>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-background"></div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-background"></div>
      </div>
    </div>
  );
};

export default ComedianVouches;
