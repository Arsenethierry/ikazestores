// import RootNavbar from "@/components/navbar/root-navbar";
// import StoreNavbar from "@/components/pages/store/navbar";

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
