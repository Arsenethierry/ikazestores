"use client";

import CustomFormField, { FormFieldType } from "@/components/custom-field";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SelectItem } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { Control, UseFormSetValue } from "react-hook-form";
import { z } from "zod";
import { OrderFormSchema } from "@/lib/schemas/products-schems";

type Props = {
    control: Control<z.infer<typeof OrderFormSchema>>;
    disabled?: boolean;
    setValue: UseFormSetValue<z.infer<typeof OrderFormSchema>>;
    currentUserId: string;
}

const countries = [
    { code: "US", name: "United States" },
    { code: "CA", name: "Canada" },
    { code: "UK", name: "United Kingdom" },
    { code: "AU", name: "Australia" },
    { code: "DE", name: "Germany" },
    { code: "FR", name: "France" },
    { code: "JP", name: "Japan" },
    { code: "IN", name: "India" },
    { code: "CN", name: "China" },
    { code: "BR", name: "Brazil" },
];

export const DeliveryAddress = ({ control, disabled = false, setValue, currentUserId }: Props) => {
    // const { data: initialAddress, isLoading } = useGetDeliverAddress(currentUserId);

    const initialAddress = {
        total: 0,
        documents: []
    }
    const isLoading = false
    const [isNewAddress, setIsNewAddress] = useState(true);
    const [selectedAddress, setSelectedAddress] = useState("");

    useEffect(() => {
        if (isLoading) return;

        const hasAddresses = initialAddress && initialAddress.total > 0;

        if (hasAddresses) {
            const firstAddress = initialAddress.documents[0];
            setIsNewAddress(false);
            setSelectedAddress(firstAddress.$id);

            setValue("deliveryAddress.fullName", firstAddress.fullName || "");
            setValue("deliveryAddress.street", firstAddress.street || "");
            setValue("deliveryAddress.phoneNumber", firstAddress.phoneNumber || "");
            setValue("deliveryAddress.city", firstAddress.city || "");
            setValue("deliveryAddress.zip", firstAddress.zip || "");
            setValue("deliveryAddress.state", firstAddress.state || "");
            setValue("deliveryAddress.country", firstAddress.country || "RW");
            setValue("deliveryAddress.$id", firstAddress.$id);
        } else {
            setIsNewAddress(true);
            setValue("deliveryAddress.$id", null);
        }
    }, [initialAddress, isLoading, setValue]);

    const handleAddressChange = (value: string) => {
        if (value === "new") {
            setIsNewAddress(true);
            setValue("deliveryAddress.$id", null);
            
            // Clear form fields for new address
            setValue("deliveryAddress.fullName", "");
            setValue("deliveryAddress.street", "");
            setValue("deliveryAddress.phoneNumber", "");
            setValue("deliveryAddress.city", "");
            setValue("deliveryAddress.zip", "");
            setValue("deliveryAddress.state", "");
            setValue("deliveryAddress.country", "RW");
        } else {
            setIsNewAddress(false);
            setSelectedAddress(value);

            const addressToUse = initialAddress?.documents.find(addr => addr.$id === value);
            if (addressToUse) {
                // Update form with selected address
                setValue("deliveryAddress.fullName", addressToUse.fullName || "");
                setValue("deliveryAddress.street", addressToUse.street || "");
                setValue("deliveryAddress.phoneNumber", addressToUse.phoneNumber || "");
                setValue("deliveryAddress.city", addressToUse.city || "");
                setValue("deliveryAddress.zip", addressToUse.zip || "");
                setValue("deliveryAddress.state", addressToUse.state || "");
                setValue("deliveryAddress.country", addressToUse.country || "RW");
                setValue("deliveryAddress.$id", addressToUse.$id);
            }
        }
    };

    const hasAddresses = initialAddress && initialAddress.total > 0;

    return (
        <div className="space-y-6">
            <CardHeader className="px-0">
                <CardTitle className="text-xl">Delivery Address</CardTitle>
                <CardDescription>
                    Select a delivery address or add a new one
                </CardDescription>
            </CardHeader>

            <CardContent className="px-0">
                {hasAddresses && (
                    <div className="mb-6">
                        <RadioGroup
                            value={isNewAddress ? "new" : selectedAddress}
                            onValueChange={handleAddressChange}
                            className="space-y-4"
                        >
                            {initialAddress.documents.map((address) => (
                                <div key={address.$id} className="flex items-start space-x-2">
                                    <RadioGroupItem value={address.$id} id={address.$id} />
                                    <div className="grid gap-1">
                                        <Label htmlFor={address.$id} className="font-medium">
                                            {address.fullName}
                                        </Label>
                                        <p className="text-sm text-gray-500">
                                            {address.street}, {address.city}, {address.state}, {address.zip}
                                            <br />
                                            {address.phone}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            <div className="flex items-start space-x-2">
                                <RadioGroupItem value="new" id="new-address" />
                                <Label htmlFor="new-address" className="font-medium">
                                    Add a new address
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>
                )}

                {(isNewAddress || !hasAddresses) && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <CustomFormField
                                control={control}
                                name="deliveryAddress.fullName"
                                label="Full Name"
                                placeholder="Enter your full name"
                                fieldType={FormFieldType.INPUT}
                                iconAlt="user"
                                disabled={disabled}
                            />

                            <CustomFormField
                                control={control}
                                name="deliveryAddress.phoneNumber"
                                label="Phone Number"
                                placeholder="Enter your phone number"
                                fieldType={FormFieldType.PHONE_INPUT}
                                disabled={disabled}
                            />
                        </div>

                        <CustomFormField
                            control={control}
                            name="deliveryAddress.street"
                            label="Street Address"
                            placeholder="Enter your street address"
                            fieldType={FormFieldType.INPUT}
                            disabled={disabled}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <CustomFormField
                                control={control}
                                name="deliveryAddress.city"
                                label="City"
                                placeholder="Enter your city"
                                fieldType={FormFieldType.INPUT}
                                disabled={disabled}
                            />

                            <CustomFormField
                                control={control}
                                name="deliveryAddress.state"
                                label="State/Province"
                                placeholder="Enter your state"
                                fieldType={FormFieldType.INPUT}
                                disabled={disabled}
                            />

                            <CustomFormField
                                control={control}
                                name="deliveryAddress.zip"
                                label="ZIP/Postal Code"
                                placeholder="Enter your ZIP code"
                                fieldType={FormFieldType.INPUT}
                                disabled={disabled}
                            />
                        </div>

                        <CustomFormField
                            control={control}
                            name="deliveryAddress.country"
                            label="Country"
                            placeholder="Select your country"
                            fieldType={FormFieldType.SELECT}
                            disabled={disabled}
                        >
                            {countries.map(country => (
                                <SelectItem key={country.code} value={country.code}>
                                    {country.name}
                                </SelectItem>
                            ))}
                        </CustomFormField>
                    </div>
                )}
            </CardContent>
        </div>
    )
}