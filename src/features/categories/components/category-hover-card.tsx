import { getCategoriesWithInheritance } from "../actions/categories-actions";
import Link from "next/link";
import { ChevronRight, Globe, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import Image from "next/image";

interface CategoriesCardProps {
    mobile?: boolean;
    storeId?: string | null;
    showGlobal?: boolean;
    maxDepth?: number;
}

export const CategoriesCard = async ({
    mobile = false,
    storeId = null,
    showGlobal = true,
    maxDepth = 2
}: CategoriesCardProps) => {
    const { documents: categories, error } = await getCategoriesWithInheritance(storeId);

    if (error) {
        return <div className="text-red-500 p-4">Error loading categories: {error}</div>;
    }

    if (!categories || categories.length === 0) {
        return (
            <div className="text-muted-foreground p-4 text-center">
                <p className="text-sm">No categories available</p>
            </div>
        );
    }

    const filteredCategories = categories.filter(category => {
        if (showGlobal) return true;
        return category.storeId === storeId;
    });

    const renderCategoryChildren = (children: any[], depth = 0) => {
        if (depth >= maxDepth || !children || children.length === 0) return null;

        return (
            <div className={`grid ${mobile ? 'grid-cols-1' : 'grid-cols-2'} gap-2 mt-2`}>
                {children.map((child: any) => (
                    <div key={child.$id} className="space-y-1">
                        <Link
                            href={`/products?category=${encodeURIComponent(child.categoryName)}`}
                            className={`block hover:bg-accent hover:underline rounded-lg transition-colors ${mobile ? 'px-2 py-1 text-sm' : 'px-3 py-2'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-medium">{child.categoryName}</span>
                                {child.children && child.children.length > 0 && (
                                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                )}
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                                {!child.storeId && (
                                    <Badge variant="outline" className="text-xs">
                                        <Globe className="w-2 h-2 mr-1" />
                                        Global
                                    </Badge>
                                )}
                                {child.storeId && (
                                    <Badge variant="secondary" className="text-xs">
                                        <Store className="w-2 h-2 mr-1" />
                                        Store
                                    </Badge>
                                )}

                                {child.children && child.children.length > 0 && depth < maxDepth - 1 && (
                                    <div className="ml-4 pl-2 border-l border-muted">
                                        {renderCategoryChildren(child.children, depth + 1)}
                                    </div>
                                )}
                            </div>
                        </Link>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className={`space-y-2 ${mobile ? 'p-2' : ''}`}>
            {filteredCategories.map((category: any) => {
                const hasChildren = category.children && category.children.length > 0;

                return (
                    <HoverCard openDelay={100} closeDelay={100} key={category.$id}>
                        <HoverCardTrigger asChild>
                            <Link href={`/products?category=${encodeURIComponent(category.categoryName)}`}>
                                <button
                                    className={`group w-full text-left transition-all duration-200 ${mobile
                                        ? 'px-4 py-3 text-sm rounded-lg bg-background border hover:border-primary'
                                        : 'px-4 py-3 font-medium hover:bg-accent rounded-lg border border-transparent hover:border-border'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {typeof category.iconUrl === 'string' && (
                                                <Image
                                                    src={category.iconUrl}
                                                    alt={category.categoryName}
                                                    className="w-5 h-5 object-cover rounded"
                                                    width={50}
                                                    height={50}
                                                />
                                            )}
                                            <span className="group-hover:underline">
                                                {category.categoryName}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {hasChildren && (
                                            <Badge variant="outline" className="text-xs">
                                                {category.children!.length} items
                                            </Badge>
                                        )}

                                        {hasChildren && (
                                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                        )}
                                    </div>

                                    {category.description && (
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                            {category.description}
                                        </p>
                                    )}
                                </button>
                            </Link>
                        </HoverCardTrigger>

                        {hasChildren && (
                            <HoverCardContent
                                align="start"
                                side={mobile ? "bottom" : "right"}
                                className={`${mobile ? 'w-80' : 'w-96'} p-4`}
                                sideOffset={8}
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 pb-2 border-b">
                                        {typeof category.iconUrl === 'string' && category.iconUrl && (
                                            <Image
                                                src={category.iconUrl}
                                                alt={category.categoryName}
                                                className="w-6 h-6 object-cover rounded"
                                            />
                                        )}
                                        <h4 className="font-semibold">{category.categoryName}</h4>
                                        <Badge variant="outline" className="text-xs ml-auto">
                                            {category.children!.length} subcategories
                                        </Badge>
                                    </div>

                                    {category.description && (
                                        <p className="text-sm text-muted-foreground">
                                            {category.description}
                                        </p>
                                    )}
                                    {renderCategoryChildren(category.children!)}

                                    <div className="pt-3 border-t">
                                        <Link
                                            href={`/products?category=${encodeURIComponent(category.categoryName)}`}
                                            className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                                        >
                                            View All {category.categoryName}
                                            <ChevronRight className="h-4 w-4" />
                                        </Link>
                                    </div>
                                </div>
                            </HoverCardContent>
                        )}
                    </HoverCard>
                )
            })}
        </div>
    )
}