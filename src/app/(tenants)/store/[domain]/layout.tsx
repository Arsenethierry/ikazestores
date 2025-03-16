
import MarketplaceNavbar from "@/components/navbars/marketplace-navbar";

export default async function StoreRootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="min-h-screen">
            <MarketplaceNavbar />
            {children}
        </div>
    );
}
