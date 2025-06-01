'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Search, 
  MoreHorizontal, 
  UserCheck, 
  UserX, 
  Shield, 
  User,
  Calendar,
  Mail,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface UserData {
  id: string;
  email: string;
  display_name: string;
  role: string;
  region: string;
  created_at: string;
  updated_at: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading users:', error);
        toast.error('Failed to load users');
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user role:', error);
        toast.error('Failed to update user role');
        return;
      }

      toast.success('User role updated successfully');
      loadUsers(); // Refresh the list
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.display_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'moderator':
        return 'secondary';
      case 'user':
      default:
        return 'outline';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-3 w-3" />;
      case 'moderator':
        return <UserCheck className="h-3 w-3" />;
      case 'user':
      default:
        return <User className="h-3 w-3" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="h-10 w-64 bg-muted animate-pulse rounded"></div>
          <div className="h-10 w-32 bg-muted animate-pulse rounded"></div>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="moderator">Moderator</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>Total: {filteredUsers.length}</span>
        <span>Admins: {filteredUsers.filter(u => u.role === 'admin').length}</span>
        <span>Moderators: {filteredUsers.filter(u => u.role === 'moderator').length}</span>
        <span>Users: {filteredUsers.filter(u => u.role === 'user').length}</span>
      </div>

      {/* Users Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{user.display_name}</span>
                    <span className="text-sm text-muted-foreground">{user.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(user.role)} className="flex items-center gap-1 w-fit">
                    {getRoleIcon(user.role)}
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>{user.region}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Manage User: {user.display_name}</DialogTitle>
                        <DialogDescription>
                          Update user role and permissions
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Email:</span>
                            <p className="text-muted-foreground">{user.email}</p>
                          </div>
                          <div>
                            <span className="font-medium">Current Role:</span>
                            <p className="text-muted-foreground">{user.role}</p>
                          </div>
                          <div>
                            <span className="font-medium">Region:</span>
                            <p className="text-muted-foreground">{user.region}</p>
                          </div>
                          <div>
                            <span className="font-medium">Joined:</span>
                            <p className="text-muted-foreground">
                              {new Date(user.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Change Role:</label>
                          <div className="flex gap-2">
                            <Button
                              variant={user.role === 'user' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => updateUserRole(user.id, 'user')}
                              disabled={user.role === 'user'}
                            >
                              <User className="h-3 w-3 mr-1" />
                              User
                            </Button>
                            <Button
                              variant={user.role === 'moderator' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => updateUserRole(user.id, 'moderator')}
                              disabled={user.role === 'moderator'}
                            >
                              <UserCheck className="h-3 w-3 mr-1" />
                              Moderator
                            </Button>
                            <Button
                              variant={user.role === 'admin' ? 'destructive' : 'outline'}
                              size="sm"
                              onClick={() => updateUserRole(user.id, 'admin')}
                              disabled={user.role === 'admin'}
                            >
                              <Shield className="h-3 w-3 mr-1" />
                              Admin
                            </Button>
                          </div>
                        </div>

                        {user.role === 'admin' && (
                          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-sm">
                            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="font-medium">Admin User</span>
                            </div>
                            <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                              This user has full administrative privileges. Use caution when modifying admin roles.
                            </p>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No users found matching your criteria.
        </div>
      )}
    </div>
  );
} 