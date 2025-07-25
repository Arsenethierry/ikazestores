"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetPhysicalStoreById, usePhysicalStoresByOwner } from "@/hooks/queries-and-mutations/use-physical-store";
import { useGetVirtualStoreById, useGetVirtualStoresByOwnerId } from "@/hooks/queries-and-mutations/use-virtual-store";
import { MAIN_DOMAIN } from "@/lib/env-config";
import { AdminDashboardType, PhysicalStoreTypes, VirtualStoreTypes } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Store, Plus, Globe, MapPin, Search } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

interface StoreSwitcherProps {
    adminType: AdminDashboardType;
    className?: string;
    adminUserId: string;
}

export const StoreSwitcher = ({
    adminType,
    className,
    adminUserId
}: StoreSwitcherProps) => {
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const params = useParams();
    const router = useRouter();
    const currentStoreId = params.storeId as string;

    // Only fetch current store if we have a storeId (not on stores list page)
    const { data: virtualStore, isLoading: virtualStoreLoading } = useGetVirtualStoreById(currentStoreId, {
        enabled: !!currentStoreId && adminType === 'virtualStoreAdmin',
    });

    const { data: physicalStore, isLoading: physicalStoreLoading } = useGetPhysicalStoreById(currentStoreId, {
        enabled: !!currentStoreId && adminType === 'physicalStoreAdmin',
    });

    // Always fetch stores list for the dropdown
    const { data: virtualStores, isLoading: virtualStoresLoading } = useGetVirtualStoresByOwnerId(adminUserId || '', {
        enabled: !!adminUserId && adminType === 'virtualStoreAdmin',
    });

    const { data: physicalStores, isLoading: physicalStoresLoading } = usePhysicalStoresByOwner(adminUserId || '', {
        enabled: !!adminUserId && adminType === 'physicalStoreAdmin',
    });

    const currentStore = currentStoreId ? (adminType === 'virtualStoreAdmin' ? virtualStore : physicalStore) : null;
    const stores = adminType === 'virtualStoreAdmin'
        ? virtualStores?.documents || []
        : physicalStores?.documents || [];

    const isCurrentStoreLoading = currentStoreId ?
        (adminType === 'virtualStoreAdmin' ? virtualStoreLoading : physicalStoreLoading) :
        false;

    const isStoresListLoading = adminType === 'virtualStoreAdmin' ? virtualStoresLoading : physicalStoresLoading;

    const filteredStores = useMemo(() => {
        if (!searchValue.trim()) return stores;

        return stores.filter(store =>
            store.storeName.toLowerCase().includes(searchValue.toLowerCase()) ||
            (adminType === 'physicalStoreAdmin' &&
                (store as PhysicalStoreTypes).address?.toLowerCase().includes(searchValue.toLowerCase())) ||
            (adminType === 'physicalStoreAdmin' &&
                (store as PhysicalStoreTypes).country?.toLowerCase().includes(searchValue.toLowerCase()))
        );
    }, [stores, searchValue, adminType]);

    const getStoreDisplayInfo = (store: VirtualStoreTypes | PhysicalStoreTypes) => {
        if (adminType === 'virtualStoreAdmin') {
            const vStore = store as VirtualStoreTypes;
            return {
                icon: Globe,
                subtitle: vStore.subDomain ? `${vStore.subDomain}.${MAIN_DOMAIN}` : 'Virtual Store',
                badge: 'Virtual',
                badgeVariant: 'secondary' as const
            };
        } else {
            const pStore = store as PhysicalStoreTypes;
            return {
                icon: MapPin,
                subtitle: pStore.address || pStore.country || 'Physical Location',
                badge: 'Physical',
                badgeVariant: 'default' as const
            };
        }
    };

    const onStoreSelect = (storeId: string) => {
        setOpen(false);
        setSearchValue("");
        router.push(`/admin/stores/${storeId}`);
    };

    const onCreateStore = () => {
        setOpen(false);
        setSearchValue("");
        router.push('/admin/stores/new');
    };

    if (adminType === 'systemAdmin') {
        return null;
    }

    if (isCurrentStoreLoading) {
        return (
            <div className={cn("w-full", className)}>
                <Skeleton className="h-10 w-full" />
            </div>
        );
    }

    const currentStoreInfo = currentStore ? getStoreDisplayInfo(currentStore) : null;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    aria-label="Select a store"
                    className={cn(
                        "w-full justify-between h-auto min-h-[2.5rem] p-3",
                        className
                    )}
                >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        {currentStore ? (
                            <>
                                {currentStoreInfo?.icon && (
                                    <currentStoreInfo.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                )}
                                <div className="flex flex-col items-start min-w-0 flex-1">
                                    <div className="flex items-center gap-2 min-w-0 w-full">
                                        <span className="truncate font-medium text-sm">
                                            {currentStore.storeName}
                                        </span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <Store className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                    {currentStoreId ? "Loading store..." : "Select store..."}
                                </span>
                            </>
                        )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start" sideOffset={4}>
                <Command>
                    <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <CommandInput
                            placeholder={`Search ${adminType === 'virtualStoreAdmin' ? 'virtual' : 'physical'} stores...`}
                            value={searchValue}
                            onValueChange={setSearchValue}
                            className="border-0 focus:ring-0"
                        />
                    </div>
                    <CommandList className="max-h-[300px]">
                        {isStoresListLoading ? (
                            <div className="p-4">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                            </div>
                        ) : (
                            <>
                                <CommandEmpty className="py-6 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Store className="h-8 w-8 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground">No stores found.</p>
                                        {searchValue && (
                                            <p className="text-xs text-muted-foreground">
                                                Try adjusting your search terms
                                            </p>
                                        )}
                                    </div>
                                </CommandEmpty>
                                {filteredStores.length > 0 && (
                                    <CommandGroup heading={`Your ${adminType === 'virtualStoreAdmin' ? 'Virtual' : 'Physical'} Stores (${stores.length})`}>
                                        {filteredStores.map((store: VirtualStoreTypes | PhysicalStoreTypes) => {
                                            const storeInfo = getStoreDisplayInfo(store);
                                            const isSelected = store.$id === currentStoreId;

                                            return (
                                                <CommandItem
                                                    key={store.$id}
                                                    onSelect={() => onStoreSelect(store.$id)}
                                                    className={cn(
                                                        "flex items-center gap-3 p-3 cursor-pointer",
                                                        isSelected && "bg-accent"
                                                    )}
                                                >
                                                    <storeInfo.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                    <div className="flex flex-col min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium truncate">
                                                                {store.storeName}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-muted-foreground truncate">
                                                            {storeInfo.subtitle}
                                                        </span>
                                                    </div>
                                                    {isSelected && (
                                                        <Check className="h-4 w-4 shrink-0 text-primary" />
                                                    )}
                                                </CommandItem>
                                            )
                                        })}
                                    </CommandGroup>
                                )}
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}