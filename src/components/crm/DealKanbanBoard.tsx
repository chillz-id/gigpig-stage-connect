import { useState, useEffect, useRef } from 'react';
import { Deal, DealStatus, useUpdateDealStatus } from '@/hooks/useDeals';
import { DealCard } from './DealCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  FileText,
  MessageSquare,
  Repeat,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';

interface DealKanbanBoardProps {
  dealsByStatus: Record<DealStatus, Deal[]>;
  isLoading?: boolean;
  onDealClick: (deal: Deal) => void;
}

/**
 * DealKanbanBoard Component
 *
 * Drag-and-drop kanban board for deal pipeline:
 * - 6 columns (proposed, negotiating, counter_offered, accepted, declined, expired)
 * - Drag cards between columns to update status
 * - Visual feedback during drag
 * - Automatic mutation on drop
 * - Keyboard accessible with arrow keys and Enter/Space
 *
 * Keyboard shortcuts:
 * - Arrow keys: Navigate between deals and columns
 * - Enter: Open deal details
 * - Space: Select/grab deal
 * - Shift + Arrow Left/Right: Move selected deal to adjacent column
 */
export const DealKanbanBoard = ({
  dealsByStatus,
  isLoading,
  onDealClick,
}: DealKanbanBoardProps) => {
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<DealStatus | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [focusedColumn, setFocusedColumn] = useState<number>(0);
  const [focusedDealIndex, setFocusedDealIndex] = useState<number>(0);
  const kanbanRef = useRef<HTMLDivElement>(null);

  const updateStatusMutation = useUpdateDealStatus();

  const columns: Array<{
    status: DealStatus;
    title: string;
    icon: React.ReactNode;
    color: string;
  }> = [
    {
      status: 'proposed',
      title: 'Proposed',
      icon: <FileText className="h-4 w-4" />,
      color: 'bg-purple-100 border-purple-300 text-purple-800',
    },
    {
      status: 'negotiating',
      title: 'Negotiating',
      icon: <MessageSquare className="h-4 w-4" />,
      color: 'bg-blue-100 border-blue-300 text-blue-800',
    },
    {
      status: 'counter_offered',
      title: 'Counter Offer',
      icon: <Repeat className="h-4 w-4" />,
      color: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    },
    {
      status: 'accepted',
      title: 'Accepted',
      icon: <CheckCircle className="h-4 w-4" />,
      color: 'bg-green-100 border-green-300 text-green-800',
    },
    {
      status: 'declined',
      title: 'Declined',
      icon: <XCircle className="h-4 w-4" />,
      color: 'bg-red-100 border-red-300 text-red-800',
    },
    {
      status: 'expired',
      title: 'Expired',
      icon: <Clock className="h-4 w-4" />,
      color: 'bg-gray-100 border-gray-300 text-gray-800',
    },
  ];

  const handleDragStart = (e: React.DragEvent, deal: Deal) => {
    setDraggedDeal(deal);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);

    // Add visual feedback to dragged element
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedDeal(null);
    setDragOverColumn(null);
    e.currentTarget.classList.remove('opacity-50');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (status: DealStatus) => {
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: DealStatus) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedDeal) return;

    // Don't update if dropped in same column
    if (draggedDeal.status === targetStatus) {
      setDraggedDeal(null);
      return;
    }

    try {
      await updateStatusMutation.mutateAsync({
        dealId: draggedDeal.id,
        status: targetStatus,
      });

      toast.success(
        `Deal "${draggedDeal.title}" moved to ${targetStatus.replace('_', ' ')}`
      );

      // Announce status change to screen readers
      announceToScreenReader(
        `Deal ${draggedDeal.title} successfully moved to ${targetStatus.replace('_', ' ')}`
      );
    } catch (error) {
      console.error('Error updating deal status:', error);
      toast.error('Failed to update deal status');
    } finally {
      setDraggedDeal(null);
    }
  };

  // Announce updates to screen readers
  const announceToScreenReader = (message: string) => {
    const announcer = document.getElementById('crm-status-announcements');
    if (announcer) {
      announcer.textContent = message;
      setTimeout(() => {
        announcer.textContent = '';
      }, 1000);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const currentColumnDeals = dealsByStatus[columns[focusedColumn]?.status] || [];

    switch (e.key) {
      case 'ArrowRight':
        if (e.shiftKey && selectedDeal) {
          // Move selected deal to next column
          e.preventDefault();
          moveDealToColumn(selectedDeal, focusedColumn + 1);
        } else if (focusedColumn < columns.length - 1) {
          // Navigate to next column
          e.preventDefault();
          setFocusedColumn(focusedColumn + 1);
          setFocusedDealIndex(0);
        }
        break;

      case 'ArrowLeft':
        if (e.shiftKey && selectedDeal) {
          // Move selected deal to previous column
          e.preventDefault();
          moveDealToColumn(selectedDeal, focusedColumn - 1);
        } else if (focusedColumn > 0) {
          // Navigate to previous column
          e.preventDefault();
          setFocusedColumn(focusedColumn - 1);
          setFocusedDealIndex(0);
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (focusedDealIndex < currentColumnDeals.length - 1) {
          setFocusedDealIndex(focusedDealIndex + 1);
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (focusedDealIndex > 0) {
          setFocusedDealIndex(focusedDealIndex - 1);
        }
        break;

      case 'Enter':
        e.preventDefault();
        if (currentColumnDeals[focusedDealIndex]) {
          onDealClick(currentColumnDeals[focusedDealIndex]!);
        }
        break;

      case ' ':
        e.preventDefault();
        if (currentColumnDeals[focusedDealIndex]) {
          setSelectedDeal(
            selectedDeal?.id === currentColumnDeals[focusedDealIndex]?.id
              ? null
              : currentColumnDeals[focusedDealIndex] ?? null
          );
          announceToScreenReader(
            selectedDeal?.id === currentColumnDeals[focusedDealIndex]?.id
              ? 'Deal deselected'
              : `Deal ${currentColumnDeals[focusedDealIndex]?.title} selected. Use Shift + Arrow keys to move.`
          );
        }
        break;

      case 'Escape':
        e.preventDefault();
        setSelectedDeal(null);
        announceToScreenReader('Deal deselected');
        break;
    }
  };

  const moveDealToColumn = async (deal: Deal, targetColumnIndex: number) => {
    if (targetColumnIndex < 0 || targetColumnIndex >= columns.length) return;

    const targetStatus = columns[targetColumnIndex]?.status;
    if (!targetStatus || deal.status === targetStatus) return;

    try {
      await updateStatusMutation.mutateAsync({
        dealId: deal.id,
        status: targetStatus,
      });

      toast.success(`Deal "${deal.title}" moved to ${targetStatus.replace('_', ' ')}`);
      announceToScreenReader(
        `Deal ${deal.title} successfully moved to ${targetStatus.replace('_', ' ')}`
      );
      setSelectedDeal(null);
      setFocusedColumn(targetColumnIndex);
    } catch (error) {
      console.error('Error updating deal status:', error);
      toast.error('Failed to update deal status');
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {columns.map((column) => (
          <Card key={column.status} className="min-h-[400px]">
            <CardHeader className="pb-3">
              <div className="h-6 w-32 bg-gray-200 animate-pulse rounded" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-40 bg-gray-100 animate-pulse rounded" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={kanbanRef}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="application"
      aria-label="Deal pipeline kanban board - Use arrow keys to navigate, Space to select, Shift+Arrow to move deals"
    >
      {columns.map((column, columnIndex) => {
        const deals = dealsByStatus[column.status] || [];
        const isDropTarget = dragOverColumn === column.status;
        const isFocusedColumn = focusedColumn === columnIndex;

        return (
          <Card
            key={column.status}
            className={`transition-all ${
              isDropTarget ? 'ring-2 ring-purple-500 ring-offset-2 scale-105' : ''
            } ${isFocusedColumn ? 'ring-2 ring-blue-400' : ''}`}
            onDragOver={handleDragOver}
            onDragEnter={() => handleDragEnter(column.status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.status)}
            role="region"
            aria-label={`${column.title} column with ${deals.length} deals`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  {column.icon}
                  {column.title}
                </CardTitle>
                <Badge
                  variant="secondary"
                  className={`${column.color} font-semibold`}
                >
                  {deals.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {deals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <p>No deals</p>
                  <p className="text-xs mt-1">Drag cards here</p>
                </div>
              ) : (
                deals.map((deal, dealIndex) => {
                  const isFocused =
                    isFocusedColumn && focusedDealIndex === dealIndex;
                  const isSelected = selectedDeal?.id === deal.id;

                  return (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, deal)}
                      onDragEnd={handleDragEnd}
                      className={`cursor-move transition-all ${
                        isFocused ? 'ring-2 ring-blue-500' : ''
                      } ${isSelected ? 'ring-2 ring-green-500' : ''}`}
                      tabIndex={isFocused ? 0 : -1}
                      role="button"
                      aria-pressed={isSelected}
                      aria-label={`Deal: ${deal.title}, Status: ${column.title}${
                        isSelected ? ', Selected' : ''
                      }`}
                    >
                      <DealCard
                        deal={deal}
                        onClick={() => onDealClick(deal)}
                        isDragging={draggedDeal?.id === deal.id}
                      />
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
