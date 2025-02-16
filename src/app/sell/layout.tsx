import { Logo } from "@/components/navbars/tenant/logo";
import { NavMenu } from "@/components/navbars/tenant/nav-menu";
import { NavigationSheet } from "@/components/navbars/tenant/navigation-sheet";
import { Button } from "@/components/ui/button";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import Link from "next/link";

export default function SellPageLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen">
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
                      <Link href="/sell/new-store" legacyBehavior passHref>
                        <NavigationMenuLink className="block p-3 rounded-lg hover:bg-accent transition-colors">
                          <div className="font-medium">Physical Store Owner</div>
                          <p className="text-sm text-muted-foreground">
                            List your existing inventory to be featured in virtual stores
                          </p>
                        </NavigationMenuLink>
                      </Link>
                      <Link href="/sell/new-store" legacyBehavior passHref>
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
      {children}
    </div>
  );
}
