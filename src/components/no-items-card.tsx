import { cn } from "@/lib/utils";
import { PackageOpen } from "lucide-react";
import { HTMLAttributes } from "react";

interface NoItemsCardProps extends HTMLAttributes<HTMLDivElement> {
    title?: string;
    description?: string;
    icon?: React.ReactNode;
}

export const NoItemsCard = ({
    className,
    title = "No items available",
    description = "It seems there's nothing to display here yet.",
    icon = <PackageOpen className="h-12 w-12" />,
    ...props
}: NoItemsCardProps) => {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center rounded-lg border bg-background/50 p-8 text-center shadow-sm transition-all hover:shadow-md max-w-2xl mx-auto my-5 md:my-10",
                className
            )}
            {...props}
        >
            <div className="mb-4 text-muted-foreground">{icon}</div>

            <h3 className="mb-2 text-xl font-semibold tracking-tight">
                {title}
            </h3>

            <p className="text-sm text-muted-foreground max-w-md">
                {description}
            </p>
        </div>
    );
}