import { Models } from "node-appwrite";
import { getLoggedInUser, getUserMemberships, getUserTeams } from "./actions/auth.action";
import { TeamNamesPatterns, UserRole } from "./constants";
import { AuthState, UserRoleType } from "./types";

export interface AuthResult {
    isAuthenticated: boolean;
    user: Models.User<Models.Preferences> | null;
    roles: UserRoleType[];
    teams: Models.Team<Models.Preferences>[];
    memberships: Models.Membership[]
}

const isValidUserRole = (role: string): role is UserRoleType => {
    return Object.values(UserRole).includes(role as UserRole);
};

const extractStoreId = (teamNameOrLabel: string): string | null => {
    const storeMatch = teamNameOrLabel.match(/Store_(.+)_Team|store-(.+)-(owner|admin|staff)/);
    return storeMatch ? (storeMatch[1] || storeMatch[2]) : null;
};

const extractStoreRole = (teamName: string, membershipRole: string, userLabels: string[]): 'owner' | 'admin' | 'staff' | null => {
    const storeId = extractStoreId(teamName);
    if (!storeId) return null;

    if (membershipRole === 'owner') return 'owner';
    if (membershipRole === 'admin') return 'admin';
    if (membershipRole === 'staff') return 'staff';

    if (userLabels.includes(`store-${storeId}-owner`)) return 'owner';
    if (userLabels.includes(`store-${storeId}-admin`)) return 'admin';
    if (userLabels.includes(`store-${storeId}-staff`)) return 'staff';

    return null;
}

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

        const userRoles = (user.labels || []).filter(isValidUserRole) as UserRoleType[];

        const teams = await getUserTeams();
        const memberships = await getUserMemberships();

        return {
            isAuthenticated: true,
            user,
            roles: userRoles,
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

    const isSystemAdmin = auth.roles.includes(UserRole.SYS_ADMIN) ||
        auth.memberships.some(m => m.teamName === TeamNamesPatterns.SYSTEM_ADMIN);
    const isSystemAgent = auth.roles.includes(UserRole.SYS_AGENT) ||
        auth.memberships.some(m => m.teamName === TeamNamesPatterns.SYSTEM_AGENT) ||
        userLabels.includes('system-agent');

    const isVirtualStoreOwner = auth.roles.includes(UserRole.VIRTUAL_STORE_OWNER);
    const isPhysicalStoreOwner = auth.roles.includes(UserRole.PHYSICAL_STORE_OWNER);

    const ownedStores: string[] = [];
    const adminStores: string[] = [];
    const staffStores: string[] = [];

    auth.memberships.forEach(membership => {
        const storeId = extractStoreId(membership.teamName);
        const storeRole = extractStoreRole(membership.teamName, membership.roles[0], userLabels);

        if (storeId && storeRole) {
            switch (storeRole) {
                case 'owner':
                    ownedStores.push(storeId);
                    break;
                case 'admin':
                    adminStores.push(storeId);
                    break;
                case 'staff':
                    staffStores.push(storeId);
                    break;
            }
        }
    });

    userLabels.forEach(label => {
        const storeMatch = label.match(/store-(.+)-(owner|admin|staff)/);
        if (storeMatch) {
            const [, storeId, role] = storeMatch;
            switch (role) {
                case 'owner':
                    if (!ownedStores.includes(storeId)) ownedStores.push(storeId);
                    break;
                case 'admin':
                    if (!adminStores.includes(storeId)) adminStores.push(storeId);
                    break;
                case 'staff':
                    if (!staffStores.includes(storeId)) staffStores.push(storeId);
                    break;
            }
        }
    });

    const isStoreOwner = ownedStores.length > 0 || isVirtualStoreOwner || isPhysicalStoreOwner;
    const isStoreAdmin = adminStores.length > 0;
    const isStoreStaff = staffStores.length > 0;

    const hasSystemAccess = (): boolean => {
        return isSystemAdmin || isSystemAgent;
    };

    const canAccessStore = (storeId: string): boolean => {
        return isSystemAdmin ||
            ownedStores.includes(storeId) ||
            adminStores.includes(storeId) ||
            staffStores.includes(storeId);
    };

    const getStoreRole = (storeId: string): 'owner' | 'admin' | 'staff' | null => {
        if (isSystemAdmin) return 'owner';
        if (ownedStores.includes(storeId)) return 'owner';
        if (adminStores.includes(storeId)) return 'admin';
        if (staffStores.includes(storeId)) return 'staff';
        return null;
    };

    const hasStorePermission = (storeId: string, permission: 'read' | 'write' | 'delete'): boolean => {
        const role = getStoreRole(storeId);
        if (!role) return false;

        switch (permission) {
            case 'read':
                return ['owner', 'admin', 'staff'].includes(role);
            case 'write':
                return ['owner', 'admin'].includes(role);
            case 'delete':
                return role === 'owner';
            default:
                return false;
        }
    };

    const canAccessResource = (resource: string, permission: 'read' | 'write' | 'delete'): boolean => {
        if (isSystemAdmin) return true;

        if (isSystemAgent && resource.startsWith('System_') && permission === 'read') {
            return true;
        }

        const storeMatch = resource.match(/Store_(.+)_/);
        if (storeMatch) {
            const storeId = storeMatch[1];
            return hasStorePermission(storeId, permission);
        }

        return false;
    }

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
        isStoreOwner,
        isStoreAdmin,
        isStoreStaff,
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

export const isStoreOwner = (user: Models.User<Models.Preferences> | null, store: Models.Document | null): boolean => {
    if (!user || !store) return false;
    return user && (user.$id === store.owner)
}
