"use client";

import { useCurrentUser } from "@/features/auth/queries/use-get-current-user";
import { useEffect, useState, useCallback, useTransition, useMemo } from "react";
import { isItemSaved, removeSavedItem, saveItem } from "../../../hooks/queries-and-mutations/saved-items-action";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Heart, Loader2, BookmarkPlus, BookmarkCheck } from "lucide-react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface SaveItemButtonProps extends Omit<ButtonProps, 'onClick'> {
    productId: string;
    initialSavedState?: boolean;
    initialSavedItemId?: string | null;
    showLabel?: boolean;
    customTooltip?: string;
    onSaveStart?: () => void;
    onSaveSuccess?: (isSaved: boolean) => void;
    onSaveError?: (error: string) => void;
    iconType?: 'heart' | 'bookmark';
    showAnimation?: boolean;
    persistentState?: boolean;
}

export const SaveItemButton = ({
    productId,
    initialSavedState = false,
    initialSavedItemId = null,
    showLabel = false,
    customTooltip,
    onSaveStart,
    onSaveSuccess,
    onSaveError,
    iconType = 'heart',
    showAnimation = true,
    persistentState = false,
    className,
    variant = "ghost",
    size = "icon",
    disabled,
    ...props
}: SaveItemButtonProps) => {
    const [isSaved, setIsSaved] = useState(initialSavedState);
    const [savedItemId, setSavedItemId] = useState(initialSavedItemId);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isPending, startTransition] = useTransition();
    
    const { data: user, isLoading: userLoading } = useCurrentUser();

    // Persistent state management
    useEffect(() => {
        if (persistentState && typeof window !== 'undefined') {
            const savedState = localStorage.getItem(`saved-${productId}`);
            if (savedState) {
                const { isSaved: saved, savedItemId: id } = JSON.parse(savedState);
                setIsSaved(saved);
                setSavedItemId(id);
            }
        }
    }, [productId, persistentState]);

    // Check saved status when user loads
    useEffect(() => {
        const checkSavedStatus = async () => {
            if (!user || userLoading) return;

            try {
                const result = await isItemSaved(user.$id, productId);
                setIsSaved(result.isSaved);
                setSavedItemId(result.savedItemId);

                // Persist to localStorage if enabled
                if (persistentState && typeof window !== 'undefined') {
                    localStorage.setItem(`saved-${productId}`, JSON.stringify({
                        isSaved: result.isSaved,
                        savedItemId: result.savedItemId
                    }));
                }
            } catch (error) {
                console.error('Failed to check saved status:', error);
            }
        };

        if (!initialSavedState && !initialSavedItemId) {
            checkSavedStatus();
        }
    }, [productId, user, userLoading, initialSavedState, initialSavedItemId, persistentState]);

    const handleSaveToggle = useCallback(async () => {
        if (!user) {
            toast.error("Please sign in to save items", {
                action: {
                    label: "Sign In",
                    onClick: () => {
                        // Redirect to sign-in page
                        window.location.href = "/sign-in";
                    }
                }
            });
            return;
        }

        if (disabled || isLoading) return;

        onSaveStart?.();
        setIsLoading(true);

        try {
            startTransition(async () => {
                if (isSaved && savedItemId) {
                    // Remove from saved items
                    const result = await removeSavedItem({ savedItemId });
                    
                    if (result?.serverError) {
                        toast.error(result.serverError);
                        onSaveError?.(result.serverError);
                    } else {
                        setIsSaved(false);
                        setSavedItemId(null);
                        toast.success("Item removed from saved items");
                        onSaveSuccess?.(false);

                        // Update persistent state
                        if (persistentState && typeof window !== 'undefined') {
                            localStorage.setItem(`saved-${productId}`, JSON.stringify({
                                isSaved: false,
                                savedItemId: null
                            }));
                        }
                    }
                } else {
                    // Add to saved items
                    const result = await saveItem({ productId });

                    if (result?.serverError) {
                        toast.error(result.serverError);
                        onSaveError?.(result.serverError);
                    } else {
                        // Re-check the saved status to get the correct savedItemId
                        const savedStatus = await isItemSaved(user.$id, productId);
                        setIsSaved(savedStatus.isSaved);
                        setSavedItemId(savedStatus.savedItemId);
                        
                        toast.success("Item saved successfully");
                        onSaveSuccess?.(true);

                        // Show success animation
                        if (showAnimation) {
                            setShowSuccess(true);
                            setTimeout(() => setShowSuccess(false), 1500);
                        }

                        // Update persistent state
                        if (persistentState && typeof window !== 'undefined') {
                            localStorage.setItem(`saved-${productId}`, JSON.stringify({
                                isSaved: savedStatus.isSaved,
                                savedItemId: savedStatus.savedItemId
                            }));
                        }
                    }
                }
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to update saved status";
            toast.error(errorMessage);
            onSaveError?.(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [
        user, disabled, isLoading, isSaved, savedItemId, onSaveStart, onSaveError, 
        onSaveSuccess, productId, showAnimation, persistentState
    ]);

    const buttonIcon = useMemo(() => {
        if (isLoading || isPending) {
            return <Loader2 className="h-4 w-4 animate-spin" />;
        }

        if (iconType === 'bookmark') {
            return isSaved ? (
                <BookmarkCheck className={cn(
                    "h-4 w-4 transition-all duration-300",
                    "text-blue-500 fill-blue-500",
                    showSuccess && showAnimation && "animate-bounce"
                )} />
            ) : (
                <BookmarkPlus className="h-4 w-4 transition-all duration-300 text-gray-500 group-hover:text-gray-800" />
            );
        }

        return (
            <Heart
                className={cn(
                    "h-4 w-4 transition-all duration-300",
                    isSaved
                        ? "fill-red-500 text-red-500"
                        : "text-gray-500 group-hover:text-gray-800",
                    showSuccess && showAnimation && "animate-pulse scale-110"
                )}
            />
        );
    }, [isLoading, isPending, iconType, isSaved, showSuccess, showAnimation]);

    const buttonText = useMemo(() => {
        if (!showLabel) return null;
        if (isLoading || isPending) return "Saving...";
        return isSaved ? "Saved" : "Save";
    }, [showLabel, isLoading, isPending, isSaved]);

    const tooltipText = useMemo(() => {
        if (customTooltip) return customTooltip;
        if (!user) return "Sign in to save items";
        if (isLoading || isPending) return "Updating...";
        return isSaved ? "Remove from saved items" : "Save item";
    }, [customTooltip, user, isLoading, isPending, isSaved]);

    return (
        <TooltipProvider delayDuration={0}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="relative">
                        <Button
                            variant={variant}
                            size={size}
                            className={cn(
                                "transition-all duration-300 ease-in-out group",
                                variant === "ghost" && "rounded-full bg-white/80 hover:bg-white hover:scale-110 active:scale-95",
                                isSaved && iconType === 'heart' && "bg-red-50 hover:bg-red-100",
                                isSaved && iconType === 'bookmark' && "bg-blue-50 hover:bg-blue-100",
                                showSuccess && showAnimation && "animate-pulse",
                                showLabel && "px-3 py-2 gap-2",
                                disabled && "opacity-50 cursor-not-allowed",
                                className
                            )}
                            onClick={handleSaveToggle}
                            disabled={disabled || isLoading || isPending}
                            {...props}
                        >
                            {buttonIcon}
                            
                            {buttonText && (
                                <span className={cn(
                                    "transition-colors duration-300",
                                    size === "icon" ? "sr-only" : "text-sm font-medium",
                                    isSaved && iconType === 'heart' && "text-red-600",
                                    isSaved && iconType === 'bookmark' && "text-blue-600"
                                )}>
                                    {buttonText}
                                </span>
                            )}
                        </Button>

                        {/* Success indicator */}
                        {showSuccess && showAnimation && (
                            <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-75 pointer-events-none" />
                        )}

                        {/* Save count badge (if you want to show how many times it's been saved) */}
                        {/* This would require additional data from your backend */}
                        {false && ( // Set to true if you want to show save count
                            <Badge
                                variant="secondary"
                                className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center"
                            >
                                5
                            </Badge>
                        )}
                    </div>
                </TooltipTrigger>
                <TooltipContent className="px-2 py-1 text-xs" side="top">
                    <div className="text-center">
                        <div>{tooltipText}</div>
                        {!user && (
                            <div className="text-muted-foreground text-xs mt-1">
                                Sign in to save items for later
                            </div>
                        )}
                        {isSaved && (
                            <div className="text-muted-foreground text-xs mt-1">
                                Click to remove from saved items
                            </div>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};