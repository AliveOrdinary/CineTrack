'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Create a client
// We create the client inside the component to ensure it's recreated on the client
// rather than potentially being shared across requests on the server.
// For server components, you'd handle client creation differently.

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  // Use state to ensure QueryClient is only created once per component instance
  const [queryClient] = React.useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Global default options for queries
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: true,
      },
    },
  }));

  return (
    // Provide the client to your App
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Optional: Add React Query DevTools for debugging */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
} 