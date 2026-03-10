import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 5, // Increase to 5 for serverless environments (cold starts)
            retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff (2s, 4s, 8s...)
            staleTime: 5 * 1000, // Keep data fresh but avoid unnecessary immediate refetching
        },
    },
});

import { ThemeProvider } from './components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import WarmupService from './lib/warmup';

// Start warming up the backend immediately
WarmupService.start();

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider defaultTheme="system" storageKey="markface-ui-theme">
            <QueryClientProvider client={queryClient}>
                {children}
                <Toaster />
            </QueryClientProvider>
        </ThemeProvider>
    );
}
