import { Button } from "@/components/ui/button";
import { Warehouse, Store, HeadsetIcon, Shuffle, UserPlus } from "lucide-react";
import Link from "next/link";

const ContactUs = () => (
    <div className="text-center bg-gradient-to-b from-muted-foreground/10 to-background py-24">
        <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-background border mb-4">
            <Shuffle className="w-5 h-5 text-primary" />
            <span className="text-muted-foreground text-sm">
                Bridging Physical & Digital Commerce
            </span>
        </div>
        <h2 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">
            Connect With Our Partnership Network
        </h2>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Whether you&apos;re a brick-and-mortar business or digital entrepreneur,
            our team is here to streamline your cross-channel operations.
        </p>

        <div className="max-w-screen-xl mx-auto py-24 grid md:grid-cols-3 gap-12 px-6">
            {/* Physical Stores Contact */}
            <div className="text-center flex flex-col items-center p-8 rounded-xl border hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full">
                    <Warehouse className="w-6 h-6" />
                </div>
                <h3 className="mt-6 font-bold text-xl">Physical Suppliers</h3>
                <p className="mt-2 text-muted-foreground">
                    List your inventory to our network of virtual stores
                </p>
                <div className="mt-6 space-y-2">
                    <Link
                        className="block font-medium text-primary hover:underline"
                        href="mailto:partnerships@yourplatform.com"
                    >
                        partnerships@yourplatform.com
                    </Link>
                    <p className="text-sm text-muted-foreground">
                        Global vendor onboarding support
                    </p>
                </div>
            </div>

            {/* Virtual Stores Contact */}
            <div className="text-center flex flex-col items-center p-8 rounded-xl border hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 flex items-center justify-center bg-green-100 text-green-600 rounded-full">
                    <Store className="w-6 h-6" />
                </div>
                <h3 className="mt-6 font-bold text-xl">Virtual Entrepreneurs</h3>
                <p className="mt-2 text-muted-foreground">
                    Start your inventory-free store in minutes
                </p>
                <div className="mt-6 space-y-2">
                    <Link
                        className="block font-medium text-primary hover:underline"
                        href="mailto:collaboration@yourplatform.com"
                    >
                        collaboration@yourplatform.com
                    </Link>
                    <p className="text-sm text-muted-foreground">
                        Dedicated curation specialists
                    </p>
                </div>
            </div>

            {/* Global Support */}
            <div className="text-center flex flex-col items-center p-8 rounded-xl border hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 flex items-center justify-center bg-purple-100 text-purple-600 rounded-full">
                    <HeadsetIcon className="w-6 h-6" />
                </div>
                <h3 className="mt-6 font-bold text-xl">Network Support</h3>
                <p className="mt-2 text-muted-foreground">
                    24/7 cross-platform operational support
                </p>
                <div className="mt-6 space-y-2">
                    <Link
                        className="block font-medium text-primary hover:underline"
                        href="tel:+1-555-123-4567"
                    >
                        +1 (555) 123-4567
                    </Link>
                    <div className="text-sm text-muted-foreground">
                        <p>Global Virtual Offices:</p>
                        <p>San Francisco • Singapore • Berlin</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Partnership CTA */}
        <div className="max-w-2xl mx-auto px-6 py-8 bg-background rounded-xl border">
            <UserPlus className="w-12 h-12 mx-auto text-primary mb-4" />
            <h3 className="text-2xl font-bold">Join Our Growing Network</h3>
            <p className="mt-2 text-muted-foreground">
                Over 1,200 physical suppliers and 3,400 virtual entrepreneurs collaborating daily
            </p>
            <div className="mt-6 flex justify-center gap-4">
                <Button asChild>
                    <Link href="/physical-onboarding" className="gap-2">
                        <Warehouse className="w-4 h-4" /> List Physical Store
                    </Link>
                </Button>
                <Button variant="outline" asChild>
                    <Link href="/virtual-onboarding" className="gap-2">
                        <Store className="w-4 h-4" /> Launch Virtual Store
                    </Link>
                </Button>
            </div>
        </div>
    </div>
);

export default ContactUs;