"use client";

import CustomFormField, { FormFieldType } from "@/components/custom-field";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SelectItem } from "@/components/ui/select";
import { useEffect, useMemo, useState } from "react";
import { Control, UseFormSetValue } from "react-hook-form";
import { z } from "zod";
import { OrderFormSchema } from "@/lib/schemas/products-schems";

type Props = {
    control: Control<z.infer<typeof OrderFormSchema>>;
    disabled?: boolean;
    setValue: UseFormSetValue<z.infer<typeof OrderFormSchema>>;
    currentUserId: string;
}

// Updated countries list with more comprehensive options
const countries = [
    { code: "RW", name: "Rwanda" },
    { code: "US", name: "United States" },
    { code: "CA", name: "Canada" },
    { code: "GB", name: "United Kingdom" },
    { code: "AU", name: "Australia" },
    { code: "DE", name: "Germany" },
    { code: "FR", name: "France" },
    { code: "JP", name: "Japan" },
    { code: "IN", name: "India" },
    { code: "CN", name: "China" },
    { code: "BR", name: "Brazil" },
    { code: "KE", name: "Kenya" },
    { code: "UG", name: "Uganda" },
    { code: "TZ", name: "Tanzania" },
    { code: "ZA", name: "South Africa" },
    { code: "NG", name: "Nigeria" },
    { code: "GH", name: "Ghana" },
];

// Interface for saved addresses (you may need to adjust based on your API)
interface SavedAddress {
    $id: string;
    fullName: string;
    street: string;
    phoneNumber: string;
    city: string;
    zip: string;
    state: string;
    country: string;
    phone?: string; // Legacy field compatibility
}

interface AddressResponse {
    total: number;
    documents: SavedAddress[];
}

export const DeliveryAddress = ({ control, disabled = false, setValue, currentUserId }: Props) => {
    // TODO: Replace with actual hook when available
    // const { data: initialAddress, isLoading } = useGetDeliverAddress(currentUserId);
    
    // Mock data - replace with actual API call
    const initialAddress = useMemo<AddressResponse>(() => ({
  total: 0,
  documents: []
}), []);
    const isLoading = false;

    const [isNewAddress, setIsNewAddress] = useState(true);
    const [selectedAddress, setSelectedAddress] = useState("");

    // Fix infinite loop by removing setValue from dependencies and using useCallback
    useEffect(() => {
        if (isLoading) return;

        const hasAddresses = initialAddress && initialAddress.total > 0;

        if (hasAddresses) {
            const firstAddress = initialAddress.documents[0];
            setIsNewAddress(false);
            setSelectedAddress(firstAddress.$id);

            // Set form values with proper validation
            setValue("deliveryAddress.fullName", firstAddress.fullName || "");
            setValue("deliveryAddress.street", firstAddress.street || "");
            setValue("deliveryAddress.phoneNumber", firstAddress.phoneNumber || "");
            setValue("deliveryAddress.city", firstAddress.city || "");
            setValue("deliveryAddress.zip", firstAddress.zip || "");
            setValue("deliveryAddress.state", firstAddress.state || "");
            setValue("deliveryAddress.country", firstAddress.country || "RW");
            setValue("deliveryAddress.$id", firstAddress.$id);
        } else {
            // Set defaults for new address
            setIsNewAddress(true);
            setValue("deliveryAddress.$id", null);
            setValue("deliveryAddress.country", "RW"); // Default to Rwanda
        }
}, [initialAddress, isLoading, selectedAddress, isNewAddress, setValue]);

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
                    {hasAddresses 
                        ? "Select a delivery address or add a new one"
                        : "Please enter your delivery address details"
                    }
                </CardDescription>
            </CardHeader>

            <CardContent className="px-0">
                {hasAddresses && (
                    <div className="mb-6">
                        <Label className="text-sm font-medium mb-3 block">
                            Saved Addresses
                        </Label>
                        <RadioGroup
                            value={isNewAddress ? "new" : selectedAddress}
                            onValueChange={handleAddressChange}
                            className="space-y-4"
                        >
                            {initialAddress.documents.map((address) => (
                                <div key={address.$id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                                    <RadioGroupItem 
                                        value={address.$id} 
                                        id={address.$id}
                                        className="mt-1" 
                                    />
                                    <div className="grid gap-1 flex-1">
                                        <Label htmlFor={address.$id} className="font-medium cursor-pointer">
                                            {address.fullName}
                                        </Label>
                                        <p className="text-sm text-gray-600">
                                            {address.street}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {address.city}, {address.state} {address.zip}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {address.phoneNumber || address.phone}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                                <RadioGroupItem 
                                    value="new" 
                                    id="new-address"
                                    className="mt-1" 
                                />
                                <Label htmlFor="new-address" className="font-medium cursor-pointer">
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
                                label="Full Name *"
                                placeholder="Enter your full name"
                                fieldType={FormFieldType.INPUT}
                                iconAlt="user"
                                disabled={disabled}
                            />

                            <CustomFormField
                                control={control}
                                name="deliveryAddress.phoneNumber"
                                label="Phone Number *"
                                placeholder="+250 xxx xxx xxx"
                                fieldType={FormFieldType.PHONE_INPUT}
                                disabled={disabled}
                            />
                        </div>

                        <CustomFormField
                            control={control}
                            name="deliveryAddress.street"
                            label="Street Address *"
                            placeholder="Enter your street address"
                            fieldType={FormFieldType.INPUT}
                            disabled={disabled}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <CustomFormField
                                control={control}
                                name="deliveryAddress.city"
                                label="City *"
                                placeholder="Enter your city"
                                fieldType={FormFieldType.INPUT}
                                disabled={disabled}
                            />

                            <CustomFormField
                                control={control}
                                name="deliveryAddress.state"
                                label="State/Province *"
                                placeholder="Enter your state/province"
                                fieldType={FormFieldType.INPUT}
                                disabled={disabled}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <CustomFormField
                                control={control}
                                name="deliveryAddress.zip"
                                label="ZIP/Postal Code *"
                                placeholder="Enter your ZIP code"
                                fieldType={FormFieldType.INPUT}
                                disabled={disabled}
                            />

                            <CustomFormField
                                control={control}
                                name="deliveryAddress.country"
                                label="Country *"
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

                        <CustomFormField
                            control={control}
                            name="deliveryAddress.additionalInfo"
                            label="Additional Information (Optional)"
                            placeholder="Apartment, suite, floor, landmarks, etc."
                            fieldType={FormFieldType.TEXTAREA}
                            disabled={disabled}
                        />

                        {!hasAddresses && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-start space-x-3">
                                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                                        <span className="text-xs text-blue-600 font-medium">i</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-blue-800">
                                            This address will be saved to your account for future orders.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Delivery Instructions */}
                {!isNewAddress && !hasAddresses && (
                    <div className="mt-6 pt-6 border-t">
                        <CustomFormField
                            control={control}
                            name="notes"
                            label="Delivery Instructions (Optional)"
                            placeholder="Special delivery instructions, preferred time, etc."
                            fieldType={FormFieldType.TEXTAREA}
                            disabled={disabled}
                        />
                    </div>
                )}
            </CardContent>
        </div>
    );
};