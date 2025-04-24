"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GripVertical, Loader2, Plus, Save, Trash } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { SingleImageUploader } from "@/components/file-uploader";
import { Input } from "@/components/ui/input";
import { deleteCollectionGroup, saveCollectionGroups, updateCollectionGroup } from "../actions/collections-actions";
import { CollectionGroupsTypes } from "@/lib/types";
import { useAction } from "next-safe-action/hooks";
import { debounce } from "lodash";

type CollectionGroup = {
    id: string;
    groupName: string;
    groupImage?: File | string | undefined;
    displayOrder: number;
};

export const CollectionGroupManager = ({
    collectionId,
    initialGroups = [],
}: {
    collectionId: string;
    initialGroups?: CollectionGroupsTypes[];
}) => {

    const formattedInitialGroups: CollectionGroup[] = initialGroups.map(group => ({
        id: group.$id,
        groupName: group.groupName,
        groupImage: group.groupImageUrl,
        displayOrder: group.displayOrder
    }));

    const [groups, setGroups] = useState<CollectionGroup[]>(formattedInitialGroups);
    const [pendingChanges, setPendingChanges] = useState(false);

    useEffect(() => {
        if (groups.length !== formattedInitialGroups.length) {
            setPendingChanges(true);
            return;
        }
        const hasChanges = groups.some((group, index) => {
            const initialGroups = formattedInitialGroups[index];
            return !initialGroups ||
                group.groupName !== initialGroups.groupName ||
                group.displayOrder !== initialGroups.displayOrder ||
                (group.groupImage instanceof File);
        });

        setPendingChanges(hasChanges)
    }, [groups, formattedInitialGroups])

    const addGroup = () => {
        const newGroup: CollectionGroup = {
            id: `temp-${Date.now()}`,
            groupName: "",
            displayOrder: groups.length
        };
        setGroups([...groups, newGroup]);
    };

    const {
        execute: executeDeleteGroup,
        isPending: isDeletePending
    } = useAction(deleteCollectionGroup, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                toast.success(data.success);
            } else if (data?.error) {
                toast.error(data.error);
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError || "Failed to delete group");
        }
    });

    const {
        execute: executeUpdateGroup,
        isPending: isUpdatePending
    } = useAction(updateCollectionGroup, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                toast.success(data.success);
            } else if (data?.error) {
                toast.error(data.error);
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError || "Failed to update group");
        }
    });

    const debouncedUpdateGroup = useMemo(
        () =>
            debounce((groupId: string, updatedData: Partial<CollectionGroup>) => {
                const group = groups.find(g => g.id === groupId);
                if (!group || groupId.startsWith('temp-')) return;

                executeUpdateGroup({
                    groupId,
                    collectionId,
                    groupName: updatedData.groupName || group.groupName,
                    groupImage: updatedData.groupImage || group.groupImage,
                    displayOrder:
                        updatedData.displayOrder !== undefined
                            ? updatedData.displayOrder
                            : group.displayOrder,
                });
            }, 1000),
        [groups, executeUpdateGroup, collectionId]
    );

    const removeGroup = (id: string, imageId: string | null) => {
        if (id.startsWith('temp-')) {
            setGroups(groups.filter(group => group.id !== id));
            return;
        }

        setGroups(groups.map(group =>
            group.id === id ? { ...group, isDeleting: true } : group
        ));

        executeDeleteGroup({ groupId: id, collectionId, imageId });

        setGroups(prevGroups => prevGroups.filter(group => group.id !== id))
    };

    const updateGroupName = (id: string, groupName: string) => {
        setGroups(
            groups.map(group =>
                group.id === id ? { ...group, groupName } : group
            )
        );
        if (!id.startsWith('temp-')) {
            debouncedUpdateGroup(id, { groupName })
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
                executeUpdateGroup({
                    groupId: id,
                    collectionId,
                    groupName: group.groupName,
                    groupImage,
                    displayOrder: group.displayOrder
                });
            }
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

        // startTransition(() => {
        //     saveGroup({
        //         collectionId,
        //         groups: updatedItems
        //     });
        // });
    };

    const {
        execute: saveGroup,
        isPending: isSavePending
    } = useAction(saveCollectionGroups, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                toast.success(data.success);
                setPendingChanges(false);
            } else if (data?.error) {
                toast.error(data.error);
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError || "Failed to save groups");
        }
    });

    const handleSave = async () => {
        const invalidGroups = groups.filter(group => !group.groupName.trim());
        if (invalidGroups.length > 0) {
            toast.error("All groups must have names");
            return;
        }
        saveGroup({
            collectionId,
            groups
        })
    };

    const isLoading = isSavePending || isDeletePending || isUpdatePending;

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
                            {isLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                            Save Changes
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={addGroup}
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
                                                    className={`flex items-start gap-4 p-4 border rounded-md bg-card transition-opacity ${isDeletePending ? 'opacity-50' : ''}`}
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
                                                                disabled={isLoading}
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
                                                                {group.displayOrder + 1}
                                                                {/* {group.isNew && " (New)"} */}
                                                                {isUpdatePending && " (Updating...)"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeGroup(group.id, null)}
                                                        disabled={isLoading}
                                                        className="self-center"
                                                    >
                                                        {isDeletePending ? (
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

                {groups.length > 0 && (
                    <div className="mt-6 flex justify-end">
                        <Button onClick={handleSave} disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save Groups"}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}