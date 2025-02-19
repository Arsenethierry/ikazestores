import { UserRoleType } from "./types";

export const AUTH_COOKIE = "ikazestores-cookie";

export const UserRole = {
    PHYSICAL_STORE_OWNER: 'physicalStoreOwner' as UserRoleType,
    VIRTUAL_STORE_OWNER: 'virtualStoreOwner' as UserRoleType,
    BUYER: 'buyer' as UserRoleType,
    SYS_ADMIN: 'sysAdmin' as UserRoleType,
} as const;