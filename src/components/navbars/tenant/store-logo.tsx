import { getVirtualStoreById } from "@/lib/actions/vitual-store.action"
import { cn, generateColorFromName, getStoreLogoInitials, splitStoreName } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export const CurrentStoreLogo = async ({ currentStoreId }: { currentStoreId: string }) => {
    const storeData = await getVirtualStoreById(currentStoreId);

    if (!storeData) {
        return (
            <Link href="/" className="font-bold text-2xl md:ml-0 flex items-center hover:opacity-80 transition-opacity">
                <span className="text-white">Ikaze</span>
                <span className="text-yellow-400">Stores</span>
            </Link>
        );
    }

    if (storeData.storeLogoUrl) {
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <div className="relative h-10 w-40">
                <Image
                    src={storeData.storeLogoUrl}
                    alt={`${storeData.storeName} logo`}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 160px"
                    priority
                />
            </div>
        </Link>
    }

    const { firstInitial, secondInitial } = getStoreLogoInitials(storeData.storeName);
    const { firstPart, secondPart } = splitStoreName(storeData.storeName);
    const color = generateColorFromName(storeData.storeName);

    return (
        <Link
            href="/"
            className={cn(
                "font-bold text-xl md:text-2xl flex items-center",
                "hover:opacity-90 transition-all group w-max"
            )}
        >
            <div
                className={cn(
                    "relative flex items-center justify-center mr-2",
                    "w-10 h-10 rounded-lg overflow-hidden",
                    "bg-gradient-to-br from-primary to-secondary",
                    "group-hover:scale-105 transition-transform"
                )}
                style={{
                    "--tw-gradient-from": `${color.primary}`,
                    "--tw-gradient-to": `${color.secondary}`,
                } as React.CSSProperties}
            >
                <span className="text-white font-bold text-lg">
                    {firstInitial}
                    <span className="opacity-80">{secondInitial}</span>
                </span>
            </div>

            <div className="flex flex-col items-start leading-tight">
                <span className="text-white font-bold">{firstPart}</span>
                <span className="text-yellow-400 font-medium text-sm md:text-base">{secondPart}</span>
            </div>
        </Link>
    )
}