
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Search, UserPlus, Shield, Crown, Mic, Building, Eye, ExternalLink, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  roles: string[];
  is_verified: boolean;
  last_sign_in: string | null;
}

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  // Add User form state
  const [newUserData, setNewUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    roles: [] as string[],
    password: ''
  });

  // Fetch users from database
  const { data: users = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['admin-users', searchTerm, roleFilter],
    queryFn: async () => {
      if (!hasRole('admin')) {
        throw new Error('Unauthorized');
      }

      // Fetch profiles with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          name,
          created_at,
          is_verified,
          last_sign_in_at,
          user_roles!inner(
            role_type
          )
        `)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Transform data to match expected format
      const transformedUsers = (profiles || []).map(profile => ({
        id: profile.id,
        email: profile.email || '',
        name: profile.name,
        created_at: profile.created_at,
        roles: profile.user_roles?.map(ur => ur.role_type) || ['member'],
        is_verified: profile.is_verified || false,
        last_sign_in: profile.last_sign_in_at
      }));

      return transformedUsers;
    },
    enabled: !!hasRole('admin'),
    staleTime: 30 * 1000, // 30 seconds
  });


  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'promoter': return 'secondary';
      case 'comedian': return 'outline';
      case 'member': return 'secondary';
      default: return 'outline';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.roles.includes(roleFilter);
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      // First delete existing role
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Then insert new role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role_type: newRole });

      if (insertError) throw insertError;

      // Refresh the data
      refetch();
      
      toast({
        title: "Role Updated",
        description: "User role has been successfully updated.",
      });
    } catch (error) {
      console.error('Role update error:', error);
      toast({
        title: "Error",
        description: "Failed to update user role.",
        variant: "destructive",
      });
    }
  };

  // Handle role toggle for new user
  const toggleRole = (role: string) => {
    setNewUserData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  // Create new user
  const handleCreateUser = async () => {
    if (!newUserData.email.trim() || !newUserData.firstName.trim() || !newUserData.lastName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (newUserData.roles.length === 0) {
      toast({
        title: "Select Role",
        description: "Please select at least one role for the user.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingUser(true);

    try {
      // Generate a temporary password if not provided
      const password = newUserData.password.trim() || `temp${Math.random().toString(36).slice(2)}`;
      
      // Prepare user data for signup
      const userData = {
        name: `${newUserData.firstName.trim()} ${newUserData.lastName.trim()}`,
        first_name: newUserData.firstName.trim(),
        last_name: newUserData.lastName.trim(),
        mobile: newUserData.mobile.trim(),
        role: newUserData.roles[0], // Primary role
        roles: [...newUserData.roles, 'member'] // Add member role by default
      };

      // Create user via Supabase auth
      const { data, error } = await supabase.auth.signUp({
        email: newUserData.email.trim(),
        password: password,
        options: {
          data: userData
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // If user is created successfully and has photographer role, create photographer profile
      if (data.user && newUserData.roles.includes('photographer')) {
        try {
          const { error: photographerError } = await supabase
            .from('photographer_profiles')
            .insert({
              user_id: data.user.id,
              specialties: [],
              services_offered: [],
              available_for_events: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (photographerError) {
            console.warn('Photographer profile creation warning:', photographerError.message);
          }
        } catch (error) {
          console.warn('Failed to create photographer profile:', error);
        }
      }

      // If successful, show message and reset form
      toast({
        title: "User Created",
        description: `User has been created successfully. ${!newUserData.password.trim() ? 'A temporary password was generated.' : ''}`,
      });

      // Reset form and close dialog
      setNewUserData({
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
        roles: [],
        password: ''
      });
      setIsAddUserOpen(false);

      // Refresh users list
      refetch();

    } catch (error: any) {
      console.error('Create user error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingUser(false);
    }
  };

  // Role icons
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'promoter': return <Crown className="w-4 h-4" />;
      case 'comedian': return <Mic className="w-4 h-4" />;
      case 'photographer': return <Camera className="w-4 h-4" />;
      case 'videographer': return <Camera className="w-4 h-4" />;
      case 'member': return <Eye className="w-4 h-4" />;
      default: return <Building className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <p className="text-white mt-4">Loading users...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Users className="w-5 h-5" />
          User Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-gray-300"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full md:w-48 bg-white/20 border-white/30 text-white">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="promoter">Promoter</SelectItem>
              <SelectItem value="comedian">Comedian</SelectItem>
              <SelectItem value="photographer">Photographer</SelectItem>
              <SelectItem value="videographer">Videographer</SelectItem>
              <SelectItem value="member">Member</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700 text-white">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={newUserData.firstName}
                      onChange={(e) => setNewUserData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="John"
                      className="bg-gray-800 border-gray-600"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={newUserData.lastName}
                      onChange={(e) => setNewUserData(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Doe"
                      className="bg-gray-800 border-gray-600"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                    className="bg-gray-800 border-gray-600"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="mobile">Mobile</Label>
                  <Input
                    id="mobile"
                    value={newUserData.mobile}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, mobile: e.target.value }))}
                    placeholder="+61 4XX XXX XXX"
                    className="bg-gray-800 border-gray-600"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password (optional)</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Leave empty for auto-generated password"
                    className="bg-gray-800 border-gray-600"
                  />
                </div>

                {/* Role Selection */}
                <div>
                  <Label className="text-base font-medium mb-3 block">Roles *</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'admin', label: 'Admin', icon: <Shield className="w-4 h-4" /> },
                      { id: 'promoter', label: 'Promoter', icon: <Crown className="w-4 h-4" /> },
                      { id: 'comedian', label: 'Comedian', icon: <Mic className="w-4 h-4" /> },
                      { id: 'photographer', label: 'Photographer', icon: <Camera className="w-4 h-4" /> },
                      { id: 'videographer', label: 'Videographer', icon: <Camera className="w-4 h-4" /> }
                    ].map(role => (
                      <div key={role.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={role.id}
                          checked={newUserData.roles.includes(role.id)}
                          onCheckedChange={() => toggleRole(role.id)}
                        />
                        <Label 
                          htmlFor={role.id} 
                          className="text-sm font-normal cursor-pointer flex items-center gap-2"
                        >
                          {role.icon}
                          {role.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {newUserData.roles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {newUserData.roles.map(role => (
                        <Badge 
                          key={role} 
                          variant="secondary"
                          className="cursor-pointer flex items-center gap-1"
                          onClick={() => toggleRole(role)}
                        >
                          {getRoleIcon(role)}
                          {role} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-4 pt-4">
                  <Button
                    type="button"
                    className="professional-button"
                    onClick={() => setIsAddUserOpen(false)}
                    disabled={isCreatingUser}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateUser}
                    disabled={isCreatingUser}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isCreatingUser ? 'Creating...' : 'Create User'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Users Table */}
        <div className="rounded-lg border border-white/20 bg-white/5">
          <Table>
            <TableHeader>
              <TableRow className="border-white/20">
                <TableHead className="text-gray-300">User</TableHead>
                <TableHead className="text-gray-300">Role</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                <TableHead className="text-gray-300">Last Sign In</TableHead>
                <TableHead className="text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="border-white/20 hover:bg-white/5">
                  <TableCell>
                    <div className="text-white">
                      <button
                        onClick={() => {
                          if (user.roles.includes('comedian') && user.name) {
                            const slug = user.name.toLowerCase().replace(/\s+/g, '-');
                            navigate(`/comedian/${slug}`);
                          } else {
                            toast({
                              title: "Profile View",
                              description: `Viewing profile for ${user.name || user.email}`,
                            });
                          }
                        }}
                        className="text-left hover:underline focus:outline-none group"
                      >
                        <div className="font-medium flex items-center gap-2">
                          {user.name || 'Unnamed User'}
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-sm text-gray-300">{user.email}</div>
                      </button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <Badge key={role} variant={getRoleBadgeVariant(role)} className="flex items-center gap-1">
                          {getRoleIcon(role)}
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_verified ? "default" : "secondary"}>
                      {user.is_verified ? "Verified" : "Unverified"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {user.last_sign_in 
                      ? new Date(user.last_sign_in).toLocaleDateString()
                      : "Never"
                    }
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.roles[0] || ''}
                      onValueChange={(value) => handleRoleChange(user.id, value)}
                    >
                      <SelectTrigger className="w-32 h-8 bg-white/20 border-white/30 text-white text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="comedian">Comedian</SelectItem>
                        <SelectItem value="promoter">Promoter</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-300">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No users found matching your criteria.</p>
            <Button 
              className="professional-button mt-4 text-white border-white/20 hover:bg-white/10"
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserManagement;
