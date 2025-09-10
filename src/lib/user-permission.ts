// lib/user-permission.ts
import { Models } from "node-appwrite";
import { getLoggedInUser, getUserMemberships, getUserTeams } from "./actions/auth.action";
import { TeamNamesPatterns, UserRole, StoreRole } from "./constants";
import { AuthState } from "./types";

export interface AuthResult {
    isAuthenticated: boolean;
    user: Models.User<Models.Preferences> | null;
    roles: string[];
    teams: Models.Team<Models.Preferences>[];
    memberships: Models.Membership[]
}

/**
 * Extract store ID from team name
 * Pattern: Store_{storeId}_Team
 */
const extractStoreIdFromTeam = (teamName: string): string | null => {
    const match = teamName.match(TeamNamesPatterns.STORE_TEAM);
    return match ? match[1] : null;
};

/**
 * Extract store ID from label (fallback for legacy data)
 * Pattern: store-{storeId}-{role}
 */
const extractStoreIdFromLabel = (label: string): { storeId: string; role: string } | null => {
    const match = label.match(/^store-(.+)-(owner|admin|staff)$/);
    return match ? { storeId: match[1], role: match[2] } : null;
};

/**
 * Get the user's role in a specific store team
 */
const getStoreRoleFromMembership = (membership: Models.Membership): StoreRole | null => {
    // Check membership roles array
    if (membership.roles && membership.roles.length > 0) {
        if (membership.roles.includes(StoreRole.OWNER)) return StoreRole.OWNER;
        if (membership.roles.includes(StoreRole.ADMIN)) return StoreRole.ADMIN;
        if (membership.roles.includes(StoreRole.STAFF)) return StoreRole.STAFF;
    }
    return null;
};

/**
 * Check if user has system access
 */
const checkSystemAccess = (user: Models.User<Models.Preferences>, memberships: Models.Membership[]): { isSystemAdmin: boolean; isSystemAgent: boolean } => {
    const userLabels = user.labels || [];
    
    // Check for system admin
    const isSystemAdmin = userLabels.includes(UserRole.SYS_ADMIN) ||
        memberships.some(m => m.teamName === TeamNamesPatterns.SYSTEM_OPERATIONS_TEAM && 
                            m.roles.includes('admin'));
    
    // Check for system agent
    const isSystemAgent = userLabels.includes(UserRole.SYS_AGENT) ||
        memberships.some(m => m.teamName === TeamNamesPatterns.SYSTEM_OPERATIONS_TEAM && 
                            m.roles.includes('agent'));
    
    return { isSystemAdmin, isSystemAgent };
};

/**
 * Main authentication check function
 */
const checkAuth = async (): Promise<AuthResult> => {
    try {
        const user = await getLoggedInUser();
        
        if (!user) {
            return {
                isAuthenticated: false,
                user: null,
                roles: [],
                teams: [],
                memberships: []
            };
        }

        let teams: Models.Team<Models.Preferences>[] = [];
        let memberships: Models.Membership[] = [];

        const results = await Promise.allSettled([
            getUserTeams(),
            getUserMemberships()
        ]);

        if (results[0].status === 'fulfilled') {
            teams = results[0].value;
        }

        if (results[1].status === 'fulfilled') {
            memberships = results[1].value;
        }

        return {
            isAuthenticated: true,
            user,
            roles: user.labels || [],
            teams,
            memberships
        };
    } catch (error) {
        console.error('Authentication check failed:', error);
        return {
            isAuthenticated: false,
            user: null,
            roles: [],
            teams: [],
            memberships: []
        };
    }
};

