'use client';

import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface EnvVarWarningProps {
  missingVars: string[];
}

export function EnvVarWarning({ missingVars }: EnvVarWarningProps) {
  if (process.env.NODE_ENV === 'production' || missingVars.length === 0) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Missing Environment Variables</AlertTitle>
      <AlertDescription>
        The following environment variables are missing or invalid:
        <ul className="mt-2 list-disc list-inside">
          {missingVars.map(varName => (
            <li key={varName} className="font-mono text-sm">
              {varName}
            </li>
          ))}
        </ul>
        Please check your <code className="bg-muted px-1 rounded">.env.local</code> file.
      </AlertDescription>
    </Alert>
  );
}

// Utility function to check environment variables
export function checkEnvVars(): string[] {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_TMDB_API_KEY',
    'NEXT_PUBLIC_TMDB_API_BASE_URL',
  ];

  const missingVars: string[] = [];

  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      missingVars.push(varName);
    }
  });

  return missingVars;
}
