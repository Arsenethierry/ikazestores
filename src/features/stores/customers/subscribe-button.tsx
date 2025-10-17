"use client";

import { Button } from "@/components/ui/button";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
    subscribeToStoreAction,
    unsubscribeFromStoreAction,
} from "@/lib/actions/store-subscribers.action";
import { useAction } from "next-safe-action/hooks";

interface SubscribeButtonProps {
    storeId: string;
    storeName: string;
    initialSubscribed: boolean;
    userId?: string;
    variant?: "teritary" | "outline";
    size?: "default" | "sm" | "lg";
    fullWidth?: boolean;
    showIcon?: boolean;
    showText?: boolean;
}

export function SubscribeButton({
    storeId,
    storeName,
    initialSubscribed,
    userId,
    variant,
    size = "sm",
    fullWidth = false,
    showIcon = true,
    showText = true,
}: SubscribeButtonProps) {
    const [isSubscribed, setIsSubscribed] = useState(initialSubscribed);
    const [isPending, startTransition] = useTransition();

    const { execute: subscribe, status: subscribeStatus } = useAction(
        subscribeToStoreAction,
        {
            onSuccess: ({ data }) => {
                if (data?.success) {
                    setIsSubscribed(true);
                    toast.success(data.message || `Subscribed to ${storeName}!`);
                } else {
                    // Revert optimistic update
                    setIsSubscribed(false);
                    toast.error(data?.error || "Failed to subscribe");
                }
            },
            onError: (error) => {
                // Revert optimistic update
                setIsSubscribed(false);
                console.error("Subscribe error:", error);
                toast.error("An error occurred while subscribing");
            },
        }
    );

    const { execute: unsubscribe, status: unsubscribeStatus } = useAction(
        unsubscribeFromStoreAction,
        {
            onSuccess: ({ data }) => {
                if (data?.success) {
                    setIsSubscribed(false);
                    toast.success(data.message || `Unsubscribed from ${storeName}`);
                } else {
                    setIsSubscribed(true);
                    toast.error(data?.error || "Failed to unsubscribe");
                }
            },
            onError: (error) => {
                setIsSubscribed(true);
                console.error("Unsubscribe error:", error);
                toast.error("An error occurred while unsubscribing");
            },
        }
    );

    const isLoading =
        subscribeStatus === "executing" ||
        unsubscribeStatus === "executing" ||
        isPending;

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!userId) {
            toast.error("Please sign in to subscribe to stores");
            return;
        }

        // Optimistic update
        startTransition(() => {
            if (isSubscribed) {
                setIsSubscribed(false);
                unsubscribe({ storeId });
            } else {
                setIsSubscribed(true);
                subscribe({ storeId });
            }
        });
    };

    const buttonVariant = variant || (isSubscribed ? "outline" : "teritary");

    return (
        <Button
            size={size}
            variant={buttonVariant}
            onClick={handleToggle}
            disabled={isLoading || !userId}
            className={fullWidth ? "flex-1" : ""}
        >
            {isLoading ? (
                <>
                    {showIcon && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {showText && (isSubscribed ? "Unsubscribing..." : "Subscribing...")}
                </>
            ) : isSubscribed ? (
                <>
                    {showIcon && <Bell className="h-4 w-4 mr-2" />}
                    {showText && "Subscribed"}
                </>
            ) : (
                <>
                    {showIcon && <BellOff className="h-4 w-4 mr-2" />}
                    {showText && "Subscribe"}
                </>
            )}
        </Button>
    );
}