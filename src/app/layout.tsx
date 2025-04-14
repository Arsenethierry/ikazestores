import type { Metadata } from "next";
import { Inter } from "next/font/google"
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import ReactQueryProvider from "@/components/providers/react-query-provider";
import NextTopLoader from "nextjs-toploader"
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { CurrencyProvider } from "@/features/products/currency/currency-context";

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: 'IkazeStores | Hybrid Commerce Platform Bridging Physical & Digital Stores',
  description: 'Transform retail spaces into digital revenue streams or launch virtual stores with zero inventory. Connect physical suppliers with digital entrepreneurs in real-time. Join 500+ vendors and 2.3k entrepreneurs.',
  keywords: [
    'hybrid commerce',
    'digital storefront',
    'virtual store',
    'dropshipping platform',
    'inventory-free business',
    'retail digitalization'
  ],
  openGraph: {
    type: 'website',
    url: 'https://ikazestores.com',
    title: 'IkazeStores | Unified Commerce Platform',
    description: 'Bridge physical retail and digital commerce with real-time inventory synchronization',
    siteName: 'IkazeStores',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'IkazeStores Platform Interface',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IkazeStores | Hybrid Commerce Solution',
    description: 'Launch your inventory-free digital store or transform existing retail into digital revenue',
    images: ['/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://ikazestores.com',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(inter.className, "antialiased")}
      >
        <NextTopLoader showSpinner={false} />
        <ReactQueryProvider>
          <Toaster />
          <main className="flex flex-col min-h-screen">
            <NuqsAdapter>
              <CurrencyProvider>
                {children}
              </CurrencyProvider>
            </NuqsAdapter>
          </main>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
