"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

export function PaymentOptionsStep({ total = 0, onNext }) {
    const [paymentMethod, setPaymentMethod] = useState("upi");

    const handleSubmit = async () => {
        // setLoading(true);
        // Add payment method to the form data
        // formData.append("paymentMethod", paymentMethod);
        // const result = await formAction(formData);
        // setLoading(false);
        // if (result.success) {
        onNext();
        // }
    };
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold mb-4">Payment Options</h2>

                <div className="flex justify-between items-center mb-4">
                    <p className="text-sm">Amount to pay</p>
                    <p className="font-semibold text-lg">₹{total.toFixed(2)}</p>
                </div>

                <Tabs defaultValue="upi" onValueChange={setPaymentMethod}>
                    <TabsList className="grid grid-cols-4 mb-4">
                        <TabsTrigger value="upi">UPI</TabsTrigger>
                        <TabsTrigger value="cards">Cards</TabsTrigger>
                        <TabsTrigger value="netbanking">Net Banking</TabsTrigger>
                        <TabsTrigger value="cod">Cash on Delivery</TabsTrigger>
                    </TabsList>

                    <form action={handleSubmit}>
                        <TabsContent value="upi">
                            <Card>
                                <CardContent className="p-4 space-y-4">
                                    <div className="space-y-2">
                                        <Label>Pay using UPI</Label>
                                        <RadioGroup defaultValue="enter" name="upiMethod" className="space-y-3">
                                            <div className="flex items-center space-x-2 border rounded p-3">
                                                <RadioGroupItem value="enter" id="enter-upi" />
                                                <Label htmlFor="enter-upi">Enter UPI ID</Label>
                                            </div>
                                            <div className="flex items-center space-x-2 border rounded p-3">
                                                <RadioGroupItem value="qr" id="qr-upi" />
                                                <Label htmlFor="qr-upi">Scan QR Code</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="upiId">UPI ID</Label>
                                        <Input
                                            id="upiId"
                                            name="upiId"
                                            placeholder="yourname@upi"
                                        // className={formState.errors?.upiId ? "border-red-500" : ""}
                                        />
                                        {/* {formState.errors?.upiId && (
                                            <p className="text-sm text-red-500">{formState.errors.upiId}</p>
                                        )} */}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="cod">
                            <Card>
                                <CardContent className="p-4 space-y-4">
                                    <div className="space-y-2">
                                        <Label>Cash on Delivery</Label>
                                        <p className="text-sm text-gray-600">
                                            Pay with cash when your order is delivered. Additional charges may apply.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </form>
                </Tabs>
            </div>
        </div>
    )
}