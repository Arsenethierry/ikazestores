import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";

const sections = [
    {
        title: "For Shoppers",
        links: [
            { name: "Browse Stores", href: "#" },
            { name: "Featured Products", href: "#" },
            { name: "How It Works", href: "#" },
            { name: "Customer Support", href: "#" },
        ],
    },
    {
        title: "For Store Owners",
        links: [
            { name: "Create Virtual Store", href: "#" },
            { name: "Partner Physical Stores", href: "#" },
            { name: "Seller Dashboard", href: "#" },
            { name: "Success Stories", href: "#" },
        ],
    },
    {
        title: "Company",
        links: [
            { name: "About Us", href: "#" },
            { name: "Terms of Service", href: "#" },
            { name: "Privacy Policy", href: "#" },
            { name: "Contact Us", href: "#" },
        ],
    },
];

export const HomePageFooter = () => {
    return (
        <section className="py-16 main-container max-w-[1540px] mx-auto">
            <div className="container">
                <footer>
                    <div className="flex flex-col items-center justify-between gap-10 text-center lg:flex-row lg:text-left">
                        <div className="flex w-full max-w-96 shrink flex-col items-center justify-between gap-6 lg:items-start">
                            <div>
                                <span className="flex items-center justify-center gap-4 lg:justify-start">
                                    {/* <img
                                        src="/images/logo.svg"
                                        alt="logo"
                                        className="h-11"
                                    /> */}
                                    <p className="text-3xl font-semibold">IkazeStores</p>
                                </span>
                                <p className="mt-6 text-sm text-muted-foreground">
                                    Connect physical and virtual stores in one marketplace. Create your virtual store, import products, and start selling without inventory.
                                </p>
                            </div>
                            <ul className="flex items-center space-x-6 text-muted-foreground">
                                <li className="font-medium hover:text-primary">
                                    <a href="#">
                                        <Instagram className="size-6" />
                                    </a>
                                </li>
                                <li className="font-medium hover:text-primary">
                                    <a href="#">
                                        <Facebook className="size-6" />
                                    </a>
                                </li>
                                <li className="font-medium hover:text-primary">
                                    <a href="#">
                                        <Twitter className="size-6" />
                                    </a>
                                </li>
                                <li className="font-medium hover:text-primary">
                                    <a href="#">
                                        <Linkedin className="size-6" />
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <div className="grid grid-cols-3 gap-6 lg:gap-20">
                            {sections.map((section, sectionIdx) => (
                                <div key={sectionIdx}>
                                    <h3 className="mb-6 font-bold">{section.title}</h3>
                                    <ul className="space-y-4 text-sm text-muted-foreground">
                                        {section.links.map((link, linkIdx) => (
                                            <li
                                                key={linkIdx}
                                                className="font-medium hover:text-primary"
                                            >
                                                <a href={link.href}>{link.name}</a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mt-12 flex flex-col justify-between gap-4 border-t pt-8 text-center text-sm font-medium text-muted-foreground lg:flex-row lg:items-center lg:text-left">
                        <p>© 2025 IkazeStores. All rights reserved.</p>
                        <ul className="flex flex-wrap justify-center gap-4 lg:justify-start">
                            <li className="hover:text-primary">
                                <a href="#"> Terms of Service</a>
                            </li>
                            <li className="hover:text-primary">
                                <a href="#"> Privacy Policy</a>
                            </li>
                            <li className="hover:text-primary">
                                <a href="#"> Seller Agreement</a>
                            </li>
                        </ul>
                    </div>
                </footer>
            </div>
        </section>
    );
};