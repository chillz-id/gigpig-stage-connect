
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Star, ExternalLink } from 'lucide-react';
import { Marquee } from '@/components/ui/marquee';

interface ComedianAccomplishmentsProps {
  comedianId: string;
}

const ComedianAccomplishments: React.FC<ComedianAccomplishmentsProps> = ({ comedianId }) => {
  // Mock accomplishments data
  const accomplishments = [
    "Winner - Sydney Comedy Festival Best Newcomer 2023",
    "Featured on Channel 10's 'The Project'",
    "Regular performer at The Comedy Store",
    "Opened for international headliners",
    "Performed at Melbourne International Comedy Festival"
  ];

  // Mock vouches data
  const vouches = [
    {
      name: "Jack Wilson",
      username: "@jackcomedian",
      body: "I've never seen anything like this before. It's amazing. I love it.",
      img: "https://avatar.vercel.sh/jack",
    },
    {
      name: "Jill Thompson",
      username: "@jillcomedy",
      body: "I don't know what to say. I'm speechless. This is amazing.",
      img: "https://avatar.vercel.sh/jill",
    },
    {
      name: "John Davis",
      username: "@johndavis",
      body: "I'm at a loss for words. This is amazing. I love it.",
      img: "https://avatar.vercel.sh/john",
    },
    {
      name: "Jane Smith",
      username: "@janesmith",
      body: "I'm at a loss for words. This is amazing. I love it.",
      img: "https://avatar.vercel.sh/jane",
    },
    {
      name: "Jenny Wilson",
      username: "@jennywilson",
      body: "I'm at a loss for words. This is amazing. I love it.",
      img: "https://avatar.vercel.sh/jenny",
    },
    {
      name: "James Brown",
      username: "@jamesbrown",
      body: "I'm at a loss for words. This is amazing. I love it.",
      img: "https://avatar.vercel.sh/james",
    },
  ];

  // Mock reviews data
  const reviews = [
    {
      id: '1',
      publication: 'The Sydney Morning Herald',
      rating: 5,
      hookLine: 'A masterclass in observational comedy that left audiences in stitches',
      url: 'https://example.com/review1',
      date: 'March 2024'
    },
    {
      id: '2',
      publication: 'Time Out Melbourne',
      rating: 4,
      hookLine: 'Fresh perspective and razor-sharp wit make this a must-see show',
      url: 'https://example.com/review2',
      date: 'February 2024'
    },
    {
      id: '3',
      publication: 'Australian Comedy Review',
      rating: 5,
      hookLine: 'Pure comedic gold that showcases exceptional storytelling ability',
      url: 'https://example.com/review3',
      date: 'January 2024'
    }
  ];

  const ReviewCard = ({ img, name, username, body }: { img: string; name: string; username: string; body: string }) => {
    return (
      <figure className={cn(
        "relative h-full w-64 cursor-pointer overflow-hidden rounded-xl border p-4",
        // light styles
        "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
        // dark styles
        "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]",
      )}>
        <div className="flex flex-row items-center gap-2">
          <img className="rounded-full" width="32" height="32" alt="" src={img} />
          <div className="flex flex-col">
            <figcaption className="text-sm font-medium dark:text-white">
              {name}
            </figcaption>
            <p className="text-xs font-medium dark:text-white/40">{username}</p>
          </div>
        </div>
        <blockquote className="mt-2 text-sm">{body}</blockquote>
      </figure>
    );
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const firstRow = vouches.slice(0, vouches.length / 2);
  const secondRow = vouches.slice(vouches.length / 2);

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white text-2xl">
          <Trophy className="w-6 h-6 text-purple-400" />
          Accomplishments & Reviews
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Accomplishments Section */}
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">Career Highlights</h3>
          <div className="space-y-3">
            {accomplishments.map((accomplishment, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-300">{accomplishment}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Vouches Section */}
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">Comedian Vouches</h3>
          <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
            <Marquee pauseOnHover className="[--duration:20s]">
              {firstRow.map((review) => (
                <ReviewCard key={review.username} {...review} />
              ))}
            </Marquee>
            <Marquee reverse pauseOnHover className="[--duration:20s]">
              {secondRow.map((review) => (
                <ReviewCard key={review.username} {...review} />
              ))}
            </Marquee>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-background"></div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-background"></div>
          </div>
        </div>

        {/* Reviews Section */}
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">Press Reviews</h3>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50">
                {renderStars(review.rating)}
                <blockquote className="text-gray-300 italic mb-3">
                  "{review.hookLine}"
                </blockquote>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{review.publication}</p>
                    <p className="text-gray-400 text-sm">{review.date}</p>
                  </div>
                  <a 
                    href={review.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Read Full Review
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComedianAccomplishments;
