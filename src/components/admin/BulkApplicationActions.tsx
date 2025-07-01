
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, EyeOff, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BulkApplicationActionsProps {
  selectedApplications: string[];
  onBulkApprove: (applicationIds: string[]) => Promise<void>;
  onBulkHide: (applicationIds: string[]) => Promise<void>;
  onClearSelection: () => void;
  isProcessing?: boolean;
}

const BulkApplicationActions: React.FC<BulkApplicationActionsProps> = ({
  selectedApplications,
  onBulkApprove,
  onBulkHide,
  onClearSelection,
  isProcessing = false,
}) => {
  const { toast } = useToast();

  const handleBulkApprove = async () => {
    if (selectedApplications.length === 0) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to approve ${selectedApplications.length} application${selectedApplications.length > 1 ? 's' : ''}?`
    );
    
    if (confirmed) {
      try {
        await onBulkApprove(selectedApplications);
        toast({
          title: "Applications Approved",
          description: `${selectedApplications.length} application${selectedApplications.length > 1 ? 's' : ''} approved successfully.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to approve applications.",
          variant: "destructive",
        });
      }
    }
  };

  const handleBulkHide = async () => {
    if (selectedApplications.length === 0) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to hide ${selectedApplications.length} application${selectedApplications.length > 1 ? 's' : ''}?`
    );
    
    if (confirmed) {
      try {
        await onBulkHide(selectedApplications);
        toast({
          title: "Applications Hidden",
          description: `${selectedApplications.length} application${selectedApplications.length > 1 ? 's' : ''} hidden successfully.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to hide applications.",
          variant: "destructive",
        });
      }
    }
  };

  if (selectedApplications.length === 0) {
    return null;
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm border-white/20 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-white border-white/30">
            {selectedApplications.length} selected
          </Badge>
          <span className="text-white text-sm">
            Bulk actions for selected applications
          </span>
        </div>
        
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleBulkApprove}
            disabled={isProcessing}
            className="bg-green-600 hover:bg-green-700"
          >
            <Check className="w-4 h-4 mr-1" />
            Approve All
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleBulkHide}
            disabled={isProcessing}
            className="text-white border-white/30 hover:bg-white/10"
          >
            <EyeOff className="w-4 h-4 mr-1" />
            Hide All
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={onClearSelection}
            className="text-white border-white/30 hover:bg-white/10"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear Selection
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkApplicationActions;
