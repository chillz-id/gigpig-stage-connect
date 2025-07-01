
import React from 'react';
import { Button } from '@/components/ui/button';
import { Mail, Share2, Calendar } from 'lucide-react';

interface ComedianActionsProps {
  email: string | null;
  name: string | null;
  onShare: () => void;
}

const ComedianActions: React.FC<ComedianActionsProps> = ({ email, name, onShare }) => {
  const handleContact = () => {
    if (email) {
      const subject = `Booking Inquiry for ${name}`;
      const body = `Hi ${name},\n\nI'm interested in booking you for an upcoming show. Let's discuss the details.\n\nBest regards,`;
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
  };

  return (
    <div className="flex flex-wrap gap-4">
      <Button 
        onClick={handleContact}
        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
        disabled={!email}
      >
        <Mail className="w-5 h-5 mr-2" />
        Book Now
      </Button>
      
      <Button 
        variant="outline"
        onClick={onShare}
        className="border-2 border-white/30 text-white hover:bg-white/10 px-6 py-3 text-lg backdrop-blur-sm"
      >
        <Share2 className="w-5 h-5 mr-2" />
        Share Profile
      </Button>
      
      <Button 
        variant="outline"
        className="border-2 border-white/30 text-white hover:bg-white/10 px-6 py-3 text-lg backdrop-blur-sm"
      >
        <Calendar className="w-5 h-5 mr-2" />
        Check Availability
      </Button>
    </div>
  );
};

export default ComedianActions;
