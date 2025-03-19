/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { MouseEventHandler, useState } from "react";
// import { useFormState } from "react-dom";

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
    savedAddresses: savedAddressesType[];
    onNext: MouseEventHandler<HTMLButtonElement>
}

// const initialState = {
//     message: "",
//     errors: {},
// };

export const DeliveryAddress = ({ savedAddresses = [], onNext }: Props) => {
    const [isNewAddress, setIsNewAddress] = useState(!savedAddresses.length);
    const [selectedAddress, setSelectedAddress] = useState(savedAddresses[0]?.id || "");

    // const saveDeliveryAddress = () => {

    // }

    // const [formState, formAction] = useFormState(saveDeliveryAddress, initialState);

    const handleSubmit = async () => {
        // const result = await formAction(formData);
        // if (!result.errors || Object.keys(result.errors).length === 0) {
        // }
        // onNext();
    };

    return (
        <div className="space-y-6">
            <CardHeader className="px-0">
                <CardTitle className="text-xl">Delivery Address</CardTitle>
                <CardDescription>
                    Select a delivery address or add a new one
                </CardDescription>
            </CardHeader>

            <CardContent className="px-0">
                {savedAddresses.length > 0 && (
                    <div className="mb-6">
                        <RadioGroup
                            value={isNewAddress ? "new" : selectedAddress}
                            onValueChange={(value) => {
                                if (value === "new") {
                                    setIsNewAddress(true);
                                } else {
                                    setIsNewAddress(false);
                                    setSelectedAddress(value);
                                }
                            }}
                            className="space-y-4"
                        >
                            {savedAddresses.map((address) => (
                                <div key={address.id} className="flex items-start space-x-2">
                                    <RadioGroupItem value={address.id} id={address.id} />
                                    <div className="grid gap-1">
                                        <Label htmlFor={address.id} className="font-medium">
                                            {address.name}
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

                {(isNewAddress || !savedAddresses.length) && (
                    <form action={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="John Doe"
                                    // className={formState.errors?.name ? "border-red-500" : ""}
                                />
                                {/* {formState.errors?.name && (
                                    <p className="text-sm text-red-500">{formState.errors.name}</p>
                                )} */}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    placeholder="1234567890"
                                    // className={formState.errors?.phone ? "border-red-500" : ""}
                                />
                                {/* {formState.errors?.phone && (
                                    <p className="text-sm text-red-500">{formState.errors.phone}</p>
                                )} */}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="street">Street Address</Label>
                            <Textarea
                                id="street"
                                name="street"
                                placeholder="123 Main St, Apt 4B"
                                // className={formState.errors?.street ? "border-red-500" : ""}
                            />
                            {/* {formState.errors?.street && (
                                <p className="text-sm text-red-500">{formState.errors.street}</p>
                            )} */}
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    name="city"
                                    placeholder="New York"
                                    // className={formState.errors?.city ? "border-red-500" : ""}
                                />
                                {/* {formState.errors?.city && (
                                    <p className="text-sm text-red-500">{formState.errors.city}</p>
                                )} */}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="state">State</Label>
                            <Input
                                id="state"
                                name="state"
                                placeholder="NY"
                                // className={formState.errors?.state ? "border-red-500" : ""}
                            />
                            {/* {formState.errors?.state && (
                                <p className="text-sm text-red-500">{formState.errors.state}</p>
                            )} */}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="zip">Zip Code</Label>
                            <Input
                                id="zip"
                                name="zip"
                                placeholder="10001"
                                // className={formState.errors?.zip ? "border-red-500" : ""}
                            />
                            {/* {formState.errors?.zip && (
                                <p className="text-sm text-red-500">{formState.errors.zip}</p>
                            )} */}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="addressType">Address Type</Label>
                            <RadioGroup defaultValue="home" name="addressType" className="flex space-x-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="home" id="home" />
                                    <Label htmlFor="home">Home</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="work" id="work" />
                                    <Label htmlFor="work">Work</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="defaultAddress" className="flex items-center space-x-2">
                                <Input type="checkbox" id="defaultAddress" name="defaultAddress" className="w-4 h-4" />
                                <span>Make this my default address</span>
                            </Label>
                        </div>

                        {/* {formState.message && (
                            <p className="text-sm text-red-500">{formState.message}</p>
                        )} */}

                        <Button type="submit" className="w-full">Save Address</Button>
                    </form>
                )}

                {!isNewAddress && savedAddresses.length > 0 && (
                    <Button
                    onClick={onNext}
                    className="w-full">
                        Deliver to this Address
                    </Button>
                )}
            </CardContent>
        </div>
    )
}