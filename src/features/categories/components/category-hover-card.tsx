import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import Link from "next/link"
import { getCategoriesWithSubcategories } from "../actions/categories-actions";
import { DocumentType } from "@/lib/types";

export const CategoriesCard = async ({
    mobile = false,
}: {
    mobile?: boolean
}) => {
    const { categories, subcategoriesMap, error } = await getCategoriesWithSubcategories({ storeId: null });

    const getSubcategories = (categoryId: string) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return subcategoriesMap[categoryId] || [];
    };

    if (error) {
        return <div className="text-red-500 p-4">Error loading categories: {error}</div>;
    }

    return (
        categories.map((category) => {
            const subcategories = getSubcategories(category.$id);

            return (
                <HoverCard openDelay={100} closeDelay={100} key={category.$id}>
                    <HoverCardTrigger asChild>
                        <button className={`${mobile ? 'px-4 py-2 text-sm rounded-full bg-background border' : 'w-full text-left px-3 py-2 font-medium hover:bg-accent rounded-lg'}`}>
                            {category.categoryName}
                        </button>
                    </HoverCardTrigger>
                    {subcategories.length > 0 && (
                        <HoverCardContent
                            align="start"
                            side={mobile ? "bottom" : "right"}
                            className={`${mobile ? 'w-[100px]' : 'w-[200px]'} p-2 group`}
                            sideOffset={8}
                        >
                            <div className="grid grid-cols-2 gap-3">
                                {subcategories.map((sub: DocumentType) => (
                                    <Link
                                        href={'#'}
                                        key={sub.$id}
                                    >
                                        {sub.subCategoryName}
                                    </Link>
                                ))}
                            </div>
                        </HoverCardContent>
                    )}
                </HoverCard >
            )
        })
    )
}