import { Logo } from "./logo";
import { ArrowUpRight } from "lucide-react";
import { NavigationSheet } from "./navigation-sheet";
import { NavMenu } from "./nav-menu";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export const TenantStoreNavbar = () => {
  
  return (
    <div className="sticky top-0 z-50 bg-muted">
      <nav className="h-16 bg-background border-b">
        <div className="h-full flex items-center justify-between mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Logo />

            {/* Desktop Menu */}
            <NavMenu className="hidden md:block" />
          </div>

          <div className="flex items-center gap-3">
            <Link href={"/sign-in"} className={buttonVariants()}>
              Get Started <ArrowUpRight />
            </Link>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <NavigationSheet />
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};