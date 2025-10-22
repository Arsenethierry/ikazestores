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
  Database,
  Users,
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
      title: "Catalog Management",
      url: "#",
      icon: Database,
      items: [
        { title: "Overview", url: "/admin/sys-admin/catalog" },
        { title: "Categories", url: "/admin/sys-admin/catalog/categories" },
        {
          title: "Product Types",
          url: "/admin/sys-admin/catalog/product-types",
        },
        {
          title: "Variant Templates",
          url: "/admin/sys-admin/catalog/variant-templates",
        },
        {
          title: "Import/Export",
          url: "/admin/sys-admin/catalog/import-export",
        },
        { title: "Validation", url: "/admin/sys-admin/catalog/validation" },
      ],
    },
    {
      title: "Users",
      url: "#",
      icon: User,
      items: [{ title: "All Users", url: "/admin/sys-admin/users" }],
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
      items: [{ title: "All Stores", url: `/admin/stores` }],
    },
    {
      title: "Staff",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        { title: "Staff Users", url: `/admin/stores/${storeId}/staff` },
        {
          title: "Seed Staff",
          url: `/admin/stores/${storeId}/staff/seed-staff`,
        },
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
      title: "Customers",
      url: "#",
      icon: Users,
      items: [
        {
          title: "All Customers",
          url: `/admin/stores/${storeId}/customers`,
        },
        {
          title: "Email Campaigns",
          url: `/admin/stores/${storeId}/customers/campaigns`,
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
          title: "Influencer Discounts",
          url: `/admin/stores/${storeId}/virtual-store/marketing/discounts`,
        },
        {
          title: "Create Discount",
          url: `/admin/stores/${storeId}/virtual-store/marketing/discounts/create`,
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
        {
          title: "Return Policies",
          url: `/admin/stores/${storeId}/virtual-store/settings/policies`,
        },
      ],
    },
  ],

  physicalStoreAdmin: [
    {
      title: "Staff",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        { title: "Staff Users", url: `/admin/stores/${storeId}/staff` },
        {
          title: "Seed Staff",
          url: `/admin/stores/${storeId}/staff/seed-staff`,
        },
      ],
    },
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
      title: "Marketing",
      url: "#",
      icon: Megaphone,
      items: [
        {
          title: "Discounts",
          url: `/admin/stores/${storeId}/physical-store/marketing/discounts`,
        },
        {
          title: "Create Discount",
          url: `/admin/stores/${storeId}/physical-store/marketing/discounts/create`,
        },
        {
          title: "Campaigns",
          url: `/admin/stores/${storeId}/marketing/campaigns`,
        },
      ],
    },
    {
      title: "Store Management",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Return Policies",
          url: `/admin/stores/${storeId}/physical-store/settings/policies`,
        },
      ],
    },
  ],
});
