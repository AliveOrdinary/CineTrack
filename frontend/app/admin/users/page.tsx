'use client';

import { useEffect, useMemo, useState } from 'react';
import useUser from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createClient } from '@/lib/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Database } from '@cinetrack/shared';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type UserProfile = Database['public']['Tables']['users']['Row'] & { 
  is_suspended?: boolean;
};

const fetchUsers = async (): Promise<UserProfile[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching users for admin:", error);
    throw error;
  }
  return (data || []) as UserProfile[];
};

export default function AdminUsersPage() {
  const { user, userData, isLoading: isUserLoading, error: userError } = useUser();
  const router = useRouter();
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createClient(), []);
  const { toast } = useToast();

  const { mutate: updateUserRole, isPending: isUpdatingRole } = useMutation<
    UserProfile | null,
    Error,
    { userId: string; newRole: 'admin' | 'user' },
    { previousUsers?: UserProfile[] }
  >({
    mutationFn: async ({ userId, newRole }) => {
      if (userId === user?.id) {
        throw new Error("Admins cannot change their own role here.");
      }
      const { data, error } = await supabase
        .from('users')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ userId, newRole }) => {
      await queryClient.cancelQueries({ queryKey: ['adminUsers'] });

      const previousUsers = queryClient.getQueryData<UserProfile[]>(['adminUsers']);

      queryClient.setQueryData<UserProfile[]>(['adminUsers'], (old) =>
        old?.map(u => u.id === userId ? { ...u, role: newRole } : u)
      );

      return { previousUsers };
    },
    onError: (err, variables, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(['adminUsers'], context.previousUsers);
      }
      console.error("Error updating role:", err);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: err.message || "Could not update user role.",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Role Updated",
        description: `User role successfully changed to ${variables.newRole}.`,
      });
    }
  });

  const { mutate: updateUserSuspension, isPending: isUpdatingSuspension } = useMutation<
    UserProfile | null,
    Error,
    { userId: string; isSuspended: boolean },
    { previousUsers?: UserProfile[] }
  >({
    mutationFn: async ({ userId, isSuspended }) => {
      const { data, error } = await supabase
        .from('users')
        .update({ is_suspended: isSuspended, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ userId, isSuspended }) => {
      await queryClient.cancelQueries({ queryKey: ['adminUsers'] });
      const previousUsers = queryClient.getQueryData<UserProfile[]>(['adminUsers']);
      queryClient.setQueryData<UserProfile[]>(['adminUsers'], (old) =>
        old?.map(u => u.id === userId ? { ...u, is_suspended: isSuspended } : u)
      );
      return { previousUsers };
    },
    onError: (err, variables, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(['adminUsers'], context.previousUsers);
      }
      console.error("Error updating suspension status:", err);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: err.message || "Could not update user suspension status.",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Status Updated",
        description: `User has been ${variables.isSuspended ? 'suspended' : 'unsuspended'}.`,
      });
    }
  });

  const { 
    data: users, 
    isLoading: isLoadingUsers, 
    error: usersError 
  } = useQuery<UserProfile[], Error>({
    queryKey: ['adminUsers'],
    queryFn: fetchUsers,
    enabled: !isUserLoading && userData?.role === 'admin',
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!isUserLoading && (!user || userData?.role !== 'admin')) {
      console.warn('[AdminUsersPage] Non-admin user detected, redirecting.');
      router.push('/'); 
    }
  }, [isUserLoading, user, userData, router]);

  const isLoading = isUserLoading || (userData?.role === 'admin' && isLoadingUsers);
  const combinedError = userError || usersError;

  const isProcessingAction = isUpdatingRole || isUpdatingSuspension;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-10 w-full mb-2" />
        <Skeleton className="h-12 w-full mb-1" />
        <Skeleton className="h-12 w-full mb-1" />
        <Skeleton className="h-12 w-full mb-1" />
      </div>
    );
  }

  if (combinedError) {
     return (
       <div className="container mx-auto px-4 py-8">
         <h1 className="text-3xl font-bold mb-6 text-red-500">Error</h1>
         <Alert variant="destructive">
           <AlertTitle>Failed to load data</AlertTitle>
           <AlertDescription>
             {combinedError.message}
           </AlertDescription>
         </Alert>
       </div>
     );
  }
  
  if (userData?.role !== 'admin') {
    return null; 
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin - Manage Users</h1>
      
      <div className="border border-gray-700 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-800">
            <TableRow className="hover:bg-gray-800">
              <TableHead className="w-[150px] hidden md:table-cell">User ID</TableHead>
              <TableHead>Display Name</TableHead>
              <TableHead className="hidden sm:table-cell">Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!users || users.length === 0) ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-gray-400">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id} className={cn("hover:bg-gray-850", u.is_suspended && "opacity-60 bg-red-900/10")}>
                  <TableCell className="font-mono text-xs text-gray-400 hidden md:table-cell">{u.id}</TableCell>
                  <TableCell className="font-medium">{u.display_name}</TableCell>
                  <TableCell className="hidden sm:table-cell">{u.email}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={u.role === 'admin' ? 'destructive' : 'secondary'}
                      className={cn(
                        "font-semibold",
                        u.role === 'admin' 
                          ? 'bg-red-800/50 border-red-700 text-red-300' 
                          : 'bg-gray-700 border-gray-600 text-gray-300'
                      )}
                    >
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={u.is_suspended ? 'destructive' : 'outline'}
                      className={cn(
                        "font-semibold border",
                        u.is_suspended
                          ? 'bg-red-900/30 border-red-700/50 text-red-400'
                          : 'bg-green-900/30 border-green-700/50 text-green-400'
                      )}
                    >
                      {u.is_suspended ? (
                        <>
                          <XCircle className="h-3 w-3 mr-1" /> Suspended
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-400 hidden lg:table-cell">
                    {formatDistanceToNow(new Date(u.created_at || Date.now()), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    {user?.id === u.id ? (
                      <span className="text-xs text-gray-500 italic pr-2">Current Admin</span>
                    ) : isProcessingAction ? (
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                          <DropdownMenuItem 
                            disabled={u.role === 'admin'} 
                            onClick={() => updateUserRole({ userId: u.id, newRole: 'admin' })}
                          >
                            Set as Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            disabled={u.role === 'user'} 
                            onClick={() => updateUserRole({ userId: u.id, newRole: 'user' })}
                          >
                            Set as User
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>User Status</DropdownMenuLabel>
                           <DropdownMenuItem 
                             disabled={u.is_suspended}
                             onClick={() => updateUserSuspension({ userId: u.id, isSuspended: true })}
                             className="text-yellow-600 focus:text-yellow-500 focus:bg-yellow-900/10"
                           >
                             Suspend User
                           </DropdownMenuItem>
                           <DropdownMenuItem 
                             disabled={!u.is_suspended}
                             onClick={() => updateUserSuspension({ userId: u.id, isSuspended: false })}
                             className="text-green-600 focus:text-green-500 focus:bg-green-900/10"
                           >
                             Unsuspend User
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 