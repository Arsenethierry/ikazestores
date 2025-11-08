import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getVirtualStoreById } from '@/lib/actions/virtual-store.action';
import { TenantStoreNavbar } from '@/components/navbars/tenant/tenant-store-navbar';

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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <TenantStoreNavbar currentStoreId={currentStoreId} />

            <main className="container mx-auto px-4 py-6">
                {children}
            </main>

            <footer className="bg-slate-900 text-white py-8 mt-16">
                <div className="container mx-auto px-4 text-center">
                    <p>© {new Date().getFullYear()} {store.storeName}. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}