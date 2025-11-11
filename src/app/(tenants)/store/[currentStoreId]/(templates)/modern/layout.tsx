import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getVirtualStoreById } from '@/lib/actions/virtual-store.action';
import { ModernNavbar, ModernNavbarSkeleton } from './_components/home/modern-navbar';
import { Skeleton } from '@/components/ui/skeleton';

export default async function ModernLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ currentStoreId: string }>;
}) {
    const { currentStoreId } = await params;
    const store = await getVirtualStoreById(currentStoreId);

    if (!store) notFound();

    return (
        <div className="min-h-screen bg-background">
            <Suspense fallback={<ModernNavbarSkeleton />}>
                <ModernNavbar
                    currentStoreId={currentStoreId}
                    storeName={store.storeName}
                    storeLogo={store.logoUrl}
                />
            </Suspense>

            <div className='min-h-screen'>{children}</div>

            <footer className="bg-slate-900 text-white py-8 mt-16">
                <div className="container mx-auto px-4 text-center">
                    <p>© {new Date().getFullYear()} {store.storeName}. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}