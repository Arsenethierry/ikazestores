/* eslint-disable @typescript-eslint/no-explicit-any */
// app/admin/stores/[storeId]/variants/variants-dashboard-client.tsx

"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Edit, Trash2, ListTree, Tag, Package, Search, Ellipsis } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { VariantType } from "@/lib/schemas/product-variants-schema";
import { deleteVariantGroup, getVariantGroupsByProductType } from "@/features/products/actions/variants management/product-types-actions";
import { deleteVariantTemplate, getVariantTemplatesByProductType } from "@/features/products/actions/variants management/products-variant-templates-action";
import { useConfirm } from "@/hooks/use-confirm";
import { CurrentUserType } from "@/lib/types";

interface ProductType {
    $id: string;
    name: string;
    description?: string;
}

interface VariantsDashboardClientProps {
    storeId: string;
    productTypes: ProductType[];
    initialProductType?: string;
    initialTab?: string;
    currentUser: CurrentUserType
}

const queryKeys = {
    variantTemplates: (productType: string, storeId: string) =>
        ['variant-templates', productType, storeId] as const,
    variantGroups: (productType: string, storeId: string) =>
        ['variant-groups', productType, storeId] as const,
};

export default function VariantsDashboardClient({
    storeId,
    productTypes,
    initialProductType,
    initialTab,
    currentUser
}: VariantsDashboardClientProps) {
    const router = useRouter();
    const queryClient = useQueryClient();

    const [selectedProductType, setSelectedProductType] = useState<string | null>(
        initialProductType || (productTypes.length > 0 ? productTypes[0].$id : null)
    );
    const [activeTab, setActiveTab] = useState(initialTab || "templates");
    const [searchTerm, setSearchTerm] = useState("");

    const [ConfirmDialog, confirm] = useConfirm(
        "Delete Item",
        "Are you sure you want to delete this item? This action cannot be undone.",
        "destructive"
    );

    const {
        data: templatesResponse,
        isLoading: templatesLoading,
        error: templatesError
    } = useQuery({
        queryKey: queryKeys.variantTemplates(selectedProductType || '', storeId),
        queryFn: () => getVariantTemplatesByProductType(selectedProductType!, storeId),
        enabled: !!selectedProductType,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });

    const {
        data: groupsResponse,
        isLoading: groupsLoading,
        error: groupsError
    } = useQuery({
        queryKey: queryKeys.variantGroups(selectedProductType || '', storeId),
        queryFn: () => getVariantGroupsByProductType(selectedProductType!, storeId),
        enabled: !!selectedProductType,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });

    const templates = useMemo(() => {
        return templatesResponse?.documents || [];
    }, [templatesResponse?.documents]);

    const groups = useMemo(() => {
        return groupsResponse?.documents || [];
    }, [groupsResponse?.documents]);

    const isLoading = templatesLoading || groupsLoading;

    const canModifyItem = useCallback((createdBy: string) => {
        return currentUser?.$id === createdBy;
    }, [currentUser?.$id]);

    const deleteTemplateMutation = useMutation({
        mutationFn: async (templateId: string) => {
            const result = await deleteVariantTemplate({ templateId });
            if (result?.data?.error) {
                throw new Error(result.data.error);
            }
            return result;
        },
        onSuccess: () => {
            toast.success("Template deleted successfully");
            if (selectedProductType) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.variantTemplates(selectedProductType, storeId)
                });
            }
        },
        onError: (error) => {
            console.error("Error deleting template:", error);
            toast.error(error instanceof Error ? error.message : "Failed to delete template");
        }
    });

    const deleteGroupMutation = useMutation({
        mutationFn: async (groupId: string) => {
            const result = await deleteVariantGroup({ groupId });
            if (result?.data?.error) {
                throw new Error(result.data.error);
            }
            return result;
        },
        onSuccess: () => {
            toast.success("Group deleted successfully");
            if (selectedProductType) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.variantGroups(selectedProductType, storeId)
                });
            }
        },
        onError: (error) => {
            console.error("Error deleting group:", error);
            toast.error(error instanceof Error ? error.message : "Failed to delete group");
        }
    })

    const handleProductTypeChange = useCallback((value: string) => {
        setSelectedProductType(value);

        const params = new URLSearchParams();
        params.set("productType", value);
        if (activeTab !== "templates") params.set("tab", activeTab);
        const newUrl = params.toString() ? `?${params.toString()}` : "";
        router.replace(`/admin/stores/${storeId}/variants${newUrl}`, { scroll: false });
    }, [activeTab, storeId, router]);

    const handleTabChange = useCallback((value: string) => {
        setActiveTab(value);

        const params = new URLSearchParams();
        if (selectedProductType) params.set("productType", selectedProductType);
        if (value !== "templates") params.set("tab", value);
        const newUrl = params.toString() ? `?${params.toString()}` : "";
        router.replace(`/admin/stores/${storeId}/variants${newUrl}`, { scroll: false });
    }, [selectedProductType, storeId, router]);

    const filteredTemplates = useMemo(() => {
        return templates.filter(template =>
            template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [templates, searchTerm]);

    const filteredGroups = useMemo(() => {
        return groups.filter(group =>
            group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [groups, searchTerm]);

    const stats = useMemo(() => ({
        totalTemplates: templates.length,
        totalGroups: groups.length,
        totalProductTypes: productTypes.length,
        activeTemplates: templates.filter(t => t.isRequired).length
    }), [templates, groups, productTypes]);

    const renderVariantTypeBadge = useCallback((type: string) => {
        const variantTypeColors: Record<string, string> = {
            [VariantType.SELECT]: "bg-blue-100 text-blue-800 border-blue-200",
            [VariantType.BOOLEAN]: "bg-green-100 text-green-800 border-green-200",
            [VariantType.TEXT]: "bg-purple-100 text-purple-800 border-purple-200",
            [VariantType.NUMBER]: "bg-yellow-100 text-yellow-800 border-yellow-200",
            [VariantType.MULTISELECT]: "bg-indigo-100 text-indigo-800 border-indigo-200",
            [VariantType.COLOR]: "bg-pink-100 text-pink-800 border-pink-200",
        };

        const variantTypeLabels: Record<string, string> = {
            [VariantType.SELECT]: "Selection",
            [VariantType.BOOLEAN]: "Yes/No",
            [VariantType.TEXT]: "Text",
            [VariantType.NUMBER]: "Number",
            [VariantType.MULTISELECT]: "Multi-select",
            [VariantType.COLOR]: "Color",
        };

        const colorClass = variantTypeColors[type] || "bg-gray-100 text-gray-800 border-gray-200";
        const label = variantTypeLabels[type] || type;

        return (
            <Badge variant="outline" className={colorClass}>
                {label}
            </Badge>
        );
    }, []);

    const handleDeleteClick = useCallback(async (id: string, type: "template" | "group", createdBy: string) => {
        if (!canModifyItem(createdBy)) {
            toast.error("You don't have permission to delete this item");
            return;
        }
        const ok = await confirm();
        if (ok) {
            if (type === "template") {
                deleteTemplateMutation.mutate(id);
            } else {
                deleteGroupMutation.mutate(id);
            }
        }
    }, [confirm, deleteTemplateMutation, deleteGroupMutation, canModifyItem]);


    if (templatesError || groupsError) {
        return (
            <Alert>
                <AlertTitle>Error Loading Data</AlertTitle>
                <AlertDescription>
                    Failed to load variant data. Please try refreshing the page.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Variants Management</h1>
                        <p className="text-muted-foreground">
                            Create and manage variant templates and groups for your products
                        </p>
                    </div>
                    <div className="flex space-x-2">
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/admin/stores/${storeId}/variants/templates/new`)}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            New Template
                        </Button>
                        <Button
                            onClick={() => router.push(`/admin/stores/${storeId}/variants/groups/new`)}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            New Group
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
                            <Tag className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalTemplates}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
                            <ListTree className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalGroups}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Product Types</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalProductTypes}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
                            <Tag className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.activeTemplates}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Filter Sidebar */}
                    <Card className="col-span-1">
                        <CardHeader>
                            <CardTitle>Filter By</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <Label className="text-sm font-medium mb-1 block">Product Type</Label>
                                    <Select
                                        value={selectedProductType || ""}
                                        onValueChange={handleProductTypeChange}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a product type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {productTypes.map((type) => (
                                                <SelectItem key={type.$id} value={type.$id}>
                                                    {type.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="col-span-1 md:col-span-3">
                        <CardHeader>
                            <CardTitle>Variant Elements</CardTitle>
                            <CardDescription>
                                Manage your variant templates and groups
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="templates" className="flex items-center">
                                            <Tag className="mr-2 h-4 w-4" />
                                            Templates
                                        </TabsTrigger>
                                        <TabsTrigger value="groups" className="flex items-center">
                                            <ListTree className="mr-2 h-4 w-4" />
                                            Groups
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <div className="relative flex-1 max-w-sm">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-8"
                                        />
                                    </div>
                                </div>

                                {!selectedProductType && (
                                    <Alert>
                                        <Package className="h-4 w-4" />
                                        <AlertTitle>No Product Type Selected</AlertTitle>
                                        <AlertDescription>
                                            Please select a product type to view its variants.
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {isLoading ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-10 w-full" />
                                        <div className="space-y-2">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Skeleton key={i} className="h-16 w-full" />
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <TabsContent value="templates" className="mt-0">
                                            {filteredTemplates.length === 0 ? (
                                                <div className="text-center p-8 border rounded-md border-dashed">
                                                    <Tag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                                    <p className="text-muted-foreground mb-4">
                                                        {searchTerm ? "No templates found matching your search" : "No variant templates found"}
                                                    </p>
                                                    {!searchTerm && (
                                                        <Button onClick={() => router.push(`/admin/stores/${storeId}/variants/templates/new`)}>
                                                            Create your first template
                                                        </Button>
                                                    )}
                                                </div>
                                            ) : (
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Name</TableHead>
                                                            <TableHead>Type</TableHead>
                                                            <TableHead>Required</TableHead>
                                                            <TableHead>Options</TableHead>
                                                            <TableHead className="text-right">Actions</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {filteredTemplates.map((template) => (
                                                            <TableRow key={template.$id}>
                                                                <TableCell>
                                                                    <div>
                                                                        <div className="font-medium">{template.name}</div>
                                                                        {template.description && (
                                                                            <div className="text-sm text-muted-foreground">
                                                                                {template.description}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>{renderVariantTypeBadge(template.type)}</TableCell>
                                                                <TableCell>
                                                                    <Badge variant={template.isRequired ? "default" : "secondary"}>
                                                                        {template.isRequired ? "Yes" : "No"}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell>
                                                                    {template.options?.length ? (
                                                                        <Badge variant="outline">{template.options.length} options</Badge>
                                                                    ) : (
                                                                        <span className="text-muted-foreground text-sm">-</span>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button variant="ghost" size="sm">
                                                                                <Ellipsis />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end">
                                                                            <DropdownMenuItem
                                                                                onClick={() => router.push(`/admin/stores/${storeId}/variants/templates/edit/${template.$id}`)}
                                                                            >
                                                                                <Edit className="mr-2 h-4 w-4" />
                                                                                Edit
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem
                                                                                onClick={() => handleDeleteClick(template.$id, "template", template.createdBy)}
                                                                                className="text-destructive"
                                                                            >
                                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                                Delete
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            )}
                                        </TabsContent>

                                        <TabsContent value="groups" className="mt-0">
                                            {filteredGroups.length === 0 ? (
                                                <div className="text-center p-8 border rounded-md border-dashed">
                                                    <ListTree className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                                    <p className="text-muted-foreground mb-4">
                                                        {searchTerm ? "No groups found matching your search" : "No variant groups found"}
                                                    </p>
                                                    {!searchTerm && (
                                                        <Button onClick={() => router.push(`/admin/stores/${storeId}/variants/groups/new`)}>
                                                            Create your first group
                                                        </Button>
                                                    )}
                                                </div>
                                            ) : (
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Name</TableHead>
                                                            <TableHead>Description</TableHead>
                                                            <TableHead>Templates</TableHead>
                                                            <TableHead className="text-right">Actions</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {filteredGroups.map((group) => (
                                                            <TableRow key={group.$id}>
                                                                <TableCell className="font-medium">{group.name}</TableCell>
                                                                <TableCell className="max-w-[300px] truncate">
                                                                    {group.description || <span className="text-muted-foreground text-sm">-</span>}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge variant="outline">
                                                                        {group.templates?.length || group.variants?.length || 0} templates
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button variant="ghost" size="sm">
                                                                                <Ellipsis />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end">
                                                                            <DropdownMenuItem
                                                                                onClick={() => router.push(`/admin/stores/${storeId}/variants/groups/edit/${group.$id}`)}
                                                                            >
                                                                                <Edit className="mr-2 h-4 w-4" />
                                                                                Edit
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem
                                                                                onClick={() => handleDeleteClick(group.$id, "group", group.createdBy)}
                                                                                className="text-destructive"
                                                                            >
                                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                                Delete
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            )}
                                        </TabsContent>
                                    </>
                                )}
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ConfirmDialog />
        </>
    );
}