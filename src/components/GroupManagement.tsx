
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Settings, Trash2, Edit, UserPlus, UserMinus, Shield } from 'lucide-react';

interface GroupMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  joinedDate: string;
}

interface Group {
  id: string;
  name: string;
  description: string;
  color: string;
  permissions: string[];
  members: GroupMember[];
  isDefault: boolean;
}

interface GroupManagementProps {
  groups: Group[];
  onCreateGroup: (group: Omit<Group, 'id' | 'members'>) => void;
  onUpdateGroup: (groupId: string, updates: Partial<Group>) => void;
  onDeleteGroup: (groupId: string) => void;
  onAddMember: (groupId: string, memberId: string) => void;
  onRemoveMember: (groupId: string, memberId: string) => void;
}

const GroupManagement: React.FC<GroupManagementProps> = ({
  groups,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onAddMember,
  onRemoveMember
}) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    color: '#8B5CF6',
    permissions: [] as string[],
    isDefault: false
  });

  const availablePermissions = [
    'manage_events',
    'manage_applications',
    'manage_payments',
    'manage_staff',
    'view_analytics',
    'manage_venues',
    'send_messages'
  ];

  const predefinedColors = [
    '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', 
    '#EF4444', '#8B5A2B', '#6B7280', '#059669', '#DC2626'
  ];

  const handleCreateGroup = () => {
    if (newGroup.name.trim()) {
      onCreateGroup(newGroup);
      setNewGroup({ name: '', description: '', color: '#8B5CF6', permissions: [], isDefault: false });
      setIsCreateDialogOpen(false);
    }
  };

  const togglePermission = (permission: string) => {
    setNewGroup(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Group Management</span>
              </CardTitle>
              <CardDescription className="text-purple-200">
                Organize your staff into groups with specific permissions
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Group
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-purple-950 border-purple-800 text-white">
                <DialogHeader>
                  <DialogTitle>Create New Group</DialogTitle>
                  <DialogDescription className="text-purple-200">
                    Set up a new staff group with specific permissions
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="groupName">Group Name</Label>
                    <Input
                      id="groupName"
                      value={newGroup.name}
                      onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white"
                      placeholder="e.g., Event Managers, Booking Staff"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="groupDescription">Description</Label>
                    <Textarea
                      id="groupDescription"
                      value={newGroup.description}
                      onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white"
                      placeholder="Describe the group's responsibilities..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Group Color</Label>
                    <div className="flex space-x-2">
                      {predefinedColors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setNewGroup(prev => ({ ...prev, color }))}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            newGroup.color === color ? 'border-white scale-110' : 'border-white/30'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Permissions</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {availablePermissions.map((permission) => (
                        <div
                          key={permission}
                          onClick={() => togglePermission(permission)}
                          className={`p-2 rounded-lg cursor-pointer transition-colors ${
                            newGroup.permissions.includes(permission)
                              ? 'bg-purple-500 text-white'
                              : 'bg-white/10 text-purple-200 hover:bg-white/20'
                          }`}
                        >
                          <span className="text-xs font-medium">
                            {permission.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <Button 
                      onClick={handleCreateGroup}
                      disabled={!newGroup.name.trim()}
                      className="flex-1 bg-purple-500 hover:bg-purple-600"
                    >
                      Create Group
                    </Button>
                    <Button 
                      onClick={() => setIsCreateDialogOpen(false)}
                      variant="outline"
                      className="text-white border-white/30 hover:bg-white/10"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {groups.map((group) => (
          <Card key={group.id} className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>{group.name}</span>
                      {group.isDefault && (
                        <Badge variant="outline" className="text-xs text-blue-300 border-blue-300">
                          Default
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-purple-200">
                      {group.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                    <Edit className="w-4 h-4" />
                  </Button>
                  {!group.isDefault && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onDeleteGroup(group.id)}
                      className="text-red-300 hover:bg-red-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Permissions</h4>
                <div className="flex flex-wrap gap-1">
                  {group.permissions.map((permission) => (
                    <Badge 
                      key={permission} 
                      variant="outline" 
                      className="text-xs text-purple-200 border-purple-300"
                    >
                      {permission.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">Members ({group.members.length})</h4>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {group.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback className="text-xs">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{member.name}</span>
                      </div>
                      {!group.isDefault && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => onRemoveMember(group.id, member.id)}
                          className="text-red-300 hover:bg-red-500/20"
                        >
                          <UserMinus className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GroupManagement;
