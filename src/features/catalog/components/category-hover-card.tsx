import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { getCategoriesWithInheritance } from "@/lib/actions/catalog-server-actions";

// Keep this a Server Component for zero client work except the small HoverCard bits.
interface CategoriesCardProps {
  mobile?: boolean;
  storeId?: string | null;
  showGlobal?: boolean;
  maxDepth?: number;        // 1 = only categories, 2 = include subcategories
  maxPerCategory?: number;  // cap how many children to render in the hover
}

type CategoryNode = Awaited<ReturnType<typeof getCategoriesWithInheritance>>["documents"][number];

export const CategoriesCard = async ({
  mobile = false,
  storeId = null,
  showGlobal = true,
  maxDepth = 2,
  maxPerCategory = 10,
}: CategoriesCardProps) => {
  const { documents: categories, error } = await getCategoriesWithInheritance(storeId);

  if (error) {
    return <div className="text-red-500 p-4 text-sm">Error loading categories: {error}</div>;
  }
  if (!categories || categories.length === 0) {
    return (
      <div className="text-muted-foreground p-4 text-center">
        <p className="text-sm">No categories available</p>
      </div>
    );
  }

  // filter once, cheaply
  const filtered = categories.filter((c) => {
    if (showGlobal) return true;
    return (c.storeId && storeId && c.storeId === storeId);
  });

  // tiny util to keep links consistent
  const catHref = (name: string | null | undefined) =>
    `/products?category=${encodeURIComponent(name ?? "")}`;

  const renderChildren = (childList: NonNullable<CategoryNode["children"]>) => {
    if (maxDepth < 2 || !childList?.length) return null;

    const limited = childList.slice(0, maxPerCategory);
    const hasMore = childList.length > maxPerCategory;

    return (
      <div className={`${mobile ? "hidden" : "grid grid-cols-2"} gap-2`}>
        {limited.map((child: any) => (
          <Link
            key={child.$id}
            href={catHref(child.subCategoryName)}
            prefetch={false}
            className="block rounded-md px-3 py-2 hover:bg-accent/40 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium line-clamp-1">{child.subCategoryName}</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            {child.description ? (
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                {child.description}
              </p>
            ) : null}
          </Link>
        ))}
        {hasMore && (
          <Link
            href={catHref("All")}
            prefetch={false}
            className="rounded-md px-3 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            View more…
          </Link>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-1 ${mobile ? "p-2" : ""}`}>
      {filtered.map((category) => {
        const count = category.children?.length ?? 0;
        const showChildren = count > 0 && maxDepth >= 2;

        return (
          <HoverCard key={category.$id} openDelay={80} closeDelay={80}>
            <HoverCardTrigger asChild>
              <Link
                href={catHref(category.categoryName)}
                prefetch={false}
                className={`group block w-full rounded-lg border border-transparent hover:border-border hover:bg-accent/40 transition-colors ${mobile ? "px-3 py-2" : "px-4 py-3"}`}
                aria-label={`Browse ${category.categoryName}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    {typeof category.iconUrl === "string" && category.iconUrl ? (
                      <Image
                        src={category.iconUrl}
                        alt={category.categoryName ?? "Category"}
                        width={20}
                        height={20}
                        className="h-5 w-5 rounded object-cover"
                        sizes="20px"
                      />
                    ) : (
                      <div className="h-5 w-5 rounded bg-muted" />
                    )}
                    <span className="truncate font-medium group-hover:underline">
                      {category.categoryName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {showChildren && (
                      <Badge variant="outline" className="text-[10px] px-1.5">
                        {count}
                      </Badge>
                    )}
                    {showChildren && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    )}
                  </div>
                </div>

                {category.description ? (
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                    {category.description}
                  </p>
                ) : null}
              </Link>
            </HoverCardTrigger>

            {showChildren && (
              <HoverCardContent
                align="start"
                side={mobile ? "bottom" : "right"}
                className={`${mobile ? "w-80" : "w-96"} p-4`}
                sideOffset={8}
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    {typeof category.iconUrl === "string" && category.iconUrl ? (
                      <Image
                        src={category.iconUrl}
                        alt={category.categoryName ?? "Category"}
                        width={24}
                        height={24}
                        className="h-6 w-6 rounded object-cover"
                        sizes="24px"
                      />
                    ) : null}
                    <h4 className="font-semibold truncate">{category.categoryName}</h4>
                    <Badge variant="outline" className="ml-auto text-[10px] px-1.5">
                      {count} subcategories
                    </Badge>
                  </div>

                  {category.description ? (
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  ) : null}

                  {category.children ? renderChildren(category.children) : null}

                  <div className="pt-3 border-t">
                    <Link
                      href={catHref(category.categoryName)}
                      prefetch={false}
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
        );
      })}
    </div>
  );
};
