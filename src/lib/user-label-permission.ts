import { Models } from "node-appwrite";
import { getLoggedInUser } from "./actions/auth.action";
import { UserRole } from "./constants";
import { DocumentType, UserRoleType } from "./types";

export interface AuthResult {
    isAuthenticated: boolean;
    user: Models.User<Models.Preferences> | null;
    roles: UserRoleType[];
}

const isValidUserRole = (role: string): role is UserRoleType => {
    return Object.values(UserRole).includes(role as UserRole);
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

        const userRoles = (user.labels || []).filter(isValidUserRole) as UserRoleType[];

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

export const isStoreOwner = (user: Models.User<Models.Preferences> | null, store: DocumentType | null): boolean => {
    if(!user || !store) return false;
    return user && (user.$id === store.owner)
}
