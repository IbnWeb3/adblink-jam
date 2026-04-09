     1|import type { ReactNode } from 'react';
     2|import type { Metadata, Viewport } from 'next';
     3|import { Inter } from 'next/font/google';
     4|import { Providers } from '@/components/providers';
     5|import './globals.css';
     6|import '@solana/wallet-adapter-react-ui/styles.css';
     7|
     8|const inter = Inter({
     9|  subsets: ['latin'],
    10|  display: 'swap',
    11|  variable: '--font-inter',
    12|});
    13|
    14|export const metadata: Metadata = {
    15|  title: {
    16|    default: 'Ad-Blink | Solana Ad Campaign Platform',
    17|    template: '%s | Ad-Blink',
    18|  },
    19|  description:
    20|    'Ad-Blink is a decentralised ad-campaign platform on Solana Devnet. Vendors lock SOL into escrow; admins pay out influencers with a transparent 5% fee.',
    21|  keywords: ['Solana', 'dApp', 'ad campaign', 'influencer', 'Seahorse', 'Anchor', 'Web3'],
    22|  authors: [{ name: 'Ad-Blink' }],
    23|  openGraph: {
    24|    type: 'website',
    25|    locale: 'en_US',
    26|    title: 'Ad-Blink | Solana Ad Campaign Platform',
    27|    description: 'Vendors lock SOL — Admins pay out influencers. Transparent 5% fee. Powered by Seahorse on Devnet.',
    28|    siteName: 'Ad-Blink',
    29|  },
    30|  twitter: {
    31|    card: 'summary_large_image',
    32|    title: 'Ad-Blink | Solana Ad Campaign Platform',
    33|    description: 'Decentralised ad-campaign escrow on Solana Devnet.',
    34|  },
    35|  robots: {
    36|    index: true,
    37|    follow: true,
    38|  },
    39|};
    40|
    41|export const viewport: Viewport = {
    42|  themeColor: '#7C3AED',
    43|  colorScheme: 'dark',
    44|  width: 'device-width',
    45|  initialScale: 1,
    46|};
    47|
    48|export default function RootLayout({ children }: { children: ReactNode }) {
    49|  return (
    50|    <html lang="en" className={inter.variable}>
    51|      <body>
    52|        <Providers>
    53|          <div className="min-h-screen bg-background text-foreground">{children}</div>
    54|        </Providers>
    55|      </body>
    56|    </html>
    57|  );
    58|}
    59|