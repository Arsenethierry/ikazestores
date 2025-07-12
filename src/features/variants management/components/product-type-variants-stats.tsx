/* eslint-disable @typescript-eslint/no-explicit-any */
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAvailableVariantTemplatesForProductType } from "@/features/categories/actions/product-types-actions";
import { getVariantTemplatesForStore } from "@/features/categories/actions/products-variant-templates-action";
import { Globe, Hash, List, Palette, Sliders, Store, ToggleLeft, Type } from "lucide-react";

interface ProductTypeVariantStatsProps {
    productTypeId: string;
    storeId?: string;
}

const VARIANT_TYPE_ICONS = {
    select: List,
    multiselect: List,
    color: Palette,
    boolean: ToggleLeft,
    text: Type,
    number: Hash,
    range: Sliders,
};

export async function ProductTypeVariantStats({
    productTypeId,
    storeId
}: ProductTypeVariantStatsProps) {
    const variantTemplates = storeId
        ? await getVariantTemplatesForStore(storeId, productTypeId)
        : await getAvailableVariantTemplatesForProductType({ productTypeId });

    if (!variantTemplates.documents) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-muted-foreground">--</div>
                        <p className="text-xs text-muted-foreground">Error loading stats</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const templates = variantTemplates.documents;

    const totalTemplates = templates.length;
    const globalTemplates = templates.filter((t: any) => !t.storeId).length;
    const storeTemplates = templates.filter((t: any) => t.storeId).length;
    const requiredTemplates = templates.filter((t: any) => t.isRequired).length;
    const activeTemplates = templates.filter((t: any) => t.isActive).length;

    const typeStats = templates.reduce((acc: any, template: any) => {
        acc[template.type] = (acc[template.type] || 0) + 1;
        return acc;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
    }, {} as Record<string, number>);

    const totalOptions = templates.reduce((sum: number, template: any) => {
        return sum + (template.options?.length || 0);
    }, 0);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold">{totalTemplates}</div>
                        <p className="text-xs text-muted-foreground">Total Templates</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-orange-600">{requiredTemplates}</div>
                        <p className="text-xs text-muted-foreground">Required</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-green-600">{activeTemplates}</div>
                        <p className="text-xs text-muted-foreground">Active</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-blue-600">{totalOptions}</div>
                        <p className="text-xs text-muted-foreground">Total Options</p>
                    </CardContent>
                </Card>
            </div>

            {storeId && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Template Scope</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Global</span>
                                </div>
                                <Badge variant="outline">{globalTemplates}</Badge>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Store className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Store-Specific</span>
                                </div>
                                <Badge variant="secondary">{storeTemplates}</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {Object.keys(typeStats).length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Template Types</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {Object.entries(typeStats).map(([type, count]) => {
                                const Icon = VARIANT_TYPE_ICONS[type as keyof typeof VARIANT_TYPE_ICONS] || List;
                                return (
                                    <div
                                        key={type}
                                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Icon className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-sm font-medium capitalize">{type}</span>
                                        </div>
                                        <Badge variant="outline">{String(count)}</Badge>                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {templates.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Template Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {templates.slice(0, 5).map((template: any) => {
                                const Icon = VARIANT_TYPE_ICONS[template.type as keyof typeof VARIANT_TYPE_ICONS] || List;
                                const optionsCount = template.options?.length || 0;

                                return (
                                    <div
                                        key={template.$id}
                                        className="flex items-center justify-between p-3 border rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon className="w-4 h-4 text-muted-foreground" />
                                            <div>
                                                <div className="font-medium text-sm">{template.name}</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className="text-xs">
                                                        {template.type}
                                                    </Badge>
                                                    {template.isRequired && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            Required
                                                        </Badge>
                                                    )}
                                                    {!template.storeId && (
                                                        <Badge variant="outline" className="text-xs">
                                                            <Globe className="w-2 h-2 mr-1" />
                                                            Global
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-medium">{optionsCount}</div>
                                            <div className="text-xs text-muted-foreground">options</div>
                                        </div>
                                    </div>
                                )
                            })}

                            {templates.length > 5 && (
                                <div className="text-center py-2">
                                    <p className="text-sm text-muted-foreground">
                                        +{templates.length - 5} more templates
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {templates.length === 0 && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center py-6">
                            <List className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="font-medium mb-2">No Variant Templates</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                This product type doesn&apos;t have any variant templates yet.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}