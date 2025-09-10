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
import { useEffect, useMemo, useState } from "react";
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
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useCartStore } from "@/features/cart/use-cart-store";
import { OrderFormSchema, OrderSchema } from "@/lib/schemas/products-schems";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Truck, Package, CreditCard, CheckCircle, AlertTriangle, Info, Clock, DollarSign } from "lucide-react";
import { convertCurrency } from "@/hooks/use-currency";
import { useAction } from "next-safe-action/hooks";
import { createOrderAction } from "@/lib/actions/product-order-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CurrencyBreakdown {
    currency: string;
    items: Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
        subtotal: number;
    }>;
    originalSubtotal: number;
    convertedSubtotal: number;
    itemCount: number;
}

interface OrderCalculations {
    currencyBreakdowns: CurrencyBreakdown[];
    customerSubtotal: number;
    customerShippingCost: number;
    customerTaxAmount: number;
    customerTotalAmount: number;
    exchangeRateSnapshot: Record<string, number>;
    exchangeRateTimestamp: string;
    isLoading: boolean;
}

export const PlaceOrderPage = () => {
    const { items, totalPrice, clearCart } = useCartStore();
    const { currentCurrency, exchangeRates, exchangeRatesLoading } = useCurrency();
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [currentStep, setCurrentStep] = useState(1);
    const [orderResult, setOrderResult] = useState<any>(null);
    // const [processedCartItems, setProcessedCartItems] = useState<any[]>([]);
    // const [orderCalculations, setOrderCalculations] = useState<any>(null);

    const { data: user, isLoading: userLoading, refetch: refetchUser, isRefetching } = useCurrentUser();

    const {
        execute: executeCreateOrder,
        isExecuting: isCreatingOrder,
        result: createOrderResult,
        reset: resetOrderAction
    } = useAction(createOrderAction, {
        onSuccess: (data) => {
            if (data?.data && data?.data) {
                setOrderResult(data.data);
                setCurrentStep(5);
                clearCart();

                toast.success("Order placed successfully!");

                // Auto-redirect to orders page after showing success
                const timer = setTimeout(() => {
                    router.push("/my-orders");
                }, 8000);

                return () => clearTimeout(timer);
            }
        },
        onError: (error) => {
            console.error("Create order error:", error);
            toast.error(error.serverError || "Failed to place order. Please try again.");
        }
    });

    useEffect(() => {
        if (user) {
            setCurrentStep(2);
        } else {
            refetchUser()
        }
    }, [user, searchParams, router]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentStep]);

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
        customerCurrency: currentCurrency,
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

    const addressFields = form.watch("deliveryAddress");
    const orderFields = form.watch("orderDate");
    const paymentMethods = form.watch("preferredPaymentMethod");
    const isExpressDelivery = form.watch("isExpressDelivery");

    // Get selected items from URL parameters
    const selectedIds = searchParams.get("products")?.split(",") || [];
    const selectedItems = items.filter(item => selectedIds.includes(item.id));

    // Comprehensive order calculations with multi-currency support
    const orderCalculations: OrderCalculations = useMemo(() => {
        if (exchangeRatesLoading || !exchangeRates || selectedItems.length === 0) {
            return {
                currencyBreakdowns: [],
                customerSubtotal: 0,
                customerShippingCost: 0,
                customerTaxAmount: 0,
                customerTotalAmount: 0,
                exchangeRateSnapshot: {},
                exchangeRateTimestamp: new Date().toISOString(),
                isLoading: true
            };
        }

        // Group items by currency
        const itemsByCurrency = selectedItems.reduce((acc, item) => {
            const currency = item.productCurrency || 'USD';
            if (!acc[currency]) {
                acc[currency] = [];
            }
            acc[currency].push(item);
            return acc;
        }, {} as Record<string, typeof selectedItems>);

        // Calculate breakdown for each currency
        const currencyBreakdowns: CurrencyBreakdown[] = Object.entries(itemsByCurrency).map(([currency, currencyItems]) => {
            const originalSubtotal = currencyItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const convertedSubtotal = convertCurrency(originalSubtotal, currency, currentCurrency, exchangeRates);
            const itemCount = currencyItems.reduce((sum, item) => sum + item.quantity, 0);

            return {
                currency,
                items: currencyItems.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    subtotal: item.price * item.quantity
                })),
                originalSubtotal,
                convertedSubtotal,
                itemCount
            };
        });

        // Calculate total amounts in customer currency
        const customerSubtotal = currencyBreakdowns.reduce((sum, breakdown) => sum + breakdown.convertedSubtotal, 0);
        const customerShippingCost = isExpressDelivery ? 10 : 0;
        const taxRate = 0; // Can be made configurable based on location
        const customerTaxAmount = (customerSubtotal * taxRate) / 100;
        const customerTotalAmount = customerSubtotal + customerShippingCost + customerTaxAmount;

        return {
            currencyBreakdowns,
            customerSubtotal,
            customerShippingCost,
            customerTaxAmount,
            customerTotalAmount,
            exchangeRateSnapshot: exchangeRates,
            exchangeRateTimestamp: new Date().toISOString(),
            isLoading: false
        };
    }, [selectedItems, currentCurrency, exchangeRates, exchangeRatesLoading, isExpressDelivery]);

    // Validation functions
    const isStep2Valid = () => {
        const required = ["fullName", "phoneNumber", "street", "city", "zip", "state", "country"];
        return required.every(field => !!addressFields[field as keyof typeof addressFields]);
    };

    const isStep3Valid = () => {
        return !!orderFields && selectedItems.length > 0 && !orderCalculations.isLoading;
    };

    const isStep4Valid = () => {
        if (paymentMethods.type === PaymentMethodType.ONLINE_PAYMENT && !paymentMethods.onlineProvider) {
            return false;
        }
        if (paymentMethods.type === PaymentMethodType.CARD_PAYMENT && !paymentMethods.cardProvider) {
            return false;
        }
        return !orderCalculations.isLoading;
    };

    const handleNextStep = () => {
        switch (currentStep) {
            case 2:
                if (isStep2Valid()) {
                    setCurrentStep(3);
                } else {
                    form.trigger("deliveryAddress");
                    toast.error("Please fill in all required address fields");
                }
                break;
            case 3:
                if (isStep3Valid()) {
                    setCurrentStep(4);
                } else {
                    form.trigger("orderDate");
                    toast.error("Please select a preferred delivery date");
                }
                break;
            case 4:
                if (isStep4Valid()) {
                    handleSubmitOrder(form.getValues());
                } else {
                    form.trigger("preferredPaymentMethod");
                    toast.error("Please select a valid payment method");
                }
                break;
            default:
                setCurrentStep(prev => Math.min(prev + 1, 5));
        }
    };

    const handleStepChange = (step: number) => {
        if (step > currentStep && step !== currentStep + 1) {
            return;
        }
        if (step < 5 && !isCreatingOrder) {
            setCurrentStep(step);
        }
    };

    const handleSubmitOrder = async (formData: z.infer<typeof OrderFormSchema>) => {
        if (selectedItems.length === 0) {
            toast.error("No items selected for order");
            return;
        }

        if (orderCalculations.isLoading) {
            toast.error("Please wait for calculations to complete");
            return;
        }

        // Validate exchange rates age (must be less than 30 minutes old)
        const ratesAge = (new Date().getTime() - new Date(orderCalculations.exchangeRateTimestamp).getTime()) / (1000 * 60);
        if (ratesAge > 30) {
            toast.error("Exchange rates are outdated. Please refresh the page and try again.");
            return;
        }

        resetOrderAction();

        const orderPayload = {
            ...formData,
            totalAmount: orderCalculations.customerTotalAmount,
            selectedItems: selectedItems.map(item => ({
                id: item.id,
                productId: item.productId,
                name: item.name,
                price: convertCurrency(
                    item.price,
                    item.productCurrency,
                    currentCurrency,
                    orderCalculations.exchangeRateSnapshot
                ),
                quantity: item.quantity,
                image: item.image,
                productCurrency: item.productCurrency
            })),
            customerCurrency: currentCurrency,
            exchangeRatesSnapshot: orderCalculations.exchangeRateSnapshot,
            exchangeRatesTimestamp: orderCalculations.exchangeRateTimestamp,
        };

        executeCreateOrder(orderPayload);
    };

    const redirectUrl = `/sign-in?redirectUrl=${encodeURIComponent(`${pathname}?${searchParams.toString()}`)}`;

    if (!userLoading && selectedItems.length === 0) {
        return (
            <div className="main-container flex flex-col items-center justify-center min-h-[400px] text-center">
                <Package className="h-16 w-16 text-gray-400 mb-4" />
                <h2 className="text-2xl font-semibold mb-2">No Items Selected</h2>
                <p className="text-gray-600 mb-4">Please add items to your cart before placing an order</p>
                <Link href="/products" className={buttonVariants()}>
                    Browse Products
                </Link>
            </div>
        );
    }

    return (
        <div className="main-container space-y-8 text-center p-4">
            {/* Order Progress Stepper */}
            <Stepper
                value={currentStep}
                onValueChange={handleStepChange}
                className="w-full max-w-4xl mx-auto p-5 border-b-2"
            >
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
                            <StepperDescription className="max-sm:hidden">Order Review</StepperDescription>
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
                    <StepperTrigger className="flex-col gap-3 rounded" disabled>
                        <StepperIndicator />
                        <div className="space-y-0.5 px-2">
                            <StepperTitle>Step 5</StepperTitle>
                            <StepperDescription className="max-sm:hidden">Order Complete</StepperDescription>
                        </div>
                    </StepperTrigger>
                </StepperItem>
            </Stepper>

            {/* Order Processing Alert */}
            {isCreatingOrder && (
                <Alert className="max-w-xl mx-auto border-blue-200 bg-blue-50">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                        Processing your order... Please don't close this page.
                    </AlertDescription>
                </Alert>
            )}

            {orderCalculations.isLoading && currentStep > 2 && (
                <Alert className="max-w-xl mx-auto border-yellow-200 bg-yellow-50">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                        Calculating order totals and exchange rates...
                    </AlertDescription>
                </Alert>
            )}

            {isExpressDelivery && currentStep > 2 && currentStep < 5 && (
                <Alert className="max-w-xl mx-auto border-orange-200 bg-orange-50">
                    <Truck className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                        Express Delivery selected - Additional{' '}
                        {/* <ProductPriceDisplay
                            productPrice={10}
                            productCurrency={currentCurrency}
                            showOriginalPrice={false}
                        />{' '} */}
                        fee applied. Estimated delivery: 2-3 business days
                    </AlertDescription>
                </Alert>
            )}

            {/* Multi-currency Alert */}
            {orderCalculations.currencyBreakdowns.length > 1 && currentStep > 2 && currentStep < 5 && (
                <Alert className="max-w-xl mx-auto border-blue-200 bg-blue-50">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                        Your order contains items in {orderCalculations.currencyBreakdowns.length} different currencies.
                        All prices are converted to {currentCurrency} using current exchange rates.
                    </AlertDescription>
                </Alert>
            )}

            {/* Error Alerts */}
            {createOrderResult?.serverError && (
                <Alert variant="destructive" className="max-w-xl mx-auto">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        {createOrderResult.serverError}
                    </AlertDescription>
                </Alert>
            )}

            <Form {...form}>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleNextStep();
                    }}
                >
                    <div className="mt-8 p-6 rounded-lg max-w-xl mx-auto">
                        {/* Step 1: Authentication */}
                        {currentStep === 1 && (
                            (userLoading || isRefetching) ? (
                                <SpinningLoader />
                            ) : (
                                <div className="text-center space-y-4">
                                    <h2 className="text-xl font-semibold">Sign In to Continue</h2>
                                    <p className="text-gray-600">Please log in to your account to place an order</p>
                                    <div className="flex justify-center mt-4">
                                        <Link href={redirectUrl} className={buttonVariants()}>
                                            Log In To Place Order
                                        </Link>
                                    </div>
                                </div>
                            )
                        )}

                        {/* Step 2: Delivery Address */}
                        {currentStep === 2 && (
                            <div className="text-left">
                                <DeliveryAddress
                                    control={form.control}
                                    disabled={isCreatingOrder}
                                    setValue={form.setValue}
                                    currentUserId={user!.$id}
                                />
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="space-y-6 text-start">
                                <h2 className="text-xl font-semibold">Order Review</h2>

                                <OrderSummaryStep
                                    address={form.getValues().deliveryAddress}
                                    cartItems={selectedItems}
                                />

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Order Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {orderCalculations.currencyBreakdowns.length > 1 && (
                                            <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                                
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Step 4: Payment Method */}
                        {currentStep === 4 && (
                            <div className="text-left space-y-6">
                                <h2 className="text-xl font-semibold mb-4">Payment Options</h2>

                                {/* Final Order Summary */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="font-medium mb-2">Order Summary</h3>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span>{selectedItems.length} items</span>
                                            {/* <ProductPriceDisplay
                                                productPrice={itemsSubtotal}
                                                productCurrency={currentCurrency}
                                            />
                                            {getCurrencySymbol(itemsSubtotal)} */}
                                        </div>
                                        {isExpressDelivery && (
                                            <div className="flex justify-between">
                                                <span>Express Delivery</span>
                                                {/* <ProductPriceDisplay
                                                    productPrice={expressDeliveryFee}
                                                    productCurrency={currentCurrency}
                                                /> */}
                                            </div>
                                        )}
                                        <div className="border-t pt-1 flex justify-between font-semibold">
                                            <span>Total</span>
                                            {/* <ProductPriceDisplay
                                                productPrice={calculatedTotal}
                                                productCurrency={currentCurrency}
                                            /> */}
                                        </div>
                                    </div>
                                </div>

                                <PaymentMethod
                                    control={form.control}
                                    disabled={isCreatingOrder}
                                />

                                {/* Payment Security Notice */}
                                <Alert className="border-green-200 bg-green-50">
                                    <CreditCard className="h-4 w-4 text-green-600" />
                                    <AlertDescription className="text-green-800">
                                        Your payment information is secure and encrypted.
                                        {paymentMethods.type === PaymentMethodType.CASH_ON_DELIVERY &&
                                            " You can pay with cash when your order is delivered."
                                        }
                                    </AlertDescription>
                                </Alert>
                            </div>
                        )}

                        {/* Step 5: Order Complete */}
                        {currentStep === 5 && orderResult && (
                            <div className="text-center space-y-6">
                                <div className="flex items-center justify-center">
                                    <div className="rounded-full bg-green-100 p-3">
                                        <CheckCircle className="h-8 w-8 text-green-600" />
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-2xl font-semibold mb-2">Order Placed Successfully!</h2>
                                    <p className="text-gray-600">Thank you for your order! Here are your order details:</p>
                                </div>

                                {/* Order Details */}
                                <div className="bg-gray-50 p-4 rounded-lg text-left space-y-3">
                                    <div className="flex justify-between">
                                        <span className="font-medium">Order Number:</span>
                                        <Badge variant="outline" className="font-mono">
                                            {orderResult.orderNumber}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Total Amount:</span>
                                        {/* <ProductPriceDisplay
                                            productPrice={orderResult.totalAmount}
                                            productCurrency={currentCurrency}
                                        /> */}
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Items:</span>
                                        <span>{orderResult.orderItems.length} items</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Virtual Store:</span>
                                        <span>{orderResult.virtualStoreId}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Estimated Delivery:</span>
                                        <span>{orderResult.estimatedDeliveryDate.toLocaleDateString()}</span>
                                    </div>
                                </div>

                                {/* Next Steps */}
                                <div className="space-y-3">
                                    <Alert>
                                        <Info className="h-4 w-4" />
                                        <AlertDescription>
                                            You will receive order updates via email. Track your order anytime in your account.
                                        </AlertDescription>
                                    </Alert>

                                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                        <Link href="/my-orders" className={buttonVariants({ variant: 'teritary' })}>
                                            View Your Orders
                                        </Link>
                                        <Link href="/products" className={buttonVariants({ variant: 'outline' })}>
                                            Continue Shopping
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Navigation Buttons */}
                    {currentStep !== 5 && (
                        <div className="flex justify-between mt-6 max-w-xl mx-auto">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCurrentStep(prev => Math.max(prev - 1, 1))}
                                disabled={currentStep === 1 || isCreatingOrder}
                            >
                                Previous
                            </Button>

                            {currentStep === 1 && !user ? (
                                <Link href={redirectUrl} className={buttonVariants()}>
                                    Sign In to Continue
                                </Link>
                            ) : (
                                <Button
                                    type="submit"
                                    disabled={isCreatingOrder}
                                >
                                    {isCreatingOrder ? (
                                        <>
                                            <SpinningLoader />
                                            {currentStep === 4 ? "Processing Order..." : "Processing..."}
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
};