export const getAuthState = async (): Promise<AuthState> => {
    const auth = await checkAuth();

    if (!auth.isAuthenticated || !auth.user) {
        return {
            isAuthenticated: false,
            user: null,
            roles: [],
            teams: [],
            memberships: [],
            isSystemAdmin: false,
            isSystemAgent: false,
            isVirtualStoreOwner: false,
            isPhysicalStoreOwner: false,
            isStoreOwner: false,
            isStoreAdmin: false,
            isStoreStaff: false,
            ownedStores: [],
            adminStores: [],
            staffStores: [],
            hasSystemAccess: () => false,
            canAccessStore: () => false,
            getStoreRole: () => null,
            hasStorePermission: () => false,
            canAccessResource: () => false,
        };
    }

    const userLabels = auth.user.labels || [];
    
    // Check system access
    const { isSystemAdmin, isSystemAgent } = checkSystemAccess(auth.user, auth.memberships);
    
    // Check store type ownership
    const isVirtualStoreOwner = userLabels.includes(UserRole.VIRTUAL_STORE_OWNER);
    const isPhysicalStoreOwner = userLabels.includes(UserRole.PHYSICAL_STORE_OWNER);
    
    // Collect store permissions
    const storePermissions = new Map<string, StoreRole>();
    
    // Process team memberships (primary source of truth)
    auth.memberships.forEach(membership => {
        const storeId = membership.teamId;
        if (storeId) {
            const role = getStoreRoleFromMembership(membership);
            if (role) {
                // Use highest permission if multiple exist
                const existingRole = storePermissions.get(storeId);
                if (!existingRole || 
                    (role === StoreRole.OWNER) ||
                    (role === StoreRole.ADMIN && existingRole === StoreRole.STAFF)) {
                    storePermissions.set(storeId, role);
                }
            }
        }
    });
    
    // Process labels (fallback for legacy data)
    userLabels.forEach(label => {
        const labelData = extractStoreIdFromLabel(label);
        if (labelData && !storePermissions.has(labelData.storeId)) {
            storePermissions.set(labelData.storeId, labelData.role as StoreRole);
        }
    });
    
    // Organize stores by role
    const ownedStores: string[] = [];
    const adminStores: string[] = [];
    const staffStores: string[] = [];
    
    storePermissions.forEach((role, storeId) => {
        switch (role) {
            case StoreRole.OWNER:
                ownedStores.push(storeId);
                break;
            case StoreRole.ADMIN:
                adminStores.push(storeId);
                break;
            case StoreRole.STAFF:
                staffStores.push(storeId);
                break;
        }
    });
    
    // Helper functions
    const hasSystemAccess = (): boolean => {
        return isSystemAdmin || isSystemAgent;
    };
    
    const canAccessStore = (storeId: string): boolean => {
        return isSystemAdmin || storePermissions.has(storeId);
    };
    
    const getStoreRole = (storeId: string): 'owner' | 'admin' | 'staff' | null => {
        if (isSystemAdmin) return StoreRole.OWNER; // System admin has owner-level access
        return storePermissions.get(storeId) || null;
    };
    
    const hasStorePermission = (storeId: string, permission: 'read' | 'write' | 'delete'): boolean => {
        const role = getStoreRole(storeId);
        if (!role) return false;
        
        switch (permission) {
            case 'read':
                // All roles can read
                return true;
            case 'write':
                // Owner and Admin can write
                return role === StoreRole.OWNER || role === StoreRole.ADMIN;
            case 'delete':
                // Only Owner can delete
                return role === StoreRole.OWNER;
            default:
                return false;
        }
    };
    
    const canAccessResource = (resource: string, permission: 'read' | 'write' | 'delete'): boolean => {
        // System admin has full access
        if (isSystemAdmin) return true;
        
        // System agent has read access to system resources
        if (isSystemAgent && resource.startsWith('System_') && permission === 'read') {
            return true;
        }
        
        // Check store resources
        const storeMatch = resource.match(/Store_(.+)_/);
        if (storeMatch) {
            const storeId = storeMatch[1];
            return hasStorePermission(storeId, permission);
        }
        
        return false;
    };
    
    return {
        isAuthenticated: auth.isAuthenticated,
        user: auth.user,
        roles: auth.roles,
        teams: auth.teams,
        memberships: auth.memberships,
        isSystemAdmin,
        isSystemAgent,
        isVirtualStoreOwner,
        isPhysicalStoreOwner,
        isStoreOwner: ownedStores.length > 0,
        isStoreAdmin: adminStores.length > 0,
        isStoreStaff: staffStores.length > 0,
        ownedStores,
        adminStores,
        staffStores,
        hasSystemAccess,
        canAccessStore,
        getStoreRole,
        hasStorePermission,
        canAccessResource,
    };
};

/**
 * Check if a user owns a specific store
 */
export const isStoreOwner = (
    user: Models.User<Models.Preferences> | null, 
    store: Models.Document | null
): boolean => {
    if (!user || !store) return false;
    
    // Check if user is the store owner
    return user.$id === store.owner;
};