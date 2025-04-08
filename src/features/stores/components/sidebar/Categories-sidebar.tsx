import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

const categoriesData = [
    {
        name: "Men's Fashion",
        subcategories: [
            "Top Wear",
            "Bottom Wear",
            "Ethnic Wear",
            "Casual Wear",
            "Formal Wear",
            "Sports Wear"
        ]
    },
    {
        name: "Women's Fashion",
        subcategories: [
            "Ethnic Wear",
            "Western Wear",
            "Lingerie & Sleepwear",
            "Formal Wear",
            "Maternity Wear",
            "Sports Wear"
        ]
    },
    {
        name: "Footwear",
        subcategories: [
            "Men's Footwear",
            "Women's Footwear",
            "Kids' Footwear",
            "Sports Shoes",
            "Sandals & Floaters",
            "Formal Shoes"
        ]
    },
    {
        name: "Accessories",
        subcategories: [
            "Watches",
            "Bags & Luggage",
            "Jewellery",
            "Sunglasses",
            "Belts & Wallets",
            "Hats & Caps"
        ]
    },
    {
        name: "Kids & Babies",
        subcategories: [
            "Clothing",
            "Footwear",
            "Toys",
            "School Supplies",
            "Feeding",
            "Baby Care"
        ]
    },
    {
        name: "Home & Living",
        subcategories: [
            "Kitchenware",
            "Furniture",
            "Decor",
            "Bedding",
            "Gardening",
            "Storage"
        ]
    }
];

const DesktopCategoriesSidebar = () => {

    return (
        <div className='space-y-1 p-2'>
            {categoriesData.map((category) => (
                <HoverCard key={category.name} openDelay={100} closeDelay={100}>
                    <HoverCardTrigger asChild>
                        <button className="w-full text-left px-3 py-2 font-medium hover:bg-accent rounded-lg transition-colors">
                            {category.name}
                        </button>
                    </HoverCardTrigger>

                    <HoverCardContent
                        align="start"
                        side="right"
                        className="w-48 px-5 ml-2"
                        sideOffset={10}
                    >
                        <div className="flex flex-col gap-2">
                            {category.subcategories.map((sub) => (
                                <Link
                                    key={sub}
                                    href="#"
                                    className="text-sm p-1 hover:bg-accent rounded-md transition-colors"
                                >
                                    {sub}
                                </Link>
                            ))}
                        </div>
                    </HoverCardContent>
                </HoverCard>
            ))}
        </div>
    )
}

const MobileCategories = () => {
    return (
        <div className="md:hidden px-4 py-2 bg-accent/50">
            <ScrollArea className="pb-2">
                <div className="flex gap-2">
                    {categoriesData.map((category) => (
                        <HoverCard key={category.name} openDelay={100} closeDelay={100}>
                            <HoverCardTrigger asChild>
                                <button className="px-4 py-2 text-sm rounded-full bg-background border hover:bg-accent">
                                    {category.name}
                                </button>
                            </HoverCardTrigger>

                            <HoverCardContent
                                align="start"
                                className="w-[300px] p-3"
                                sideOffset={5}
                            >
                                <div className="grid grid-cols-2 gap-2">
                                    {category.subcategories.map((sub) => (
                                        <Link
                                            key={sub}
                                            href="#"
                                            className="text-sm p-2 hover:bg-accent rounded-md"
                                        >
                                            {sub}
                                        </Link>
                                    ))}
                                </div>
                            </HoverCardContent>
                        </HoverCard>
                    ))}
                </div>
            </ScrollArea>
        </div>
    )
}

export { DesktopCategoriesSidebar, MobileCategories }