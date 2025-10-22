import { Button } from "@/components/ui/button";
import { CreateDiscountForm } from "@/features/marketing/create-discount-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type PageProps = {
    params: Promise<{
        storeId: string
    }>
}

export default async function CreatePhysicalDiscountPage({ params }: PageProps) {
    const { storeId } = await params;
    
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/admin/stores/${storeId}/physical-store/marketing/discounts`}>
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Create New Discount</h1>
                    <p className="text-muted-foreground mt-1">
                        Set up a new promotion for your physical store
                    </p>
                </div>
            </div>

            <CreateDiscountForm
                storeId={storeId}
                storeType="physical"
            />
        </div>
    );
}