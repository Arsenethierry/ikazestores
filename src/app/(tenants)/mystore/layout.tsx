import { TenantStoreNavbar } from "@/components/navbars/tenant/tenant-store-navbar";

export default function SellPlatformLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="min-h-screen">
            <TenantStoreNavbar />
            {children}
        </div>
    );
}
