
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Search, UserPlus, Shield, Crown, Mic, Building, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Mock data for demonstration
  useEffect(() => {
    const mockUsers: User[] = [
      {
        id: '1',
        email: 'admin@standupSydney.com',
        name: 'System Admin',
        created_at: '2024-01-15T10:00:00Z',
        roles: ['admin'],
        is_verified: true,
        last_sign_in: '2024-12-27T09:30:00Z'
      },
      {
        id: '2',
        email: 'sarah@example.com',
        name: 'Sarah Mitchell',
        created_at: '2024-02-20T14:30:00Z',
        roles: ['comedian'],
        is_verified: true,
        last_sign_in: '2024-12-26T18:45:00Z'
      },
      {
        id: '3',
        email: 'mike@venues.com',
        name: 'Mike Johnson',
        created_at: '2024-03-10T11:15:00Z',
        roles: ['promoter'],
        is_verified: true,
        last_sign_in: '2024-12-25T16:20:00Z'
      },
      {
        id: '4',
        email: 'jane@example.com',
        name: 'Jane Smith',
        created_at: '2024-11-15T08:00:00Z',
        roles: ['member'],
        is_verified: false,
        last_sign_in: null
      }
    ];
    
    setTimeout(() => {
      setUsers(mockUsers);
      setLoading(false);
    }, 1000);
  }, []);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'promoter': return <Building className="w-4 h-4 text-blue-500" />;
      case 'comedian': return <Mic className="w-4 h-4 text-purple-500" />;
      case 'member': return <Eye className="w-4 h-4 text-green-500" />;
      default: return <Users className="w-4 h-4 text-gray-500" />;
    }
  };

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
      // In a real app, this would call your backend API
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, roles: [newRole] }
          : user
      ));
      
      toast({
        title: "Role Updated",
        description: "User role has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user role.",
        variant: "destructive",
      });
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
              <SelectItem value="member">Member</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
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
                <TableRow key={user.id} className="border-white/20">
                  <TableCell>
                    <div className="text-white">
                      <div className="font-medium">{user.name || 'Unnamed User'}</div>
                      <div className="text-sm text-gray-300">{user.email}</div>
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
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserManagement;
