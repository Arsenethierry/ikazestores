import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Trash2, Settings } from "lucide-react";
import { VariantTemplate } from "@/lib/types";
import { getVariantTemplatesForStore } from "@/features/categories/actions/products-variant-templates-action";
import { DeleteVariantTemplateModal, EditVariantTemplateModal, ViewVariantTemplateModal } from "./variant-templates-modals";

interface VariantTemplatesSectionProps {
    productTypeId: string;
    storeId?: string;
}

export async function VariantTemplatesSection({ 
    productTypeId, 
    storeId 
}: VariantTemplatesSectionProps) {
    const variantTemplates = await getVariantTemplatesForStore(
        storeId,
        productTypeId,
    );

    if (!variantTemplates?.documents || variantTemplates.documents.length === 0) {
        return (
            <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
                <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    No Variant Templates
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Create variant templates to define the options available for products of this type.
                </p>
                <p className="text-xs text-muted-foreground">
                    Examples: Storage (64GB, 128GB), Color (Red, Blue), Size (S, M, L)
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {variantTemplates.documents.map((template: VariantTemplate) => (
                <VariantTemplateCard 
                    key={template.$id} 
                    template={template}
                    storeId={storeId}
                    productTypeId={productTypeId}
                />
            ))}
        </div>
    );
}

interface VariantTemplateCardProps {
    template: VariantTemplate;
    storeId?: string;
    productTypeId: string;
}

function VariantTemplateCard({ template, storeId, productTypeId }: VariantTemplateCardProps) {
    const getTypeColor = (type: string) => {
        const colors = {
            'select': 'bg-blue-100 text-blue-800',
            'multiselect': 'bg-purple-100 text-purple-800',
            'color': 'bg-pink-100 text-pink-800',
            'boolean': 'bg-green-100 text-green-800',
            'text': 'bg-gray-100 text-gray-800',
            'number': 'bg-orange-100 text-orange-800',
            'range': 'bg-indigo-100 text-indigo-800'
        };
        return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                    <h4 className="font-medium">{template.name}</h4>
                    <Badge 
                        variant="secondary"
                        className={getTypeColor(template.type)}
                    >
                        {template.type}
                    </Badge>
                    {template.isRequired && (
                        <Badge variant="destructive" className="text-xs">
                            Required
                        </Badge>
                    )}
                    {!template.storeId && (
                        <Badge variant="outline" className="text-xs">
                            Global
                        </Badge>
                    )}
                </div>
                
                {template.description && (
                    <p className="text-sm text-muted-foreground">
                        {template.description}
                    </p>
                )}
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{template.options?.length || 0} options</span>
                    {template.defaultValue && (
                        <span>Default: {template.defaultValue}</span>
                    )}
                    <span>Created {new Date(template.$createdAt).toLocaleDateString()}</span>
                </div>

                {template.options && template.options.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {template.options.slice(0, 5).map((option, index) => (
                            <Badge 
                                key={index} 
                                variant="outline" 
                                className="text-xs"
                            >
                                {option.label || option.value}
                            </Badge>
                        ))}
                        {template.options.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                                +{template.options.length - 5} more
                            </Badge>
                        )}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2">
                <ViewVariantTemplateModal template={template}>
                    <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                    </Button>
                </ViewVariantTemplateModal>

                <EditVariantTemplateModal
                    template={template}
                    storeId={storeId}
                    productTypeId={productTypeId}
                >
                    <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                    </Button>
                </EditVariantTemplateModal>

                <DeleteVariantTemplateModal
                    template={template}
                    storeId={storeId}
                >
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </DeleteVariantTemplateModal>
            </div>
        </div>
    );
}