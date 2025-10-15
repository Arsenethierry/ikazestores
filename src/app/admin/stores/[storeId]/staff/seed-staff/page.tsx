import { AccessDeniedCard } from "@/components/access-denied-card";
import { SeedStaffPage } from "@/features/staff/components/seed-staff-page";
import { getPhysicalStoreById } from "@/lib/actions/physical-store.action";
import { getVirtualStoreById } from "@/lib/actions/virtual-store.action";
import { getAuthState } from "@/lib/user-permission";
import { redirect } from "next/navigation";

interface SeedStaffRoutePageProps {
    params: Promise<{
        storeId: string;
    }>;
}

export default async function SeedStaffRoutePage({
    params,
}: SeedStaffRoutePageProps) {
    const { storeId } = await params;
    const auth = await getAuthState();

    if (!auth.isAuthenticated || !auth.user) {
        redirect(`/sign-in?redirectUrl=/admin/stores/${storeId}/staff/seed-staff`);
    }

    // Check if user has owner access to this store
    const storeRole = auth.getStoreRole(storeId);

    if (!storeRole || storeRole !== "owner") {
        return (
            <AccessDeniedCard
                message="Only store owners can access the seeding page"
            />
        );
    }

    // Determine store type and fetch store details
    let storeName = "Store";
    let storeType: "physical" | "virtual" = "physical";

    try {
        // Try virtual store first
        const virtualStore = await getVirtualStoreById(storeId);
        if (virtualStore) {
            storeName = virtualStore.storeName;
            storeType = "virtual";
        } else {
            // Try physical store
            const physicalStore = await getPhysicalStoreById(storeId);
            if (physicalStore) {
                storeName = physicalStore.storeName;
                storeType = "physical";
            } else {
                return (
                    <AccessDeniedCard
                        message="Store not found"
                    />
                );
            }
        }
    } catch (error) {
        console.error("Error fetching store:", error);
        return (
            <AccessDeniedCard
                message="Error loading store"
            />
        );
    }

    return (
        <SeedStaffPage
            storeId={storeId}
            storeType={storeType}
            storeName={storeName}
        />
    );
}