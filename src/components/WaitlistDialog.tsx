
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { WaitlistForm } from './WaitlistForm';
import { Users } from 'lucide-react';

interface WaitlistDialogProps {
  eventId: string;
  eventTitle: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export const WaitlistDialog: React.FC<WaitlistDialogProps> = ({
  eventId,
  eventTitle,
  trigger,
  onSuccess
}) => {
  const [open, setOpen] = React.useState(false);

  const handleSuccess = () => {
    setOpen(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full">
            <Users className="w-4 h-4 mr-2" />
            Join Waitlist
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Join Waitlist</DialogTitle>
          <DialogDescription>
            Enter your details to join the waitlist for "{eventTitle}"
          </DialogDescription>
        </DialogHeader>
        <WaitlistForm
          eventId={eventId}
          eventTitle={eventTitle}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  );
};
