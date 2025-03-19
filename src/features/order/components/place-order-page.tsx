"use client";

import { buttonVariants } from "@/components/ui/button";
import {
    Stepper,
    StepperDescription,
    StepperIndicator,
    StepperItem,
    StepperSeparator,
    StepperTitle,
    StepperTrigger,
} from "@/components/ui/stepper";
import { useCurrentUser } from "@/features/auth/queries/use-get-current-user";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DeliveryAddress } from "./order-steps/delivery-address";
import { OrderSummaryStep } from "./order-steps/order-summary";
import { Cart } from "@/lib/types";
import { PaymentOptionsStep } from "./order-steps/payment-step";

export const PlaceOrderPage = ({ cartItems }: { cartItems: Cart }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const { data: user } = useCurrentUser();

    useEffect(() => {
        if (user) {
            setCurrentStep(2)
        }
    }, [user])

    const handleStepChange = (step: number) => {
        setCurrentStep(step);
    };

    const savedAddresses = [
        {
            id: "demde",
            name: "kigali",
            street: "convenction",
            phone: "123",
            city: "kitali city",
            state: "kitali state",
            zip: "0000",
        }
    ]

    return (
        <div className="main-container space-y-8 text-center p-4">
            <Stepper value={currentStep} onValueChange={handleStepChange} className="w-full max-w-4xl mx-auto p-5 border-b-2">
                <StepperItem step={1} className="relative flex-1 flex-col!">
                    <StepperTrigger className="flex-col gap-3 rounded">
                        <StepperIndicator />
                        <div className="space-y-0.5 px-2">
                            <StepperTitle>Step 1</StepperTitle>
                            <StepperDescription className="max-sm:hidden">Login / Sign up</StepperDescription>
                        </div>
                    </StepperTrigger>
                    <StepperSeparator className="absolute inset-x-0 top-3 left-[calc(50%+0.75rem+0.125rem)] -order-1 m-0 -translate-y-1/2 group-data-[orientation=horizontal]/stepper:w-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=horizontal]/stepper:flex-none" />
                </StepperItem>

                <StepperItem step={2} className="relative flex-1 flex-col!">
                    <StepperTrigger className="flex-col gap-3 rounded">
                        <StepperIndicator />
                        <div className="space-y-0.5 px-2">
                            <StepperTitle>Step 2</StepperTitle>
                            <StepperDescription className="max-sm:hidden">Delivery Address</StepperDescription>
                        </div>
                    </StepperTrigger>
                    <StepperSeparator className="absolute inset-x-0 top-3 left-[calc(50%+0.75rem+0.125rem)] -order-1 m-0 -translate-y-1/2 group-data-[orientation=horizontal]/stepper:w-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=horizontal]/stepper:flex-none" />
                </StepperItem>

                <StepperItem step={3} className="relative flex-1 flex-col!">
                    <StepperTrigger className="flex-col gap-3 rounded">
                        <StepperIndicator />
                        <div className="space-y-0.5 px-2">
                            <StepperTitle>Step 3</StepperTitle>
                            <StepperDescription className="max-sm:hidden">Order Summary</StepperDescription>
                        </div>
                    </StepperTrigger>
                    <StepperSeparator className="absolute inset-x-0 top-3 left-[calc(50%+0.75rem+0.125rem)] -order-1 m-0 -translate-y-1/2 group-data-[orientation=horizontal]/stepper:w-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=horizontal]/stepper:flex-none" />
                </StepperItem>

                <StepperItem step={4} className="relative flex-1 flex-col!">
                    <StepperTrigger className="flex-col gap-3 rounded">
                        <StepperIndicator />
                        <div className="space-y-0.5 px-2">
                            <StepperTitle>Step 4</StepperTitle>
                            <StepperDescription className="max-sm:hidden">Payment Options</StepperDescription>
                        </div>
                    </StepperTrigger>
                    <StepperSeparator className="absolute inset-x-0 top-3 left-[calc(50%+0.75rem+0.125rem)] -order-1 m-0 -translate-y-1/2 group-data-[orientation=horizontal]/stepper:w-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=horizontal]/stepper:flex-none" />
                </StepperItem>

                <StepperItem step={5} className="relative flex-1 flex-col!">
                    <StepperTrigger className="flex-col gap-3 rounded">
                        <StepperIndicator />
                        <div className="space-y-0.5 px-2">
                            <StepperTitle>Step 5</StepperTitle>
                            <StepperDescription className="max-sm:hidden">Order Complete</StepperDescription>
                        </div>
                    </StepperTrigger>
                </StepperItem>
            </Stepper>

            <div className="mt-8 p-6 rounded-lg max-w-xl mx-auto">
                {currentStep === 1 && (
                    <div className="text-left">
                        <Link href={'/sign-in?redirectUrl=/place-order'} className={buttonVariants({ variant: 'outline' })}>Log In To Place Order</Link>
                    </div>
                )}
                {currentStep === 2 && (
                    <div className="text-left">
                        <h2 className="text-xl font-semibold mb-4">Delivery Address</h2>
                        <DeliveryAddress savedAddresses={savedAddresses} onNext={() => { }} />
                    </div>
                )}
                {currentStep === 3 && (
                    <div className="text-left">
                        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                        <OrderSummaryStep onNext={() => {}} address={savedAddresses[0]} cartItems={cartItems.items} />
                    </div>
                )}
                {currentStep === 4 && (
                    <div className="text-left">
                        <h2 className="text-xl font-semibold mb-4">Payment Options</h2>
                        <PaymentOptionsStep />
                    </div>
                )}
                {currentStep === 5 && (
                    <div className="text-center">
                        <h2 className="text-xl font-semibold mb-4">Order Complete!</h2>
                        <p className="text-green-600">Thank you for your order!</p>
                        {/* Order confirmation details would go here */}
                    </div>
                )}
            </div>

            <div className="flex justify-between mt-6 max-w-xl mx-auto">
                <button
                    className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                    onClick={() => setCurrentStep(prev => Math.max(prev - 1, 1))}
                    disabled={currentStep === 1}
                >
                    Previous
                </button>
                <button
                    className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                    onClick={() => setCurrentStep(prev => Math.min(prev + 1, 5))}
                    disabled={currentStep === 5 || !user}
                >
                    {currentStep === 4 ? "Place Order" : "Continue"}
                </button>
            </div>
        </div>
    );
}