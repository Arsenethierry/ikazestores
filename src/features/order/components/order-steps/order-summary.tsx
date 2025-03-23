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
export const OrderSummaryStep: React.FC<OrderSummaryStepProps> = ({ address, cartItems }) => {
    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shippingCost = 0;
    const tax = 0
    const total = subtotal + shippingCost + tax;

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
                                        <p className="text-sm font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                                    </div>
                                    <div className="mt-1 flex-1">
                                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                        {/* {item.options && Object.entries(item.options).map(([key, value]) => (
                                            <p key={key} className="text-xs text-gray-500">
                                                {key}: {value}
                                            </p>
                                        ))} */}
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
                    <div className="flex justify-between py-1">
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                        <span>Shipping</span>
                        <span>${shippingCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                        <span>Tax</span>
                        <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 font-medium border-t mt-2">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}