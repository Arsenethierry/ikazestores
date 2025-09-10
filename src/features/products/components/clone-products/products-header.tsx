import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft, TableOfContents } from "lucide-react";
import Link from "next/link";

export function ProductsHeader({ storeId }: { storeId: string }) {
    return (
        <div className="bg-white border-b">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/admin/stores/${storeId}`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Store
                    </Link>
                    <div className="flex items-center gap-2">
                        <TableOfContents className="w-5 h-5 text-blue-600" />
                        <h1 className="text-xl font-semibold">Product Import Center</h1>
                    </div>
                </div>
            </div>
        </div>
    );
}