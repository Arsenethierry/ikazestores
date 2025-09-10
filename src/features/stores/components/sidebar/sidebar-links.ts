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
  Megaphone,
} from "lucide-react";

export const getSidebarLinks = (storeId: string | null) => ({
  systemAdmin: [
    {
      title: "Stores",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        { title: "All Stores", url: "/admin/sys-admin/stores" },
        { title: "Analytics", url: "/admin/sys-admin/stores/analytics" },
        { title: "Settings", url: "/admin/sys-admin/stores/settings" },
      ],
    },
    {
      title: "Users",
      url: "#",
      icon: User,
      items: [{ title: "All Users", url: "/admin/sys-admin/users" }],
    },
    {
      title: "Categories",
      url: "#",
      icon: Layers,
      items: [{ title: "All Categories", url: "/admin/categories" }],
    },
    {
      title: "Product Types",
      url: "#",
      icon: Package,
      items: [
        { title: "All Product Types", url: "/admin/sys-admin/product-types" },
        {
          title: "Create Product Type",
          url: "/admin/sys-admin/product-types/create",
        },
        { title: "Analytics", url: "/admin/sys-admin/product-types/analytics" },
      ],
    },
    {
      title: "Variant Templates",
      url: "#",
      icon: Palette,
      items: [
        { title: "All Templates", url: "/admin/sys-admin/variant-templates" },
        {
          title: "Create Template",
          url: "/admin/sys-admin/variant-templates/create",
        },
        {
          title: "Template Categories",
          url: "/admin/sys-admin/variant-templates/categories",
        },
      ],
    },
    {
      title: "Products",
      url: "#",
      icon: Grid3X3,
      items: [
        { title: "All Products", url: "/admin/sys-admin/products" },
        { title: "Analytics", url: "/admin/sys-admin/products/analytics" },
        {
          title: "Import / Export",
          url: "/admin/sys-admin/products/import-export",
        },
      ],
    },
  ],

  virtualStoreAdmin: [
    {
      title: "Stores",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        { title: "All Stores", url: `/admin/stores` },
      ],
    },
    {
      title: "Products",
      url: "#",
      icon: Package,
      items: [
        { title: "My Products", url: `/admin/stores/${storeId}/products` },
        {
          title: "Browse Catalog",
          url: `/admin/stores/${storeId}/products/catalog`,
        },
      ],
    },
    {
      title: "Orders",
      url: "#",
      icon: ShoppingCart,
      items: [
        { title: "All Orders", url: `/admin/stores/${storeId}/orders` },
        {
          title: "Analytics",
          url: `/admin/stores/${storeId}/orders/analytics`,
        },
        {
          title: "Returns & Refunds",
          url: `/admin/stores/${storeId}/orders/returns`,
        },
      ],
    },
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
      title: "Marketing",
      url: "#",
      icon: Megaphone,
      items: [
        {
          title: "Discounts / Coupons",
          url: `/admin/stores/${storeId}/marketing/coupons`,
        },
        {
          title: "Campaigns",
          url: `/admin/stores/${storeId}/marketing/campaigns`,
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        { title: "General", url: `/admin/stores/${storeId}/settings` },
        {
          title: "Shipping",
          url: `/admin/stores/${storeId}/settings/shipping`,
        },
        {
          title: "Payments",
          url: `/admin/stores/${storeId}/settings/payments`,
        },
        { title: "SEO", url: `/admin/stores/${storeId}/settings/seo` },
      ],
    },
  ],

  physicalStoreAdmin: [
    {
      title: "Products",
      url: "#",
      icon: Grid3X3,
      items: [
        { title: "All Products", url: `/admin/stores/${storeId}/products` },
        {
          title: "Create Product",
          url: `/admin/stores/${storeId}/products/new`,
        },
        {
          title: "Inventory Management",
          url: `/admin/stores/${storeId}/products/inventory`,
        },
        {
          title: "Price Management",
          url: `/admin/stores/${storeId}/products/pricing`,
        },
        {
          title: "Analytics",
          url: `/admin/stores/${storeId}/products/analytics`,
        },
      ],
    },
    {
      title: "Orders",
      url: "#",
      icon: ShoppingCart,
      items: [
        { title: "All Orders", url: `/admin/stores/${storeId}/orders` },
        {
          title: "Analytics",
          url: `/admin/stores/${storeId}/orders/analytics`,
        },
      ],
    },
    {
      title: "Staff",
      url: "#",
      icon: User,
      items: [
        { title: "Staff Management", url: `/admin/stores/${storeId}/staff` },
      ],
    },
    {
      title: "Store Management",
      url: "#",
      icon: Settings2,
      items: [
        { title: "Store Details", url: `/admin/stores/${storeId}/settings` },
        {
          title: "Location Settings",
          url: `/admin/stores/${storeId}/location`,
        },
        { title: "Analytics", url: `/admin/stores/${storeId}/analytics` },
        {
          title: "Billing / Subscription",
          url: `/admin/stores/${storeId}/billing`,
        },
      ],
    },
  ],
});
