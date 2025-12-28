// Tour Collaboration Manager - Handle multi-promoter partnerships and collaboration features
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { 
  Users, 
  Plus, 
  Mail, 
  MapPin, 
  Star,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Handshake,
  UserPlus,
  Send,
  Eye,
  Edit,
  Trash2,
  Phone,
  Building,
  Target,
  TrendingUp,
  Award,
  MessageSquare,
  FileText,
  Share2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { tourService } from '@/services/tourService';
import { cn } from '@/lib/utils';
import type { 
  TourCollaboration, 
  TourCollaborationWithUser,
  CollaborationRole,
  CollaborationStatus,
  CreateTourCollaborationRequest,
  Tour
} from '@/types/tour';

interface TourCollaborationManagerProps {
  tour: Tour;
  isOwner: boolean;
}

const TourCollaborationManager: React.FC<TourCollaborationManagerProps> = ({ 
  tour, 
  isOwner 
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedCollaboration, setSelectedCollaboration] = useState<TourCollaborationWithUser | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Query for collaborations
  const { data: collaborations = [], isLoading } = useQuery({
    queryKey: ['tour-collaborations', tour.id],
    queryFn: () => tourService.getTourCollaborations(tour.id),
    refetchInterval: 30000 // Refresh every 30 seconds for real-time updates
  });

  // Mutations
  const inviteCollaboratorMutation = useMutation({
    mutationFn: tourService.createTourCollaboration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tour-collaborations', tour.id] });
      toast({
        title: "Invitation Sent",
        description: "Collaboration invitation has been sent successfully.",
      });
      setShowInviteModal(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send collaboration invitation.",
        variant: "destructive",
      });
    }
  });

  const respondToCollaborationMutation = useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) => 
      tourService.respondToCollaboration(id, accept),
    onSuccess: (_, { accept }) => {
      queryClient.invalidateQueries({ queryKey: ['tour-collaborations', tour.id] });
      toast({
        title: accept ? "Invitation Accepted" : "Invitation Declined",
        description: accept 
          ? "You are now a collaborator on this tour!" 
          : "You have declined the collaboration invitation.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to respond to collaboration invitation.",
        variant: "destructive",
      });
    }
  });

  const updateCollaborationMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTourCollaborationRequest> }) => 
      tourService.updateTourCollaboration(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tour-collaborations', tour.id] });
      toast({
        title: "Collaboration Updated",
        description: "Collaboration details have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update collaboration details.",
        variant: "destructive",
      });
    }
  });

  const deleteCollaborationMutation = useMutation({
    mutationFn: tourService.deleteTourCollaboration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tour-collaborations', tour.id] });
      toast({
        title: "Collaboration Removed",
        description: "Collaborator has been removed from the tour.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove collaborator.",
        variant: "destructive",
      });
    }
  });

  // Helper functions
  const getStatusColor = (status: CollaborationStatus): string => {
    const colors = {
      invited: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
      active: 'bg-green-100 text-green-800 border-green-300',
      completed: 'bg-gray-100 text-gray-800 border-gray-300',
      declined: 'bg-red-100 text-red-800 border-red-300',
      terminated: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[status] || colors.invited;
  };

  const getStatusIcon = (status: CollaborationStatus) => {
    const icons = {
      invited: <Clock className="w-4 h-4" />,
      confirmed: <CheckCircle className="w-4 h-4" />,
      active: <TrendingUp className="w-4 h-4" />,
      completed: <Award className="w-4 h-4" />,
      declined: <XCircle className="w-4 h-4" />,
      terminated: <AlertCircle className="w-4 h-4" />
    };
    return icons[status] || icons.invited;
  };

  const getRoleDisplayName = (role: CollaborationRole): string => {
    const names = {
      co_promoter: 'Co-Promoter',
      local_promoter: 'Local Promoter',
      sponsor: 'Sponsor',
      partner: 'Partner',
      venue_partner: 'Venue Partner',
      media_partner: 'Media Partner'
    };
    return names[role] || role;
  };

  const canManageCollaborations = isOwner || user?.id === tour.tour_manager_id;
  const userCollaboration = collaborations.find(c => c.collaborator_id === user?.id);
  const pendingInvitations = collaborations.filter(c => c.status === 'invited');
  const activeCollaborations = collaborations.filter(c => c.status === 'active');

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Tour Collaborations</h2>
          <p className="text-blue-200">
            Manage partnerships and co-promoter relationships for {tour.name}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-blue-200">
            <Users className="w-4 h-4" />
            <span>{activeCollaborations.length} Active</span>
          </div>
          
          {pendingInvitations.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-yellow-200">
              <Clock className="w-4 h-4" />
              <span>{pendingInvitations.length} Pending</span>
            </div>
          )}
          
          {canManageCollaborations && (
            <Button 
              onClick={() => setShowInviteModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Collaborator
            </Button>
          )}
        </div>
      </div>

      {/* Pending invitations for current user */}
      {userCollaboration?.status === 'invited' && (
        <Card className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-yellow-500/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <Handshake className="w-12 h-12 text-yellow-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Collaboration Invitation
                </h3>
                <p className="text-yellow-100 mb-4">
                  You've been invited to collaborate on this tour as a {getRoleDisplayName(userCollaboration.role)}.
                  {userCollaboration.revenue_share && (
                    <span className="block mt-1">
                      Revenue Share: {userCollaboration.revenue_share}%
                    </span>
                  )}
                </p>
                <div className="flex gap-3">
                  <Button 
                    onClick={() => respondToCollaborationMutation.mutate({ 
                      id: userCollaboration.id, 
                      accept: true 
                    })}
                    disabled={respondToCollaborationMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept
                  </Button>
                  <Button 
                    onClick={() => respondToCollaborationMutation.mutate({ 
                      id: userCollaboration.id, 
                      accept: false 
                    })}
                    disabled={respondToCollaborationMutation.isPending}
                    className="professional-button"
                    className="border-red-400/30 text-red-300 hover:bg-red-500/20"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Decline
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Collaborations grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collaborations.map((collaboration) => (
          <Card 
            key={collaboration.id} 
            className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 transition-colors"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {collaboration.collaborator?.avatar_url ? (
                      <img 
                        src={collaboration.collaborator.avatar_url} 
                        alt={collaboration.collaborator.name || 'Collaborator'}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                        <Building className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-white text-sm">
                        {collaboration.collaborator?.company_name || 
                         collaboration.collaborator?.name || 
                         'Unknown Collaborator'}
                      </CardTitle>
                      {collaboration.collaborator?.company_name && collaboration.collaborator?.name && (
                        <p className="text-xs text-gray-400">{collaboration.collaborator.name}</p>
                      )}
                    </div>
                  </div>
                  
                  <Badge className={cn("mb-2", getStatusColor(collaboration.status))}>
                    {getStatusIcon(collaboration.status)}
                    <span className="ml-1 capitalize">{collaboration.status}</span>
                  </Badge>
                  
                  <p className="text-sm text-blue-200">
                    {getRoleDisplayName(collaboration.role)}
                  </p>
                </div>
                
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCollaboration(collaboration);
                      setShowDetailsModal(true);
                    }}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  
                  {canManageCollaborations && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (window.confirm('Remove this collaborator from the tour?')) {
                          deleteCollaborationMutation.mutate(collaboration.id);
                        }
                      }}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-2">
                {collaboration.revenue_share && (
                  <div className="flex items-center text-sm text-gray-300">
                    <DollarSign className="w-4 h-4 mr-2 text-green-400" />
                    <span>{collaboration.revenue_share}% revenue share</span>
                  </div>
                )}
                
                {collaboration.local_knowledge && (
                  <div className="flex items-center text-sm text-gray-300">
                    <MapPin className="w-4 h-4 mr-2 text-blue-400" />
                    <span className="truncate">Local expertise</span>
                  </div>
                )}
                
                {collaboration.decision_making_power && (
                  <div className="flex items-center text-sm text-gray-300">
                    <Target className="w-4 h-4 mr-2 text-purple-400" />
                    <span>Decision making power</span>
                  </div>
                )}
                
                {collaboration.responsibilities && collaboration.responsibilities.length > 0 && (
                  <div className="flex items-center text-sm text-gray-300">
                    <FileText className="w-4 h-4 mr-2 text-orange-400" />
                    <span>{collaboration.responsibilities.length} responsibilities</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      {collaborations.length === 0 && !isLoading && (
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="py-16 text-center">
            <Handshake className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-white mb-2">No collaborations yet</h3>
            <p className="text-gray-400 mb-6">
              Start building partnerships with other promoters to make this tour amazing!
            </p>
            {canManageCollaborations && (
              <Button 
                onClick={() => setShowInviteModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Your First Collaborator
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading collaborations...</p>
          </div>
        </div>
      )}

      {/* Invite Collaborator Modal */}
      <InviteCollaboratorModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        tourId={tour.id}
        onSubmit={inviteCollaboratorMutation.mutate}
        isLoading={inviteCollaboratorMutation.isPending}
      />

      {/* Collaboration Details Modal */}
      <CollaborationDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        collaboration={selectedCollaboration}
        canEdit={canManageCollaborations}
        onUpdate={(data) => {
          if (selectedCollaboration) {
            updateCollaborationMutation.mutate({ 
              id: selectedCollaboration.id, 
              data 
            });
          }
        }}
        isLoading={updateCollaborationMutation.isPending}
      />
    </div>
  );
};

// Invite Collaborator Modal Component
interface InviteCollaboratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tourId: string;
  onSubmit: (data: CreateTourCollaborationRequest) => void;
  isLoading: boolean;
}

const InviteCollaboratorModal: React.FC<InviteCollaboratorModalProps> = ({
  isOpen,
  onClose,
  tourId,
  onSubmit,
  isLoading
}) => {
  const [formData, setFormData] = useState<Partial<CreateTourCollaborationRequest>>({
    tour_id: tourId,
    role: 'co_promoter',
    contact_priority: 1,
    decision_making_power: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.collaborator_id) {
      onSubmit(formData as CreateTourCollaborationRequest);
      setFormData({
        tour_id: tourId,
        role: 'co_promoter',
        contact_priority: 1,
        decision_making_power: false
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Invite Collaborator</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Collaborator Email *</label>
              <Input
                required
                type="email"
                placeholder="collaborator@example.com"
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  collaborator_id: e.target.value // This would be resolved to user ID in real implementation
                }))}
                className="bg-slate-900/50 border-slate-600/50 text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Role</label>
              <Select 
                value={formData.role} 
                onValueChange={(value: CollaborationRole) => 
                  setFormData(prev => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger className="bg-slate-900/50 border-slate-600/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="co_promoter">Co-Promoter</SelectItem>
                  <SelectItem value="local_promoter">Local Promoter</SelectItem>
                  <SelectItem value="sponsor">Sponsor</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                  <SelectItem value="venue_partner">Venue Partner</SelectItem>
                  <SelectItem value="media_partner">Media Partner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Revenue Share (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                placeholder="0"
                value={formData.revenue_share || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  revenue_share: parseFloat(e.target.value) || undefined 
                }))}
                className="bg-slate-900/50 border-slate-600/50 text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Contact Priority</label>
              <Select 
                value={formData.contact_priority?.toString()} 
                onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, contact_priority: parseInt(value) }))
                }
              >
                <SelectTrigger className="bg-slate-900/50 border-slate-600/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="1">Primary Contact</SelectItem>
                  <SelectItem value="2">Secondary Contact</SelectItem>
                  <SelectItem value="3">Backup Contact</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Responsibilities</label>
            <Textarea
              placeholder="List specific responsibilities and expectations..."
              onChange={(e) => {
                const responsibilities = e.target.value.split('\n').filter(r => r.trim());
                setFormData(prev => ({ ...prev, responsibilities }));
              }}
              className="bg-slate-900/50 border-slate-600/50 text-white h-24 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Local Knowledge & Connections</label>
            <Textarea
              placeholder="Describe their local market expertise, venue connections, etc..."
              onChange={(e) => setFormData(prev => ({ ...prev, local_knowledge: e.target.value }))}
              className="bg-slate-900/50 border-slate-600/50 text-white h-20 resize-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="decision_making"
              checked={formData.decision_making_power}
              onCheckedChange={(checked) => setFormData(prev => ({
                ...prev,
                decision_making_power: checked === true
              }))}
            />
            <Label htmlFor="decision_making" className="text-sm cursor-pointer">
              Grant decision-making power for tour management
            </Label>
          </div>

          <div className="flex gap-3 pt-6">
            <Button
              type="button"
              className="professional-button"
              onClick={onClose}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isLoading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Collaboration Details Modal Component
interface CollaborationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  collaboration: TourCollaborationWithUser | null;
  canEdit: boolean;
  onUpdate: (data: Partial<CreateTourCollaborationRequest>) => void;
  isLoading: boolean;
}

const CollaborationDetailsModal: React.FC<CollaborationDetailsModalProps> = ({
  isOpen,
  onClose,
  collaboration,
  canEdit,
  onUpdate,
  isLoading
}) => {
  if (!collaboration) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Collaboration Details - {collaboration.collaborator?.company_name || collaboration.collaborator?.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Collaborator info */}
          <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg">
            {collaboration.collaborator?.avatar_url ? (
              <img 
                src={collaboration.collaborator.avatar_url} 
                alt={collaboration.collaborator.name || 'Collaborator'}
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <Building className="w-8 h-8 text-white" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-xl font-semibold">
                {collaboration.collaborator?.company_name || collaboration.collaborator?.name}
              </h3>
              {collaboration.collaborator?.company_name && collaboration.collaborator?.name && (
                <p className="text-gray-400">{collaboration.collaborator.name}</p>
              )}
              <p className="text-blue-200">{collaboration.collaborator?.email}</p>
            </div>
            <Badge className={cn("", getStatusColor(collaboration.status))}>
              {getStatusIcon(collaboration.status)}
              <span className="ml-1 capitalize">{collaboration.status}</span>
            </Badge>
          </div>

          {/* Collaboration details grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Role & Responsibilities</h4>
              <div className="space-y-2">
                <p><span className="text-gray-400">Role:</span> {getRoleDisplayName(collaboration.role)}</p>
                <p><span className="text-gray-400">Contact Priority:</span> {collaboration.contact_priority}</p>
                <p><span className="text-gray-400">Decision Making:</span> {collaboration.decision_making_power ? 'Yes' : 'No'}</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Financial Terms</h4>
              <div className="space-y-2">
                {collaboration.revenue_share && (
                  <p><span className="text-gray-400">Revenue Share:</span> {collaboration.revenue_share}%</p>
                )}
                {collaboration.expense_share && (
                  <p><span className="text-gray-400">Expense Share:</span> {collaboration.expense_share}%</p>
                )}
                {collaboration.financial_responsibility && (
                  <p><span className="text-gray-400">Financial Responsibility:</span> ${collaboration.financial_responsibility.toLocaleString()}</p>
                )}
              </div>
            </div>
          </div>

          {/* Responsibilities */}
          {collaboration.responsibilities && collaboration.responsibilities.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Specific Responsibilities</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                {collaboration.responsibilities.map((responsibility, index) => (
                  <li key={index}>{responsibility}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Local knowledge */}
          {collaboration.local_knowledge && (
            <div>
              <h4 className="font-semibold mb-3">Local Knowledge & Connections</h4>
              <p className="text-gray-300">{collaboration.local_knowledge}</p>
            </div>
          )}

          {/* Timeline */}
          <div>
            <h4 className="font-semibold mb-3">Timeline</h4>
            <div className="space-y-2 text-sm text-gray-300">
              {collaboration.invitation_sent_at && (
                <p>Invited: {new Date(collaboration.invitation_sent_at).toLocaleDateString()}</p>
              )}
              {collaboration.responded_at && (
                <p>Responded: {new Date(collaboration.responded_at).toLocaleDateString()}</p>
              )}
              {collaboration.joined_at && (
                <p>Joined: {new Date(collaboration.joined_at).toLocaleDateString()}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <Button
              className="professional-button"
              onClick={onClose}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Close
            </Button>
            {canEdit && (
              <Button
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Edit Collaboration
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TourCollaborationManager;