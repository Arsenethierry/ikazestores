import { Button } from "@/components/ui/button";
import { NavigationSheet } from "@/components/navbars/tenant/navigation-sheet";
import { Logo } from "@/components/navbars/tenant/logo";
import { NavMenu } from "@/components/navbars/tenant/nav-menu";
import Link from "next/link";
import { ArrowUpRight, Boxes, CirclePlay, Rocket, Store, UserPlus, Zap } from "lucide-react";
import SellFooter from "@/components/footers/sell-page-footer";
import SellPageTestimonials from "@/features/sell-page/components/testimonials";
import SellPageFaq from "@/features/sell-page/components/faq";
import MeetOurTeam from "@/features/sell-page/components/meet-our-team";
import ContactUs from "@/features/sell-page/components/contact-us";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
// import Image from "next/image";
import { Badge } from "@/components/ui/badge";

const Navbar04Page = () => {
    return (
        <>
            <nav className="fixed top-6 inset-x-4 h-16 bg-background border dark:border-slate-700/70 max-w-screen-xl mx-auto rounded-full z-50">
                <div className="h-full flex items-center justify-between mx-auto px-4">
                    <Link href={'/'}>
                        <Logo />
                    </Link>

                    {/* Desktop Menu - Updated for marketplace focus */}
                    <NavMenu className="hidden md:block" />

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="hidden sm:inline-flex rounded-full"
                        >
                            Sign In
                        </Button>
                        {/* Updated Get Started with dropdown */}
                        <NavigationMenu>
                            <NavigationMenuList>
                                <NavigationMenuItem>
                                    <NavigationMenuTrigger className="rounded-full bg-primary text-primary-foreground">
                                        Get Started
                                    </NavigationMenuTrigger>
                                    <NavigationMenuContent className="p-4 min-w-[300px]">
                                        <div className="grid gap-2">
                                            <h3 className="text-lg font-semibold">Start Selling</h3>
                                            <Link href="/create-physical-store" legacyBehavior passHref>
                                                <NavigationMenuLink className="block p-3 rounded-lg hover:bg-accent transition-colors">
                                                    <div className="font-medium">Physical Store Owner</div>
                                                    <p className="text-sm text-muted-foreground">
                                                        List your existing inventory to be featured in virtual stores
                                                    </p>
                                                </NavigationMenuLink>
                                            </Link>
                                            <Link href="/create-virtual-store" legacyBehavior passHref>
                                                <NavigationMenuLink className="block p-3 rounded-lg hover:bg-accent transition-colors">
                                                    <div className="font-medium">Virtual Entrepreneur</div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Build your online store with our product network
                                                    </p>
                                                </NavigationMenuLink>
                                            </Link>
                                        </div>
                                    </NavigationMenuContent>
                                </NavigationMenuItem>
                            </NavigationMenuList>
                        </NavigationMenu>

                        {/* Mobile Menu */}
                        <div className="md:hidden">
                            <NavigationSheet />
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero */}

            <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-b from-background to-muted-foreground/20">
                <div className="text-center max-w-4xl">
                    <Badge variant="outline" className="mb-6 py-2 px-4 rounded-full">
                        <Rocket className="w-4 h-4 mr-2" />
                        Next-Gen Commerce Platform
                    </Badge>

                    <h1 className="mt-4 text-4xl sm:text-5xl md:text-6xl font-black leading-[1.1] tracking-tight">
                        Bridge Physical & Virtual Commerce,
                        <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                            Earn Together
                        </span>
                    </h1>

                    <p className="mt-8 text-[17px] md:text-xl text-muted-foreground max-w-3xl mx-auto">
                        Transform your existing retail space into a digital revenue stream or launch your
                        virtual store with zero inventory. Our automated platform connects physical
                        suppliers with digital entrepreneurs in real-time.
                    </p>

                    <div className="mt-12 flex items-center justify-center gap-4">
                        <Button size="lg" className="rounded-full text-base gap-2" asChild>
                            <Link href="/create-store">
                                Launch Your Store <ArrowUpRight className="h-5 w-5" />
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="rounded-full text-base shadow-none gap-2"
                        >
                            <CirclePlay className="h-5 w-5" /> Platform Demo
                        </Button>
                    </div>

                    {/* Value Proposition Metrics */}
                    <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 text-left max-w-5xl mx-auto">
                        <div className="p-6 bg-background rounded-xl border">
                            <Store className="h-8 w-8 mb-4 text-primary" />
                            <h3 className="text-2xl font-bold">500+</h3>
                            <p className="text-muted-foreground">Physical Vendors</p>
                        </div>
                        <div className="p-6 bg-background rounded-xl border">
                            <UserPlus className="h-8 w-8 mb-4 text-primary" />
                            <h3 className="text-2xl font-bold">2.3k</h3>
                            <p className="text-muted-foreground">Virtual Entrepreneurs</p>
                        </div>
                        <div className="p-6 bg-background rounded-xl border">
                            <Boxes className="h-8 w-8 mb-4 text-primary" />
                            <h3 className="text-2xl font-bold">50k+</h3>
                            <p className="text-muted-foreground">Products Listed</p>
                        </div>
                        <div className="p-6 bg-background rounded-xl border">
                            <Zap className="h-8 w-8 mb-4 text-primary" />
                            <h3 className="text-2xl font-bold">Instant</h3>
                            <p className="text-muted-foreground">Sales Notifications</p>
                        </div>
                    </div>

                    {/* Platform Preview Mockup */}
                    <div className="mt-16 mx-auto max-w-6xl border rounded-2xl bg-background shadow-xl overflow-hidden">
                        {/* <Image
                            src="/platform-preview.jpg"
                            alt="Platform interface showing physical and virtual store dashboards"
                            className="w-full h-auto"
                        /> */}
                    </div>
                </div>
            </div>

            <SellPageTestimonials />
            <MeetOurTeam />
            <ContactUs />
            <SellPageFaq />
            <SellFooter />
        </>
    );
};

export default Navbar04Page;