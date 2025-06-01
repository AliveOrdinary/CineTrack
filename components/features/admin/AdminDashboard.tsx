'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  BarChart3, 
  Activity, 
  Settings, 
  Shield,
  Database,
  Flag,
  AlertTriangle
} from 'lucide-react';
import { UserManagement } from './UserManagement';
import { SiteAnalytics } from './SiteAnalytics';
import { SystemHealth } from './SystemHealth';
import { FeatureFlags } from './FeatureFlags';
import { AdminOverview } from './AdminOverview';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">System</span>
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            <span className="hidden sm:inline">Features</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AdminOverview />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage user accounts, roles, and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Site Analytics
              </CardTitle>
              <CardDescription>
                View platform usage statistics and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SiteAnalytics />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Health
              </CardTitle>
              <CardDescription>
                Monitor system performance and health metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SystemHealth />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5" />
                Feature Flags
              </CardTitle>
              <CardDescription>
                Manage feature toggles and experimental features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FeatureFlags />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 