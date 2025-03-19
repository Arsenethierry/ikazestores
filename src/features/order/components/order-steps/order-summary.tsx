"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CartItem } from "@/lib/types";
import Image from "next/image";
import { MouseEventHandler, useState } from "react";
interface savedAddressesType {
    id: string;
    name: string;
    street: string;
    phone: string;
    city: string;
    state: string;
    zip: string;
}

type Props = {
    address: savedAddressesType;
    onNext: MouseEventHandler<HTMLButtonElement>,
    cartItems: CartItem[];
}
export function OrderSummaryStep({ cartItems = [], address, onNext }: Props) {
    const [isLoading, setIsLoading] = useState(false);

    const handleContinue = () => {
        setIsLoading(true);
        // You might want to persist the order summary before proceeding
        setTimeout(() => {
            setIsLoading(false);
            onNext();
        }, 500);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                <Card>
                    <CardContent className="p-4">
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-medium mb-2">Delivery Address</h3>
                                <div className="text-sm text-gray-600">
                                    <p className="font-semibold">{address.name}</p>
                                    <p>{address.street}</p>
                                    <p>{address.city}, {address.state} {address.zip}</p>
                                    <p>Phone: {address.phone}</p>
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <h3 className="font-medium mb-2">Items ({cartItems.length})</h3>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item</TableHead>
                                            <TableHead className="text-right">Qty</TableHead>
                                            <TableHead className="text-right">Price</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {cartItems.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-12 h-12 bg-gray-100 rounded relative">
                                                            {item.image && (
                                                                <Image
                                                                    src={item.image}
                                                                    alt={item.name}
                                                                    fill
                                                                    className="object-contain"
                                                                />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{item.name}</p>
                                                            <p className="text-xs text-gray-500">item variant</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">{item.quantity}</TableCell>
                                                <TableCell className="text-right">₹{item.price.toFixed(2)}</TableCell>
                                                <TableCell className="text-right">₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <Separator />

                            <div>
                                <h3 className="font-medium mb-2">Price Details</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <p>Subtotal</p>
                                        <p>₹100</p>
                                    </div>

                                    <div className="flex justify-between">
                                        <p>Delivery Fee</p>
                                        <p>₹40</p>
                                    </div>

                                    <div className="flex justify-between">
                                        <p>Tax (GST)</p>
                                        <p>₹10</p>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between font-semibold">
                                        <p>Total</p>
                                        <p>₹150</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Button
                onClick={handleContinue}
                className="w-full"
                disabled={isLoading || cartItems.length === 0}
            >
                {isLoading ? "Processing..." : "Proceed to Payment"}
            </Button>
        </div>
    )
}