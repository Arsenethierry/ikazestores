export const PRODUCT_PERMISSIONS = {
  // Product Management
  VIEW_PRODUCTS: "products.view",
  CREATE_PRODUCTS: "products.create",
  EDIT_PRODUCTS: "products.update",
  DELETE_PRODUCTS: "products.delete",
  MANAGE_PRODUCT_STATUS: "products.status",
  MANAGE_PRICING: "products.pricing",
  MANAGE_INVENTORY: "products.inventory",

  // Product Features
  MANAGE_FEATURED: "products.featured",
  MANAGE_DROPSHIPPING: "products.dropshipping",

  // Virtual Store Specific
  IMPORT_PRODUCTS: "products.import",
  MANAGE_COMMISSION: "products.commission",
  REMOVE_IMPORTS: "products.remove_imports",
} as const;

export const MARKETING_PERMISSIONS = {
  // Discounts
  VIEW_DISCOUNTS: "marketing.discounts.view",
  CREATE_DISCOUNTS: "marketing.discounts.create",
  UPDATE_DISCOUNTS: "marketing.discounts.update",
  DELETE_DISCOUNTS: "marketing.discounts.delete",
  MANAGE_DISCOUNT_STATUS: "marketing.discounts.status",

  // Coupons
  CREATE_COUPONS: "marketing.coupons.create",
  VIEW_COUPONS: "marketing.coupons.view",
  DELETE_COUPONS: "marketing.coupons.delete",

  // Badges
  VIEW_BADGES: "marketing.badges.view",
  CREATE_BADGES: "marketing.badges.create",
  UPDATE_BADGES: "marketing.badges.update",
  DELETE_BADGES: "marketing.badges.delete",
  MANAGE_BADGE_STATUS: "marketing.badges.status",
} as const;

export const STORE_PERMISSIONS = {
  // Store Settings
  VIEW_STORE_SETTINGS: "store.settings.view",
  MANAGE_STORE_SETTINGS: "store.settings.manage",

  // Return Policies
  VIEW_RETURN_POLICIES: "store.return_policies.view",
  CREATE_RETURN_POLICIES: "store.return_policies.create",
  UPDATE_RETURN_POLICIES: "store.return_policies.update",
  DELETE_RETURN_POLICIES: "store.return_policies.delete",

  // Staff Management
  VIEW_STAFF: "staff.view",
  MANAGE_STAFF: "staff.manage",
  MANAGE_ROLES: "staff.roles",
} as const;

export const ORDER_PERMISSIONS = {
  VIEW_ORDERS: "orders.view",
  CREATE_ORDERS: "orders.create",
  UPDATE_ORDERS: "orders.update",
  CANCEL_ORDERS: "orders.cancel",
  FULFILL_ORDERS: "orders.fulfill",
  REFUND_ORDERS: "orders.refund",
} as const;

export const CUSTOMER_PERMISSIONS = {
  VIEW_CUSTOMERS: "customers.view",
  CREATE_CUSTOMERS: "customers.create",
  UPDATE_CUSTOMERS: "customers.update",
  DELETE_CUSTOMERS: "customers.delete",
} as const;

export const ANALYTICS_PERMISSIONS = {
  VIEW_DASHBOARD: "dashboard.view",
  VIEW_ANALYTICS: "dashboard.analytics",
  VIEW_FINANCIAL: "dashboard.financial",
  EXPORT_REPORTS: "reports.export",
} as const;

export const ALL_PERMISSIONS = {
  ...PRODUCT_PERMISSIONS,
  ...MARKETING_PERMISSIONS,
  ...STORE_PERMISSIONS,
  ...ORDER_PERMISSIONS,
  ...CUSTOMER_PERMISSIONS,
  ...ANALYTICS_PERMISSIONS,
} as const;

export type Permission = (typeof ALL_PERMISSIONS)[keyof typeof ALL_PERMISSIONS];

