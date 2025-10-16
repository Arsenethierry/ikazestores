import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { getStoreSubscribersWithPagination } from '@/lib/actions/store-subscribers.action';
import { Users } from 'lucide-react';
import { SubscribersPagination } from './subscribers-pagination';
import { SubscribersFilters } from './subscribers-filters';

interface StoreSubscribersTableProps {
    storeId: string;
    searchParams: {
        page?: string;
        search?: string;
        status?: 'all' | 'active' | 'inactive';
    };
}

export async function StoreSubscribersTable({ 
    storeId, 
    searchParams 
}: StoreSubscribersTableProps) {
    const page = parseInt(searchParams.page || '1');
    const search = searchParams.search || '';
    const status = searchParams.status || 'all';

    const result = await getStoreSubscribersWithPagination(storeId, {
        page,
        limit: 25,
        search,
        status,
    });

    const { subscribers, total, totalPages } = result.data;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Subscriber List</CardTitle>
                        <CardDescription>
                            Manage your store subscribers
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Filters - Client Component */}
                <SubscribersFilters 
                    currentSearch={search}
                    currentStatus={status}
                />

                {/* Results count */}
                <div className="text-sm text-muted-foreground">
                    Showing {subscribers.length} of {total} subscribers
                </div>

                {/* Table */}
                {subscribers.length === 0 ? (
                    <div className="text-center py-12">
                        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No subscribers found</h3>
                        <p className="text-muted-foreground">
                            {search || status !== 'all'
                                ? 'Try adjusting your filters'
                                : 'Start promoting your store to gain subscribers'}
                        </p>
                    </div>
                ) : (
                    <>
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
                                    {subscribers.map((subscriber) => (
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
                                                <div className="flex gap-1 flex-wrap">
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

                        {/* Pagination - Client Component */}
                        {totalPages > 1 && (
                            <SubscribersPagination
                                currentPage={page}
                                totalPages={totalPages}
                            />
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}