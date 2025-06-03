import {
    BookOpen,
    Settings2,
    SquareTerminal,
    ShoppingCart,
    Package,
    Tag,
    Layers
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
            icon: Layers,
            isActive: true,
            items: [
                {
                    title: "All categories",
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
            icon: Package,
            items: [
                {
                    title: "Collections",
                    url: `/admin/collections`,
                },
            ],
        },
        {
            title: "Variants Management",
            url: "#",
            icon: Tag,
            items: [
                {
                    title: "Product Types",
                    url: `/admin/product-types`,
                },
                {
                    title: "Templates & Groups",
                    url: `/admin/variants/templates`,
                },
            ],
        }
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
            icon: Package,
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
            title: "Variants",
            url: "#",
            icon: Tag,
            items: [
                {
                    title: "Product Types",
                    url: `/admin/stores/${storeId}/product-types`,
                },
                {
                    title: "Templates & Groups",
                    url: `/admin/stores/${storeId}/variants`,
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
            icon: Package,
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
            title: "Variants",
            url: "#",
            icon: Tag,
            items: [
                {
                    title: "Product Types",
                    url: `/admin/stores/${storeId}/product-types`,
                },
                {
                    title: "Variant Dashboard",
                    url: `/admin/stores/${storeId}/variants`,
                },
                {
                    title: "Templates",
                    url: `/admin/stores/${storeId}/variants/templates/new`,
                },
                {
                    title: "Groups",
                    url: `/admin/stores/${storeId}/variants/groups/new`,
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