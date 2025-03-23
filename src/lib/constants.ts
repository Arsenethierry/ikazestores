
import { UserRoleType } from "./types";

export const AUTH_COOKIE = "auth-cookie";
export const CART_COOKIE = "cart-cookie";

export const UserRole = {
    PHYSICAL_STORE_OWNER: 'physicalStoreOwner' as UserRoleType,
    VIRTUAL_STORE_OWNER: 'virtualStoreOwner' as UserRoleType,
    BUYER: 'buyer' as UserRoleType,
    SYS_ADMIN: 'sysAdmin' as UserRoleType,
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

export enum OrderStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    SHIPPED = "shipped",
    DELIVERED = "delivered",
    CANCELLED = "cancelled"
}