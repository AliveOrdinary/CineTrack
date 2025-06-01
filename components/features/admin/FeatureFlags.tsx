'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Flag,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Users,
  Percent,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rollout_percentage: number;
  target_users: string[];
  environment: 'development' | 'staging' | 'production';
  created_at: string;
  updated_at: string;
}

export function FeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [newFlag, setNewFlag] = useState({
    name: '',
    description: '',
    enabled: false,
    rollout_percentage: 0,
    environment: 'development' as const,
  });

  useEffect(() => {
    loadFeatureFlags();
  }, []);

  const loadFeatureFlags = async () => {
    try {
      setLoading(true);

      // For now, we'll use mock data since we don't have a feature_flags table
      // In a real implementation, you would create this table and use Supabase
      const mockFlags: FeatureFlag[] = [
        {
          id: '1',
          name: 'enhanced_search',
          description: 'Enhanced search with AI-powered recommendations',
          enabled: true,
          rollout_percentage: 100,
          target_users: [],
          environment: 'production',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'social_features_v2',
          description: 'New social features including group watching',
          enabled: false,
          rollout_percentage: 25,
          target_users: ['beta-testers'],
          environment: 'staging',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'advanced_analytics',
          description: 'Advanced user analytics and insights',
          enabled: true,
          rollout_percentage: 50,
          target_users: ['premium-users'],
          environment: 'production',
          created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '4',
          name: 'mobile_app_integration',
          description: 'Mobile app deep linking and integration',
          enabled: false,
          rollout_percentage: 0,
          target_users: [],
          environment: 'development',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      setFlags(mockFlags);
    } catch (error) {
      console.error('Error loading feature flags:', error);
      toast.error('Failed to load feature flags');
    } finally {
      setLoading(false);
    }
  };

  const toggleFlag = async (flagId: string, enabled: boolean) => {
    try {
      // In a real implementation, this would update the database
      setFlags(prev =>
        prev.map(flag =>
          flag.id === flagId ? { ...flag, enabled, updated_at: new Date().toISOString() } : flag
        )
      );

      toast.success(`Feature flag ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling feature flag:', error);
      toast.error('Failed to update feature flag');
    }
  };

  const updateRolloutPercentage = async (flagId: string, percentage: number) => {
    try {
      setFlags(prev =>
        prev.map(flag =>
          flag.id === flagId
            ? { ...flag, rollout_percentage: percentage, updated_at: new Date().toISOString() }
            : flag
        )
      );

      toast.success('Rollout percentage updated');
    } catch (error) {
      console.error('Error updating rollout percentage:', error);
      toast.error('Failed to update rollout percentage');
    }
  };

  const createFlag = async () => {
    try {
      const flag: FeatureFlag = {
        id: Date.now().toString(),
        ...newFlag,
        target_users: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setFlags(prev => [flag, ...prev]);
      setNewFlag({
        name: '',
        description: '',
        enabled: false,
        rollout_percentage: 0,
        environment: 'development',
      });
      setIsCreateDialogOpen(false);

      toast.success('Feature flag created');
    } catch (error) {
      console.error('Error creating feature flag:', error);
      toast.error('Failed to create feature flag');
    }
  };

  const deleteFlag = async (flagId: string) => {
    try {
      setFlags(prev => prev.filter(flag => flag.id !== flagId));
      toast.success('Feature flag deleted');
    } catch (error) {
      console.error('Error deleting feature flag:', error);
      toast.error('Failed to delete feature flag');
    }
  };

  const getEnvironmentBadge = (environment: string) => {
    switch (environment) {
      case 'production':
        return <Badge variant="destructive">Production</Badge>;
      case 'staging':
        return <Badge variant="secondary">Staging</Badge>;
      case 'development':
        return <Badge variant="outline">Development</Badge>;
      default:
        return <Badge variant="outline">{environment}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-6 w-32 bg-muted animate-pulse rounded"></div>
          <div className="h-9 w-24 bg-muted animate-pulse rounded"></div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-5 w-48 bg-muted animate-pulse rounded"></div>
                <div className="h-4 w-64 bg-muted animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-6 w-16 bg-muted animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Feature Flags</h3>
          <p className="text-sm text-muted-foreground">
            Manage feature toggles and experimental features
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Flag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Feature Flag</DialogTitle>
              <DialogDescription>
                Add a new feature flag to control feature rollouts
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Flag Name</Label>
                <Input
                  id="name"
                  value={newFlag.name}
                  onChange={e => setNewFlag(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., new_dashboard"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newFlag.description}
                  onChange={e => setNewFlag(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the feature"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={newFlag.enabled}
                  onCheckedChange={enabled => setNewFlag(prev => ({ ...prev, enabled }))}
                />
                <Label htmlFor="enabled">Enable immediately</Label>
              </div>

              <div>
                <Label htmlFor="rollout">Rollout Percentage</Label>
                <Input
                  id="rollout"
                  type="number"
                  min="0"
                  max="100"
                  value={newFlag.rollout_percentage}
                  onChange={e =>
                    setNewFlag(prev => ({
                      ...prev,
                      rollout_percentage: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createFlag} disabled={!newFlag.name || !newFlag.description}>
                Create Flag
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Feature Flags List */}
      <div className="space-y-4">
        {flags.map(flag => (
          <Card key={flag.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{flag.name}</CardTitle>
                    {getEnvironmentBadge(flag.environment)}
                    {flag.enabled ? (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Enabled
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Disabled
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{flag.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={flag.enabled}
                    onCheckedChange={enabled => toggleFlag(flag.id, enabled)}
                  />
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteFlag(flag.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Percent className="h-3 w-3 text-muted-foreground" />
                    <span>Rollout: {flag.rollout_percentage}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="range"
                      min="0"
                      max="100"
                      value={flag.rollout_percentage}
                      onChange={e => updateRolloutPercentage(flag.id, parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-xs text-muted-foreground w-8">
                      {flag.rollout_percentage}%
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span>Target Users</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {flag.target_users.length > 0 ? (
                      flag.target_users.map((user, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {user}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">All users</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span>Last Updated</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(flag.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {flags.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Flag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Feature Flags</h3>
              <p className="text-muted-foreground mb-4">
                Create your first feature flag to start managing feature rollouts
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Feature Flag
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning about feature flags */}
      <Card className="border-yellow-200 dark:border-yellow-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                Feature Flag Management
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Feature flags are currently managed in-memory for demonstration purposes. In
                production, implement a proper feature flag service with database persistence and
                real-time updates.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
