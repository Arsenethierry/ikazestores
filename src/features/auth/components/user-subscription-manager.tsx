"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
    Bell, 
    BellOff, 
    Store, 
    Mail, 
    Package, 
    TrendingUp, 
    ShoppingBag,
    Loader2,
    ExternalLink
} from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { 
    getUserSubscriptionsAction, 
    unsubscribeFromStoreAction,
    updateSubscriptionPreferencesAction 
} from '@/lib/actions/store-subscribers.action';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useConfirm } from '@/hooks/use-confirm';
import { generateColorFromName } from '@/lib/utils';
import Image from 'next/image';
import { StoreSubscriberWithParsedPreferences } from '@/lib/models/store-subscribers-model';

interface SubscriptionWithStoreDetails extends StoreSubscriberWithParsedPreferences {
    storeName?: string;
    storeLogoUrl?: string;
}

export const UserSubscriptionsManager = () => {
    const [subscriptions, setSubscriptions] = useState<SubscriptionWithStoreDetails[]>([]);
    const [expandedStoreId, setExpandedStoreId] = useState<string | null>(null);

    const { execute: fetchSubscriptions, isPending: isLoading } = useAction(
        getUserSubscriptionsAction,
        {
            onSuccess: (result) => {
                if (result.data?.success && result.data.data) {
                    setSubscriptions(result.data.data.documents as SubscriptionWithStoreDetails[]);
                }
            },
            onError: (error) => {
                toast.error('Failed to load subscriptions');
                console.error(error);
            }
        }
    );

    const { execute: unsubscribe, isPending: isUnsubscribing } = useAction(
        unsubscribeFromStoreAction,
        {
            onSuccess: (result) => {
                if (result.data?.success) {
                    toast.success('Unsubscribed successfully');
                    fetchSubscriptions();
                } else {
                    toast.error(result.data?.error || 'Failed to unsubscribe');
                }
            }
        }
    );

    const { execute: updatePreferences, isPending: isUpdating } = useAction(
        updateSubscriptionPreferencesAction,
        {
            onSuccess: (result) => {
                if (result.data?.success) {
                    toast.success('Preferences updated');
                    fetchSubscriptions();
                } else {
                    toast.error(result.data?.error || 'Failed to update');
                }
            }
        }
    );

    const [UnsubscribeDialog, confirmUnsubscribe] = useConfirm(
        "Unsubscribe from Store?",
        "You'll no longer receive marketing emails and updates from this store. You can resubscribe anytime.",
        "destructive"
    );

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const handleUnsubscribe = async (storeId: string, storeName: string) => {
        const confirmed = await confirmUnsubscribe();
        if (confirmed) {
            unsubscribe({ storeId });
        }
    };

    const handlePreferenceChange = async (
        storeId: string,
        preference: 'marketingEmails' | 'orderUpdates' | 'newProducts' | 'promotions',
        value: boolean
    ) => {
        updatePreferences({
            storeId,
            preferences: {
                [preference]: value
            }
        });
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (subscriptions.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Store Subscriptions
                    </CardTitle>
                    <CardDescription>
                        Manage your store newsletter and notification preferences
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <BellOff className="h-4 w-4" />
                        <AlertDescription>
                            You're not subscribed to any stores yet. When you sign up at a store, 
                            you can opt-in to receive exclusive deals and updates.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
        <UnsubscribeDialog />
        <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                Store Subscriptions
                                <Badge variant="secondary">{subscriptions.length}</Badge>
                            </CardTitle>
                            <CardDescription>
                                Manage your store newsletter and notification preferences
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {subscriptions.map((subscription) => {
                        const colors = generateColorFromName(subscription.storeName || 'Store');
                        const isExpanded = expandedStoreId === subscription.storeId;

                        return (
                            <Card key={subscription.$id} className="overflow-hidden">
                                <CardHeader className="pb-4">
                                    <div className="flex items-start justify-between gap-4">
                                        {/* Store Info */}
                                        <div className="flex items-center gap-3 flex-1">
                                            {subscription.storeLogoUrl ? (
                                                <div className="relative w-12 h-12 rounded-lg overflow-hidden border">
                                                    <Image
                                                        src={subscription.storeLogoUrl}
                                                        alt={subscription.storeName || 'Store'}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div 
                                                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                                                    style={{
                                                        background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
                                                    }}
                                                >
                                                    <Store className="h-6 w-6" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold truncate">
                                                        {subscription.storeName || 'Store'}
                                                    </h4>
                                                    <Badge 
                                                        variant={subscription.isActive ? "default" : "secondary"}
                                                        className="shrink-0"
                                                    >
                                                        {subscription.isActive ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    Subscribed {new Date(subscription.subscribedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setExpandedStoreId(
                                                    isExpanded ? null : subscription.storeId
                                                )}
                                            >
                                                {isExpanded ? 'Hide' : 'Preferences'}
                                            </Button>
                                            <Link href={`/store/${subscription.storeId}`}>
                                                <Button variant="ghost" size="icon">
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </CardHeader>

                                {/* Expanded Preferences */}
                                {isExpanded && (
                                    <CardContent className="pt-0 space-y-4">
                                        <Separator />
                                        
                                        <div className="space-y-3">
                                            <h5 className="text-sm font-medium">Email Preferences</h5>
                                            
                                            {/* Marketing Emails */}
                                            <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-white">
                                                        <Mail className="h-4 w-4 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <Label className="text-sm font-medium">
                                                            Marketing Emails
                                                        </Label>
                                                        <p className="text-xs text-muted-foreground">
                                                            Promotional content and special offers
                                                        </p>
                                                    </div>
                                                </div>
                                                <Switch
                                                    checked={subscription.preferences?.marketing ?? true}
                                                    onCheckedChange={(checked) =>
                                                        handlePreferenceChange(
                                                            subscription.storeId,
                                                            'marketingEmails',
                                                            checked
                                                        )
                                                    }
                                                    disabled={isUpdating}
                                                />
                                            </div>

                                            {/* Order Updates */}
                                            <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-white">
                                                        <ShoppingBag className="h-4 w-4 text-green-600" />
                                                    </div>
                                                    <div>
                                                        <Label className="text-sm font-medium">
                                                            Order Updates
                                                        </Label>
                                                        <p className="text-xs text-muted-foreground">
                                                            Shipping and delivery notifications
                                                        </p>
                                                    </div>
                                                </div>
                                                <Switch
                                                    checked={subscription.preferences?.orderUpdates ?? true}
                                                    onCheckedChange={(checked) =>
                                                        handlePreferenceChange(
                                                            subscription.storeId,
                                                            'orderUpdates',
                                                            checked
                                                        )
                                                    }
                                                    disabled={isUpdating}
                                                />
                                            </div>

                                            {/* New Products */}
                                            <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-white">
                                                        <Package className="h-4 w-4 text-purple-600" />
                                                    </div>
                                                    <div>
                                                        <Label className="text-sm font-medium">
                                                            New Products
                                                        </Label>
                                                        <p className="text-xs text-muted-foreground">
                                                            Alerts about new arrivals
                                                        </p>
                                                    </div>
                                                </div>
                                                <Switch
                                                    checked={subscription.preferences?.newProducts ?? true}
                                                    onCheckedChange={(checked) =>
                                                        handlePreferenceChange(
                                                            subscription.storeId,
                                                            'newProducts',
                                                            checked
                                                        )
                                                    }
                                                    disabled={isUpdating}
                                                />
                                            </div>

                                            {/* Promotions */}
                                            <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-white">
                                                        <TrendingUp className="h-4 w-4 text-orange-600" />
                                                    </div>
                                                    <div>
                                                        <Label className="text-sm font-medium">
                                                            Promotions
                                                        </Label>
                                                        <p className="text-xs text-muted-foreground">
                                                            Sales and discount announcements
                                                        </p>
                                                    </div>
                                                </div>
                                                <Switch
                                                    checked={subscription.preferences?.promotions ?? true}
                                                    onCheckedChange={(checked) =>
                                                        handlePreferenceChange(
                                                            subscription.storeId,
                                                            'promotions',
                                                            checked
                                                        )
                                                    }
                                                    disabled={isUpdating}
                                                />
                                            </div>
                                        </div>

                                        <Separator />

                                        {/* Unsubscribe Button */}
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="w-full"
                                            onClick={() => handleUnsubscribe(
                                                subscription.storeId,
                                                subscription.storeName || 'this store'
                                            )}
                                            disabled={isUnsubscribing}
                                        >
                                            <BellOff className="h-4 w-4 mr-2" />
                                            {isUnsubscribing ? 'Unsubscribing...' : 'Unsubscribe from Store'}
                                        </Button>
                                    </CardContent>
                                )}
                            </Card>
                        );
                    })}
                </CardContent>
            </Card>
        </>
    )
}