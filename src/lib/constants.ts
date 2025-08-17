
export const AUTH_COOKIE = "auth-cookie";
export const CART_COOKIE = "cart-cookie";

export enum UserRole {
    SYS_ADMIN = "sysAdmin",
    SYS_AGENT = "sysAgent",
    PHYSICAL_STORE_OWNER = "physicalSeller",
    VIRTUAL_STORE_OWNER = "virtualStoreOwner",
    STORE_ADMIN = "storeAdmin",
    STORE_STAFF = "storeStaff",
    PHYSICAL_SELLER_PENDING = 'physicalSellerPending',
    BUYER = 'buyer',
}

export const TeamNamesPatterns = {
    SYSTEM_ADMIN: 'system_ops',
    SYSTEM_AGENT: 'SystemAgents',
    STORE_ROLES: {
        OWNER: 'virtualStoreOwner',
        ADMIN: 'admin',
        STAFF: 'staff'
    },
    STORE_TEAM: /^Store_(.+)_Team$/,
    STORE_OWNER_LABEL: /^store-(.+)-owner$/,
    STORE_ADMIN_LABEL: /^store-(.+)-admin$/,
    STORE_STAFF_LABEL: /^store-(.+)-staff$/
} as const;

export enum PaymentMethodType {
    CASH_ON_DELIVERY = "CASH_ON_DELIVERY",
    ONLINE_PAYMENT = "ONLINE_PAYMENT",
    CARD_PAYMENT = "CARD_PAYMENT"
}

export enum OnlinePaymentProvider {
    MTN = "MTN",
    AIRTEL = "AIRTEL"
}

export enum CardProvider {
    STRIPE = "STRIPE",
    PAYPAL = "PAYPAL",
    RAZORPAY = "RAZORPAY",
    VISA = "VISA",
    MASTERCARD = "MASTERCARD"
}

export enum PhysicalStoreFulfillmentOrderStatus {
    PENDING = "pending_fulfillment",
    PROCESSING = "processing",
    SHIPPED = "shipped",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}

export enum OrderStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    SHIPPED = "shipped",
    DELIVERED = "delivered",
    CANCELLED = "cancelled"
}

export const PRICE_FILTER_VALUE = {
    min: 1,
    max: 10000
};

export enum PhysicalStoreStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected'
}

export enum UserAccountType {
    BUYER = "buyer",
    SYS_ADMIN = "sysAdmin",
    SYS_AGENT = "sysAgent",
    PHYSICAL_STORE_SELLER = "physicalSeller",
    VIRTUAL_STORE_SELLER = "virtualSeller",
}
