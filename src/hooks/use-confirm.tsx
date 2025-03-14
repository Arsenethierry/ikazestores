import { ResponsiveModal } from "@/components/responsive-modal";
import { Button, ButtonProps } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, JSX } from "react";

export const useConfirm = (
    title: string,
    message: string,
    variant: ButtonProps["variant"] = "primary"
): [() => JSX.Element, () => Promise<unknown>] => {
    const [promise, setPromise] = useState<{ resolve: (value: boolean) => void } | null>(null);

    const confirm = () => {
        return new Promise((resolve) => {
            setPromise({ resolve });
        });
    }

    const handleClose = () => {
        setPromise(null);
    }

    const handleConfirm = () => {
        promise?.resolve(true);
        handleClose();
    }

    const handleCancel = () => {
        promise?.resolve(false);
        handleClose();
    }

    const ConfirmationDialog = () => (
        <ResponsiveModal open={promise !== null} onOpenChange={handleClose}>
            <Card className="w-full py-5 px-3 h-full border-none shadow-none">
                <CardContent className="pt-8">
                    <CardHeader className="p-0">
                        <CardTitle>
                            {title}
                        </CardTitle>
                        <p className="text-muted-foreground text-sm my-2">{message}</p>
                    </CardHeader>
                    <div className="pt-4 w-full flex flex-col gap-y-2 lg:flex-row gap-x-2 items-center justify-between">
                        <Button onClick={handleCancel} variant={"outline"} className="w-full lg:w-auto">
                            Cancel
                        </Button>
                        <Button onClick={handleConfirm} variant={variant} className="w-full lg:w-auto">
                            Confirm
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </ResponsiveModal>
    )

    return [ConfirmationDialog, confirm];
};