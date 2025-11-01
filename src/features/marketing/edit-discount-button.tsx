"use client";

import { useState, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Loader2 } from "lucide-react";
import { Discounts } from "@/lib/types/appwrite-types";
import { useRouter } from "next/navigation";

const EditDiscountDialog = lazy(() =>
    import("./edit-discount-dialog").then((mod) => ({ default: mod.EditDiscountDialog }))
);

interface EditDiscountButtonProps {
    discount: Discounts;
    storeId: string;
}

export function EditDiscountButton({ discount, storeId }: EditDiscountButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    return (
        <>
            <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsOpen(true)}
            >
                <Edit className="mr-2 h-4 w-4" />
                Edit
            </Button>

            {/* Lazy-loaded Dialog with Suspense */}
            <Suspense fallback={<DialogLoadingFallback isOpen={isOpen} />}>
                {isOpen && (
                    <EditDiscountDialog
                        discount={discount}
                        isOpen={isOpen}
                        onClose={() => setIsOpen(false)}
                        onSuccess={() => router.refresh()}
                    />
                )}
            </Suspense>
        </>
    );
}

// Loading fallback for the dialog
function DialogLoadingFallback({ isOpen }: { isOpen: boolean }) {
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="rounded-lg bg-white p-6">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
        </div>
    );
}