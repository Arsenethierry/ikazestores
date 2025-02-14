import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Warehouse, Store, Shuffle, Coins, BookOpen, Shield } from "lucide-react";

const footerSections = [
    {
        title: "Marketplace Network",
        icon: <Shuffle className="w-5 h-5" />,
        links: [
            { title: "Virtual Store Builder", href: "/virtual-store" },
            { title: "Supplier Directory", href: "/suppliers" },
            { title: "Commission System", href: "/commissions" },
            { title: "Real-time Analytics", href: "/analytics" },
            { title: "API Integration", href: "/api" },
            { title: "Mobile Apps", href: "/apps" },
        ],
    },
    {
        title: "For Suppliers",
        icon: <Warehouse className="w-5 h-5" />,
        links: [
            { title: "List Your Inventory", href: "/supplier-onboarding" },
            { title: "Fulfillment Guide", href: "/fulfillment" },
            { title: "Pricing & Commissions", href: "/supplier-pricing" },
            { title: "Inventory Management", href: "/inventory" },
            { title: "Supplier Dashboard", href: "/dashboard" },
            { title: "Global Shipping", href: "/shipping" },
        ],
    },
    {
        title: "For Sellers",
        icon: <Store className="w-5 h-5" />,
        links: [
            { title: "Start Virtual Store", href: "/seller-onboarding" },
            { title: "Product Import Guide", href: "/import-guide" },
            { title: "Store Customization", href: "/customization" },
            { title: "Marketing Tools", href: "/marketing" },
            { title: "Seller Commissions", href: "/earnings" },
            { title: "Sales Analytics", href: "/sales" },
        ],
    },
    {
        title: "Partnerships",
        icon: <Coins className="w-5 h-5" />,
        links: [
            { title: "Become a Partner", href: "/partners" },
            { title: "Enterprise Solutions", href: "/enterprise" },
            { title: "API Documentation", href: "/docs" },
            { title: "Affiliate Program", href: "/affiliates" },
            { title: "Success Stories", href: "/success" },
            { title: "Global Network", href: "/network" },
        ],
    },
    {
        title: "Seller Resources",
        icon: <BookOpen className="w-5 h-5" />,
        links: [
            { title: "Help Center", href: "/help" },
            { title: "Seller Academy", href: "/academy" },
            { title: "Webinars", href: "/webinars" },
            { title: "Community Forum", href: "/forum" },
            { title: "API Documentation", href: "/api-docs" },
            { title: "Status Page", href: "/status" },
        ],
    },
    {
        title: "Legal & Trust",
        icon: <Shield className="w-5 h-5" />,
        links: [
            { title: "Supplier Agreement", href: "/supplier-terms" },
            { title: "Seller Terms", href: "/seller-terms" },
            { title: "Privacy Policy", href: "/privacy" },
            { title: "GDPR Compliance", href: "/gdpr" },
            { title: "Payment Security", href: "/security" },
            { title: "Service Level Agreement", href: "/sla" },
        ],
    },
];

const SellFooter = () => {
    return (
        <footer className="bg-muted border-t">
            <div className="max-w-screen-xl mx-auto">
                <div className="py-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 px-6">
                    {footerSections.map(({ title, links, icon }) => (
                        <div key={title} className="space-y-4">
                            <div className="flex items-center gap-2 font-semibold">
                                {icon}
                                {title}
                            </div>
                            <ul className="space-y-3">
                                {links.map(({ title, href }) => (
                                    <li key={title}>
                                        <Link
                                            href={href}
                                            className="text-muted-foreground hover:text-foreground text-sm"
                                        >
                                            {title}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <Separator />

                <div className="py-8 flex flex-col sm:flex-row items-center justify-between gap-4 px-6">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Warehouse className="w-6 h-6" />
                            <Store className="w-6 h-6" />
                            <span className="text-lg font-bold">BridgeCommerce</span>
                        </div>
                        <p className="text-sm text-muted-foreground max-w-xs">
                            Connecting physical suppliers with digital entrepreneurs worldwide
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="/blog" className="text-muted-foreground hover:text-foreground">
                            Blog
                        </Link>
                        <Link href="/careers" className="text-muted-foreground hover:text-foreground">
                            Careers
                        </Link>
                        <div className="flex gap-4">
                            <Link href="https://twitter.com" target="_blank">
                                <TwitterIcon className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                            </Link>
                            <Link href="https://linkedin.com" target="_blank">
                                <LinkedinIcon className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                            </Link>
                            <Link href="https://youtube.com" target="_blank">
                                <YoutubeIcon className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                            </Link>
                        </div>
                    </div>
                </div>

                <Separator />

                <div className="py-6 text-center text-sm text-muted-foreground">
                    © {new Date().getFullYear()} BridgeCommerce. Connecting physical and digital commerce worldwide.
                    <br />
                    VAT Number: EU123456789 | Registered in Delaware, USA
                </div>
            </div>
        </footer>
    );
};

// Example social icons (replace with actual icons from your setup)
const TwitterIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
    </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
);

const YoutubeIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
    </svg>
);

export default SellFooter;