import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { VariantOption, VariantTemplate } from "@/lib/types/catalog-types";
import { Minus, Package, Plus, Settings, Star, X } from "lucide-react";
import React from "react";
import { Control, useFieldArray, useFormContext } from "react-hook-form";
import { toast } from "sonner";

interface VariantValue {
    id: string;
    value: string;
    label?: string;
    additionalPrice?: number;
    isDefault?: boolean;
}

interface VariantConfigProps {
    control: Control<any>;
    variantTemplates: VariantTemplate[];
}

export const VariantConfig: React.FC<VariantConfigProps> = ({
    control,
    variantTemplates
}) => {
    const { watch, setValue, trigger } = useFormContext();
    const hasVariants = watch('hasVariants');
    const watchedVariants = watch('variants') || [];

    const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
        control,
        name: 'variants'
    });

    // Filter out color variants from the templates since colors are handled separately
    const nonColorTemplates = variantTemplates.filter(template => {
        const name = template.name?.toLowerCase() || '';
        const type = template.inputType?.toLowerCase() || '';
        const colorKeywords = ['color', 'colour', 'hue', 'shade', 'tint', 'paint'];
        return !colorKeywords.some(keyword =>
            name.includes(keyword) || type.includes(keyword)
        ) && template.inputType !== 'color';
    });

    const addVariantFromTemplate = (template: VariantTemplate) => {
        const existingVariant = variantFields.find((field: any) => field.templateId === template.id);
        if (!existingVariant) {
            appendVariant({
                templateId: template.id,
                name: template.name,
                type: template.inputType,
                values: [],
                required: template.isRequired
            });
        }
    }

    const addValueToVariant = (variantIndex: number, value: Partial<VariantValue>) => {
        const currentVariant = watchedVariants[variantIndex] || { values: [] };
        const existingValues = currentVariant?.values || [];

        const newValue: VariantValue = {
            id: `${currentVariant.templateId}-${Date.now()}`,
            value: value.value || '',
            label: value.label || value.value,
            additionalPrice: value.additionalPrice || 0,
            isDefault: existingValues.length === 0
        };

        const updatedValues = [...existingValues, newValue];
        setValue(`variants.${variantIndex}.values`, updatedValues);
        
        // Trigger form validation for the variants field
        trigger('variants');
    }

    const removeValueFromVariant = (variantIndex: number, valueIndex: number) => {
        const currentVariant = watchedVariants[variantIndex];
        const updatedValues = currentVariant.values.filter((_: any, index: number) => index !== valueIndex);
        setValue(`variants.${variantIndex}.values`, updatedValues);
        trigger('variants');
    }

    const updateVariantValue = (variantIndex: number, valueIndex: number, field: string, newValue: any) => {
        const currentVariant = watch(`variants.${variantIndex}`);
        const updatedValues = [...currentVariant.values];
        updatedValues[valueIndex] = {
            ...updatedValues[valueIndex],
            [field]: newValue
        };
        setValue(`variants.${variantIndex}.values`, updatedValues);
        trigger('variants');
    };

    const renderVariantValueInput = (
        variantIndex: number,
        template: VariantTemplate
    ) => {
        const variant = watchedVariants[variantIndex] || { values: [] };

        switch (template.inputType) {
            case 'select':
            case 'multiselect':
                return (
                    <div className="space-y-4">
                        {template.variantOptions && template.variantOptions.length > 0 && (
                            <div className="space-y-3">
                                <h5 className="text-sm font-medium">Pre-configured Options</h5>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                                    {template.variantOptions.map((option: VariantOption) => {
                                        const isSelected = variant.values?.some((v: any) => v.value === option.value);
                                        return (
                                            <Button
                                                key={option.value}
                                                type="button"
                                                variant={isSelected ? "secondary" : "outline"}
                                                size="sm"
                                                onClick={() => {
                                                    if (!isSelected) {
                                                        addValueToVariant(variantIndex, {
                                                            value: option.value,
                                                            label: option.value,
                                                            additionalPrice: option.additionalPrice
                                                        });
                                                    }
                                                }}
                                                disabled={isSelected}
                                                className="justify-start text-left h-auto py-2"
                                            >
                                                <div className="flex flex-col items-start w-full">
                                                    <span className="font-medium">{option.value}</span>
                                                    {option.additionalPrice && option.additionalPrice !== 0 && (
                                                        <span className="text-xs text-green-600">
                                                            {option.additionalPrice > 0 ? '+' : ''}${option.additionalPrice}
                                                        </span>
                                                    )}
                                                </div>
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <h5 className="text-sm font-medium">Add Custom Option</h5>
                            <div className="flex gap-2">
                                <Input
                                    placeholder={`Add custom ${template.name.toLowerCase()} option`}
                                    onChange={(e) => {
                                        setValue(`variants.${variantIndex}.newOptionValue`, e.target.value);
                                    }}
                                    className="flex-1"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const value = watch(`variants.${variantIndex}.newOptionValue`);
                                            const label = watch(`variants.${variantIndex}.newOptionLabel`) || value;
                                            const price = parseFloat(watch(`variants.${variantIndex}.newOptionPrice`) || 0);

                                            if (value) {
                                                addValueToVariant(variantIndex, {
                                                    value,
                                                    label,
                                                    additionalPrice: price
                                                });

                                                setValue(`variants.${variantIndex}.newOptionValue`, '');
                                                setValue(`variants.${variantIndex}.newOptionLabel`, '');
                                                setValue(`variants.${variantIndex}.newOptionPrice`, '');
                                            }
                                        }
                                    }}
                                />
                                <Input
                                    placeholder="Display name"
                                    onChange={(e) => {
                                        setValue(`variants.${variantIndex}.newOptionLabel`, e.target.value);
                                    }}
                                    className="flex-1"
                                />
                                <Input
                                    type="number"
                                    placeholder="Price +/-"
                                    onChange={(e) => {
                                        setValue(`variants.${variantIndex}.newOptionPrice`, e.target.value);
                                    }}
                                    className="w-24"
                                />
                                <Button
                                    type="button"
                                    onClick={() => {
                                        const value = watch(`variants.${variantIndex}.newOptionValue`);
                                        const label = watch(`variants.${variantIndex}.newOptionLabel`) || value;
                                        const price = parseFloat(watch(`variants.${variantIndex}.newOptionPrice`) || 0);

                                        if (value) {
                                            addValueToVariant(variantIndex, {
                                                value,
                                                label,
                                                additionalPrice: price
                                            });

                                            setValue(`variants.${variantIndex}.newOptionValue`, '');
                                            setValue(`variants.${variantIndex}.newOptionLabel`, '');
                                            setValue(`variants.${variantIndex}.newOptionPrice`, '');
                                        }
                                    }}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                );

            case 'boolean':
                return (
                    <div className="space-y-4">
                        <h5 className="text-sm font-medium">Boolean Options</h5>
                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                type="button"
                                variant={variant.values?.some((v: any) => v.value === 'true') ? "secondary" : "outline"}
                                onClick={() => {
                                    if (!variant.values?.some((v: any) => v.value === 'true')) {
                                        addValueToVariant(variantIndex, {
                                            value: 'true',
                                            label: 'Yes',
                                            additionalPrice: template.variantOptions?.find((o: any) => o.value === 'true')?.additionalPrice || 0
                                        });
                                    }
                                }}
                                disabled={variant.values?.some((v: any) => v.value === 'true')}
                            >
                                Yes
                                {template.variantOptions?.find((o: any) => o.value === 'true')?.additionalPrice && (
                                    <span className="ml-2 text-xs text-green-600">
                                        +${template.variantOptions.find((o: any) => o.value === 'true')?.additionalPrice}
                                    </span>
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant={variant.values?.some((v: any) => v.value === 'false') ? "secondary" : "outline"}
                                onClick={() => {
                                    if (!variant.values?.some((v: any) => v.value === 'false')) {
                                        addValueToVariant(variantIndex, {
                                            value: 'false',
                                            label: 'No',
                                            additionalPrice: template.variantOptions?.find((o: any) => o.value === 'false')?.additionalPrice || 0
                                        });
                                    }
                                }}
                                disabled={variant.values?.some((v: any) => v.value === 'false')}
                            >
                                No
                                {template.variantOptions?.find((o: any) => o.value === 'false')?.additionalPrice && (
                                    <span className="ml-2 text-xs text-green-600">
                                        +${template.variantOptions.find((o: any) => o.value === 'false')?.additionalPrice}
                                    </span>
                                )}
                            </Button>
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="space-y-3">
                        <h5 className="text-sm font-medium">Add Custom Values</h5>
                        <div className="flex gap-2">
                            <Input
                                placeholder={`Add ${template.name.toLowerCase()} value`}
                                onChange={(e) => {
                                    setValue(`variants.${variantIndex}.newCustomValue`, e.target.value);
                                }}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const value = watch(`variants.${variantIndex}.newCustomValue`);
                                        if (value) {
                                            addValueToVariant(variantIndex, { value });
                                            setValue(`variants.${variantIndex}.newCustomValue`, '');
                                        }
                                    }
                                }}
                            />
                            <Button
                                type="button"
                                onClick={() => {
                                    const value = watch(`variants.${variantIndex}.newCustomValue`);
                                    if (value) {
                                        addValueToVariant(variantIndex, { value });
                                        setValue(`variants.${variantIndex}.newCustomValue`, '');
                                    }
                                }}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )
        }
    };

    const renderSelectedValues = (variantIndex: number) => {
        const currentVariant = watchedVariants[variantIndex] || {};
        const currentValues = currentVariant.values || [];

        if (currentValues.length === 0) {
            return (
                <div className="text-center py-4 text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No values added yet</p>
                </div>
            )
        }

        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h5 className="text-sm font-medium">Selected Values ({currentValues.length})</h5>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {currentValues.map((value: any, valueIndex: number) => (
                        <div key={value.id} className="p-3 rounded-lg border bg-gray-50 border-gray-200">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium">{value.label || value.value}</span>
                                            {value.isDefault && (
                                                <Badge variant="secondary" className="text-xs">
                                                    <Star className="h-3 w-3 mr-1" />
                                                    Default
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Label className="text-xs text-muted-foreground">Additional Price:</Label>
                                            <Input
                                                type="number"
                                                value={value.additionalPrice || 0}
                                                onChange={(e) => updateVariantValue(
                                                    variantIndex,
                                                    valueIndex,
                                                    'additionalPrice',
                                                    parseFloat(e.target.value) || 0
                                                )}
                                                className="w-20 h-6 text-xs"
                                                step="0.01"
                                            />
                                            <span className="text-xs text-muted-foreground">USD</span>
                                        </div>
                                    </div>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeValueFromVariant(variantIndex, valueIndex)}
                                        className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (!hasVariants) {
        return null;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Available Variant Options</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Select from pre-configured variant types based on your product category (colors managed separately)
                    </p>
                </CardHeader>
                <CardContent>
                    {nonColorTemplates.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-medium mb-2">No Variant Templates Available</h3>
                            <p className="text-sm">
                                Select a product type in the previous step to see available variant options, or add colors using the color manager above.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {nonColorTemplates.map(template => {
                                const isAdded = variantFields.some((field: any) => field.templateId === template.id);
                                return (
                                    <Button
                                        key={template.id}
                                        type="button"
                                        variant={isAdded ? "secondary" : "outline"}
                                        onClick={() => addVariantFromTemplate(template)}
                                        disabled={isAdded}
                                        className="h-auto p-3 justify-start"
                                    >
                                        <div className="flex flex-col items-start w-full">
                                            <div className="flex items-center gap-2 w-full">
                                                <Plus className="h-3 w-3" />
                                                <span className="font-medium">{template.name}</span>
                                                {template.isRequired && (
                                                    <Badge variant="destructive" className="text-xs ml-auto">Required</Badge>
                                                )}
                                            </div>
                                            <Badge variant="outline" className="text-xs mt-1">
                                                {template.inputType}
                                            </Badge>
                                        </div>
                                    </Button>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {variantFields.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Configure Selected Variants</h3>
                    {variantFields.map((field: any, variantIndex: any) => {
                        const currentVariant = watchedVariants[variantIndex];
                        if (!currentVariant) return null;

                        const template = nonColorTemplates.find(t => t.id === currentVariant.templateId);
                        if (!template) return null;

                        return (
                            <Card key={field.id} className="border-l-4 border-l-blue-500">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-base">{currentVariant.name}</CardTitle>
                                            {currentVariant.required && (
                                                <Badge variant="destructive" className="text-xs">Required</Badge>
                                            )}
                                            <Badge variant="outline" className="text-xs">{currentVariant.type}</Badge>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeVariant(variantIndex)}
                                        >
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-6">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            checked={currentVariant.required}
                                            onCheckedChange={(checked) => {
                                                setValue(`variants.${variantIndex}.required`, checked);
                                            }}
                                            id={`required-${field.id}`}
                                        />
                                        <Label htmlFor={`required-${field.id}`}>Required variant</Label>
                                    </div>

                                    <Separator />

                                    {renderVariantValueInput(variantIndex, template)}

                                    <Separator />

                                    {renderSelectedValues(variantIndex)}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {variantFields.length === 0 && nonColorTemplates.length > 0 && (
                <Card>
                    <CardContent className="py-8">
                        <div className="text-center text-muted-foreground">
                            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-medium mb-2">No Variants Selected</h3>
                            <p className="text-sm">
                                Choose from the available variant options above to start configuring product variations.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}