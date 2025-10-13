export const ASSET_MODULES = {
  DASHBOARD: "dashboard",
  ANALYTICS: "analytics",
  ORDERS: "orders",
  ORDER_FULFILLMENT: "order_fulfillment",
  RETURNS: "returns",
  PRODUCTS: "products",
  PRODUCT_CATEGORIES: "product_categories",
  PRODUCT_COLLECTIONS: "product_collections",
  INVENTORY: "inventory",
  SHIPPING: "shipping",
  SHIPPING_CLASSES: "shipping_classes",
  CUSTOMERS: "customers",
  CUSTOMER_REVIEWS: "customer_reviews",
  STAFF: "staff",
  ROLES: "roles",
  STORE_SETTINGS: "store_settings",
  COMMISSIONS: "commissions",
  AFFILIATE_PRODUCTS: "affiliate_products",
  REPORTS: "reports",
  PAYOUTS: "payouts",
} as const;

export type AssetModule = (typeof ASSET_MODULES)[keyof typeof ASSET_MODULES];

export interface Permission {
  key: string;
  name: string;
  description: string;
  module: AssetModule;
  applicableToStoreType: "both" | "physical" | "virtual";
  requiresHigherRole?: boolean;
}

export const PERMISSIONS_REGISTRY: Permission[] = [
  // Dashboard / Analytics
  {
    key: "view_dashboard",
    name: "View Dashboard",
    description: "Access to main dashboard",
    module: ASSET_MODULES.DASHBOARD,
    applicableToStoreType: "both",
  },
  {
    key: "view_analytics",
    name: "View Analytics",
    description: "View store analytics",
    module: ASSET_MODULES.ANALYTICS,
    applicableToStoreType: "both",
  },

  // Orders
  {
    key: "view_orders",
    name: "View Orders",
    description: "View order list and details",
    module: ASSET_MODULES.ORDERS,
    applicableToStoreType: "both",
  },
  {
    key: "manage_orders",
    name: "Manage Orders",
    description: "Create and update orders",
    module: ASSET_MODULES.ORDERS,
    applicableToStoreType: "both",
  },
  {
    key: "delete_orders",
    name: "Delete Orders",
    description: "Delete orders",
    module: ASSET_MODULES.ORDERS,
    applicableToStoreType: "both",
    requiresHigherRole: true,
  },
  {
    key: "export_orders",
    name: "Export Orders",
    description: "Export order data",
    module: ASSET_MODULES.ORDERS,
    applicableToStoreType: "both",
  },
  {
    key: "update_order_status",
    name: "Update Order Status",
    description: "Change order status",
    module: ASSET_MODULES.ORDERS,
    applicableToStoreType: "both",
  },

  // Order Fulfillment (Physical)
  {
    key: "view_fulfillment_requests",
    name: "View Fulfillment Requests",
    description: "View pending fulfillment",
    module: ASSET_MODULES.ORDER_FULFILLMENT,
    applicableToStoreType: "physical",
  },
  {
    key: "process_fulfillment",
    name: "Process Fulfillment",
    description: "Process and ship orders",
    module: ASSET_MODULES.ORDER_FULFILLMENT,
    applicableToStoreType: "physical",
  },
  {
    key: "update_fulfillment_status",
    name: "Update Fulfillment Status",
    description: "Update fulfillment status",
    module: ASSET_MODULES.ORDER_FULFILLMENT,
    applicableToStoreType: "physical",
  },

  // Returns
  {
    key: "view_returns",
    name: "View Returns",
    description: "View return requests",
    module: ASSET_MODULES.RETURNS,
    applicableToStoreType: "both",
  },
  {
    key: "manage_returns",
    name: "Manage Returns",
    description: "Approve/reject returns",
    module: ASSET_MODULES.RETURNS,
    applicableToStoreType: "both",
  },

  // Products
  {
    key: "view_products",
    name: "View Products",
    description: "View product catalog",
    module: ASSET_MODULES.PRODUCTS,
    applicableToStoreType: "both",
  },
  {
    key: "create_products",
    name: "Create Products",
    description: "Add new products",
    module: ASSET_MODULES.PRODUCTS,
    applicableToStoreType: "physical",
  },
  {
    key: "edit_products",
    name: "Edit Products",
    description: "Modify products",
    module: ASSET_MODULES.PRODUCTS,
    applicableToStoreType: "physical",
  },
  {
    key: "delete_products",
    name: "Delete Products",
    description: "Remove products",
    module: ASSET_MODULES.PRODUCTS,
    applicableToStoreType: "physical",
    requiresHigherRole: true,
  },
  {
    key: "manage_product_status",
    name: "Manage Product Status",
    description: "Activate/deactivate products",
    module: ASSET_MODULES.PRODUCTS,
    applicableToStoreType: "physical",
  },

  // Categories
  {
    key: "view_categories",
    name: "View Categories",
    description: "View product categories",
    module: ASSET_MODULES.PRODUCT_CATEGORIES,
    applicableToStoreType: "physical",
  },
  {
    key: "manage_categories",
    name: "Manage Categories",
    description: "Create/edit categories",
    module: ASSET_MODULES.PRODUCT_CATEGORIES,
    applicableToStoreType: "physical",
  },
  {
    key: "delete_categories",
    name: "Delete Categories",
    description: "Remove categories",
    module: ASSET_MODULES.PRODUCT_CATEGORIES,
    applicableToStoreType: "physical",
    requiresHigherRole: true,
  },

  // Collections
  {
    key: "view_collections",
    name: "View Collections",
    description: "View product collections",
    module: ASSET_MODULES.PRODUCT_COLLECTIONS,
    applicableToStoreType: "physical",
  },
  {
    key: "manage_collections",
    name: "Manage Collections",
    description: "Create/edit collections",
    module: ASSET_MODULES.PRODUCT_COLLECTIONS,
    applicableToStoreType: "physical",
  },

  // Inventory
  {
    key: "view_inventory",
    name: "View Inventory",
    description: "View stock levels",
    module: ASSET_MODULES.INVENTORY,
    applicableToStoreType: "physical",
  },
  {
    key: "manage_inventory",
    name: "Manage Inventory",
    description: "Update stock levels",
    module: ASSET_MODULES.INVENTORY,
    applicableToStoreType: "physical",
  },

  // Shipping
  {
    key: "view_shipping",
    name: "View Shipping",
    description: "View shipping settings",
    module: ASSET_MODULES.SHIPPING,
    applicableToStoreType: "both",
  },
  {
    key: "manage_shipping",
    name: "Manage Shipping",
    description: "Configure shipping",
    module: ASSET_MODULES.SHIPPING,
    applicableToStoreType: "both",
  },
  {
    key: "manage_shipping_classes",
    name: "Manage Shipping Classes",
    description: "Create/edit shipping classes",
    module: ASSET_MODULES.SHIPPING_CLASSES,
    applicableToStoreType: "both",
  },

  // Customers
  {
    key: "view_customers",
    name: "View Customers",
    description: "View customer list",
    module: ASSET_MODULES.CUSTOMERS,
    applicableToStoreType: "both",
  },
  {
    key: "manage_customers",
    name: "Manage Customers",
    description: "Edit customer info",
    module: ASSET_MODULES.CUSTOMERS,
    applicableToStoreType: "both",
  },
  {
    key: "export_customers",
    name: "Export Customers",
    description: "Export customer data",
    module: ASSET_MODULES.CUSTOMERS,
    applicableToStoreType: "both",
  },

  // Reviews
  {
    key: "view_reviews",
    name: "View Reviews",
    description: "View customer reviews",
    module: ASSET_MODULES.CUSTOMER_REVIEWS,
    applicableToStoreType: "both",
  },
  {
    key: "moderate_reviews",
    name: "Moderate Reviews",
    description: "Approve/reject reviews",
    module: ASSET_MODULES.CUSTOMER_REVIEWS,
    applicableToStoreType: "both",
  },
  {
    key: "respond_to_reviews",
    name: "Respond to Reviews",
    description: "Reply to reviews",
    module: ASSET_MODULES.CUSTOMER_REVIEWS,
    applicableToStoreType: "both",
  },

  // Staff
  {
    key: "view_staff",
    name: "View Staff",
    description: "View staff members",
    module: ASSET_MODULES.STAFF,
    applicableToStoreType: "both",
  },
  {
    key: "invite_staff",
    name: "Invite Staff",
    description: "Invite new staff",
    module: ASSET_MODULES.STAFF,
    applicableToStoreType: "both",
    requiresHigherRole: true,
  },
  {
    key: "manage_staff",
    name: "Manage Staff",
    description: "Edit staff info",
    module: ASSET_MODULES.STAFF,
    applicableToStoreType: "both",
    requiresHigherRole: true,
  },
  {
    key: "remove_staff",
    name: "Remove Staff",
    description: "Remove staff members",
    module: ASSET_MODULES.STAFF,
    applicableToStoreType: "both",
    requiresHigherRole: true,
  },

  // Roles
  {
    key: "view_roles",
    name: "View Roles",
    description: "View role definitions",
    module: ASSET_MODULES.ROLES,
    applicableToStoreType: "both",
  },
  {
    key: "create_roles",
    name: "Create Roles",
    description: "Create custom roles",
    module: ASSET_MODULES.ROLES,
    applicableToStoreType: "both",
    requiresHigherRole: true,
  },
  {
    key: "edit_roles",
    name: "Edit Roles",
    description: "Modify role permissions",
    module: ASSET_MODULES.ROLES,
    applicableToStoreType: "both",
    requiresHigherRole: true,
  },
  {
    key: "delete_roles",
    name: "Delete Roles",
    description: "Remove custom roles",
    module: ASSET_MODULES.ROLES,
    applicableToStoreType: "both",
    requiresHigherRole: true,
  },

  // Settings
  {
    key: "view_store_settings",
    name: "View Store Settings",
    description: "View store config",
    module: ASSET_MODULES.STORE_SETTINGS,
    applicableToStoreType: "both",
  },
  {
    key: "manage_store_settings",
    name: "Manage Store Settings",
    description: "Modify store config",
    module: ASSET_MODULES.STORE_SETTINGS,
    applicableToStoreType: "both",
    requiresHigherRole: true,
  },

  // Commissions (Virtual)
  {
    key: "view_commissions",
    name: "View Commissions",
    description: "View commission earnings",
    module: ASSET_MODULES.COMMISSIONS,
    applicableToStoreType: "virtual",
  },
  {
    key: "manage_commission_rates",
    name: "Manage Commission Rates",
    description: "Set product commissions",
    module: ASSET_MODULES.COMMISSIONS,
    applicableToStoreType: "virtual",
  },

  // Affiliate Products (Virtual)
  {
    key: "view_affiliate_products",
    name: "View Affiliate Products",
    description: "Browse available products",
    module: ASSET_MODULES.AFFILIATE_PRODUCTS,
    applicableToStoreType: "virtual",
  },
  {
    key: "import_products",
    name: "Import Products",
    description: "Add products to store",
    module: ASSET_MODULES.AFFILIATE_PRODUCTS,
    applicableToStoreType: "virtual",
  },
  {
    key: "manage_imported_products",
    name: "Manage Imported Products",
    description: "Edit imported products",
    module: ASSET_MODULES.AFFILIATE_PRODUCTS,
    applicableToStoreType: "virtual",
  },
  {
    key: "remove_products",
    name: "Remove Products",
    description: "Remove products from store",
    module: ASSET_MODULES.AFFILIATE_PRODUCTS,
    applicableToStoreType: "virtual",
  },

  // Reports
  {
    key: "view_reports",
    name: "View Reports",
    description: "Access financial reports",
    module: ASSET_MODULES.REPORTS,
    applicableToStoreType: "both",
  },
  {
    key: "export_reports",
    name: "Export Reports",
    description: "Download report data",
    module: ASSET_MODULES.REPORTS,
    applicableToStoreType: "both",
  },

  // Payouts (Virtual)
  {
    key: "view_payouts",
    name: "View Payouts",
    description: "View payout history",
    module: ASSET_MODULES.PAYOUTS,
    applicableToStoreType: "virtual",
  },
  {
    key: "request_payout",
    name: "Request Payout",
    description: "Request commission payouts",
    module: ASSET_MODULES.PAYOUTS,
    applicableToStoreType: "virtual",
    requiresHigherRole: true,
  },
];

