import MarketplaceNavbar from "@/components/navbars/marketplace-navbar";

export default function MarketplaceLayout({
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
