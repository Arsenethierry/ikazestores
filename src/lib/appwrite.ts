import "server-only";

import {
  Account,
  Client,
  Databases,
  Locale,
  Permission,
  Role,
  Storage,
  Teams,
  Users,
} from "node-appwrite";
import { cookies } from "next/headers";
import { AUTH_COOKIE, StoreRole, UserRole } from "./constants";
import {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  SYSTEM_OPERATIONS_TEAM,
} from "./env-config";

export async function createSessionClient() {
  const cookieStore = await cookies();

  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

  const session = await cookieStore.get(AUTH_COOKIE);

  if (session) {
    client.setSession(session.value);
  }

  return {
    get account() {
      return new Account(client);
    },
    get databases() {
      return new Databases(client);
    },
    get storage() {
      return new Storage(client);
    },
    get teams() {
      return new Teams(client);
    },
    get locale() {
      return new Locale(client);
    },
  };
}

export async function createAdminClient() {
  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(process.env.NEXT_APPWRITE_KEY!);

  return {
    get account() {
      return new Account(client);
    },
    get users() {
      return new Users(client);
    },
    get databases() {
      return new Databases(client);
    },
    get storage() {
      return new Storage(client);
    }
  };
}

export const createDocumentPermissions = ({ userId }: { userId: string }) => {
  return [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),

    Permission.read(Role.team(SYSTEM_OPERATIONS_TEAM)),
    Permission.update(Role.team(SYSTEM_OPERATIONS_TEAM)),
    Permission.update(Role.team(SYSTEM_OPERATIONS_TEAM)),
    Permission.delete(Role.team(SYSTEM_OPERATIONS_TEAM, "admin")),

    Permission.update(Role.label(UserRole.SYS_ADMIN)),
    Permission.delete(Role.label(UserRole.SYS_ADMIN)),

    // Permission.read(Role.label(UserRole.SYS_AGENT)),
    // Permission.update(Role.label(UserRole.SYS_AGENT)),

    Permission.read(Role.users()),
  ];
};

export const createStoreDocumentPermissions = ({
  storeId,
  isPublic = false,
}: {
  storeId: string;
  isPublic?: boolean;
}) => {
  const permissions = [];

  // Public read if specified
  if (isPublic) {
    permissions.push(Permission.read(Role.any()));
  }

  // Store team permissions (using Store_{storeId}_Team format)
  const teamId = storeId; // teamId is same as storeId

  // Owner permissions
  permissions.push(
    Permission.read(Role.team(teamId, StoreRole.OWNER)),
    Permission.update(Role.team(teamId, StoreRole.OWNER)),
    Permission.delete(Role.team(teamId, StoreRole.OWNER))
  );

  // Admin permissions
  permissions.push(
    Permission.read(Role.team(teamId, StoreRole.ADMIN)),
    Permission.update(Role.team(teamId, StoreRole.ADMIN))
  );

  // Staff permissions
  permissions.push(Permission.read(Role.team(teamId, StoreRole.STAFF)));

  // System permissions
  permissions.push(
    Permission.read(Role.team(SYSTEM_OPERATIONS_TEAM)),
    Permission.update(Role.team(SYSTEM_OPERATIONS_TEAM, "admin")),
    Permission.delete(Role.team(SYSTEM_OPERATIONS_TEAM, "admin"))
  );

  return permissions;
};

export const createOrderPermissions = ({
  storeId,
  customerId,
}: {
  storeId: string;
  customerId: string;
}) => {
  const permissions = [];
  const teamId = storeId;

  // Customer can read their own order
  permissions.push(Permission.read(Role.user(customerId)));

  // Store owner permissions
  permissions.push(
    Permission.read(Role.team(teamId, StoreRole.OWNER)),
    Permission.update(Role.team(teamId, StoreRole.OWNER)),
    Permission.delete(Role.team(teamId, StoreRole.OWNER))
  );

  // Store admin permissions
  permissions.push(
    Permission.read(Role.team(teamId, StoreRole.ADMIN)),
    Permission.update(Role.team(teamId, StoreRole.ADMIN))
  );

  // Store staff permissions (read only for order fulfillment)
  permissions.push(Permission.read(Role.team(teamId, StoreRole.STAFF)));

  // System permissions
  permissions.push(
    Permission.read(Role.team(SYSTEM_OPERATIONS_TEAM)),
    Permission.update(Role.team(SYSTEM_OPERATIONS_TEAM, "admin")),
    Permission.delete(Role.team(SYSTEM_OPERATIONS_TEAM, "admin"))
  );

  return permissions;
};

/**
 * Helper to check if current user has specific permission on a store
 */
export async function checkStorePermission(
  storeId: string,
  requiredRole: StoreRole
): Promise<boolean> {
  try {
    const { teams, account } = await createSessionClient();
    const user = await account.get();

    // Check if user is system admin (has full access)
    if (user.labels?.includes(UserRole.SYS_ADMIN)) {
      return true;
    }

    // Check team membership
    const memberships = await teams.listMemberships(storeId);
    const userMembership = memberships.memberships.find(
      (m) => m.userId === user.$id
    );

    if (!userMembership) return false;

    // Check role hierarchy
    const userRole = userMembership.roles[0] as StoreRole;

    switch (requiredRole) {
      case StoreRole.STAFF:
        // Any role can do staff actions
        return true;
      case StoreRole.ADMIN:
        // Admin and Owner can do admin actions
        return userRole === StoreRole.ADMIN || userRole === StoreRole.OWNER;
      case StoreRole.OWNER:
        // Only Owner can do owner actions
        return userRole === StoreRole.OWNER;
      default:
        return false;
    }
  } catch (error) {
    console.error("Error checking store permission:", error);
    return false;
  }
}
