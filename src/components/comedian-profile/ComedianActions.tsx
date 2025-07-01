
import React from 'react';
import { Button } from '@/components/ui/button';
import { Mail, Share2 } from 'lucide-react';

interface ComedianActionsProps {
  email: string | null;
  name: string | null;
  onShare: () => void;
}

const ComedianActions: React.FC<ComedianActionsProps> = ({ email, name, onShare }) => {
  const handleContact = () => {
    if (email) {
      window.location.href = `mailto:${email}?subject=Booking Inquiry from Stand Up Sydney`;
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
      {email && (
        <Button onClick={handleContact} className="flex items-center gap-2">
          <Mail className="w-4 h-4" />
          Contact for Booking
        </Button>
      )}
      
      <Button variant="outline" onClick={onShare} className="flex items-center gap-2">
        <Share2 className="w-4 h-4" />
        Share Profile
      </Button>
    </div>
  );
};

export default ComedianActions;