// Permission groups for bulk checks
export const PERMISSION_GROUPS = {
  PRODUCT_FULL_ACCESS: [
    PRODUCT_PERMISSIONS.VIEW_PRODUCTS,
    PRODUCT_PERMISSIONS.CREATE_PRODUCTS,
    PRODUCT_PERMISSIONS.EDIT_PRODUCTS,
    PRODUCT_PERMISSIONS.DELETE_PRODUCTS,
    PRODUCT_PERMISSIONS.MANAGE_PRODUCT_STATUS,
    PRODUCT_PERMISSIONS.MANAGE_PRICING,
  ],

  MARKETING_FULL_ACCESS: [
    MARKETING_PERMISSIONS.VIEW_DISCOUNTS,
    MARKETING_PERMISSIONS.CREATE_DISCOUNTS,
    MARKETING_PERMISSIONS.UPDATE_DISCOUNTS,
    MARKETING_PERMISSIONS.DELETE_DISCOUNTS,
    MARKETING_PERMISSIONS.VIEW_BADGES,
    MARKETING_PERMISSIONS.CREATE_BADGES,
    MARKETING_PERMISSIONS.UPDATE_BADGES,
  ],

  STORE_MANAGER: [
    STORE_PERMISSIONS.VIEW_STORE_SETTINGS,
    STORE_PERMISSIONS.MANAGE_STORE_SETTINGS,
    ORDER_PERMISSIONS.VIEW_ORDERS,
    ORDER_PERMISSIONS.UPDATE_ORDERS,
    PRODUCT_PERMISSIONS.VIEW_PRODUCTS,
  ],

  SALES_REP: [
    ORDER_PERMISSIONS.VIEW_ORDERS,
    ORDER_PERMISSIONS.CREATE_ORDERS,
    CUSTOMER_PERMISSIONS.VIEW_CUSTOMERS,
    CUSTOMER_PERMISSIONS.CREATE_CUSTOMERS,
    PRODUCT_PERMISSIONS.VIEW_PRODUCTS,
  ],
} as const;

// Helper function to check if a permission is valid
export function isValidPermission(
  permission: string
): permission is Permission {
  return Object.values(ALL_PERMISSIONS).includes(permission as Permission);
}

