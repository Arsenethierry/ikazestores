import { Models } from "node-appwrite";
import { getLoggedInUser } from "./actions/auth.action";
import { UserRole } from "./constants";
import { UserRoleType } from "./types";

export interface AuthResult {
    isAuthenticated: boolean;
    user: Models.User<Models.Preferences> | null;
    roles: UserRoleType[];
}

const USER_ROLES = Object.values(UserRole);

const isValidUserRole = (role: string): role is UserRoleType => {
    return USER_ROLES.includes(role as UserRoleType);
};

const checkAuth = async (): Promise<AuthResult> => {
    try {
        const user = await getLoggedInUser();

        if (!user) {
            return {
                isAuthenticated: false,
                user: null,
                roles: []
            };
        }

        const userRoles = (user.labels || []).filter(isValidUserRole);

        return {
            isAuthenticated: true,
            user,
            roles: userRoles
        };
    } catch (error) {
        console.error('Authentication check failed:', error);
        return {
            isAuthenticated: false,
            user: null,
            roles: []
        };
    }
};

export const getAuthState = async () => {
    const auth = await checkAuth();
    
    return {
        isAuthenticated: auth.isAuthenticated,
        user: auth.user,
        roles: auth.roles,
        isSystemAdmin: auth.roles.includes(UserRole.SYS_ADMIN),
        isVirtualStoreOwner: auth.roles.includes(UserRole.VIRTUAL_STORE_OWNER),
        isPhysicalStoreOwner: auth.roles.includes(UserRole.PHYSICAL_STORE_OWNER),
        isBuyer: auth.roles.includes(UserRole.BUYER),
    };
};
