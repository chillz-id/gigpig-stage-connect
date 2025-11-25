
import React from 'react';
import { Button } from '@/components/ui/button';

interface BookingDialogActionsProps {
  loading: boolean;
  onCancel: () => void;
  onSave: () => void;
}

const BookingDialogActions: React.FC<BookingDialogActionsProps> = ({ loading, onCancel, onSave }) => {
  return (
    <div className="flex justify-end space-x-2">
      <Button
        className="professional-button"
        onClick={onCancel}
        className="border-white/20 text-white hover:bg-white/10"
        disabled={loading}
      >
        Cancel
      </Button>
      <Button
        onClick={onSave}
        disabled={loading}
        className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
      >
        {loading ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  );
};

export default BookingDialogActions;