// Helper to get permission description
export function getPermissionDescription(permission: Permission): string {
  const descriptions: Record<string, string> = {
    // Products
    [PRODUCT_PERMISSIONS.VIEW_PRODUCTS]: "View product catalog",
    [PRODUCT_PERMISSIONS.CREATE_PRODUCTS]: "Create new products",
    [PRODUCT_PERMISSIONS.EDIT_PRODUCTS]: "Edit product information",
    [PRODUCT_PERMISSIONS.DELETE_PRODUCTS]: "Delete products",
    [PRODUCT_PERMISSIONS.MANAGE_PRODUCT_STATUS]:
      "Change product status (active/draft/archived)",
    [PRODUCT_PERMISSIONS.MANAGE_PRICING]: "Update product prices",
    [PRODUCT_PERMISSIONS.MANAGE_INVENTORY]: "Manage stock levels",
    [PRODUCT_PERMISSIONS.MANAGE_FEATURED]: "Toggle featured status",
    [PRODUCT_PERMISSIONS.MANAGE_DROPSHIPPING]: "Enable/disable dropshipping",
    [PRODUCT_PERMISSIONS.IMPORT_PRODUCTS]:
      "Import products from physical stores",
    [PRODUCT_PERMISSIONS.MANAGE_COMMISSION]: "Set commission rates",
    [PRODUCT_PERMISSIONS.REMOVE_IMPORTS]: "Remove imported products",

    // Marketing
    [MARKETING_PERMISSIONS.VIEW_DISCOUNTS]: "View discounts and promotions",
    [MARKETING_PERMISSIONS.CREATE_DISCOUNTS]: "Create new discounts",
    [MARKETING_PERMISSIONS.UPDATE_DISCOUNTS]: "Edit existing discounts",
    [MARKETING_PERMISSIONS.DELETE_DISCOUNTS]: "Remove discounts",
    [MARKETING_PERMISSIONS.MANAGE_DISCOUNT_STATUS]:
      "Activate/deactivate discounts",
    [MARKETING_PERMISSIONS.CREATE_COUPONS]: "Generate coupon codes",
    [MARKETING_PERMISSIONS.VIEW_COUPONS]: "View coupon codes",
    [MARKETING_PERMISSIONS.DELETE_COUPONS]: "Delete coupon codes",
    [MARKETING_PERMISSIONS.VIEW_BADGES]: "View product badges",
    [MARKETING_PERMISSIONS.CREATE_BADGES]: "Create product badges",
    [MARKETING_PERMISSIONS.UPDATE_BADGES]: "Edit product badges",
    [MARKETING_PERMISSIONS.DELETE_BADGES]: "Remove product badges",
    [MARKETING_PERMISSIONS.MANAGE_BADGE_STATUS]: "Activate/deactivate badges",

    // Store
    [STORE_PERMISSIONS.VIEW_STORE_SETTINGS]: "View store settings",
    [STORE_PERMISSIONS.MANAGE_STORE_SETTINGS]: "Modify store settings",
    [STORE_PERMISSIONS.VIEW_RETURN_POLICIES]: "View return policies",
    [STORE_PERMISSIONS.CREATE_RETURN_POLICIES]: "Create return policies",
    [STORE_PERMISSIONS.UPDATE_RETURN_POLICIES]: "Edit return policies",
    [STORE_PERMISSIONS.DELETE_RETURN_POLICIES]: "Delete return policies",
    [STORE_PERMISSIONS.VIEW_STAFF]: "View staff members",
    [STORE_PERMISSIONS.MANAGE_STAFF]: "Manage staff members",
    [STORE_PERMISSIONS.MANAGE_ROLES]: "Manage staff roles",

    // Orders
    [ORDER_PERMISSIONS.VIEW_ORDERS]: "View orders",
    [ORDER_PERMISSIONS.CREATE_ORDERS]: "Create new orders",
    [ORDER_PERMISSIONS.UPDATE_ORDERS]: "Update order details",
    [ORDER_PERMISSIONS.CANCEL_ORDERS]: "Cancel orders",
    [ORDER_PERMISSIONS.FULFILL_ORDERS]: "Fulfill and ship orders",
    [ORDER_PERMISSIONS.REFUND_ORDERS]: "Process refunds",

    // Customers
    [CUSTOMER_PERMISSIONS.VIEW_CUSTOMERS]: "View customer information",
    [CUSTOMER_PERMISSIONS.CREATE_CUSTOMERS]: "Add new customers",
    [CUSTOMER_PERMISSIONS.UPDATE_CUSTOMERS]: "Edit customer details",
    [CUSTOMER_PERMISSIONS.DELETE_CUSTOMERS]: "Remove customers",

    // Analytics
    [ANALYTICS_PERMISSIONS.VIEW_DASHBOARD]: "View dashboard",
    [ANALYTICS_PERMISSIONS.VIEW_ANALYTICS]: "View analytics and reports",
    [ANALYTICS_PERMISSIONS.VIEW_FINANCIAL]: "View financial data",
    [ANALYTICS_PERMISSIONS.EXPORT_REPORTS]: "Export reports",
  };

  return descriptions[permission] || permission;
}

// Helper to get required permissions for common operations
export const OPERATION_PERMISSIONS = {
  PRODUCT_SETTINGS_ACCESS: [PRODUCT_PERMISSIONS.VIEW_PRODUCTS],
  PRODUCT_SETTINGS_EDIT: [PRODUCT_PERMISSIONS.EDIT_PRODUCTS],
  PRICE_QUICK_EDIT: [PRODUCT_PERMISSIONS.MANAGE_PRICING],
  TOGGLE_FEATURED: [PRODUCT_PERMISSIONS.MANAGE_FEATURED],
  TOGGLE_DROPSHIPPING: [PRODUCT_PERMISSIONS.MANAGE_DROPSHIPPING],
  TOGGLE_STATUS: [PRODUCT_PERMISSIONS.MANAGE_PRODUCT_STATUS],
  MANAGE_BADGES: [
    MARKETING_PERMISSIONS.VIEW_BADGES,
    MARKETING_PERMISSIONS.CREATE_BADGES,
    MARKETING_PERMISSIONS.UPDATE_BADGES,
  ],
  MANAGE_RETURN_POLICIES: [
    STORE_PERMISSIONS.VIEW_RETURN_POLICIES,
    STORE_PERMISSIONS.CREATE_RETURN_POLICIES,
    STORE_PERMISSIONS.UPDATE_RETURN_POLICIES,
  ],
  MANAGE_DISCOUNTS: [
    MARKETING_PERMISSIONS.VIEW_DISCOUNTS,
    MARKETING_PERMISSIONS.CREATE_DISCOUNTS,
    MARKETING_PERMISSIONS.UPDATE_DISCOUNTS,
  ],
} as const;
