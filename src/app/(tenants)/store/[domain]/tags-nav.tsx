"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

export const TagsNav = () => {

    return (
        <div className="relative z-50 border-b">
            <div className="mx-auto max-w-7xl">
                <nav className="flex items-center lg:-mx-3">
                    <ul className="relative -mb-px flex h-11 snap-x snap-proximity scroll-px-6 items-center gap-6 overflow-x-auto overflow-y-hidden px-6 lg:scroll-px-2 lg:gap-5">
                        <li className={cn("flex h-full snap-start items-center border-b border-b-transparent")}>
                            <Link href={'/'} prefetch={true}>
                                <span className="block w-max text-nowrap capitalize">Near me</span>
                            </Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    )
}