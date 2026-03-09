import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
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
