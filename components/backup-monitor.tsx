'use client';

import { useEffect, useState } from 'react';
import { DatabaseBackupManager, BackupReport, BackupMonitor } from '@/lib/database-backup';

/**
 * BackupMonitorComponent
 * Displays backup status and health information
 */
export function BackupMonitorComponent() {
  const [report, setReport] = useState<BackupReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only run in development or for admin users
    if (process.env.NODE_ENV === 'development') {
      loadBackupReport();
    }
  }, []);

  const loadBackupReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const manager = new DatabaseBackupManager(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'nlwyweawqapblohdnzkk'
      );

      const backupReport = await manager.generateBackupReport();
      setReport(backupReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load backup report');
    } finally {
      setLoading(false);
    }
  };

  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (loading) {
    return (
      <div className="fixed bottom-4 right-4 bg-background border rounded-lg p-4 shadow-lg max-w-sm">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span className="text-sm">Loading backup status...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed bottom-4 right-4 bg-background border border-red-200 rounded-lg p-4 shadow-lg max-w-sm">
        <div className="flex items-center gap-2 text-red-600">
          <span className="text-sm">❌ Backup check failed</span>
        </div>
        <p className="text-xs text-red-500 mt-1">{error}</p>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthIcon = (score: number) => {
    if (score >= 90) return '✅';
    if (score >= 70) return '⚠️';
    return '❌';
  };

  return (
    <div className="fixed bottom-4 right-4 bg-background border rounded-lg p-4 shadow-lg max-w-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm">🗄️ Backup Status</h3>
        <button
          onClick={loadBackupReport}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span>Health Score:</span>
          <span className={`font-medium ${getHealthColor(report.healthScore)}`}>
            {getHealthIcon(report.healthScore)} {report.healthScore}/100
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span>PITR:</span>
          <span>{report.pointInTimeRecoveryEnabled ? '✅' : '❌'}</span>
        </div>

        <div className="flex items-center justify-between">
          <span>Retention:</span>
          <span>{report.backupRetentionDays} days</span>
        </div>

        {report.lastBackup && (
          <div className="flex items-center justify-between">
            <span>Last Backup:</span>
            <span>
              {report.lastBackup.status === 'success' ? '✅' : '❌'}{' '}
              {new Date(report.lastBackup.timestamp).toLocaleDateString()}
            </span>
          </div>
        )}

        {report.recommendations.length > 0 && (
          <div className="mt-2 pt-2 border-t">
            <p className="font-medium mb-1">Recommendations:</p>
            <ul className="space-y-1">
              {report.recommendations.slice(0, 2).map((rec, index) => (
                <li key={index} className="text-xs text-muted-foreground">
                  • {rec}
                </li>
              ))}
              {report.recommendations.length > 2 && (
                <li className="text-xs text-muted-foreground">
                  ... and {report.recommendations.length - 2} more
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
