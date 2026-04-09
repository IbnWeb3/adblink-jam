     1|'use client';
     2|
     3|import { useMemo, type ReactNode } from 'react';
     4|import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
     5|import {
     6|  ConnectionProvider,
     7|  WalletProvider,
     8|} from '@solana/wallet-adapter-react';
     9|import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
    10|import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
    11|import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
    12|import { DEVNET_RPC } from '@/lib/anchor';
    13|
    14|
    15|export function SolanaWalletProvider({ children }: { children: ReactNode }) {
    16|  const network = WalletAdapterNetwork.Devnet;
    17|
    18|  const wallets = useMemo(
    19|    () => [
    20|      new PhantomWalletAdapter(),
    21|      new SolflareWalletAdapter({ network }),
    22|    ],
    23|    [network]
    24|  );
    25|
    26|  return (
    27|    <ConnectionProvider endpoint={DEVNET_RPC}>
    28|      <WalletProvider wallets={wallets} autoConnect>
    29|        <WalletModalProvider>{children}</WalletModalProvider>
    30|      </WalletProvider>
    31|    </ConnectionProvider>
    32|  );
    33|}
    34|