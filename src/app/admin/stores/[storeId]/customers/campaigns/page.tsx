import { AccessDeniedCard } from '@/components/access-denied-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getVirtualStoreById } from '@/lib/actions/virtual-store.action';
import { getAuthState } from '@/lib/user-permission';
import { Mail, Megaphone, Package, TrendingUp, AlertCircle } from 'lucide-react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import React from 'react';

interface CampaignsPageProps {
    params: Promise<{ storeId: string }>;
}

async function CampaignsPage({ params }: CampaignsPageProps) {
    const { storeId } = await params;
    const { user, isVirtualStoreOwner } = await getAuthState();

    if (!user || !isVirtualStoreOwner) {
        return <AccessDeniedCard />;
    }

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
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                        <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Email Campaigns</h1>
                        <p className="text-muted-foreground">
                            Send targeted emails to your store subscribers
                        </p>
                    </div>
                </div>
                <Button disabled>
                    <Megaphone className="h-4 w-4 mr-2" />
                    Create Campaign
                </Button>
            </div>

            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    <strong>Email Campaigns Coming Soon!</strong> This feature is currently under development.
                    For now, you can use the email campaign actions directly in your code.
                </AlertDescription>
            </Alert>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <Mail className="h-5 w-5 text-blue-600" />
                        </div>
                        <CardTitle className="text-lg">Marketing Email</CardTitle>
                        <CardDescription>
                            Send promotional content and special offers to opted-in subscribers
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" className="w-full" disabled>
                            Create Campaign
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <Package className="h-5 w-5 text-purple-600" />
                        </div>
                        <CardTitle className="text-lg">Product Launch</CardTitle>
                        <CardDescription>
                            Announce new products to customers who want product updates
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" className="w-full" disabled>
                            Create Campaign
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <TrendingUp className="h-5 w-5 text-orange-600" />
                        </div>
                        <CardTitle className="text-lg">Promotion</CardTitle>
                        <CardDescription>
                            Send discount codes and special deals to subscribers
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" className="w-full" disabled>
                            Create Campaign
                        </Button>
                    </CardContent>
                </Card>

                <div className="flex justify-start">
                    <Button variant="outline" asChild>
                        <Link href={`/admin/stores/${storeId}/customers`}>
                            ← Back to Customers
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default CampaignsPage;