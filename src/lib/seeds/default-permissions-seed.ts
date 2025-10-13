import { ID, Query } from "node-appwrite";
import { createAdminClient } from "../appwrite";
import { DATABASE_ID, STORE_PERMISSIONS_ID } from "../env-config";

export const DEFAULT_PERMISSIONS = [
  // ========== ORDERS MODULE ==========
  {
    permissionKey: "orders.view",
    permissionName: "View Orders",
    module: "orders",
    description: "View all orders in the store",
    applicableToStoreType: "both" as const,
  },
  {
    permissionKey: "orders.create",
    permissionName: "Create Orders",
    module: "orders",
    description: "Create new orders manually",
    applicableToStoreType: "both" as const,
  },
  {
    permissionKey: "orders.update",
    permissionName: "Update Orders",
    module: "orders",
    description: "Edit order details and status",
    applicableToStoreType: "both" as const,
  },
  {
    permissionKey: "orders.delete",
    permissionName: "Delete Orders",
    module: "orders",
    description: "Delete orders from the system",
    applicableToStoreType: "both" as const,
  },
  {
    permissionKey: "orders.fulfill",
    permissionName: "Fulfill Orders",
    module: "orders",
    description: "Process and fulfill orders",
    applicableToStoreType: "physical" as const,
  },
  {
    permissionKey: "orders.refund",
    permissionName: "Process Refunds",
    module: "orders",
    description: "Issue refunds for orders",
    applicableToStoreType: "both" as const,
  },

  // ========== PRODUCTS MODULE ==========
  {
    permissionKey: "products.view",
    permissionName: "View Products",
    module: "products",
    description: "View all products in catalog",
    applicableToStoreType: "both" as const,
  },
  {
    permissionKey: "products.create",
    permissionName: "Create Products",
    module: "products",
    description: "Add new products to store",
    applicableToStoreType: "physical" as const,
  },
  {
    permissionKey: "products.import",
    permissionName: "Import Products",
    module: "products",
    description: "Import products from physical stores",
    applicableToStoreType: "virtual" as const,
  },
  {
    permissionKey: "products.update",
    permissionName: "Update Products",
    module: "products",
    description: "Edit product information",
    applicableToStoreType: "both" as const,
  },
  {
    permissionKey: "products.delete",
    permissionName: "Delete Products",
    module: "products",
    description: "Remove products from catalog",
    applicableToStoreType: "both" as const,
  },
  {
    permissionKey: "products.pricing",
    permissionName: "Manage Pricing",
    module: "products",
    description: "Set product prices and commissions",
    applicableToStoreType: "both" as const,
  },
  {
    permissionKey: "products.inventory",
    permissionName: "Manage Inventory",
    module: "products",
    description: "Update stock levels and inventory",
    applicableToStoreType: "physical" as const,
  },

  // ========== SHIPPING MODULE ==========
  {
    permissionKey: "shipping.view",
    permissionName: "View Shipments",
    module: "shipping",
    description: "View shipping information",
    applicableToStoreType: "both" as const,
  },
  {
    permissionKey: "shipping.create",
    permissionName: "Create Shipments",
    module: "shipping",
    description: "Create shipping labels and tracking",
    applicableToStoreType: "physical" as const,
  },
  {
    permissionKey: "shipping.update",
    permissionName: "Update Shipments",
    module: "shipping",
    description: "Update shipment status and details",
    applicableToStoreType: "physical" as const,
  },
  {
    permissionKey: "shipping.settings",
    permissionName: "Shipping Settings",
    module: "shipping",
    description: "Manage shipping zones and rates",
    applicableToStoreType: "both" as const,
  },

  // ========== DASHBOARD MODULE ==========
  {
    permissionKey: "dashboard.view",
    permissionName: "View Dashboard",
    module: "dashboard",
    description: "Access store dashboard and analytics",
    applicableToStoreType: "both" as const,
  },
  {
    permissionKey: "dashboard.analytics",
    permissionName: "View Analytics",
    module: "dashboard",
    description: "Access detailed analytics and reports",
    applicableToStoreType: "both" as const,
  },
  {
    permissionKey: "dashboard.financial",
    permissionName: "Financial Reports",
    module: "dashboard",
    description: "View revenue and financial data",
    applicableToStoreType: "both" as const,
  },

  // ========== CUSTOMERS MODULE ==========
  {
    permissionKey: "customers.view",
    permissionName: "View Customers",
    module: "customers",
    description: "View customer information",
    applicableToStoreType: "both" as const,
  },
  {
    permissionKey: "customers.create",
    permissionName: "Create Customers",
    module: "customers",
    description: "Add new customers manually",
    applicableToStoreType: "both" as const,
  },
  {
    permissionKey: "customers.update",
    permissionName: "Update Customers",
    module: "customers",
    description: "Edit customer information",
    applicableToStoreType: "both" as const,
  },
  {
    permissionKey: "customers.delete",
    permissionName: "Delete Customers",
    module: "customers",
    description: "Remove customer accounts",
    applicableToStoreType: "both" as const,
  },

  // ========== MARKETING MODULE ==========
  {
    permissionKey: "marketing.view",
    permissionName: "View Campaigns",
    module: "marketing",
    description: "View marketing campaigns",
    applicableToStoreType: "both" as const,
  },
  {
    permissionKey: "marketing.create",
    permissionName: "Create Campaigns",
    module: "marketing",
    description: "Create marketing campaigns",
    applicableToStoreType: "both" as const,
  },
  {
    permissionKey: "marketing.update",
    permissionName: "Manage Campaigns",
    module: "marketing",
    description: "Edit and manage campaigns",
    applicableToStoreType: "both" as const,
  },
  {
    permissionKey: "marketing.discounts",
    permissionName: "Manage Discounts",
    module: "marketing",
    description: "Create and manage discount codes",
    applicableToStoreType: "both" as const,
  },

  // ========== STORE SETTINGS MODULE ==========
  {
    permissionKey: "store.view",
    permissionName: "View Settings",
    module: "store",
    description: "View store settings",
    applicableToStoreType: "both" as const,
  },
  {
    permissionKey: "store.update",
    permissionName: "Update Settings",
    module: "store",
    description: "Modify store settings",
    applicableToStoreType: "both" as const,
  },
  {
    permissionKey: "store.payment",
    permissionName: "Payment Settings",
    module: "store",
    description: "Manage payment methods and settings",
    applicableToStoreType: "both" as const,
  },
  {
    permissionKey: "store.theme",
    permissionName: "Theme Settings",
    module: "store",
    description: "Customize store theme and appearance",
    applicableToStoreType: "virtual" as const,
  },

  // ========== STAFF MODULE ==========
  {
    permissionKey: "staff.view",
    permissionName: "View Staff",
    module: "staff",
    description: "View staff members and roles",
    applicableToStoreType: "both" as const,
  },
  {
    permissionKey: "staff.invite",
    permissionName: "Invite Staff",
    module: "staff",
    description: "Invite new staff members",
    applicableToStoreType: "both" as const,
  },
  {
    permissionKey: "staff.update",
    permissionName: "Manage Staff",
    module: "staff",
    description: "Edit staff roles and permissions",
    applicableToStoreType: "both" as const,
  },
  {
    permissionKey: "staff.delete",
    permissionName: "Remove Staff",
    module: "staff",
    description: "Remove staff members from store",
    applicableToStoreType: "both" as const,
  },
  {
    permissionKey: "staff.roles",
    permissionName: "Manage Roles",
    module: "staff",
    description: "Create and manage custom roles",
    applicableToStoreType: "both" as const,
  },

  // ========== SUPPORT MODULE ==========
  {
    permissionKey: "support.view",
    permissionName: "View Tickets",
    module: "support",
    description: "View customer support tickets",
    applicableToStoreType: "both" as const,
  },
  {
    permissionKey: "support.respond",
    permissionName: "Respond Tickets",
    module: "support",
    description: "Respond to support tickets",
    applicableToStoreType: "both" as const,
  },
  {
    permissionKey: "support.close",
    permissionName: "Close Tickets",
    module: "support",
    description: "Close and resolve tickets",
    applicableToStoreType: "both" as const,
  },
] as const;

