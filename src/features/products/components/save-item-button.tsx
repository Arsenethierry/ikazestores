"use client";

import { useCurrentUser } from "@/features/auth/queries/use-get-current-user";
import { useEffect, useState } from "react";
import { isItemSaved, removeSavedItem, saveItem } from "../actions/saved-items-action";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export const SaveItemButton = ({
    productId,
    initialSavedState = false,
    initialSavedItemId = null
}: {
    productId: string;
    initialSavedState?: boolean;
    initialSavedItemId?: string | null;
}) => {
    const [isSaved, setIsSaved] = useState(initialSavedState);
    const [savedItemId, setSavedItemId] = useState(initialSavedItemId);
    const [isLoading, setIsLoading] = useState(false);
    const { data: user } = useCurrentUser();

    useEffect(() => {
        const checkSavedStatus = async () => {
            if (!user) return;

            const result = await isItemSaved(user.$id, productId);
            setIsSaved(result.isSaved);
            setSavedItemId(result.savedItemId);
        };

        checkSavedStatus();
    }, [productId, user]);

    const handleSaveToggle = async () => {
        if (!user) {
            toast.error("Please sign in to save items");
            return;
        }

        setIsLoading(true);

        try {
            if (isSaved && savedItemId) {
                setIsSaved(false)
                const result = await removeSavedItem({ savedItemId });
                if (result && result.serverError) {
                    toast.error(result.serverError);
                } else {
                    setIsSaved(false);
                    setSavedItemId(null);
                    toast.success("Item removed from saved items");
                }
            } else {
                setIsSaved(true)
                const result = await saveItem({ productId });

                if (result?.serverError) {
                    toast.error(result.serverError);
                } else {
                    const savedStatus = await isItemSaved(user.$id, productId);
                    setIsSaved(savedStatus.isSaved);
                    setSavedItemId(savedStatus.savedItemId);
                    toast.success("Item saved successfully");
                }
            }
        } catch {
            toast.error("Failed to update saved status");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <TooltipProvider delayDuration={0}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full bg-white/80 transition-all duration-300 ease-in-out hover:bg-white hover:scale-110 active:scale-95"
                        onClick={handleSaveToggle}
                        disabled={isLoading}
                    >
                        <Heart
                            className={`h-4 w-4 transition-colors duration-300 ease-in-out ${isSaved
                                ? "fill-red-500 text-red-500"
                                : "text-gray-500 group-hover:text-gray-800"
                                }`}
                        />
                    </Button>
                </TooltipTrigger>
                <TooltipContent className="dark px-2 py-1 text-xs" showArrow={true}>
                    {isSaved ? "Remove from saved items" : "Save item"}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}