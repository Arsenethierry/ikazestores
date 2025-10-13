// lib/seeds/default-roles-seed.ts
import { DATABASE_ID, STORE_ROLES_ID, STORE_STAFF_ID } from "@/lib/env-config";
import { createAdminClient } from "@/lib/appwrite";
import { ID, Query } from "node-appwrite";

export const DEFAULT_ROLES_PHYSICAL_STORE = [
  {
    roleName: "Warehouse Manager",
    description: "Manages inventory and fulfillment operations",
    permissions: [
      "orders.view",
      "orders.fulfill",
      "products.view",
      "products.inventory",
      "shipping.view",
      "shipping.create",
      "shipping.update",
      "dashboard.view",
    ],
    priority: 2,
  },
  {
    roleName: "Sales Manager",
    description: "Manages sales, orders, and customer relations",
    permissions: [
      "orders.view",
      "orders.create",
      "orders.update",
      "orders.refund",
      "products.view",
      "products.pricing",
      "customers.view",
      "customers.create",
      "customers.update",
      "dashboard.view",
      "dashboard.analytics",
      "dashboard.financial",
      "marketing.view",
      "marketing.discounts",
    ],
    priority: 2,
  },
  {
    roleName: "Product Manager",
    description: "Manages product catalog and inventory",
    permissions: [
      "products.view",
      "products.create",
      "products.update",
      "products.delete",
      "products.pricing",
      "products.inventory",
      "dashboard.view",
      "dashboard.analytics",
    ],
    priority: 3,
  },
  {
    roleName: "Marketing Manager",
    description: "Manages marketing campaigns and promotions",
    permissions: [
      "products.view",
      "customers.view",
      "marketing.view",
      "marketing.create",
      "marketing.update",
      "marketing.discounts",
      "dashboard.view",
      "dashboard.analytics",
    ],
    priority: 3,
  },
  {
    roleName: "Support Agent",
    description: "Handles customer support and inquiries",
    permissions: [
      "orders.view",
      "products.view",
      "customers.view",
      "customers.update",
      "support.view",
      "support.respond",
      "support.close",
      "dashboard.view",
    ],
    priority: 4,
  },
  {
    roleName: "Order Processor",
    description: "Processes and fulfills customer orders",
    permissions: [
      "orders.view",
      "orders.update",
      "orders.fulfill",
      "shipping.view",
      "shipping.create",
      "products.view",
      "customers.view",
      "dashboard.view",
    ],
    priority: 4,
  },
  {
    roleName: "Store Viewer",
    description: "Read-only access to store data",
    permissions: [
      "orders.view",
      "products.view",
      "customers.view",
      "dashboard.view",
    ],
    priority: 5,
  },
] as const;

export const DEFAULT_ROLES_VIRTUAL_STORE = [
  {
    roleName: "Marketing Manager",
    description: "Manages marketing campaigns and store promotion",
    permissions: [
      "products.view",
      "products.import",
      "products.update",
      "products.pricing",
      "customers.view",
      "orders.view",
      "marketing.view",
      "marketing.create",
      "marketing.update",
      "marketing.discounts",
      "dashboard.view",
      "dashboard.analytics",
      "store.theme",
    ],
    priority: 2,
  },
  {
    roleName: "Product Curator",
    description: "Imports and manages product catalog",
    permissions: [
      "products.view",
      "products.import",
      "products.update",
      "products.delete",
      "products.pricing",
      "dashboard.view",
      "dashboard.analytics",
    ],
    priority: 3,
  },
  {
    roleName: "Sales Agent",
    description: "Manages customer orders and relations",
    permissions: [
      "orders.view",
      "orders.create",
      "orders.update",
      "products.view",
      "customers.view",
      "customers.create",
      "customers.update",
      "dashboard.view",
      "dashboard.analytics",
    ],
    priority: 3,
  },
  {
    roleName: "Support Agent",
    description: "Handles customer support and inquiries",
    permissions: [
      "orders.view",
      "products.view",
      "customers.view",
      "customers.update",
      "support.view",
      "support.respond",
      "support.close",
      "dashboard.view",
    ],
    priority: 4,
  },
  {
    roleName: "Content Manager",
    description: "Manages store content and theme",
    permissions: [
      "products.view",
      "store.view",
      "store.theme",
      "marketing.view",
      "marketing.create",
      "dashboard.view",
    ],
    priority: 4,
  },
  {
    roleName: "Store Viewer",
    description: "Read-only access to store data",
    permissions: [
      "orders.view",
      "products.view",
      "customers.view",
      "dashboard.view",
    ],
    priority: 5,
  },
] as const;

