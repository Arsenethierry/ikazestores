import { buttonVariants } from '@/components/ui/button';
import CloneProductsPage from '@/features/products/components/clone-products/clone-products-page';
import { getAuthState } from '@/lib/user-permission';
import { ArrowLeft, TableOfContents } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

async function page({
    params,
}: {
    params: Promise<{ storeId: string }>
}) {
    const { storeId } = await params;
    const {
        // isPhysicalStoreOwner,
        isVirtualStoreOwner,
        isSystemAdmin,
        user
    } = await getAuthState();

    if (!isVirtualStoreOwner && !isSystemAdmin) {
        return (
            <div className="container mx-auto px-4 py-6">
                <div className="text-center py-12">
                    <h1 className="text-3xl font-bold text-destructive mb-4">Access Denied</h1>
                    <p className="text-muted-foreground mb-6">
                        You don&apos;t have permission to access this page. This feature is only available to virtual store owners.
                    </p>
                    <Link
                        href="/dashboard"
                        className={buttonVariants({ variant: "secondary" })}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        )
    }
    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/admin/stores/${storeId}`}
                            className={buttonVariants({ variant: "outline", size: "sm" })}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Store
                        </Link>
                        <div className="flex items-center gap-2">
                            <TableOfContents className="w-5 h-5 text-blue-600" />
                            <h1 className="text-xl font-semibold">Product Import Center</h1>
                        </div>
                    </div>
                </div>
            </div>

            <CloneProductsPage storeId={storeId} user={user} />
        </div>
    );
}

export default page;