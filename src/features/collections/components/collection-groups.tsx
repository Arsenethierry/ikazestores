"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CollectionGroupsTypes } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface CollectionGroupsProps {
    groups: CollectionGroupsTypes[];
    collectionId: string;
}
export const CollectionGroups = ({ groups }: CollectionGroupsProps) => {
    const pathname = usePathname();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {groups.map((group: CollectionGroupsTypes) => (
                <Link
                    href={`${pathname}/group/${group.$id}`}
                    key={group.$id}
                    className="transition-transform duration-200 hover:scale-105"
                >
                    <Card className="overflow-hidden h-full">
                        <CardContent className="p-4">
                            {group.groupImageUrl ? (
                                <div className="h-48 w-full relative mb-4 rounded-md overflow-hidden">
                                    <Image
                                        src={group.groupImageUrl}
                                        alt={group.groupName ?? ''}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ) : (
                                <Skeleton className='h-48 w-full' />
                            )}

                            <p className='text-lg font-semibold mt-2'>{group.groupName}</p>
                            {group.groupDescription && (
                                <p className='text-sm text-muted-foreground mt-1 line-clamp-2'>{group.groupDescription}</p>
                            )}
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    )
}