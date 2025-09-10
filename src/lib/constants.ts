export const AUTH_COOKIE = "auth-cookie";
export const CART_COOKIE = "cart-cookie";

export enum UserRole {
  // System roles
  SYS_ADMIN = "sysAdmin",
  SYS_AGENT = "sysAgent",

  // Store type labels (for user account type)
  PHYSICAL_STORE_OWNER = "physicalSeller",
  VIRTUAL_STORE_OWNER = "virtualStoreOwner",

  // Legacy/Other roles
  PHYSICAL_SELLER_PENDING = "physicalSellerPending",
  BUYER = "buyer",
}

// Store-specific roles (used in teams)
export enum StoreRole {
  OWNER = "owner",
  ADMIN = "admin",
  STAFF = "staff",
}

export const TeamNamesPatterns = {
  // System team names
  SYSTEM_OPERATIONS_TEAM: "System_Operations_Team",

  // Store team pattern: Store_{storeId}_Team
  STORE_TEAM: /^Store_(.+)_Team$/,

  // Store role patterns for labels (fallback)
  STORE_OWNER_LABEL: /^store-(.+)-owner$/,
  STORE_ADMIN_LABEL: /^store-(.+)-admin$/,
  STORE_STAFF_LABEL: /^store-(.+)-staff$/,
} as const;

export enum PaymentMethodType {
  CASH_ON_DELIVERY = "CASH_ON_DELIVERY",
  ONLINE_PAYMENT = "ONLINE_PAYMENT",
  CARD_PAYMENT = "CARD_PAYMENT",
}

export enum OnlinePaymentProvider {
  MTN = "MTN",
  AIRTEL = "AIRTEL",
}

export enum CardProvider {
  STRIPE = "STRIPE",
  PAYPAL = "PAYPAL",
  RAZORPAY = "RAZORPAY",
  VISA = "VISA",
  MASTERCARD = "MASTERCARD",
}

export enum PhysicalStoreFulfillmentOrderStatus {
  PENDING = "pending_fulfillment",
  PROCESSING = "processing",
  SHIPPED = "shipped",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum OrderStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
}

export const PRICE_FILTER_VALUE = {
  min: 1,
  max: 10000,
};

export enum PhysicalStoreStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}