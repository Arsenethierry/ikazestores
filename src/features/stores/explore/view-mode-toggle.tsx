"use client";

import { Button } from "@/components/ui/button";
import { Grid3x3, List } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";

export function ViewModeToggle() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const viewMode = searchParams.get("view") || "grid";

    const handleViewChange = (mode: "grid" | "list") => {
        startTransition(() => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("view", mode);
            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        });
    };

    return (
        <div className="flex items-center gap-2 border rounded-lg p-1">
            <Button
                variant={viewMode === "grid" ? "teritary" : "ghost"}
                size="sm"
                onClick={() => handleViewChange("grid")}
                disabled={isPending}
                className="h-8"
            >
                <Grid3x3 className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Grid</span>
            </Button>
            <Button
                variant={viewMode === "list" ? "teritary" : "ghost"}
                size="sm"
                onClick={() => handleViewChange("list")}
                disabled={isPending}
                className="h-8"
            >
                <List className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">List</span>
            </Button>
        </div>
    );
}