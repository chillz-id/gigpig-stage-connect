import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  MoreVertical,
  Users,
  Download,
  Upload,
  Pencil,
  Trash2,
  Mail,
} from 'lucide-react';
import type { SegmentWithId } from '@/services/crm/segment-service';

interface SegmentCardProps {
  segment: SegmentWithId;
  customerCount: number;
  onEdit: (segment: SegmentWithId) => void;
  onDelete: (segment: SegmentWithId) => void;
  onExport: (segment: SegmentWithId) => void;
  onImport: (segment: SegmentWithId) => void;
  onSendEDM: (segment: SegmentWithId) => void;
  isDeleting?: boolean;
}

export function SegmentCard({
  segment,
  customerCount,
  onEdit,
  onDelete,
  onExport,
  onImport,
  onSendEDM,
  isDeleting,
}: SegmentCardProps) {
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleViewCustomers = () => {
    navigate(`/crm/customers?segment=${segment.slug}`);
  };

  const handleDeleteConfirm = () => {
    onDelete(segment);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {segment.color && (
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
              )}
              <h3 className="font-semibold text-lg">{segment.name}</h3>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleViewCustomers}>
                  <Users className="mr-2 h-4 w-4" />
                  View Customers
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onImport(segment)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import to Segment
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport(segment)}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit(segment)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Segment
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Segment
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {segment.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {segment.description}
            </p>
          )}
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-sm">
              {customerCount.toLocaleString()} customer{customerCount !== 1 ? 's' : ''}
            </Badge>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onSendEDM(segment)}
              disabled={customerCount === 0}
            >
              <Mail className="mr-2 h-4 w-4" />
              Send EDM
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Segment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{segment.name}"? This will remove{' '}
              {customerCount} customer{customerCount !== 1 ? 's' : ''} from this
              segment. The customers themselves will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
