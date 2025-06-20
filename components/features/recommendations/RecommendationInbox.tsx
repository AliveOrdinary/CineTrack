'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Inbox, 
  Send, 
  Filter, 
  Loader2,
  Search,
  RotateCcw
} from 'lucide-react';
import { RecommendationCard } from './RecommendationCard';
import {
  ContentRecommendationWithUsers,
  RecommendationInbox as InboxType,
  RecommendationOutbox as OutboxType,
  RecommendationQueryOptions,
  RecommendationStatus,
  RECOMMENDATION_STATUS_CONFIG,
} from '@/types/recommendations';
import {
  getRecommendationInbox,
  getRecommendationOutbox,
} from '@/lib/supabase/recommendations';

interface RecommendationInboxProps {
  currentUserId: string;
}

export function RecommendationInbox({ currentUserId }: RecommendationInboxProps) {
  const [activeTab, setActiveTab] = useState('inbox');
  const [inbox, setInbox] = useState<InboxType | null>(null);
  const [outbox, setOutbox] = useState<OutboxType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<RecommendationStatus | 'all'>('all');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'movie' | 'tv' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadRecommendations();
  }, [activeTab, statusFilter, mediaTypeFilter]);

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      const options: RecommendationQueryOptions = {
        filters: {
          ...(statusFilter !== 'all' && { status: [statusFilter as RecommendationStatus] }),
          ...(mediaTypeFilter !== 'all' && { media_type: [mediaTypeFilter as 'movie' | 'tv'] }),
        },
        sort: {
          field: 'created_at',
          direction: 'desc',
        },
        pagination: {
          limit: 50,
          offset: 0,
        },
      };

      if (activeTab === 'inbox') {
        const inboxData = await getRecommendationInbox(options);
        setInbox(inboxData);
      } else {
        const outboxData = await getRecommendationOutbox(options);
        setOutbox(outboxData);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadRecommendations();
    setIsRefreshing(false);
  };

  const filterRecommendations = (recommendations: ContentRecommendationWithUsers[]) => {
    if (!searchQuery) return recommendations;
    
    return recommendations.filter(rec => 
      rec.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.sender.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.recipient.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const renderRecommendationsList = (recommendations: ContentRecommendationWithUsers[], emptyMessage: string) => {
    const filteredRecs = filterRecommendations(recommendations);
    
    if (filteredRecs.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {filteredRecs.map((recommendation) => (
          <RecommendationCard
            key={recommendation.id}
            recommendation={recommendation}
            currentUserId={currentUserId}
            showContentInfo={true}
            onStatusUpdate={loadRecommendations}
            onDelete={loadRecommendations}
          />
        ))}
      </div>
    );
  };

  const getStatusCount = (data: InboxType | OutboxType | null, status: RecommendationStatus) => {
    if (!data) return 0;
    return data[status].length;
  };

  const getAllRecommendations = (data: InboxType | OutboxType | null) => {
    if (!data) return [];
    return [...data.pending, ...data.accepted, ...data.declined, ...data.watched];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Recommendations</h2>
          <p className="text-muted-foreground">
            Manage your content recommendations
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RotateCcw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search recommendations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(RECOMMENDATION_STATUS_CONFIG).map(([status, config]) => (
                  <SelectItem key={status} value={status}>
                    <span className="flex items-center gap-2">
                      <span>{config.emoji}</span>
                      {config.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={mediaTypeFilter} onValueChange={(value) => setMediaTypeFilter(value as any)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="movie">Movies</SelectItem>
                <SelectItem value="tv">TV Shows</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="inbox" className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            Inbox
            {inbox && inbox.pending.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {inbox.pending.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="outbox" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Sent
            {outbox && (
              <Badge variant="outline" className="ml-2">
                {outbox.total_count}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox">
          <div className="space-y-6">
            {/* Status Summary */}
            {inbox && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(RECOMMENDATION_STATUS_CONFIG).map(([status, config]) => (
                  <Card key={status}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{config.label}</p>
                          <p className="text-2xl font-bold">
                            {getStatusCount(inbox, status as RecommendationStatus)}
                          </p>
                        </div>
                        <span className="text-2xl">{config.emoji}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Recommendations List */}
            <Card>
              <CardHeader>
                <CardTitle>Received Recommendations</CardTitle>
                <CardDescription>
                  Content recommendations from other users
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading recommendations...</span>
                  </div>
                ) : (
                  renderRecommendationsList(
                    getAllRecommendations(inbox),
                    "No recommendations received yet"
                  )
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="outbox">
          <div className="space-y-6">
            {/* Status Summary */}
            {outbox && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(RECOMMENDATION_STATUS_CONFIG).map(([status, config]) => (
                  <Card key={status}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{config.label}</p>
                          <p className="text-2xl font-bold">
                            {getStatusCount(outbox, status as RecommendationStatus)}
                          </p>
                        </div>
                        <span className="text-2xl">{config.emoji}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Recommendations List */}
            <Card>
              <CardHeader>
                <CardTitle>Sent Recommendations</CardTitle>
                <CardDescription>
                  Content you've recommended to others
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading recommendations...</span>
                  </div>
                ) : (
                  renderRecommendationsList(
                    getAllRecommendations(outbox),
                    "No recommendations sent yet"
                  )
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}