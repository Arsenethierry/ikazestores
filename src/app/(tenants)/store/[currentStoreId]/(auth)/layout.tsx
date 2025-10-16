import { getVirtualStoreById } from '@/lib/actions/virtual-store.action';
import { notFound } from 'next/navigation';
import { StoreAuthLayoutClient } from '@/features/auth/components/store-auth-layout-client';
import { Metadata } from 'next';
import { getStoreUrls } from '@/features/stores/store-domain-helper';

interface StoreAuthLayoutProps {
  children: React.ReactNode;
  params: Promise<{ currentStoreId: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ currentStoreId: string }> }): Promise<Metadata> {
  const { currentStoreId } = await params;

  try {
    const store = await getVirtualStoreById(currentStoreId);

    if (!store) {
      return {
        title: 'Store Not Found',
        description: 'The store you are looking for does not exist.',
      };
    }

    const { storeUrl } = getStoreUrls(store);

    return {
      title: `Sign In - ${store.storeName}`,
      description: `Sign in to your account at ${store.storeName}. ${store.storeBio || 'Your trusted online store.'}`,
      openGraph: {
        title: `Sign In - ${store.storeName}`,
        description: store.storeBio || `Shop at ${store.storeName}`,
        url: `${storeUrl}/sign-in`,
        siteName: store.storeName,
        images: store.storeLogoUrl ? [
          {
            url: store.storeLogoUrl,
            width: 400,
            height: 400,
            alt: `${store.storeName} logo`,
          }
        ] : [],
        type: 'website',
      },
      twitter: {
        card: 'summary',
        title: `Sign In - ${store.storeName}`,
        description: store.storeBio || `Shop at ${store.storeName}`,
        images: store.storeLogoUrl ? [store.storeLogoUrl] : [],
      },
      robots: {
        index: false, // Don't index auth pages
        follow: false,
      },
    };
  } catch (error) {
    console.error('Error generating auth metadata:', error);
    return {
      title: 'Authentication',
      description: 'Sign in to your account',
    };
  }
}

export default async function StoreAuthLayout({
  children,
  params
}: StoreAuthLayoutProps) {
  const { currentStoreId } = await params;

  // Prefetch store data with SSR
  const store = await getVirtualStoreById(currentStoreId);

  if (!store) {
    notFound();
  }

  return (
    <StoreAuthLayoutClient store={store}>
      {children}
    </StoreAuthLayoutClient>
  );
}