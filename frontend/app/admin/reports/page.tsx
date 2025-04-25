'use client';

import { useEffect, useMemo, useState } from 'react';
import useUser from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createClient } from '@/lib/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Database } from '@cinetrack/shared';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  MoreHorizontal, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Flag, 
  Eye, 
  ArrowLeft 
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

type ReportStatus = Database['public']['Enums']['report_status'];

type ContentReport = Database['public']['Tables']['content_reports']['Row'];

interface ReportWithDetails extends ContentReport {
  status: Database['public']['Enums']['report_status'];
  id: string;
  reporter: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  review?: {
    content: string | null;
    rating: number | null;
    media_type: string | null;
    tmdb_id: number | null;
  } | null;
}

// Function to fetch reports
const fetchReports = async (): Promise<ReportWithDetails[]> => {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('content_reports')
    .select(`
      *,
      reporter:reporter_user_id!inner(display_name, avatar_url),
      review:reported_content_id(content, rating, media_type, tmdb_id)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching reports:", error);
    throw error;
  }
  
  // Put the cast back temporarily
  const fetchedData = (data || []) as any[]; // Use 'any' for now before mapping

  // Manually map to the desired structure
  const mappedData: ReportWithDetails[] = fetchedData.map(report => ({
    ...report,
    // Explicitly include the status to ensure TypeScript sees it
    status: report.status as ReportStatus,
    // Ensure the reporter object matches the interface, handling potential nulls
    reporter: report.reporter ? {
      display_name: report.reporter.display_name,
      avatar_url: report.reporter.avatar_url
    } : null,
    // Ensure the review object matches the interface, handling potential nulls/undefined
    review: report.review ? {
        content: report.review.content,
        rating: report.review.rating,
        media_type: report.review.media_type,
        tmdb_id: report.review.tmdb_id
    } : null
  }));

  return mappedData;
};

export default function AdminReportsPage() {
  const { user, userData, isLoading: isUserLoading } = useUser();
  const router = useRouter();
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createClient(), []);
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<string>('pending');
  const [selectedReport, setSelectedReport] = useState<ReportWithDetails | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
  const [isDismissDialogOpen, setIsDismissDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  
  const { 
    data: reports, 
    isLoading: isLoadingReports, 
    error: reportsError 
  } = useQuery({
    queryKey: ['adminReports'],
    queryFn: fetchReports,
    enabled: !isUserLoading && userData?.role === 'admin',
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter reports based on active tab
  const filteredReports = useMemo(() => {
    if (!reports) return [];
    
    if (activeTab === 'all') return reports;
    
    return reports.filter((report) => {
      // Ensure report has a status property
      if (!report || typeof report.status === 'undefined') {
        console.warn('Report missing status property', report);
        return false;
      }
      return report.status === activeTab;
    });
  }, [reports, activeTab]);

  // Mutation for updating report status
  const { mutate: updateReportStatus, isPending: isUpdatingStatus } = useMutation({
    mutationFn: async ({ 
      reportId, 
      status, 
      notes 
    }: { 
      reportId: string; 
      status: ReportStatus; 
      notes?: string 
    }) => {
      const { data, error } = await supabase
        .from('content_reports')
        .update({
          status,
          admin_notes: notes || null,
          resolved_at: status !== 'pending' ? new Date().toISOString() : null,
          resolved_by_admin_id: status !== 'pending' ? user?.id : null
        })
        .eq('id', reportId)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReports'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
      
      setIsResolveDialogOpen(false);
      setIsDismissDialogOpen(false);
      setSelectedReport(null);
      setAdminNotes('');

      toast({
        title: "Report Updated",
        description: "The report status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      console.error("Error updating report status:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Could not update report status.",
      });
    }
  });

  useEffect(() => {
    if (!isUserLoading && (!user || userData?.role !== 'admin')) {
      console.warn('[AdminReports] Non-admin user detected, redirecting.');
      router.push('/'); 
    }
  }, [isUserLoading, user, userData, router]);

  const isLoading = isUserLoading || (userData?.role === 'admin' && isLoadingReports);

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

  if (reportsError) {
     return (
       <div className="container mx-auto px-4 py-8">
         <h1 className="text-3xl font-bold mb-6 text-red-500">Error</h1>
         <Alert variant="destructive">
           <AlertTitle>Failed to load reports</AlertTitle>
           <AlertDescription>
             {reportsError instanceof Error ? reportsError.message : 'An unknown error occurred'}
           </AlertDescription>
         </Alert>
       </div>
     );
  }
  
  if (userData?.role !== 'admin') {
    return null; // This will be handled by the useEffect redirect
  }

  // Handlers
  const handleViewReport = (report: ReportWithDetails) => {
    setSelectedReport(report);
    setIsViewDialogOpen(true);
  };

  const handleResolveReport = (report: ReportWithDetails) => {
    setSelectedReport(report);
    setIsResolveDialogOpen(true);
  };

  const handleDismissReport = (report: ReportWithDetails) => {
    setSelectedReport(report);
    setIsDismissDialogOpen(true);
  };

  const confirmResolveReport = () => {
    if (!selectedReport) return;
    
    updateReportStatus({
      reportId: selectedReport.id,
      status: 'resolved',
      notes: adminNotes
    });
  };

  const confirmDismissReport = () => {
    if (!selectedReport) return;
    
    updateReportStatus({
      reportId: selectedReport.id,
      status: 'dismissed',
      notes: adminNotes
    });
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: ReportStatus }) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-900/30 text-yellow-300 border-yellow-600">
            Pending
          </Badge>
        );
      case 'resolved':
        return (
          <Badge variant="outline" className="bg-green-900/30 text-green-300 border-green-600">
            Resolved
          </Badge>
        );
      case 'dismissed':
        return (
          <Badge variant="outline" className="bg-gray-800 text-gray-300 border-gray-600">
            Dismissed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  // Count reports by status
  const pendingCount = reports?.filter(r => r.status === 'pending').length || 0;
  const resolvedCount = reports?.filter(r => r.status === 'resolved').length || 0;
  const dismissedCount = reports?.filter(r => r.status === 'dismissed').length || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with back link */}
      <div className="flex items-center gap-2 mb-6">
        <Link href="/admin" className="text-gray-400 hover:text-white">
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back to Admin Dashboard</span>
        </Link>
        <h1 className="text-3xl font-bold">Content Reports</h1>
      </div>
      
      {/* Tabs for filtering reports */}
      <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="pending" className="relative">
            Pending
            {pendingCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full bg-yellow-900 text-yellow-300">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved
            {resolvedCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full bg-gray-800 text-gray-300">
                {resolvedCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="dismissed">
            Dismissed
            {dismissedCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full bg-gray-800 text-gray-300">
                {dismissedCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">All Reports</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Reports table */}
      <div className="border border-gray-700 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-800">
            <TableRow className="hover:bg-gray-800">
              <TableHead>Type</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Reported By</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-gray-400">
                  No reports found.
                </TableCell>
              </TableRow>
            ) : (
              filteredReports.map((report) => (
                <TableRow key={report.id} className="hover:bg-gray-850">
                  <TableCell>
                    <Badge variant="outline">
                      {report.reported_content_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={report.reason}>
                    {report.reason}
                  </TableCell>
                  <TableCell>
                    {report.reporter?.display_name || 'Unknown User'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-gray-400 text-sm">
                    {report.created_at ? formatDistanceToNow(new Date(report.created_at), { addSuffix: true }) : 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={report.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewReport(report)}>
                          <Eye className="mr-2 h-4 w-4" />
                          <span>View Details</span>
                        </DropdownMenuItem>
                        
                        {report.status === 'pending' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleResolveReport(report)}
                              className="text-green-500 focus:text-green-400 focus:bg-green-900/10"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              <span>Resolve Report</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDismissReport(report)}
                              className="text-gray-400 focus:text-gray-300 focus:bg-gray-800"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              <span>Dismiss Report</span>
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* View Report Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Status</h3>
                  <div className="mt-1">
                    <StatusBadge status={selectedReport.status} />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Date Reported</h3>
                  <p className="mt-1">
                    {selectedReport.created_at 
                      ? new Date(selectedReport.created_at).toLocaleString() 
                      : 'Unknown'}
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-400">Reported By</h3>
                <p className="mt-1">
                  {selectedReport.reporter?.display_name || 'Unknown User'}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-400">Content Type</h3>
                <p className="mt-1 capitalize">
                  {selectedReport.reported_content_type}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-400">Reason for Report</h3>
                <p className="mt-1 bg-gray-800 p-3 rounded-md">
                  {selectedReport.reason}
                </p>
              </div>
              
              {selectedReport.review && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Reported Content</h3>
                  <div className="mt-1 bg-gray-800 p-3 rounded-md border border-gray-700">
                    <p className="whitespace-pre-wrap">
                      {selectedReport.review.content}
                    </p>
                    {selectedReport.review.rating && (
                      <p className="mt-2 text-sm text-gray-400">
                        Rating: {selectedReport.review.rating}/10
                      </p>
                    )}
                    <div className="mt-2 text-sm text-gray-400">
                      {selectedReport.review.media_type === 'movie' ? 'Movie' : 'TV Show'} ID: {selectedReport.review.tmdb_id}
                    </div>
                  </div>
                </div>
              )}
              
              {selectedReport.admin_notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Admin Notes</h3>
                  <p className="mt-1 bg-gray-800 p-3 rounded-md text-gray-300">
                    {selectedReport.admin_notes}
                  </p>
                </div>
              )}
              
              {selectedReport.status !== 'pending' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">Resolved Date</h3>
                    <p className="mt-1">
                      {selectedReport.resolved_at 
                        ? new Date(selectedReport.resolved_at).toLocaleString() 
                        : 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">Resolved By</h3>
                    <p className="mt-1">
                      {selectedReport.resolved_by_admin_id 
                        ? (selectedReport.resolved_by_admin_id === user?.id 
                            ? 'You' 
                            : 'Another Admin') 
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
            
            {selectedReport && selectedReport.status === 'pending' && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    handleDismissReport(selectedReport);
                  }}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Dismiss
                </Button>
                <Button 
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    handleResolveReport(selectedReport);
                  }}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Resolve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Report Dialog */}
      <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Report</DialogTitle>
            <DialogDescription>
              This will mark the report as resolved. Add any notes about actions taken.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Admin Notes (Optional)</h3>
              <Textarea 
                value={adminNotes} 
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Enter any notes about the action taken..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsResolveDialogOpen(false)}
              disabled={isUpdatingStatus}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmResolveReport}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirm Resolution
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dismiss Report Dialog */}
      <Dialog open={isDismissDialogOpen} onOpenChange={setIsDismissDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dismiss Report</DialogTitle>
            <DialogDescription>
              This will mark the report as dismissed without taking action.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Reason for Dismissal (Optional)</h3>
              <Textarea 
                value={adminNotes} 
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Enter reason for dismissing this report..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDismissDialogOpen(false)}
              disabled={isUpdatingStatus}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmDismissReport}
              disabled={isUpdatingStatus}
              variant="destructive"
            >
              {isUpdatingStatus ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Confirm Dismissal
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 