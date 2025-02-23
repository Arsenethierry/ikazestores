
import { TenantStoreNavbar } from "@/components/navbars/tenant/tenant-store-navbar";

export default async function StoreRootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <TenantStoreNavbar />
            {children}
        </>
    );
}
