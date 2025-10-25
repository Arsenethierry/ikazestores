"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Tag,
    Clock,
    CheckCircle,
    XCircle,
    CalendarClock,
    AlertTriangle,
    Plus,
} from "lucide-react";
import { ProductBadges } from "@/lib/types/appwrite/appwrite";
import { formatDistanceToNow, isPast, isFuture, differenceInDays, differenceInHours } from "date-fns";
import Link from "next/link";

interface BadgeStatusIndicatorsProps {
    productId: string;
    storeId: string;
    badges: ProductBadges[];
    storeType: "physical" | "virtual";
}

type BadgeStatus = "active" | "expiring-soon" | "expired" | "scheduled" | "inactive";

interface BadgeWithStatus extends ProductBadges {
    status: BadgeStatus;
    daysRemaining?: number;
    hoursRemaining?: number;
}

export function BadgeStatusIndicators({
    productId,
    storeId,
    badges,
    storeType,
}: BadgeStatusIndicatorsProps) {
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update current time every minute for countdown accuracy
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Update every minute

        return () => clearInterval(timer);
    }, []);

    const getBadgeStatus = (badge: ProductBadges): BadgeWithStatus => {
        const now = currentTime;
        const startDate = badge.startDate ? new Date(badge.startDate) : null;
        const endDate = badge.endDate ? new Date(badge.endDate) : null;

        let status: BadgeStatus = "active";
        let daysRemaining: number | undefined;
        let hoursRemaining: number | undefined;

        // Inactive badge
        if (!badge.isActive) {
            status = "inactive";
        }
        // Scheduled (not started yet)
        else if (startDate && isFuture(startDate)) {
            status = "scheduled";
        }
        // Expired
        else if (endDate && isPast(endDate)) {
            status = "expired";
        }
        // Expiring soon (less than 3 days)
        else if (endDate) {
            daysRemaining = differenceInDays(endDate, now);
            hoursRemaining = differenceInHours(endDate, now);

            if (daysRemaining <= 3) {
                status = "expiring-soon";
            } else {
                status = "active";
            }
        }

        return {
            ...badge,
            status,
            daysRemaining,
            hoursRemaining,
        };
    };

    const badgesWithStatus = badges.map(getBadgeStatus);

    const getStatusConfig = (status: BadgeStatus) => {
        switch (status) {
            case "active":
                return {
                    icon: CheckCircle,
                    label: "Active",
                    variant: "default" as const,
                    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                };
            case "expiring-soon":
                return {
                    icon: AlertTriangle,
                    label: "Expiring Soon",
                    variant: "destructive" as const,
                    className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
                };
            case "expired":
                return {
                    icon: XCircle,
                    label: "Expired",
                    variant: "secondary" as const,
                    className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
                };
            case "scheduled":
                return {
                    icon: CalendarClock,
                    label: "Scheduled",
                    variant: "outline" as const,
                    className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
                };
            case "inactive":
                return {
                    icon: XCircle,
                    label: "Inactive",
                    variant: "secondary" as const,
                    className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
                };
            default:
                return {
                    icon: Tag,
                    label: "Unknown",
                    variant: "secondary" as const,
                    className: "bg-gray-100 text-gray-800",
                };
        }
    };

    const formatCountdown = (badge: BadgeWithStatus) => {
        if (!badge.endDate) return null;

        const days = badge.daysRemaining || 0;
        const hours = badge.hoursRemaining || 0;
        const remainingHours = hours % 24;

        if (days === 0 && remainingHours === 0) {
            return "Less than 1 hour";
        }

        const parts: string[] = [];
        if (days > 0) {
            parts.push(`${days} day${days !== 1 ? "s" : ""}`);
        }
        if (remainingHours > 0 || days === 0) {
            parts.push(`${remainingHours} hour${remainingHours !== 1 ? "s" : ""}`);
        }

        return parts.join(" ");
    };

    const formatScheduledStart = (badge: BadgeWithStatus) => {
        if (!badge.startDate) return null;
        return formatDistanceToNow(new Date(badge.startDate), { addSuffix: true });
    };

    // Group badges by status
    const groupedBadges = badgesWithStatus.reduce(
        (acc, badge) => {
            if (!acc[badge.status]) {
                acc[badge.status] = [];
            }
            acc[badge.status].push(badge);
            return acc;
        },
        {} as Record<BadgeStatus, BadgeWithStatus[]>
    );

    const statusOrder: BadgeStatus[] = [
        "active",
        "expiring-soon",
        "scheduled",
        "expired",
        "inactive",
    ];

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Tag className="h-5 w-5" />
                            Badge Status Indicators
                        </CardTitle>
                        <CardDescription>
                            Manage promotional badges with countdown timers
                        </CardDescription>
                    </div>
                    <Button size="sm" asChild>
                        <Link
                            href={`/admin/stores/${storeId}/${storeType}-store/products/${productId}/badges/new`}
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Badge
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {badges.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-sm">No badges assigned to this product</p>
                        <Button size="sm" variant="outline" className="mt-4" asChild>
                            <Link
                                href={`/admin/stores/${storeId}/${storeType}-store/products/${productId}/badges/new`}
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Create First Badge
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {statusOrder.map((status) => {
                            const statusBadges = groupedBadges[status] || [];
                            if (statusBadges.length === 0) return null;

                            const config = getStatusConfig(status);
                            const StatusIcon = config.icon;

                            return (
                                <div key={status} className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Badge className={config.className}>
                                            <StatusIcon className="h-3 w-3 mr-1" />
                                            {config.label}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">
                                            ({statusBadges.length})
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        {statusBadges.map((badge) => (
                                            <div
                                                key={badge.$id}
                                                className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
                                            >
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">
                                                            {badge.label || badge.badgeType}
                                                        </span>
                                                        <Badge variant="outline" className="text-xs">
                                                            {badge.badgeType}
                                                        </Badge>
                                                        {badge.priority && badge.priority > 0 && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                Priority: {badge.priority}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {/* Countdown for expiring badges */}
                                                    {badge.status === "expiring-soon" && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                                            <span className="text-orange-700 dark:text-orange-300 font-medium">
                                                                Expires in: {formatCountdown(badge)}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Countdown for active badges with end date */}
                                                    {badge.status === "active" && badge.endDate && (
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <Clock className="h-4 w-4" />
                                                            <span>
                                                                Expires in: {formatCountdown(badge)}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Scheduled start time */}
                                                    {badge.status === "scheduled" && (
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <CalendarClock className="h-4 w-4" />
                                                            <span>
                                                                Starts: {formatScheduledStart(badge)}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Expired info */}
                                                    {badge.status === "expired" && badge.endDate && (
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <XCircle className="h-4 w-4" />
                                                            <span>
                                                                Expired {formatDistanceToNow(new Date(badge.endDate), { addSuffix: true })}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Color scheme preview */}
                                                    {badge.colorScheme && (
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <div
                                                                className={`h-3 w-3 rounded-full bg-${badge.colorScheme}-500`}
                                                            />
                                                            <span className="text-xs text-muted-foreground">
                                                                {badge.colorScheme}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    asChild
                                                >
                                                    <Link
                                                        href={`/admin/stores/${storeId}/${storeType}-store/products/${productId}/badges/${badge.$id}/edit`}
                                                    >
                                                        Edit
                                                    </Link>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}