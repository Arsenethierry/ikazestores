import {
    BookOpen,
    Bot,
    Settings2,
    SquareTerminal,
    ShoppingCart
} from "lucide-react";

export const getSidebarLinks = (storeId: string | null) => ({
    systemAdmin: [
        {
            title: "Manage Stores",
            url: "#",
            icon: SquareTerminal,
            isActive: true,
            items: [
                {
                    title: "All stores",
                    url: "/admin/stores",
                },
                {
                    title: "Starred",
                    url: "#",
                },
                {
                    title: "Settings",
                    url: "#",
                },
            ],
        },
        {
            title: "Categories",
            url: "#",
            icon: SquareTerminal,
            isActive: true,
            items: [
                {
                    title: "All categorise",
                    url: "/admin/categories",
                },
                {
                    title: "Sub-categories",
                    url: "/admin/subcategories",
                },
            ],
        },
        {
            title: "Products Management",
            url: "#",
            icon: Bot,
            items: [
                {
                    title: "Collections",
                    url: `/admin/collections`,
                },
            ],
        },
    ],
    virtualStoreAdmin: [
        {
            title: "Order Management",
            url: "#",
            icon: ShoppingCart,
            isActive: true,
            items: [
                {
                    title: "All orders",
                    url: `/admin/stores/${storeId}/orders`,
                },
            ],
        },
        {
            title: "Product Management",
            url: "#",
            icon: Bot,
            items: [
                {
                    title: "Products",
                    url: `/admin/stores/${storeId}/products`,
                },
                {
                    title: "Categories",
                    url: `/admin/stores/${storeId}/categories`,
                },
                {
                    title: "Collections",
                    url: `/admin/stores/${storeId}/collections`,
                },
            ],
        },
        {
            title: "Promo Codes",
            url: "#",
            icon: BookOpen,
            items: [
                {
                    title: "Introduction",
                    url: "#",
                },
                {
                    title: "Get Started",
                    url: "#",
                },
                {
                    title: "Tutorials",
                    url: "#",
                },
                {
                    title: "Changelog",
                    url: "#",
                },
            ],
        },
        {
            title: "Settings",
            url: "#",
            icon: Settings2,
            items: [
                {
                    title: "General",
                    url: "#",
                },
                {
                    title: "Team",
                    url: "#",
                },
                {
                    title: "Billing",
                    url: "#",
                },
                {
                    title: "Limits",
                    url: "#",
                },
            ],
        },
    ],
    physicalStoreAdmin: [
        {
            title: "Order Management",
            url: "#",
            icon: SquareTerminal,
            isActive: true,
            items: [
                {
                    title: "All orders",
                    url: "/dashboard",
                },
            ],
        },
        {
            title: "Product Management",
            url: "#",
            icon: Bot,
            items: [
                {
                    title: "Products",
                    url: `/admin/stores/${storeId}/products`,
                },
                {
                    title: "Categories",
                    url: `/admin/stores/${storeId}/categories`,
                },
                {
                    title: "Sub-categories",
                    url: `/admin/stores/${storeId}/subcategories`,
                },
                {
                    title: "Collections",
                    url: `/admin/stores/${storeId}/collections`,
                },
            ],
        },
        {
            title: "Promo Codes",
            url: "#",
            icon: BookOpen,
            items: [
                {
                    title: "Introduction",
                    url: "#",
                },
                {
                    title: "Get Started",
                    url: "#",
                },
                {
                    title: "Tutorials",
                    url: "#",
                },
                {
                    title: "Changelog",
                    url: "#",
                },
            ],
        },
        {
            title: "Settings",
            url: "#",
            icon: Settings2,
            items: [
                {
                    title: "General",
                    url: "#",
                },
                {
                    title: "Team",
                    url: "#",
                },
                {
                    title: "Billing",
                    url: "#",
                },
                {
                    title: "Limits",
                    url: "#",
                },
            ],
        },
    ],
});
