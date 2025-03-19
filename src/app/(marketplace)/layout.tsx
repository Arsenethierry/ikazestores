import { HomePageFooter } from "@/components/navbars/home-page-footer";
import MarketplaceNavbar from "@/components/navbars/marketplace-navbar";
import React from "react";

export default function MarketplaceLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="min-h-screen flex flex-col justify-between">
            <div>
                <MarketplaceNavbar />
                {children}
            </div>
            <HomePageFooter />
        </div>
    );
}
