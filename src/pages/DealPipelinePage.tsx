import { useState } from "react";
import { useDeals, Deal } from "@/hooks/useDeals";
import { DealKanbanBoard } from "@/components/crm/DealKanbanBoard";
import { DealFiltersComponent, DealFilters } from "@/components/deals/DealFilters";
import DealNegotiationEngine from "@/components/agency/DealNegotiationEngine";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, TrendingUp, DollarSign, AlertCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DealPipelinePage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<DealFilters>({
    search: "",
    priority: "all",
    assignedTo: "all",
    sortBy: "value-desc",
  });
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isNegotiationModalOpen, setIsNegotiationModalOpen] = useState(false);

  const { data: deals, isLoading, error } = useDeals();

  const handleDealClick = (deal: Deal) => {
    setSelectedDeal(deal);
    setIsNegotiationModalOpen(true);
  };

  const handleCloseNegotiationModal = () => {
    setIsNegotiationModalOpen(false);
    setSelectedDeal(null);
  };

  // Filter and sort deals based on filters
  const filteredDeals = deals
    ? deals
        .filter((deal) => {
          // Search filter
          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const matchesSearch =
              deal.comedian_name?.toLowerCase().includes(searchLower) ||
              deal.event_name?.toLowerCase().includes(searchLower) ||
              deal.venue_name?.toLowerCase().includes(searchLower);
            if (!matchesSearch) return false;
          }

          // Priority filter
          if (filters.priority !== "all" && deal.priority !== filters.priority) {
            return false;
          }

          // Assignee filter
          if (filters.assignedTo !== "all" && deal.assigned_to !== filters.assignedTo) {
            return false;
          }

          return true;
        })
        .sort((a, b) => {
          // Sort logic
          switch (filters.sortBy) {
            case "value-desc":
              return (b.total_value || 0) - (a.total_value || 0);
            case "value-asc":
              return (a.total_value || 0) - (b.total_value || 0);
            case "date-desc":
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            case "date-asc":
              return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            case "updated-desc":
              return new Date(b.updated_at || b.created_at).getTime() -
                     new Date(a.updated_at || a.created_at).getTime();
            default:
              return 0;
          }
        })
    : [];

  // Calculate pipeline metrics
  const metrics = {
    totalValue: filteredDeals.reduce((sum, deal) => sum + (deal.total_value || 0), 0),
    activeDeals: filteredDeals.length,
    highPriority: filteredDeals.filter((d) => d.priority === "high").length,
    closingSoon: filteredDeals.filter((d) => {
      if (!d.expected_close_date) return false;
      const daysUntilClose = Math.floor(
        (new Date(d.expected_close_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilClose >= 0 && daysUntilClose <= 7;
    }).length,
  };

  const handleCreateDeal = () => {
    navigate("/deals/new");
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <p>Error loading deals: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Deal Pipeline</h1>
          <p className="text-muted-foreground">
            Manage and track comedy show bookings through the sales pipeline
          </p>
        </div>
        <Button onClick={handleCreateDeal}>
          <Plus className="h-4 w-4 mr-2" />
          New Deal
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Pipeline Value</p>
              <p className="text-2xl font-bold">
                ${metrics.totalValue.toLocaleString()}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Deals</p>
              <p className="text-2xl font-bold">{metrics.activeDeals}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">High Priority</p>
              <p className="text-2xl font-bold">{metrics.highPriority}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Closing This Week</p>
              <p className="text-2xl font-bold">{metrics.closingSoon}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <DealFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        assignees={[
          // TODO: Fetch from Supabase profiles table
          { id: "all", name: "All Assignees" },
        ]}
      />

      {/* Kanban Board */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DealKanbanBoard
          dealsByStatus={filteredDeals.reduce((acc, deal) => {
            if (!acc[deal.status]) {
              acc[deal.status] = [];
            }
            acc[deal.status]!.push(deal);
            return acc;
          }, {} as Record<string, Deal[]>)}
          onDealClick={handleDealClick}
        />
      )}

      {/* Negotiation Modal */}
      <Dialog open={isNegotiationModalOpen} onOpenChange={setIsNegotiationModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Deal Negotiation</DialogTitle>
          </DialogHeader>
          {selectedDeal && (
            <DealNegotiationEngine
              dealId={selectedDeal.id}
              onClose={handleCloseNegotiationModal}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
