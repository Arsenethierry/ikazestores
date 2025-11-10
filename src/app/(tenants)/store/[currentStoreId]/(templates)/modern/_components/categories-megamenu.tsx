import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { getCategoriesWithInheritance } from "@/lib/actions/catalog-server-actions";
import { cn } from "@/lib/utils";

interface CategoriesMegaMenuProps {
    storeId: string;
    className?: string;
    variant?: "default" | "compact";
}

type CategoryNode = Awaited<ReturnType<typeof getCategoriesWithInheritance>>["documents"][number];

export const CategoriesMegaMenu = async ({
    storeId,
    className,
    variant = "default",
}: CategoriesMegaMenuProps) => {
    const { documents: categories, error } = await getCategoriesWithInheritance(storeId);

    if (error || !categories || categories.length === 0) {
        return null;
    }

    const isCompact = variant === "compact";

    return (
        <div className={cn("flex items-center gap-1", className)}>
            {categories.slice(0, 8).map((category) => {
                const hasSubcategories = category.children && category.children.length > 0;

                return (
                    <HoverCard key={category.$id} openDelay={100} closeDelay={200}>
                        <HoverCardTrigger asChild>
                            <Link
                                href={`/products?category=${encodeURIComponent(category.categoryName || "")}`}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors",
                                    "hover:bg-accent/50 rounded-md",
                                    isCompact && "px-3 py-1.5 text-xs"
                                )}
                                prefetch={false}
                            >
                                {category.iconUrl && (
                                    <Image
                                        src={category.iconUrl}
                                        alt={category.categoryName || "Category"}
                                        width={20}
                                        height={20}
                                        className="h-5 w-5 object-contain"
                                        loading="lazy"
                                    />
                                )}
                                <span className="truncate">{category.categoryName}</span>
                                {hasSubcategories && <ChevronRight className="h-3 w-3 opacity-50" />}
                            </Link>
                        </HoverCardTrigger>

                        {hasSubcategories && (
                            <HoverCardContent
                                align="start"
                                side="bottom"
                                className="w-[600px] p-4"
                                sideOffset={8}
                            >
                                <div className="space-y-3">
                                    {/* Category Header */}
                                    <div className="flex items-center gap-2 pb-2 border-b">
                                        {category.iconUrl && (
                                            <Image
                                                src={category.iconUrl}
                                                alt={category.categoryName || "Category"}
                                                width={24}
                                                height={24}
                                                className="h-6 w-6 object-contain"
                                                loading="lazy"
                                            />
                                        )}
                                        <h4 className="font-semibold">{category.categoryName}</h4>
                                    </div>

                                    {/* Subcategories Grid */}
                                    <div className="grid grid-cols-3 gap-2">
                                        {category.children?.slice(0, 15).map((subcategory: any) => (
                                            <Link
                                                key={subcategory.$id}
                                                href={`/products?category=${encodeURIComponent(
                                                    subcategory.subCategoryName || ""
                                                )}`}
                                                className="group flex items-center gap-2 rounded-md px-3 py-2 hover:bg-accent/40 transition-colors"
                                                prefetch={false}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-sm font-medium line-clamp-1 group-hover:text-primary">
                                                        {subcategory.subCategoryName}
                                                    </span>
                                                    {subcategory.description && (
                                                        <p className="text-xs text-muted-foreground line-clamp-1">
                                                            {subcategory.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </Link>
                                        ))}
                                    </div>

                                    {/* More link if there are more subcategories */}
                                    {category.children && category.children.length > 15 && (
                                        <Link
                                            href={`/products?category=${encodeURIComponent(category.categoryName || "")}`}
                                            className="block text-center text-sm text-primary hover:underline pt-2 border-t"
                                            prefetch={false}
                                        >
                                            View all {category.children.length} subcategories →
                                        </Link>
                                    )}
                                </div>
                            </HoverCardContent>
                        )}
                    </HoverCard>
                );
            })}
        </div>
    );
};