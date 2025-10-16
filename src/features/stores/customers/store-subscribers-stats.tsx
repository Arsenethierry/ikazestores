import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getStoreSubscriberStats } from '@/lib/actions/store-subscribers.action';
import { Users, Mail, TrendingUp } from 'lucide-react';

interface StoreSubscribersStatsProps {
    storeId: string;
}

export async function StoreSubscribersStats({ storeId }: StoreSubscribersStatsProps) {
    const result = await getStoreSubscriberStats(storeId);
    const stats = result.data;

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Total Subscribers
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.total}</div>
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
                    <div className="text-2xl font-bold">{stats.active}</div>
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
                    <div className="text-2xl font-bold">{stats.engagementRate}%</div>
                    <p className="text-xs text-muted-foreground">
                        Active vs total ratio
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}