export async function seedDefaultPermissions() {
  const { databases } = await createAdminClient();

  try {
    console.log("Starting permission seeding...");

    // Check if permissions already exist
    const existing = await databases.listDocuments(
      DATABASE_ID,
      STORE_PERMISSIONS_ID,
      [Query.limit(1)]
    );

    if (existing.total > 0) {
      console.log("Permissions already seeded. Skipping...");
      return { success: true, message: "Permissions already exist" };
    }

    // Seed all permissions
    const promises = DEFAULT_PERMISSIONS.map((permission) =>
      databases.createDocument(
        DATABASE_ID,
        STORE_PERMISSIONS_ID,
        ID.unique(),
        permission
      )
    );

    await Promise.all(promises);

    console.log(
      `Successfully seeded ${DEFAULT_PERMISSIONS.length} permissions`
    );
    return {
      success: true,
      message: `Seeded ${DEFAULT_PERMISSIONS.length} permissions`,
    };
  } catch (error) {
    console.error("Error seeding permissions:", error);
    throw error;
  }
}

export async function getPermissionsForStoreType(
  storeType: "physical" | "virtual"
) {
  const { databases } = await createAdminClient();

  try {
    const permissions = await databases.listDocuments(
      DATABASE_ID,
      STORE_PERMISSIONS_ID,
      [
        Query.or([
          Query.equal("applicableToStoreType", "both"),
          Query.equal("applicableToStoreType", storeType),
        ]),
        Query.limit(100),
      ]
    );

    return permissions.documents;
  } catch (error) {
    console.error("Error fetching permissions:", error);
    throw error;
  }
}
