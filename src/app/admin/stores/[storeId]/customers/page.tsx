import { AccessDeniedCard } from '@/components/access-denied-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StoreSubscribersDashboard } from '@/features/stores/customers/store-subscribers-dashboard';
import { getVirtualStoreById } from '@/lib/actions/virtual-store.action';
import { getAuthState } from '@/lib/user-permission';
import { Users } from 'lucide-react';
import { notFound } from 'next/navigation';
import React from 'react';

interface CustomersPageProps {
    params: Promise<{ storeId: string }>;
}

async function CustomersPage({ params }: CustomersPageProps) {
    const { storeId } = await params;
    const { user, isVirtualStoreOwner } = await getAuthState();

    // Check if user has access to this store
    if (!user || !isVirtualStoreOwner) {
        return <AccessDeniedCard />;
    }

    // Fetch store data
    const store = await getVirtualStoreById(storeId);

    if (!store) {
        notFound();
    }

    // Check if user owns this store
    if (store.owner !== user.$id) {
        return <AccessDeniedCard />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Store Customers</h1>
                    <p className="text-muted-foreground">
                        Manage your store subscribers and send email campaigns
                    </p>
                </div>
            </div>

            {/* Subscribers Dashboard */}
            <StoreSubscribersDashboard
                storeId={storeId}
                storeName={store.storeName}
            />

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">About Store Customers</CardTitle>
                    <CardDescription>
                        How the subscription system works
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div>
                        <p className="font-medium mb-1">📧 Email Preferences</p>
                        <p className="text-muted-foreground">
                            Customers can opt-in to receive marketing emails, order updates,
                            new product announcements, and promotions from your store.
                        </p>
                    </div>
                    <div>
                        <p className="font-medium mb-1">🎯 Targeted Campaigns</p>
                        <p className="text-muted-foreground">
                            Send bulk emails only to customers who opted-in for specific types
                            of communications. Respect customer preferences automatically.
                        </p>
                    </div>
                    <div>
                        <p className="font-medium mb-1">📊 Export & Analysis</p>
                        <p className="text-muted-foreground">
                            Export your subscriber list to CSV for external marketing tools
                            or data analysis.
                        </p>
                    </div>
                    <div>
                        <p className="font-medium mb-1">✅ GDPR Compliant</p>
                        <p className="text-muted-foreground">
                            Customers can easily unsubscribe or update their preferences at
                            any time. All emails include unsubscribe links.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default CustomersPage;