/**
 * Seed default roles for a specific store
 * This is called when a new store is created
 */
export async function seedDefaultRolesForStore(
  storeId: string,
  storeType: "physical" | "virtual",
  createdBy: string
) {
  const { databases } = await createAdminClient();

  try {
    const rolesToSeed =
      storeType === "physical"
        ? DEFAULT_ROLES_PHYSICAL_STORE
        : DEFAULT_ROLES_VIRTUAL_STORE;

    const promises = rolesToSeed.map((role) =>
      databases.createDocument(DATABASE_ID, STORE_ROLES_ID, ID.unique(), {
        storeId,
        storeType,
        roleName: role.roleName,
        description: role.description,
        permissions: role.permissions,
        isCustom: false,
        createdBy,
        isActive: true,
        priority: role.priority,
      })
    );

    const createdRoles = await Promise.all(promises);

    console.log(
      `Successfully seeded ${rolesToSeed.length} default roles for store ${storeId}`
    );
    return createdRoles;
  } catch (error) {
    console.error("Error seeding default roles:", error);
    throw error;
  }
}

/**
 * Get all roles for a specific store
 */
export async function getStoreRoles(storeId: string) {
  const { databases } = await createAdminClient();
  const STORE_ROLES_COLLECTION_ID = "store_roles";

  try {
    const roles = await databases.listDocuments(
      DATABASE_ID,
      STORE_ROLES_COLLECTION_ID,
      [
        Query.equal("storeId", storeId),
        Query.equal("isActive", true),
        Query.orderAsc("priority"),
        Query.limit(100),
      ]
    );

    return roles.documents;
  } catch (error) {
    console.error("Error fetching store roles:", error);
    throw error;
  }
}

/**
 * Create a custom role for a store
 */
export async function createCustomRole(
  storeId: string,
  storeType: "physical" | "virtual",
  roleName: string,
  description: string,
  permissions: string[],
  createdBy: string
) {
  const { databases } = await createAdminClient();

  try {
    // Validate role name is unique for this store
    const existingRoles = await databases.listDocuments(
      DATABASE_ID,
      STORE_ROLES_ID,
      [Query.equal("storeId", storeId), Query.equal("roleName", roleName)]
    );

    if (existingRoles.total > 0) {
      throw new Error(`Role "${roleName}" already exists in this store`);
    }

    const newRole = await databases.createDocument(
      DATABASE_ID,
      STORE_ROLES_ID,
      ID.unique(),
      {
        storeId,
        storeType,
        roleName,
        description,
        permissions,
        isCustom: true,
        createdBy,
        isActive: true,
        priority: 10, // Custom roles have lower priority
      }
    );

    return newRole;
  } catch (error) {
    console.error("Error creating custom role:", error);
    throw error;
  }
}

/**
 * Update an existing role
 */
export async function updateRole(
  roleId: string,
  updates: {
    roleName?: string;
    description?: string;
    permissions?: string[];
    isActive?: boolean;
  }
) {
  const { databases } = await createAdminClient();

  try {
    const updatedRole = await databases.updateDocument(
      DATABASE_ID,
      STORE_ROLES_ID,
      roleId,
      updates
    );

    return updatedRole;
  } catch (error) {
    console.error("Error updating role:", error);
    throw error;
  }
}

/**
 * Delete a custom role (can't delete default roles)
 */
export async function deleteRole(roleId: string) {
  const { databases } = await createAdminClient();

  try {
    // Check if role is custom
    const role = await databases.getDocument(
      DATABASE_ID,
      STORE_ROLES_ID,
      roleId
    );

    if (!role.isCustom) {
      throw new Error("Cannot delete default roles");
    }

    const staffWithRole = await databases.listDocuments(
      DATABASE_ID,
      STORE_STAFF_ID,
      [Query.equal("roleId", roleId), Query.limit(1)]
    );

    if (staffWithRole.total > 0) {
      throw new Error(
        "Cannot delete role that is assigned to staff members. Reassign staff first."
      );
    }

    await databases.deleteDocument(
      DATABASE_ID,
      STORE_ROLES_ID,
      roleId
    );

    return { success: true };
  } catch (error) {
    console.error("Error deleting role:", error);
    throw error;
  }
}
