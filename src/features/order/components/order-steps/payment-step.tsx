"use client";

import CustomFormField, { FormFieldType } from "@/components/custom-field";
import { SelectItem } from "@/components/ui/select";
import { CardProvider, OnlinePaymentProvider, PaymentMethodType } from "@/lib/constants";
import { OrderFormSchema } from "@/lib/schemas/products-schems";
import { Control, useWatch } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Smartphone, Banknote } from "lucide-react";

interface PaymentMethodProps {
    control: Control<z.infer<typeof OrderFormSchema>>;
    disabled?: boolean;
}

export const PaymentMethod: React.FC<PaymentMethodProps> = ({ control, disabled = false }) => {
    const paymentMethod = useWatch({
        control,
        name: "preferredPaymentMethod.type",
    });

    const renderPaymentMethodIcon = (method: PaymentMethodType) => {
        switch (method) {
            case PaymentMethodType.CASH_ON_DELIVERY:
                return <Banknote className="h-5 w-5 text-green-600" />;
            case PaymentMethodType.ONLINE_PAYMENT:
                return <Smartphone className="h-5 w-5 text-blue-600" />;
            case PaymentMethodType.CARD_PAYMENT:
                return <CreditCard className="h-5 w-5 text-purple-600" />;
            default:
                return <CreditCard className="h-5 w-5 text-gray-600" />;
        }
    };

    const getPaymentMethodDescription = (method: PaymentMethodType) => {
        switch (method) {
            case PaymentMethodType.CASH_ON_DELIVERY:
                return "Pay with cash when your order is delivered to your doorstep";
            case PaymentMethodType.ONLINE_PAYMENT:
                return "Pay using mobile money services like MTN or Airtel Money";
            case PaymentMethodType.CARD_PAYMENT:
                return "Pay securely using your credit or debit card";
            default:
                return "";
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {renderPaymentMethodIcon(paymentMethod)}
                        Payment Method
                    </CardTitle>
                    <CardDescription>
                        Choose how you'd like to pay for your order
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <CustomFormField
                        control={control}
                        name="preferredPaymentMethod.type"
                        label="Select Payment Method"
                        placeholder="Select a payment method"
                        fieldType={FormFieldType.SELECT}
                        disabled={disabled}
                    >
                        <SelectItem value={PaymentMethodType.CASH_ON_DELIVERY}>
                            <div className="flex items-center gap-2">
                                <Banknote className="h-4 w-4 text-green-600" />
                                Cash on Delivery
                            </div>
                        </SelectItem>
                        <SelectItem value={PaymentMethodType.ONLINE_PAYMENT}>
                            <div className="flex items-center gap-2">
                                <Smartphone className="h-4 w-4 text-blue-600" />
                                Mobile Money
                            </div>
                        </SelectItem>
                        <SelectItem value={PaymentMethodType.CARD_PAYMENT}>
                            <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-purple-600" />
                                Credit/Debit Card
                            </div>
                        </SelectItem>
                    </CustomFormField>

                    {/* Payment method description */}
                    {paymentMethod && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800">
                                {getPaymentMethodDescription(paymentMethod)}
                            </p>
                        </div>
                    )}

                    {/* Mobile Money Provider Selection */}
                    {paymentMethod === PaymentMethodType.ONLINE_PAYMENT && (
                        <div className="space-y-3">
                            <CustomFormField
                                control={control}
                                name="preferredPaymentMethod.onlineProvider"
                                label="Select Mobile Money Provider"
                                placeholder="Choose your mobile money provider"
                                fieldType={FormFieldType.SELECT}
                                disabled={disabled}
                            >
                                <SelectItem value={OnlinePaymentProvider.MTN}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                                        MTN Mobile Money
                                    </div>
                                </SelectItem>
                                <SelectItem value={OnlinePaymentProvider.AIRTEL}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                                        Airtel Money
                                    </div>
                                </SelectItem>
                            </CustomFormField>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <p className="text-sm text-yellow-800">
                                    You'll receive payment instructions via SMS after placing your order.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Card Provider Selection */}
                    {paymentMethod === PaymentMethodType.CARD_PAYMENT && (
                        <div className="space-y-3">
                            <CustomFormField
                                control={control}
                                name="preferredPaymentMethod.cardProvider"
                                label="Select Card Provider"
                                placeholder="Choose your preferred card payment processor"
                                fieldType={FormFieldType.SELECT}
                                disabled={disabled}
                            >
                                <SelectItem value={CardProvider.STRIPE}>
                                    <div className="flex items-center justify-between w-full">
                                        <span>Stripe</span>
                                        <Badge variant="secondary" className="text-xs">Recommended</Badge>
                                    </div>
                                </SelectItem>
                                <SelectItem value={CardProvider.PAYPAL}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-blue-600 rounded"></div>
                                        PayPal
                                    </div>
                                </SelectItem>
                                <SelectItem value={CardProvider.RAZORPAY}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                                        Razorpay
                                    </div>
                                </SelectItem>
                                <SelectItem value={CardProvider.VISA}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-blue-700 rounded"></div>
                                        Visa
                                    </div>
                                </SelectItem>
                                <SelectItem value={CardProvider.MASTERCARD}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-red-600 rounded"></div>
                                        Mastercard
                                    </div>
                                </SelectItem>
                            </CustomFormField>

                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <p className="text-sm text-green-800">
                                    Your card information will be securely processed. We do not store your payment details.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Cash on Delivery Notice */}
                    {paymentMethod === PaymentMethodType.CASH_ON_DELIVERY && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <div className="space-y-2">
                                <p className="text-sm text-gray-800 font-medium">
                                    Cash on Delivery Instructions:
                                </p>
                                <ul className="text-sm text-gray-700 space-y-1 ml-4">
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-600 mt-1">•</span>
                                        Have the exact amount ready when the delivery arrives
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-600 mt-1">•</span>
                                        Inspect your order before making payment
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-600 mt-1">•</span>
                                        Additional delivery charges may apply for COD orders
                                    </li>
                                </ul>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};