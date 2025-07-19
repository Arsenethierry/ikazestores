import {
    Settings2,
    SquareTerminal,
    ShoppingCart,
    Package,
    Layers,
    Palette,
    Grid3X3,
    FolderTree,
    User,
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
                    title: "All Stores",
                    url: "/admin/stores",
                },
                {
                    title: "Store Analytics",
                    url: "/admin/stores/analytics",
                },
                {
                    title: "Store Settings",
                    url: "/admin/stores/settings",
                },
            ],
        },
        {
            title: "Manage Users",
            url: "#",
            icon: User,
            isActive: true,
            items: [
                {
                    title: "All Users",
                    url: "/admin/users",
                },
            ],
        },
        {
            title: "Categories",
            url: "#",
            icon: Layers,
            items: [
                {
                    title: "All Categories",
                    url: "/admin/categories",
                },
            ],
        },
        {
            title: "Product Types",
            url: "#",
            icon: Package,
            items: [
                {
                    title: "All Product Types",
                    url: "/admin/product-types",
                },
                {
                    title: "Create Product Type",
                    url: "/admin/product-types/create",
                },
                {
                    title: "Product Type Analytics",
                    url: "/admin/product-types/analytics",
                },
            ],
        },
        {
            title: "Variant Templates",
            url: "#",
            icon: Palette,
            items: [
                {
                    title: "All Templates",
                    url: "/admin/variant-templates",
                },
                {
                    title: "Create Template",
                    url: "/admin/variant-templates/create",
                },
                {
                    title: "Template Categories",
                    url: "/admin/variant-templates/categories",
                },
            ],
        },
        {
            title: "Products",
            url: "#",
            icon: Grid3X3,
            items: [
                {
                    title: "All Products",
                    url: "/admin/products",
                },
                {
                    title: "Product Analytics",
                    url: "/admin/products/analytics",
                },
                {
                    title: "Import/Export",
                    url: "/admin/products/import-export",
                },
            ],
        },
    ],
    virtualStoreAdmin: [
        {
            title: "Product Sourcing",
            url: "#",
            icon: Package,
            isActive: true,
            items: [
                {
                    title: "all Products",
                    url: `/admin/stores/${storeId}/products`,
                },
                {
                    title: "Import Products",
                    url: `/admin/stores/${storeId}/products/clone-products`,
                },
                {
                    title: "Product Requests",
                    url: `/admin/stores/${storeId}/products/requests`,
                },
                {
                    title: "Supplier Directory",
                    url: `/admin/stores/${storeId}/products/suppliers`,
                },
                {
                    title: "Bulk Import",
                    url: `/admin/stores/${storeId}/products/bulk-import`,
                },
            ]
        },
        {
            title: "Order Management",
            url: "#",
            icon: ShoppingCart,
            isActive: true,
            items: [
                {
                    title: "All Orders",
                    url: `/admin/stores/${storeId}/orders`,
                },
                {
                    title: "Order Analytics",
                    url: `/admin/stores/${storeId}/orders/analytics`,
                },
                {
                    title: "Returns & Refunds",
                    url: `/admin/stores/${storeId}/orders/returns`,
                },
            ],
        },
        // {
        //     title: "Categories",
        //     url: "#",
        //     icon: Layers,
        //     items: [
        //         {
        //             title: "All Categories",
        //             url: `/admin/stores/${storeId}/categories`,
        //         },
        //     ],
        // },
        // {
        //     title: "Variants",
        //     url: "#",
        //     icon: Palette,
        //     items: [
        //         {
        //             title: "Product Types",
        //             url: `/admin/stores/${storeId}/product-types`,
        //         },
        //         // {
        //         //     title: "Templates",
        //         //     url: `/admin/stores/${storeId}/variant-templates`,
        //         // },
        //         // {
        //         //     title: "Templates Options",
        //         //     url: `/admin/stores/${storeId}/variant-templates/options`,
        //         // },
        //     ],
        // },
        {
            title: "Collections",
            url: "#",
            icon: FolderTree,
            items: [
                {
                    title: "All Collections",
                    url: `/admin/stores/${storeId}/collections`,
                },
                {
                    title: "Create Collection",
                    url: `/admin/stores/${storeId}/collections/create`,
                },
                {
                    title: "Featured Collections",
                    url: `/admin/stores/${storeId}/collections/featured`,
                },
            ],
        },
        {
            title: "Store Settings",
            url: "#",
            icon: Settings2,
            items: [
                {
                    title: "General",
                    url: `/admin/stores/${storeId}/settings`,
                },
                {
                    title: "Shipping",
                    url: `/admin/stores/${storeId}/settings/shipping`,
                },
                {
                    title: "Payments",
                    url: `/admin/stores/${storeId}/settings/payments`,
                },
                {
                    title: "SEO",
                    url: `/admin/stores/${storeId}/settings/seo`,
                },
            ],
        },
    ],
    physicalStoreAdmin: [
        // {
        //     title: "Order Management",
        //     url: "#",
        //     icon: ShoppingCart,
        //     isActive: true,
        //     items: [
        //         {
        //             title: "All Orders",
        //             url: `/admin/stores/${storeId}/orders`,
        //         },
        //         {
        //             title: "In-Store Orders",
        //             url: `/admin/stores/${storeId}/orders/in-store`,
        //         },
        //         {
        //             title: "Online Orders",
        //             url: `/admin/stores/${storeId}/orders/online`,
        //         },
        //         {
        //             title: "Order Analytics",
        //             url: `/admin/stores/${storeId}/orders/analytics`,
        //         },
        //     ],
        // },
        // {
        //     title: "Categories",
        //     url: "#",
        //     icon: Layers,
        //     items: [
        //         {
        //             title: "All Categories",
        //             url: `/admin/stores/${storeId}/categories`,
        //         },
        //     ],
        // },
        // {
        //     title: "Variants",
        //     url: "#",
        //     icon: Palette,
        //     items: [
        //         {
        //             title: "Product Types",
        //             url: `/admin/stores/${storeId}/product-types`,
        //         },
        //         // {
        //         //     title: "Templates",
        //         //     url: `/admin/stores/${storeId}/variant-templates`,
        //         // },
        //         // {
        //         //     title: "Templates Options",
        //         //     url: `/admin/stores/${storeId}/variant-templates/options`,
        //         // },
        //     ],
        // },
        {
            title: "Products",
            url: "#",
            icon: Grid3X3,
            items: [
                {
                    title: "All Products",
                    url: `/admin/stores/${storeId}/products`,
                },
                {
                    title: "Create Product",
                    url: `/admin/stores/${storeId}/products/create`,
                },
                {
                    title: "Inventory Management",
                    url: `/admin/stores/${storeId}/products/inventory`,
                },
                {
                    title: "Product Analytics",
                    url: `/admin/stores/${storeId}/products/analytics`,
                },
                {
                    title: "Price Management",
                    url: `/admin/stores/${storeId}/products/pricing`,
                },
            ],
        },
        {
            title: "Store Management",
            url: "#",
            icon: Settings2,
            items: [
                {
                    title: "Store Details",
                    url: `/admin/stores/${storeId}/settings`,
                },
                {
                    title: "Staff Management",
                    url: `/admin/stores/${storeId}/staff`,
                },
                {
                    title: "Store Analytics",
                    url: `/admin/stores/${storeId}/analytics`,
                },
                {
                    title: "Location Settings",
                    url: `/admin/stores/${storeId}/location`,
                },
            ],
        },
    ],
});