interface RoleDefinition {
  slug: string;
  name: string;
  description: string;
  priority: number;
  accessibleModules: AssetModule[];
  permissions: string[];
}

export const DEFAULT_ROLES: Record<string, RoleDefinition[]> = {
  physical_store: [
    {
      slug: "owner",
      name: "Owner",
      description: "Full access to all store features",
      priority: 100,
      accessibleModules: [
        ASSET_MODULES.DASHBOARD,
        ASSET_MODULES.ANALYTICS,
        ASSET_MODULES.ORDERS,
        ASSET_MODULES.ORDER_FULFILLMENT,
        ASSET_MODULES.RETURNS,
        ASSET_MODULES.PRODUCTS,
        ASSET_MODULES.PRODUCT_CATEGORIES,
        ASSET_MODULES.PRODUCT_COLLECTIONS,
        ASSET_MODULES.INVENTORY,
        ASSET_MODULES.SHIPPING,
        ASSET_MODULES.SHIPPING_CLASSES,
        ASSET_MODULES.CUSTOMERS,
        ASSET_MODULES.CUSTOMER_REVIEWS,
        ASSET_MODULES.STAFF,
        ASSET_MODULES.ROLES,
        ASSET_MODULES.STORE_SETTINGS,
        ASSET_MODULES.REPORTS,
      ],
      permissions: PERMISSIONS_REGISTRY.filter(
        (p) => p.applicableToStoreType !== "virtual"
      ).map((p) => p.key),
    },
    {
      slug: "warehouse_manager",
      name: "Warehouse Manager",
      description: "Manages orders, fulfillment, and inventory",
      priority: 70,
      accessibleModules: [
        ASSET_MODULES.DASHBOARD,
        ASSET_MODULES.ORDERS,
        ASSET_MODULES.ORDER_FULFILLMENT,
        ASSET_MODULES.PRODUCTS,
        ASSET_MODULES.INVENTORY,
        ASSET_MODULES.SHIPPING,
        ASSET_MODULES.RETURNS,
      ],
      permissions: [
        "view_dashboard",
        "view_orders",
        "manage_orders",
        "update_order_status",
        "view_fulfillment_requests",
        "process_fulfillment",
        "update_fulfillment_status",
        "view_products",
        "manage_product_status",
        "view_inventory",
        "manage_inventory",
        "view_shipping",
        "manage_shipping",
        "view_returns",
        "manage_returns",
      ],
    },
    {
      slug: "marketing_manager",
      name: "Marketing Manager",
      description: "Manages products, categories, and marketing",
      priority: 60,
      accessibleModules: [
        ASSET_MODULES.DASHBOARD,
        ASSET_MODULES.ANALYTICS,
        ASSET_MODULES.PRODUCTS,
        ASSET_MODULES.PRODUCT_CATEGORIES,
        ASSET_MODULES.PRODUCT_COLLECTIONS,
        ASSET_MODULES.CUSTOMER_REVIEWS,
        ASSET_MODULES.REPORTS,
      ],
      permissions: [
        "view_dashboard",
        "view_analytics",
        "view_products",
        "create_products",
        "edit_products",
        "manage_product_status",
        "view_categories",
        "manage_categories",
        "view_collections",
        "manage_collections",
        "view_reviews",
        "moderate_reviews",
        "respond_to_reviews",
        "view_reports",
      ],
    },
    {
      slug: "support_agent",
      name: "Support Agent",
      description: "Handles customer support",
      priority: 40,
      accessibleModules: [
        ASSET_MODULES.DASHBOARD,
        ASSET_MODULES.ORDERS,
        ASSET_MODULES.CUSTOMERS,
        ASSET_MODULES.CUSTOMER_REVIEWS,
        ASSET_MODULES.RETURNS,
      ],
      permissions: [
        "view_dashboard",
        "view_orders",
        "update_order_status",
        "view_customers",
        "manage_customers",
        "view_reviews",
        "respond_to_reviews",
        "view_returns",
      ],
    },
  ],

  virtual_store: [
    {
      slug: "owner",
      name: "Owner",
      description: "Full access to all store features",
      priority: 100,
      accessibleModules: [
        ASSET_MODULES.DASHBOARD,
        ASSET_MODULES.ANALYTICS,
        ASSET_MODULES.ORDERS,
        ASSET_MODULES.RETURNS,
        ASSET_MODULES.AFFILIATE_PRODUCTS,
        ASSET_MODULES.COMMISSIONS,
        ASSET_MODULES.CUSTOMERS,
        ASSET_MODULES.CUSTOMER_REVIEWS,
        ASSET_MODULES.STAFF,
        ASSET_MODULES.ROLES,
        ASSET_MODULES.STORE_SETTINGS,
        ASSET_MODULES.REPORTS,
        ASSET_MODULES.PAYOUTS,
        ASSET_MODULES.SHIPPING,
      ],
      permissions: PERMISSIONS_REGISTRY.filter(
        (p) => p.applicableToStoreType !== "physical"
      ).map((p) => p.key),
    },
    {
      slug: "store_manager",
      name: "Store Manager",
      description: "Manages products, orders, and customers",
      priority: 70,
      accessibleModules: [
        ASSET_MODULES.DASHBOARD,
        ASSET_MODULES.ANALYTICS,
        ASSET_MODULES.ORDERS,
        ASSET_MODULES.AFFILIATE_PRODUCTS,
        ASSET_MODULES.COMMISSIONS,
        ASSET_MODULES.CUSTOMERS,
        ASSET_MODULES.CUSTOMER_REVIEWS,
        ASSET_MODULES.STAFF,
        ASSET_MODULES.REPORTS,
      ],
      permissions: [
        "view_dashboard",
        "view_analytics",
        "view_orders",
        "manage_orders",
        "view_affiliate_products",
        "import_products",
        "manage_imported_products",
        "remove_products",
        "view_commissions",
        "manage_commission_rates",
        "view_customers",
        "view_reviews",
        "moderate_reviews",
        "respond_to_reviews",
        "view_staff",
        "view_reports",
      ],
    },
    {
      slug: "support_agent",
      name: "Support Agent",
      description: "Handles customer support",
      priority: 40,
      accessibleModules: [
        ASSET_MODULES.DASHBOARD,
        ASSET_MODULES.ORDERS,
        ASSET_MODULES.CUSTOMERS,
        ASSET_MODULES.CUSTOMER_REVIEWS,
      ],
      permissions: [
        "view_dashboard",
        "view_orders",
        "view_customers",
        "manage_customers",
        "view_reviews",
        "respond_to_reviews",
      ],
    },
    {
      slug: "product_curator",
      name: "Product Curator",
      description: "Manages product catalog",
      priority: 50,
      accessibleModules: [
        ASSET_MODULES.DASHBOARD,
        ASSET_MODULES.AFFILIATE_PRODUCTS,
        ASSET_MODULES.COMMISSIONS,
        ASSET_MODULES.ANALYTICS,
      ],
      permissions: [
        "view_dashboard",
        "view_analytics",
        "view_affiliate_products",
        "import_products",
        "manage_imported_products",
        "remove_products",
        "view_commissions",
        "manage_commission_rates",
      ],
    },
  ],
};
