     1|'use client';
     2|import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
     3|import { useState, type ReactNode } from 'react';
     4|import { SolanaWalletProvider } from './wallet-provider';
     5|
     6|export function Providers({ children }: { children: ReactNode }) {
     7|	const [queryClient] = useState(() => new QueryClient({
     8|		defaultOptions: {
     9|			queries: {
    10|				staleTime: 1000 * 60 * 5,
    11|				refetchOnWindowFocus: false,
    12|			},
    13|		},
    14|	}));
    15|
    16|	return (
    17|		<QueryClientProvider client={queryClient}>
    18|			<SolanaWalletProvider>
    19|				{children}
    20|			</SolanaWalletProvider>
    21|		</QueryClientProvider>
    22|	);
    23|}
    24|