import { AccessDeniedCard } from "@/components/access-denied-card";
import { EmptyState, ErrorDisplay } from "@/components/error-display";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InviteStaffDialog } from "@/features/staff/components/invite-staff-dialog";
import { PendingInvitations } from "@/features/staff/pending-invitations";
import { RolesManagement } from "@/features/staff/roles-management";
import { StaffTable } from "@/features/staff/staff-table";
import { checkStaffPermissionsAction, getStoreInvitationsAction, getStoreRolesAction, getStoreStaffAction } from "@/lib/actions/staff.safe-actions";
import { EnrichedStaffMember } from "@/lib/models/staff-models";
import { getAuthState } from "@/lib/user-permission";
import { AlertCircle, AlertTriangle, Clock, RefreshCw, ShieldCheck, UserPlus, Users, XCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";

interface StaffPageProps {
    params: Promise<{
        storeId: string;
    }>;
}

function StaffTableSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-32" />
            </div>
            <div className="border rounded-md">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border-b last:border-b-0">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-8 w-8" />
                    </div>
                ))}
            </div>
        </div>
    );
}

function StatsSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-16 mb-1" />
                        <Skeleton className="h-3 w-32" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

async function StaffStats({ storeId }: { storeId: string }) {
    const [staffResult, invitationsResult] = await Promise.all([
        getStoreStaffAction(storeId),
        getStoreInvitationsAction(storeId, "pending"),
    ]);

    if (!staffResult.success) {
        return (
            <ErrorDisplay
                title="Failed to Load Staff Statistics"
                message={staffResult.error || "Unable to retrieve staff data. Please try again later."}
            />
        );
    }

    if (!invitationsResult.success) {
        return (
            <ErrorDisplay
                title="Failed to Load Invitation Statistics"
                message={invitationsResult.error || "Unable to retrieve invitation data. Please try again later."}
            />
        );
    }

    const staff = staffResult.data;
    const pendingInvitations = invitationsResult.data || [];

    const activeStaff = staff.filter((s: EnrichedStaffMember) => s.StoreStaffStatus === "active").length;
    const suspendedStaff = staff.filter((s: EnrichedStaffMember) => s.StoreStaffStatus === "suspended").length;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentlyActive = staff.filter(
        (s: any) => s.lastActive && new Date(s.lastActive) > sevenDaysAgo
    ).length;

    const stats = [
        {
            title: "Total Staff",
            value: staff.length,
            description: "Active team members",
            icon: Users,
            color: "text-blue-600",
        },
        {
            title: "Active Now",
            value: activeStaff,
            description: `${staff.length - activeStaff} inactive`,
            icon: ShieldCheck,
            color: "text-green-600",
        },
        {
            title: "Pending Invites",
            value: pendingInvitations.length,
            description: "Awaiting acceptance",
            icon: UserPlus,
            color: "text-orange-600",
        },
        {
            title: "Recently Active",
            value: recentlyActive,
            description: "Last 7 days",
            icon: Clock,
            color: "text-purple-600",
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-4">
            {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <Icon className={`h-4 w-4 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">{stat.description}</p>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}

async function StaffList({ storeId }: { storeId: string }) {
    const [staffResult, rolesResult, permissionsResult] = await Promise.all([
        getStoreStaffAction(storeId),
        getStoreRolesAction(storeId),
        checkStaffPermissionsAction(storeId, ["staff.update", "staff.delete", "staff.invite"]),
    ]);

    if (!staffResult.success) {
        return (
            <ErrorDisplay
                title="Failed to Load Staff Members"
                message={staffResult.error || "Unable to retrieve staff members. Please check your connection and try again."}
            />
        );
    }

    // Show staff even if roles fail
    const canEdit = permissionsResult.permissions?.["staff.update"] || false;
    const canDelete = permissionsResult.permissions?.["staff.delete"] || false;
    const canInvite = permissionsResult.permissions?.["staff.invite"] || false;

    return (
        <div className="space-y-4">
            {!rolesResult.success && (
                <Alert variant="default">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Unable to load roles for invitations. {rolesResult.error}
                    </AlertDescription>
                </Alert>
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Team Members</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage your store's staff and their permissions
                    </p>
                </div>
                {canInvite && rolesResult.success && (
                    <InviteStaffDialog
                        storeId={storeId}
                        storeType="physical"
                        roles={rolesResult.data}
                    />
                )}
            </div>

            {staffResult.data.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title="No Staff Members"
                    description="Get started by inviting team members to help manage your store."
                />
            ) : (
                <StaffTable
                    staff={staffResult.data}
                    storeId={storeId}
                    canEdit={canEdit}
                    canDelete={canDelete}
                />
            )}
        </div>
    );
}

async function InvitationsList({ storeId }: { storeId: string }) {
    const invitationsResult = await getStoreInvitationsAction(storeId, "pending");

    if (!invitationsResult.success) {
        return (
            <ErrorDisplay
                title="Failed to Load Invitations"
                message={invitationsResult.error || "Unable to retrieve pending invitations. Please try again later."}
            />
        );
    }

    if (!invitationsResult.data || invitationsResult.data.length === 0) {
        return (
            <EmptyState
                icon={UserPlus}
                title="No Pending Invitations"
                description="All invitations have been accepted or there are no pending invites at this time."
            />
        );
    }

    return <PendingInvitations invitations={invitationsResult.data} storeId={storeId} />;
}

async function RolesList({ storeId }: { storeId: string }) {
    const rolesResult = await getStoreRolesAction(storeId);

    if (!rolesResult.success) {
        return (
            <ErrorDisplay
                title="Failed to Load Roles"
                message={rolesResult.error || "Unable to retrieve role information. Please check your permissions and try again."}
            />
        );
    }

    if (!rolesResult.data || rolesResult.data.length === 0) {
        return (
            <EmptyState
                icon={ShieldCheck}
                title="No Roles Configured"
                description="Create roles to define permissions and access levels for your team members."
            />
        );
    }

    return <RolesManagement roles={rolesResult.data} storeId={storeId} storeType="physical" />;
}

export default async function StaffPage({ params }: StaffPageProps) {
    const { storeId } = await params;

    const { user } = await getAuthState();

    if (!user) {
        redirect("/sign-in");
    }

    // Check if user has access to view staff
    const permissionsResult = await checkStaffPermissionsAction(storeId, ["staff.view"]);

    if (!permissionsResult.permissions?.["staff.view"]) {
        return <AccessDeniedCard />
    }

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
                <p className="text-muted-foreground">
                    Manage your team members, roles, and permissions
                </p>
            </div>

            <Suspense fallback={<StatsSkeleton />}>
                <StaffStats storeId={storeId} />
            </Suspense>

            <Tabs defaultValue="staff" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="staff">Staff Members</TabsTrigger>
                    <TabsTrigger value="invitations">Pending Invitations</TabsTrigger>
                    <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
                </TabsList>

                <TabsContent value="staff" className="space-y-4">
                    <Suspense fallback={<StaffTableSkeleton />}>
                        <StaffList storeId={storeId} />
                    </Suspense>
                </TabsContent>

                <TabsContent value="invitations" className="space-y-4">
                    <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                        <InvitationsList storeId={storeId} />
                    </Suspense>
                </TabsContent>

                <TabsContent value="roles" className="space-y-4">
                    <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                        <RolesList storeId={storeId} />
                    </Suspense>
                </TabsContent>
            </Tabs>
        </div>
    );
}

export async function generateMetadata({ params }: StaffPageProps) {
    return {
        title: "Staff Management",
        description: "Manage your store's team members, roles, and permissions",
    };
}