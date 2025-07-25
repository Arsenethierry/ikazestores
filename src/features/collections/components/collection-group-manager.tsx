"use client"

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GripVertical, Loader2, Plus, Save, Trash } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { SingleImageUploader } from "@/components/file-uploader";
import { Input } from "@/components/ui/input";
import { CollectionGroupsTypes } from "@/lib/types";
import { debounce } from "lodash";
import Link from "next/link";
import {
    useDeleteCollectionGroup,
    useSaveCollectionGroups,
    useUpdateCollectionGroup
} from "@/hooks/queries-and-mutations/use-products-collections";

type CollectionGroup = {
    id: string;
    groupName: string;
    groupImage?: File | string | undefined;
    displayOrder: number;
    isDeleting?: boolean;
};

export const CollectionGroupManager = ({
    collectionId,
    initialGroups = [],
    storeId,
}: {
    collectionId: string;
    initialGroups?: CollectionGroupsTypes[];
    storeId: string;
}) => {

    const formattedInitialGroups: CollectionGroup[] = initialGroups.map(group => ({
        id: group.$id,
        groupName: group.groupName ?? '',
        groupImage: group.groupImageUrl ?? undefined,
        displayOrder: group.displayOrder ?? 0
    }));

    const [groups, setGroups] = useState<CollectionGroup[]>(formattedInitialGroups);
    const [pendingChanges, setPendingChanges] = useState(false);

    const saveGroupsMutation = useSaveCollectionGroups();
    const deleteGroupMutation = useDeleteCollectionGroup();
    const updateGroupMutation = useUpdateCollectionGroup();

    useEffect(() => {
        if (groups.length !== formattedInitialGroups.length) {
            setPendingChanges(true);
            return;
        }
        const hasChanges = groups.some((group, index) => {
            const initialGroup = formattedInitialGroups[index];
            return !initialGroup ||
                group.groupName !== initialGroup.groupName ||
                group.displayOrder !== initialGroup.displayOrder ||
                (group.groupImage instanceof File);
        });

        setPendingChanges(hasChanges);
    }, [groups, formattedInitialGroups]);

    const addGroup = () => {
        const newGroup: CollectionGroup = {
            id: `temp-${Date.now()}`,
            groupName: "",
            displayOrder: groups.length
        };
        setGroups([...groups, newGroup]);
    };

    const debouncedUpdateGroup = useMemo(
        () =>
            debounce((groupId: string, updatedData: Partial<CollectionGroup>) => {
                const group = groups.find(g => g.id === groupId);
                if (!group || groupId.startsWith('temp-')) return;

                updateGroupMutation.mutate({
                    groupId,
                    groupName: updatedData.groupName || group.groupName,
                    groupImage: updatedData.groupImage || group.groupImage,
                    displayOrder:
                        updatedData.displayOrder !== undefined
                            ? updatedData.displayOrder
                            : group.displayOrder || 0,
                });
            }, 1000),
        [groups, updateGroupMutation]
    );

    const removeGroup = (id: string, imageId: string | null = null) => {
        if (id.startsWith('temp-')) {
            setGroups(groups.filter(group => group.id !== id));
            return;
        }

        // Mark group as deleting for UI feedback
        setGroups(groups.map(group =>
            group.id === id ? { ...group, isDeleting: true } : group
        ));

        deleteGroupMutation.mutate(
            {
                collectionId,
                groupId: id,
                imageId: imageId || undefined
            },
            {
                onSuccess: () => {
                    // Remove from local state after successful deletion
                    setGroups(prevGroups => prevGroups.filter(group => group.id !== id));
                },
                onError: () => {
                    // Remove deleting state if deletion failed
                    setGroups(groups.map(group =>
                        group.id === id ? { ...group, isDeleting: false } : group
                    ));
                }
            }
        );
    };

    const updateGroupName = (id: string, groupName: string) => {
        setGroups(
            groups.map(group =>
                group.id === id ? { ...group, groupName } : group
            )
        );
        if (!id.startsWith('temp-')) {
            debouncedUpdateGroup(id, { groupName });
        }
    };

    const updateGroupImage = (id: string, groupImage: File | string | undefined) => {
        setGroups(
            groups.map(group =>
                group.id === id ? { ...group, groupImage } : group
            )
        );

        if (!id.startsWith('temp-') && groupImage instanceof File) {
            const group = groups.find(g => g.id === id);
            if (group) {
                updateGroupMutation.mutate({
                    groupId: id,
                    groupName: group.groupName,
                    groupImage,
                    displayOrder: group.displayOrder ?? 0
                });
            }
        }
    };

    const handleDragEnd = (result: any) => {
        if (!result.destination) return;

        const items = Array.from(groups);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        const updatedItems = items.map((item, index) => ({
            ...item,
            displayOrder: index
        }));

        setGroups(updatedItems);
    };

    const handleSave = async () => {
        const invalidGroups = groups.filter(group => !group.groupName.trim());
        if (invalidGroups.length > 0) {
            toast.error("All groups must have names");
            return;
        }

        const groupsToSave = groups.map(group => ({
            id: group.id,
            groupName: group.groupName,
            displayOrder: group.displayOrder ?? 0,
            groupImage: group.groupImage || ""
        }));

        saveGroupsMutation.mutate(
            {
                collectionId,
                groups: groupsToSave
            },
            {
                onSuccess: () => {
                    setPendingChanges(false);
                    // Update the groups state with the new IDs from server if needed
                    // This would require the mutation to return the updated groups
                }
            }
        );
    };

    const isLoading = saveGroupsMutation.isPending ||
        deleteGroupMutation.isPending ||
        updateGroupMutation.isPending;

    return (
        <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Collection Groups</CardTitle>
                <div className="flex gap-2">
                    {pendingChanges && (
                        <Button
                            variant="teritary"
                            size="sm"
                            onClick={handleSave}
                            disabled={isLoading}
                        >
                            {saveGroupsMutation.isPending ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4 mr-1" />
                            )}
                            Save Changes
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={addGroup}
                        disabled={isLoading}
                    >
                        <Plus className="h-4 w-4 mr-1" /> Add Group
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="collection-groups">
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="space-y-4"
                            >
                                {groups.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-4">
                                        No groups added. Add a group to organize products within this collection.
                                    </p>
                                ) : (
                                    groups.map((group, index) => (
                                        <Draggable key={group.id} draggableId={group.id} index={index}>
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className={`flex gap-4 items-center p-4 border rounded-md bg-card transition-opacity ${group.isDeleting ? 'opacity-50' : ''
                                                        }`}
                                                >
                                                    <div
                                                        {...provided.dragHandleProps}
                                                        className="cursor-grab"
                                                    >
                                                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                                                    </div>
                                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">Group Name</label>
                                                            <Input
                                                                value={group.groupName}
                                                                onChange={(e) => updateGroupName(group.id, e.target.value)}
                                                                placeholder="e.g., Shoes, Jewelry"
                                                                disabled={isLoading || group.isDeleting}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">Group Image</label>
                                                            <SingleImageUploader
                                                                file={group.groupImage}
                                                                onChange={(file) => updateGroupImage(group.id, file)}
                                                                imageHeight={60}
                                                                imageWidth={60}
                                                                isEditMode={Boolean(group.groupImage)}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">Display Order</label>
                                                            <p className="text-sm text-muted-foreground">
                                                                {(group.displayOrder ?? 0) + 1}
                                                                {updateGroupMutation.isPending && " (Updating...)"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {!group.id.startsWith('temp-') && (
                                                        <Link
                                                            href={`/admin/stores/${storeId}/collections/${collectionId}/groups/${group.id}`}
                                                            className={buttonVariants({ variant: "teritary", size: "xs" })}
                                                        >
                                                            <Plus className="h-3 w-3 mr-1" /> Add Products
                                                        </Link>
                                                    )}
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeGroup(group.id)}
                                                        disabled={isLoading || group.isDeleting}
                                                        className="self-center"
                                                    >
                                                        {group.isDeleting ? (
                                                            <Loader2 className="h-4 w-4 text-destructive animate-spin" />
                                                        ) : (
                                                            <Trash className="h-4 w-4 text-destructive" />
                                                        )}
                                                    </Button>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))
                                )}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>

                {groups.length > 0 && pendingChanges && (
                    <div className="mt-6 flex justify-end">
                        <Button
                            onClick={handleSave}
                            disabled={isLoading}
                        >
                            {saveGroupsMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Groups"
                            )}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};