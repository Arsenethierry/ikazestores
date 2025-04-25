
import { TenantStoreNavbar } from "@/components/navbars/tenant/tenant-store-navbar";

export default async function StoreRootLayout({
    children,
    params
}: Readonly<{
    children: React.ReactNode;
    params: Promise<{ currentStoreId: string }>
}>) {
    const { currentStoreId } = await params;
    
    return (
        <div className="min-h-screen">
            <TenantStoreNavbar currentStore={currentStoreId} />
            {children}
        </div>
    );
}
