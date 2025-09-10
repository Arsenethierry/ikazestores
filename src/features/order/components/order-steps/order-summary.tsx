"use client";

import { Card } from "@/components/ui/card";
import { convertCurrency } from "@/hooks/use-currency";
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
export const OrderSummaryStep: React.FC<OrderSummaryStepProps> = ({ address, cartItems }) => {
    const { exchangeRates, exchangeRatesLoading, currentCurrency } = useCurrency();

    const calculateOrderTotals = () => {
        if (exchangeRatesLoading || !exchangeRates) {
            return {
                subtotal: 0,
                total: 0,
                isLoading: true
            };
        }

        // Convert each item to current currency and sum
        const convertedSubtotal = cartItems.reduce((acc, item) => {
            const itemCurrency = item.productCurrency || 'USD';
            const itemTotal = item.price * item.quantity;
            const convertedAmount = convertCurrency(
                itemTotal,
                itemCurrency,
                currentCurrency,
                exchangeRates
            );
            return acc + convertedAmount;
        }, 0);

        const shippingCost = 0;
        const tax = 0;
        const total = convertedSubtotal + shippingCost + tax;

        return {
            subtotal: convertedSubtotal,
            total,
            isLoading: false
        };
    };

    const { subtotal, total, isLoading: calculationsLoading } = calculateOrderTotals();

    const shippingCost = 0;
    const tax = 0

    return (
        <div className="space-y-6">
            <div>
                <h3 className="font-medium text-gray-900 mb-3">Delivery Address</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                    <p className="font-medium">{address.fullName}</p>
                    <p>{address.street}</p>
                    <p>{address.city}, {address.state} {address.zip}</p>
                    <p>{address.country}</p>
                    <p>Phone: {address.phoneNumber}</p>
                </div>
            </div>

            <div>
                <h3 className="font-medium text-gray-900 mb-3">Items ({cartItems.length})</h3>
                <Card className="p-4">
                    <ul className="divide-y divide-gray-200">
                        {cartItems.map((item, index) => (
                            <li key={index} className="py-4 flex">
                                <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-gray-100 mr-4">
                                    {item.image ? (
                                        <Image
                                            src={item.image}
                                            alt={item.name}
                                            width={64}
                                            height={64}
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                            <span className="text-xs text-gray-500">No image</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 flex flex-col">
                                    <div className="flex justify-between">
                                        <h4 className="text-sm font-medium">{item.name}</h4>
                                        <div className="text-sm font-medium">
                                            <ProductPriceDisplay
                                                productPrice={item.price}
                                                productCurrency={item.productCurrency || 'USD'}
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-1 flex-1">
                                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>

            <div>
                <h3 className="font-medium text-gray-900 mb-3">Order Summary</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                    {/* Show currency breakdown if multiple currencies exist */}
                    {(() => {
                        const currencies = [...new Set(cartItems.map(item => item.productCurrency || 'USD'))];
                        return currencies.length > 1 ? (
                            <div className='space-y-2 mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200'>
                                <span className='text-sm font-medium text-blue-700'>Items by original currency:</span>
                                {currencies.map(currency => {
                                    const currencyItems = cartItems.filter(item => (item.productCurrency || 'USD') === currency);
                                    const currencySubtotal = currencyItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                                    const itemCount = currencyItems.reduce((sum, item) => sum + item.quantity, 0);

                                    return (
                                        <div key={currency} className='flex justify-between text-sm'>
                                            <span>{itemCount} items ({currency})</span>
                                            <ProductPriceDisplay
                                                productPrice={currencySubtotal}
                                                productCurrency={currency}
                                                showOriginalPrice={false}
                                            />
                                        </div>
                                    );
                                })}
                                <hr className='border-blue-200' />
                            </div>
                        ) : null;
                    })()}

                    <div className="flex justify-between py-1">
                        <span>Subtotal</span>
                        {calculationsLoading ? (
                            <span className="text-sm text-gray-500">Calculating...</span>
                        ) : (
                            <div className="text-right">
                                <ProductPriceDisplay
                                    productPrice={subtotal}
                                    productCurrency={currentCurrency || 'USD'}
                                    showOriginalPrice={false}
                                />
                                {/* Show conversion note if multiple currencies */}
                                {[...new Set(cartItems.map(item => item.productCurrency || 'USD'))].length > 1 && (
                                    <div className='text-xs text-gray-500'>
                                        Converted to {currentCurrency}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex justify-between py-1">
                        <span>Shipping</span>
                        <ProductPriceDisplay
                            productPrice={0}
                            productCurrency={currentCurrency || 'USD'}
                            showOriginalPrice={false}
                        />
                    </div>
                    <div className="flex justify-between py-1">
                        <span>Tax</span>
                        <ProductPriceDisplay
                            productPrice={0}
                            productCurrency={currentCurrency || 'USD'}
                            showOriginalPrice={false}
                        />
                    </div>
                    <div className="flex justify-between py-2 font-medium border-t mt-2">
                        <span>Total</span>
                        {calculationsLoading ? (
                            <span className="text-sm text-gray-500">Calculating...</span>
                        ) : (
                            <ProductPriceDisplay
                                productPrice={total}
                                productCurrency={currentCurrency || 'USD'}
                                showOriginalPrice={false}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}