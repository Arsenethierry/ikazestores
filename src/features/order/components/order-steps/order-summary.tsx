"use client";

import { Card } from "@/components/ui/card";
import { CartItem } from "@/lib/types";
import Image from "next/image";

interface OrderSummaryStepProps {
    address: {
        fullName: string;
        phoneNumber: string;
        street?: string | undefined;
        city?: string | undefined;
        state?: string | undefined;
        zip?: string | undefined;
        country?: string | undefined;
    };
    cartItems: CartItem[];
}

// Utility function to get currency symbol
const getCurrencySymbol = (currency: string): string => {
    const symbols: Record<string, string> = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'RWF': 'FRw',
        'KES': 'KSh',
        'UGX': 'USh',
        'TZS': 'TSh',
    };
    return symbols[currency] || currency;
};

export const OrderSummaryStep: React.FC<OrderSummaryStepProps> = ({ address, cartItems }) => {
    // Simplified single currency calculation
    const calculateOrderTotals = () => {
        // Validate all items have the same currency
        const currencies = [...new Set(cartItems.map(item => item.productCurrency || 'USD'))];

        if (currencies.length > 1) {
            console.warn("Multiple currencies detected in cart items. Only single currency orders are supported.");
            return {
                subtotal: 0,
                total: 0,
                shippingCost: 0,
                tax: 0,
                currency: 'USD',
                isLoading: false,
                hasError: true
            };
        }

        // Use the currency from the first item (all items should have same currency)
        const orderCurrency = cartItems[0]?.productCurrency || 'USD';

        // Calculate subtotal in the order's currency
        const subtotal = cartItems.reduce((acc, item) => {
            return acc + (item.price * item.quantity);
        }, 0);

        const shippingCost = 5; // Default shipping cost
        const tax = 0; // Can be made configurable based on location
        const total = subtotal + shippingCost + tax;

        return {
            subtotal,
            total,
            shippingCost,
            tax,
            currency: orderCurrency,
            isLoading: false,
            hasError: false
        };
    };

    const { subtotal, total, shippingCost, tax, currency, isLoading: calculationsLoading, hasError } = calculateOrderTotals();

    // Show error state if multiple currencies detected
    if (hasError) {
        return (
            <div className="space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">
                                Multiple Currencies Detected
                            </h3>
                            <div className="mt-2 text-sm text-red-700">
                                <p>
                                    Your cart contains items with different currencies. Please ensure all items use the same currency before proceeding with the order.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Delivery Address */}
            <div>
                <h3 className="font-medium text-gray-900 mb-3">Delivery Address</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                    <p className="font-medium">{address.fullName}</p>
                    {address.street && <p>{address.street}</p>}
                    {(address.city || address.state || address.zip) && (
                        <p>
                            {[address.city, address.state, address.zip].filter(Boolean).join(', ')}
                        </p>
                    )}
                    {address.country && <p>{address.country}</p>}
                    <p>Phone: {address.phoneNumber}</p>
                </div>
            </div>

            {/* Order Items */}
            <div>
                <h3 className="font-medium text-gray-900 mb-3">
                    Items ({cartItems.length})
                </h3>
                <Card className="p-4">
                    {cartItems.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No items in your order
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-200">
                            {cartItems.map((item, index) => (
                                <li key={item.id || index} className="py-4 flex">
                                    {/* Product Image */}
                                    <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-gray-100 mr-4">
                                        {item.image ? (
                                            <Image
                                                src={item.image}
                                                alt={item.name}
                                                width={64}
                                                height={64}
                                                className="object-cover w-full h-full"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Details */}
                                    <div className="flex-1 flex flex-col">
                                        <div className="flex justify-between">
                                            <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                                                {item.name}
                                            </h4>
                                            <div className="text-sm font-medium text-gray-900 ml-4">
                                                {getCurrencySymbol(item.productCurrency || 'USD')}{item.price.toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="mt-1 flex-1">
                                            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                            {item.sku && (
                                                <p className="text-xs text-gray-400 mt-1">SKU: {item.sku}</p>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-end mt-2">
                                            <span className="text-xs text-gray-500">
                                                Subtotal
                                            </span>
                                            <span className="text-sm font-medium">
                                                {getCurrencySymbol(item.productCurrency || 'USD')}{(item.price * item.quantity).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </div>

            {/* Order Summary */}
            <div>
                <h3 className="font-medium text-gray-900 mb-3">Order Summary</h3>
                <div className="bg-gray-50 p-4 rounded-md space-y-2">
                    {/* Subtotal */}
                    <div className="flex justify-between py-1">
                        <span className="text-gray-600">Subtotal ({cartItems.length} items)</span>
                        {calculationsLoading ? (
                            <span className="text-sm text-gray-500">Calculating...</span>
                        ) : (
                            <span className="font-medium">
                                {getCurrencySymbol(currency)}{subtotal.toFixed(2)}
                            </span>
                        )}
                    </div>

                    {/* Shipping */}
                    <div className="flex justify-between py-1">
                        <span className="text-gray-600">Shipping</span>
                        <span className="font-medium">
                            {shippingCost === 0 ? 'Free' : `${getCurrencySymbol(currency)}${shippingCost.toFixed(2)}`}
                        </span>
                    </div>

                    {/* Tax */}
                    <div className="flex justify-between py-1">
                        <span className="text-gray-600">Tax</span>
                        <span className="font-medium">
                            {getCurrencySymbol(currency)}{tax.toFixed(2)}
                        </span>
                    </div>

                    {/* Total */}
                    <div className="flex justify-between py-2 font-semibold text-lg border-t border-gray-300 mt-3 pt-3">
                        <span className="text-gray-900">Total</span>
                        {calculationsLoading ? (
                            <span className="text-sm text-gray-500">Calculating...</span>
                        ) : (
                            <span className="text-gray-900">
                                {getCurrencySymbol(currency)}{total.toFixed(2)}
                            </span>
                        )}
                    </div>

                    {/* Currency Information */}
                    {currency && currency !== 'USD' && (
                        <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-200 mt-2">
                            All prices shown in {currency}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};