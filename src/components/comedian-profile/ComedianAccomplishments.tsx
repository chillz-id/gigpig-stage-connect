
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import CareerHighlights from './accomplishments/CareerHighlights';
import ComedianVouches from './accomplishments/ComedianVouches';
import PressReviews from './accomplishments/PressReviews';

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

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white text-2xl">
          <Trophy className="w-6 h-6 text-purple-400" />
          Accomplishments & Reviews
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <CareerHighlights accomplishments={accomplishments} />
        <ComedianVouches vouches={vouches} />
        <PressReviews reviews={reviews} />
      </CardContent>
    </Card>
  );
};

export default ComedianAccomplishments;
