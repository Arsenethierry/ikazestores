"use client";

import { Button } from "@/components/ui/button";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { NavigationMenuProps } from "@radix-ui/react-navigation-menu";
import { Bell, Boxes, LucideIcon, Rocket, Shuffle, Store, Warehouse } from "lucide-react";
import Link from "next/link";
import React from "react";

export const NavMenu = (props: NavigationMenuProps) => (
    <NavigationMenu {...props}>
        <NavigationMenuList className="gap-0 space-x-0 text-sm">
            <NavigationMenuItem>
                <Button variant="ghost" className="text-[15px] font-normal" asChild>
                    <Link href="#">Home</Link>
                </Button>
            </NavigationMenuItem>

            <NavigationMenuItem>
                <NavigationMenuTrigger className="text-[15px] font-normal">
                    For Sellers
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-1 p-4 md:w-[500px] lg:w-[600px] grid-cols-2">
                        <ListItem
                            title="Physical Stores"
                            icon={Warehouse}
                            href="/physical-stores"
                        >
                            Monetize your existing space & inventory. Get featured across virtual stores.
                        </ListItem>
                        <ListItem
                            title="Virtual Stores"
                            icon={Store}
                            href="/virtual-stores"
                        >
                            Start with zero inventory. Curate products & earn on every sale.
                        </ListItem>
                        <ListItem
                            title="Product Network"
                            icon={Boxes}
                            href="/products"
                        >
                            Global inventory network with automated order fulfillment
                        </ListItem>
                        <ListItem
                            title="Commission System"
                            icon={Shuffle}
                            href="/commissions"
                        >
                            Transparent revenue sharing between physical and virtual stores
                        </ListItem>
                    </ul>
                </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
                <NavigationMenuTrigger className="text-[15px] font-normal">
                    How It Works
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] lg:w-[600px] grid-cols-2">
                        <ListItem
                            title="1. Import Products"
                            icon={Rocket}
                            href="/guide"
                        >
                            Virtual stores select items from physical store catalogs
                        </ListItem>
                        <ListItem
                            title="2. Sell Anywhere"
                            icon={Store}
                            href="/guide"
                        >
                            Market products through your customized storefront
                        </ListItem>
                        <ListItem
                            title="3. Automated Fulfillment"
                            icon={Shuffle}
                            href="/guide"
                        >
                            Orders automatically routed to physical stores
                        </ListItem>
                        <ListItem
                            title="4. Real-time Updates"
                            icon={Bell}
                            href="/guide"
                        >
                            Instant notifications when your imported products sell
                        </ListItem>
                    </ul>
                </NavigationMenuContent>
            </NavigationMenuItem>
        </NavigationMenuList>
    </NavigationMenu>
);

const ListItem = React.forwardRef<
    React.ElementRef<typeof Link>,
    React.ComponentPropsWithoutRef<typeof Link> & { icon: LucideIcon }
>(({ className, title, children, ...props }, ref) => {
    return (
        <li>
            <NavigationMenuLink asChild>
                <Link
                    ref={ref}
                    className={cn(
                        "block select-none space-y-2 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                        className
                    )}
                    {...props}
                >
                    <props.icon className="mb-4 h-6 w-6" />
                    <div className="text-sm font-semibold leading-none">{title}</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        {children}
                    </p>
                </Link>
            </NavigationMenuLink>
        </li>
    );
});
ListItem.displayName = "ListItem";
