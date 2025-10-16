"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Users,
    Mail,
    TrendingUp,
    Search,
    Download,
    Filter,
    RefreshCw,
    Loader2
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { StoreSubscribersModel } from '@/lib/models/store-subscribers-model';
import type { StoreSubscriberWithParsedPreferences } from '@/lib/models/store-subscribers-model';
import { useAction } from 'next-safe-action/hooks';
import { getStoreSubscriberCountAction } from '@/lib/actions/store-subscribers.action';
import { toast } from 'sonner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface StoreSubscribersDashboardProps {
    storeId: string;
    storeName: string;
}

export const StoreSubscribersDashboard = ({
    storeId,
    storeName
}: StoreSubscribersDashboardProps) => {
    const [subscribers, setSubscribers] = useState<StoreSubscriberWithParsedPreferences[]>([]);
    const [filteredSubscribers, setFilteredSubscribers] = useState<StoreSubscriberWithParsedPreferences[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [subscriberCount, setSubscriberCount] = useState(0);

    const { execute: fetchCount } = useAction(getStoreSubscriberCountAction, {
        onSuccess: (result) => {
            if (result.data?.success) {
                setSubscriberCount(result.data.count);
            }
        }
    });

    useEffect(() => {
        loadSubscribers();
        fetchCount({ storeId });
    }, [storeId]);

    useEffect(() => {
        filterSubscribers();
    }, [subscribers, searchQuery, statusFilter]);

    const loadSubscribers = async () => {
        setIsLoading(true);
        try {
            const model = new StoreSubscribersModel();
            const result = await model.getStoreSubscribers(storeId, {
                limit: 1000,
                activeOnly: false
            });
            setSubscribers(result.documents as StoreSubscriberWithParsedPreferences[]);
        } catch (error) {
            console.error('Error loading subscribers:', error);
            toast.error('Failed to load subscribers');
        } finally {
            setIsLoading(false);
        }
    };

    const filterSubscribers = () => {
        let filtered = subscribers;

        // Apply status filter
        if (statusFilter === 'active') {
            filtered = filtered.filter(sub => sub.isActive);
        } else if (statusFilter === 'inactive') {
            filtered = filtered.filter(sub => !sub.isActive);
        }

        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(sub =>
                sub.email.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredSubscribers(filtered);
    };

    const exportToCSV = () => {
        const headers = ['Email', 'Subscribed Date', 'Status', 'Marketing', 'Order Updates', 'New Products', 'Promotions'];
        const rows = filteredSubscribers.map(sub => [
            sub.email,
            new Date(sub.subscribedAt).toLocaleDateString(),
            sub.isActive ? 'Active' : 'Inactive',
            sub.preferences?.marketing ? 'Yes' : 'No',
            sub.preferences?.orderUpdates ? 'Yes' : 'No',
            sub.preferences?.newProducts ? 'Yes' : 'No',
            sub.preferences?.promotions ? 'Yes' : 'No'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${storeName}-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Subscribers exported successfully');
    };

    const activeCount = subscribers.filter(s => s.isActive).length;
    const growthRate = subscribers.length > 0
        ? ((activeCount / subscribers.length) * 100).toFixed(1)
        : '0';

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Subscribers
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{subscribers.length}</div>
                        <p className="text-xs text-muted-foreground">
                            All time subscribers
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Active Subscribers
                        </CardTitle>
                        <Mail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Currently receiving emails
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Engagement Rate
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{growthRate}%</div>
                        <p className="text-xs text-muted-foreground">
                            Active vs total ratio
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Subscribers Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Subscriber List</CardTitle>
                            <CardDescription>
                                Manage and export your store subscribers
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={loadSubscribers}
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={exportToCSV}
                                disabled={filteredSubscribers.length === 0}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export CSV
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Filters */}
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                            <SelectTrigger className="w-[180px]">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Filter status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active Only</SelectItem>
                                <SelectItem value="inactive">Inactive Only</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Results count */}
                    <div className="text-sm text-muted-foreground">
                        Showing {filteredSubscribers.length} of {subscribers.length} subscribers
                    </div>

                    {/* Table */}
                    {filteredSubscribers.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No subscribers found</h3>
                            <p className="text-muted-foreground">
                                {searchQuery || statusFilter !== 'all'
                                    ? 'Try adjusting your filters'
                                    : 'Start promoting your store to gain subscribers'}
                            </p>
                        </div>
                    ) : (
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Subscribed</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Preferences</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredSubscribers.map((subscriber) => (
                                        <TableRow key={subscriber.$id}>
                                            <TableCell className="font-medium">
                                                {subscriber.email}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(subscriber.subscribedAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={subscriber.isActive ? "default" : "secondary"}
                                                >
                                                    {subscriber.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    {subscriber.preferences?.marketing && (
                                                        <Badge variant="outline" className="text-xs">
                                                            Marketing
                                                        </Badge>
                                                    )}
                                                    {subscriber.preferences?.orderUpdates && (
                                                        <Badge variant="outline" className="text-xs">
                                                            Orders
                                                        </Badge>
                                                    )}
                                                    {subscriber.preferences?.newProducts && (
                                                        <Badge variant="outline" className="text-xs">
                                                            Products
                                                        </Badge>
                                                    )}
                                                    {subscriber.preferences?.promotions && (
                                                        <Badge variant="outline" className="text-xs">
                                                            Promos
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}