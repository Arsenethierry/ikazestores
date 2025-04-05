"use client";

import { Button, buttonVariants } from "@/components/ui/button";
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
import { PaymentMethod } from "./order-steps/payment-step";
import SpinningLoader from "@/components/spinning-loader";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PaymentMethodType } from "@/lib/constants";
import CustomFormField, { FormFieldType } from "@/components/custom-field";
import { Form } from "@/components/ui/form";
import { OrderSummaryStep } from "./order-steps/order-summary";
import { useAction } from "next-safe-action/hooks";
import { createOrder } from "../actions/order-actions";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useCartStore } from "@/features/cart/use-cart-store";
import { OrderFormSchema } from "@/lib/schemas/products-schems";

export const PlaceOrderPage = () => {
    const { items, totalPrice } = useCartStore()
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [currentStep, setCurrentStep] = useState(1);
    const { data: user, isLoading: userLoading } = useCurrentUser();

    useEffect(() => {
        if (user) {
            setCurrentStep(2)
        }
    }, [user])

    const defaultValues: Partial<z.infer<typeof OrderFormSchema>> = {
        deliveryAddress: {
            fullName: "",
            phoneNumber: "",
            street: "",
            city: "",
            zip: "",
            state: "",
            country: "RW",
            $id: null,
        },
        notes: "",
        preferredPaymentMethod: {
            type: PaymentMethodType.CASH_ON_DELIVERY,
        },
        orderDate: new Date(),
        isExpressDelivery: false,
    };

    const form = useForm<z.infer<typeof OrderFormSchema>>({
        resolver: zodResolver(OrderFormSchema),
        defaultValues,
        mode: "onChange",
    });

    const { execute, isPending: isSubmitting } = useAction(createOrder, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                toast.success(data.success)
                router.push("/my-orders");
            } else if (data?.error) {
                toast.error(data?.error)
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError)
        }
    })

    const addressFields = form.watch("deliveryAddress");
    const orderFields = form.watch("orderDate");
    const paymentMethods = form.watch("preferredPaymentMethod");

    const isStep2Valid = () => {
        const required = ["fullName", "phoneNumber", "street", "city", "zip", "state", "country"];
        return required.every(field => !!addressFields[field as keyof typeof addressFields]);
    }

    const isStep3Valid = () => {
        return !!orderFields
    }

    const isStep4Valid = () => {
        if (paymentMethods.type === PaymentMethodType.ONLINE_PAYMENT && !paymentMethods.onlineProvider) {
            return false;
        }
        if (paymentMethods.type === PaymentMethodType.CARD_PAYMENT && !paymentMethods.cardProvider) {
            return false;
        }
        return true;
    }

    const handleNextStep = () => {
        switch (currentStep) {
            case 2:
                if (isStep2Valid()) {
                    setCurrentStep(3)
                } else {
                    form.trigger("deliveryAddress")
                }
                break;
            case 3:
                if (isStep3Valid()) {
                    setCurrentStep(4)
                } else {
                    form.trigger("orderDate")
                }
                break;
            case 4:
                if (isStep4Valid()) {
                    handleSubmitOrder(form.getValues());
                } else {
                    form.trigger("preferredPaymentMethod");
                }
                break;
            default:
                setCurrentStep(prev => Math.min(prev + 1, 5));
        }
    }

    const handleStepChange = (step: number) => {
        if (step > currentStep && step !== currentStep + 1) {
            return;
        }
        setCurrentStep(step);
    }

    const selectedIds = searchParams.get("products")?.split(",") || [];
    const selectedItems = items.filter(item => selectedIds.includes(item.id));

    const handleSubmitOrder = async (data: z.infer<typeof OrderFormSchema>) => {
        const payload = { selectedItems, totalAmount: totalPrice, ...data }
        execute(payload)
    }


    const redirectUrl = `/sign-in?redirectUrl=${encodeURIComponent(`${pathname}?${searchParams.toString()}`)}`;

    return (
        <div className="main-container space-y-8 text-center p-4">
            <Stepper value={currentStep} onValueChange={handleStepChange} className="w-full max-w-4xl mx-auto p-5 border-b-2">
                <StepperItem step={1} className="relative flex-1 flex-col!">
                    <StepperTrigger className="flex-col gap-3 rounded" disabled={!!user}>
                        <StepperIndicator />
                        <div className="space-y-0.5 px-2">
                            <StepperTitle>Step 1</StepperTitle>
                            <StepperDescription className="max-sm:hidden">Login / Sign up</StepperDescription>
                        </div>
                    </StepperTrigger>
                    <StepperSeparator className="absolute inset-x-0 top-3 left-[calc(50%+0.75rem+0.125rem)] -order-1 m-0 -translate-y-1/2 group-data-[orientation=horizontal]/stepper:w-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=horizontal]/stepper:flex-none" />
                </StepperItem>

                <StepperItem step={2} className="relative flex-1 flex-col!">
                    <StepperTrigger className="flex-col gap-3 rounded" disabled={!user}>
                        <StepperIndicator />
                        <div className="space-y-0.5 px-2">
                            <StepperTitle>Step 2</StepperTitle>
                            <StepperDescription className="max-sm:hidden">Delivery Address</StepperDescription>
                        </div>
                    </StepperTrigger>
                    <StepperSeparator className="absolute inset-x-0 top-3 left-[calc(50%+0.75rem+0.125rem)] -order-1 m-0 -translate-y-1/2 group-data-[orientation=horizontal]/stepper:w-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=horizontal]/stepper:flex-none" />
                </StepperItem>

                <StepperItem step={3} className="relative flex-1 flex-col!">
                    <StepperTrigger className="flex-col gap-3 rounded" disabled={!user}>
                        <StepperIndicator />
                        <div className="space-y-0.5 px-2">
                            <StepperTitle>Step 3</StepperTitle>
                            <StepperDescription className="max-sm:hidden">Order Summary</StepperDescription>
                        </div>
                    </StepperTrigger>
                    <StepperSeparator className="absolute inset-x-0 top-3 left-[calc(50%+0.75rem+0.125rem)] -order-1 m-0 -translate-y-1/2 group-data-[orientation=horizontal]/stepper:w-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=horizontal]/stepper:flex-none" />
                </StepperItem>

                <StepperItem step={4} className="relative flex-1 flex-col!">
                    <StepperTrigger className="flex-col gap-3 rounded" disabled={!user}>
                        <StepperIndicator />
                        <div className="space-y-0.5 px-2">
                            <StepperTitle>Step 4</StepperTitle>
                            <StepperDescription className="max-sm:hidden">Payment Options</StepperDescription>
                        </div>
                    </StepperTrigger>
                    <StepperSeparator className="absolute inset-x-0 top-3 left-[calc(50%+0.75rem+0.125rem)] -order-1 m-0 -translate-y-1/2 group-data-[orientation=horizontal]/stepper:w-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=horizontal]/stepper:flex-none" />
                </StepperItem>

                <StepperItem step={5} className="relative flex-1 flex-col!">
                    <StepperTrigger className="flex-col gap-3 rounded" disabled={!user}>
                        <StepperIndicator />
                        <div className="space-y-0.5 px-2">
                            <StepperTitle>Step 5</StepperTitle>
                            <StepperDescription className="max-sm:hidden">Order Complete</StepperDescription>
                        </div>
                    </StepperTrigger>
                </StepperItem>
            </Stepper>

            <Form {...form}>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (currentStep === 5) {
                            form.handleSubmit(handleSubmitOrder)(e);
                        } else {
                            handleNextStep();
                        }
                    }}
                >
                    <div className="mt-8 p-6 rounded-lg max-w-xl mx-auto">
                        {currentStep === 1 && (
                            userLoading ?
                                <SpinningLoader /> :
                                <div className="text-center space-y-4">
                                    <h2 className="text-xl font-semibold">Sign In to Continue</h2>
                                    <p className="text-gray-600">Please log in to your account to place an order</p>
                                    <div className="flex justify-center mt-4">
                                        <Link href={redirectUrl} className={buttonVariants()}>
                                            Log In To Place Order
                                        </Link>
                                    </div>
                                </div>
                        )}
                        {currentStep === 2 && (
                            <div className="text-left">
                                <DeliveryAddress
                                    control={form.control}
                                    disabled={isSubmitting}
                                    setValue={form.setValue}
                                    currentUserId={user!.$id}
                                />
                            </div>
                        )}
                        {currentStep === 3 && (
                            <div className="space-y-4 text-start">
                                <h2 className="text-xl font-semibold">Order Details</h2>
                                <OrderSummaryStep
                                    address={form.getValues().deliveryAddress}
                                    cartItems={selectedItems}
                                />

                                <div className="space-y-4 mt-6">

                                    <CustomFormField
                                        control={form.control}
                                        name="notes"
                                        label="Order Notes"
                                        placeholder="Add any special instructions or notes about your order"
                                        fieldType={FormFieldType.TEXTAREA}
                                        disabled={isSubmitting}
                                    />

                                    <CustomFormField
                                        control={form.control}
                                        name="orderDate"
                                        label="Order Date"
                                        fieldType={FormFieldType.DATE_PICKER}
                                        dateFormat="MM/dd/yyyy h:mm aa"
                                        showTimeSelect
                                        disabled={isSubmitting}
                                    />

                                    <CustomFormField
                                        control={form.control}
                                        name="isExpressDelivery"
                                        label="Express Delivery (Additional fees may apply)"
                                        fieldType={FormFieldType.CHECKBOX}
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>
                        )}
                        {currentStep === 4 && (
                            <div className="text-left">
                                <h2 className="text-xl font-semibold mb-4">Payment Options</h2>
                                <PaymentMethod
                                    control={form.control}
                                    disabled={isSubmitting}
                                />
                            </div>
                        )}
                        {currentStep === 5 && (
                            <div className="text-center space-y-6">
                                <div className="flex items-center justify-center">
                                    <div className="rounded-full bg-green-100 p-3">
                                        <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                </div>
                                <h2 className="text-2xl font-semibold mb-2">Order Complete!</h2>
                                <p className="text-gray-600">Thank you for your order! Your confirmation number is:</p>
                                <p className="text-lg font-mono bg-gray-100 p-2 rounded inline-block">{Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
                                <div className="pt-4">
                                    <Link href="/my-orders" className={buttonVariants({ variant: 'outline' })}>
                                        View Your Orders
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                    {currentStep !== 5 && (
                        <div className="flex justify-between mt-6 max-w-xl mx-auto">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCurrentStep(prev => Math.max(prev - 1, 1))}
                                disabled={currentStep === 1 || isSubmitting}
                            >
                                Previous
                            </Button>

                            {currentStep === 1 && !user ? (
                                <Link href={redirectUrl} className={buttonVariants()}>
                                    Sign In to Continue
                                </Link>
                            ) : (
                                <Button
                                    type={currentStep === 5 ? "submit" : "button"}
                                    onClick={currentStep !== 5 ? handleNextStep : undefined}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <SpinningLoader />
                                            Processing...
                                        </>
                                    ) : currentStep === 4 ? (
                                        "Place Order"
                                    ) : (
                                        "Continue"
                                    )}
                                </Button>
                            )}
                        </div>
                    )}
                </form>
            </Form>
        </div>
    );
}