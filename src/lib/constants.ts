
export const AUTH_COOKIE = "auth-cookie";
export const CART_COOKIE = "cart-cookie";

export enum UserRole {
    PHYSICAL_STORE_OWNER = "physicalStoreOwner",
    VIRTUAL_STORE_OWNER = "virtualStoreOwner",
    BUYER = "buyer",
    SYS_ADMIN = "sysAdmin"
}

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

export enum OrderStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    SHIPPED = "shipped",
    DELIVERED = "delivered",
    CANCELLED = "cancelled"
}