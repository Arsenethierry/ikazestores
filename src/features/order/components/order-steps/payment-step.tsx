"use client";

import CustomFormField, { FormFieldType } from "@/components/custom-field";
import { SelectItem } from "@/components/ui/select";
import { CardProvider, OnlinePaymentProvider, PaymentMethodType } from "@/lib/constants";
import { OrderFormSchema } from "@/lib/schemas";
import { Control, useWatch } from "react-hook-form";
import { z } from "zod";

interface PaymentMethodProps {
    control: Control<z.infer<typeof OrderFormSchema>>;
    disabled?: boolean;
}

export const PaymentMethod: React.FC<PaymentMethodProps> = ({ control, disabled }) => {
    const paymentMethod = useWatch({
        control,
        name: "preferredPaymentMethod.type",
    });

    return (
        <div className="space-y-4">
            <CustomFormField
                control={control}
                name="preferredPaymentMethod.type"
                label="Select Payment Method"
                placeholder="Select a payment method"
                fieldType={FormFieldType.SELECT}
                disabled={disabled}
            >
                <SelectItem value={PaymentMethodType.CASH_ON_DELIVERY}>Cash on Delivery</SelectItem>
                <SelectItem value={PaymentMethodType.ONLINE_PAYMENT}>Online Payment</SelectItem>
                <SelectItem value={PaymentMethodType.CARD_PAYMENT}>Credit/Debit Card</SelectItem>
            </CustomFormField>

            {paymentMethod === PaymentMethodType.ONLINE_PAYMENT && (
                <CustomFormField
                    control={control}
                    name="preferredPaymentMethod.onlineProvider"
                    label="Select Mobile Money Provider"
                    placeholder="Select a provider"
                    fieldType={FormFieldType.SELECT}
                    disabled={disabled}
                >
                    <SelectItem value={OnlinePaymentProvider.MTN}>MTN Mobile Money</SelectItem>
                    <SelectItem value={OnlinePaymentProvider.AIRTEL}>Airtel Money</SelectItem>
                </CustomFormField>
            )}

            {paymentMethod === PaymentMethodType.CARD_PAYMENT && (
                <CustomFormField
                    control={control}
                    name="preferredPaymentMethod.cardProvider"
                    label="Select Card Provider"
                    placeholder="Select a card provider"
                    fieldType={FormFieldType.SELECT}
                    disabled={disabled}
                >
                    <SelectItem value={CardProvider.STRIPE}>Stripe</SelectItem>
                    <SelectItem value={CardProvider.PAYPAL}>PayPal</SelectItem>
                    <SelectItem value={CardProvider.RAZORPAY}>Razorpay</SelectItem>
                    <SelectItem value={CardProvider.VISA}>Visa</SelectItem>
                    <SelectItem value={CardProvider.MASTERCARD}>Mastercard</SelectItem>
                </CustomFormField>
            )}
        </div>
    )
}