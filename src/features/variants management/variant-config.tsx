/* eslint-disable @typescript-eslint/no-explicit-any */
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { VariantOption, VariantTemplate } from "@/lib/types";
import { Minus, Package, Plus, Settings, Star, Upload, X } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import { Control, useFieldArray, useFormContext } from "react-hook-form";

interface VariantValue {
    id: string;
    value: string;
    label?: string;
    colorCode?: string;
    additionalPrice?: number;
    isDefault?: boolean;
    images?: File[];
}

interface EnhancedVariantConfigProps {
    control: Control<any>;
    variantTemplates: VariantTemplate[];
}
export const VariantConfig: React.FC<EnhancedVariantConfigProps> = ({
    control,
    variantTemplates
}) => {
    const [previewImages, setPreviewImages] = useState<{ [key: string]: string[] }>({});
    const [editingValues, setEditingValues] = useState<{ [key: string]: any }>({});

    const { setValue, watch } = useFormContext();
    const hasVariants = watch('hasVariants');
    const watchedVariants = watch('variants') || [];

    const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
        control,
        name: 'variants'
    });

    const addVariantFromTemplate = (template: VariantTemplate) => {
        const existingVariant = variantFields.find((field: any) => field.id === template.id);
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
            id: `${currentVariant.id}-${Date.now()}`,
            value: value.value || '',
            label: value.label || value.value,
            colorCode: value.colorCode,
            additionalPrice: value.additionalPrice || 0,
            isDefault: existingValues.length === 0,
            images: value.images || []
        };

        const updatedValues = [...existingValues, newValue];
        setValue(`variants.${variantIndex}.values`, updatedValues);
    }

    const removeValueFromVariant = (variantIndex: number, valueIndex: number) => {
        const currentVariant = watchedVariants[variantIndex];
        const updatedValues = currentVariant.values.filter((_: any, index: number) => index !== valueIndex);

        // Clean up preview images
        const key = `${variantIndex}-${valueIndex}`;
        if (previewImages[key]) {
            previewImages[key].forEach(url => URL.revokeObjectURL(url));
            setPreviewImages(prev => {
                const newPrev = { ...prev };
                delete newPrev[key];
                return newPrev;
            });
        }

        setValue(`variants.${variantIndex}.values`, updatedValues);
    }

    const handleImageUpload = (variantIndex: number, valueIndex: number, files: FileList) => {
        const filesArray = Array.from(files);
        const previewUrls = filesArray.map(file => URL.createObjectURL(file));
        const key = `${variantIndex}-${valueIndex}`;

        setPreviewImages(prev => ({
            ...prev,
            [key]: previewUrls
        }));

        const currentVariant = watch(`variants.${variantIndex}`);
        const updatedValues = [...currentVariant.values];
        updatedValues[valueIndex] = {
            ...updatedValues[valueIndex],
            images: filesArray
        };
        setValue(`variants.${variantIndex}.values`, updatedValues);
    };

    const updateVariantValue = (variantIndex: number, valueIndex: number, field: string, newValue: any) => {
        const currentVariant = watch(`variants.${variantIndex}`);
        const updatedValues = [...currentVariant.values];
        updatedValues[valueIndex] = {
            ...updatedValues[valueIndex],
            [field]: newValue
        };
        setValue(`variants.${variantIndex}.values`, updatedValues);
    };

    const renderVariantValueInput = (
        variant: VariantTemplate,
        variantIndex: number,
        template: VariantTemplate
    ) => {
        const key = `${variantIndex}-input`;

        switch (variant.inputType) {
            case 'color':
                return (
                    <div className="space-y-4">
                        {template.options && template.options.length > 0 && (
                            <div className="space-y-3">
                                <h5 className="text-sm font-medium">Pre-configured Colors</h5>
                                <div className="grid grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto">
                                    {template.options.map((option: VariantOption) => {
                                        const isSelected = variant.values?.some((v: any) => v.value === option.value);
                                        return (
                                            <button
                                                key={option.value}
                                                type="button"
                                                className={`
                          relative p-2 rounded-lg border-2 transition-all
                          ${isSelected
                                                        ? 'border-blue-500 ring-2 ring-blue-200'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                    }
                        `}
                                                onClick={() => {
                                                    if (!isSelected) {
                                                        addValueToVariant(variantIndex, {
                                                            value: option.value,
                                                            label: option.name,
                                                            colorCode: option.colorCode,
                                                            additionalPrice: option.additionalPrice
                                                        });
                                                    }
                                                }}
                                                disabled={isSelected}
                                            >
                                                <div
                                                    className="w-8 h-8 rounded-full border border-gray-300 mx-auto"
                                                    style={{ backgroundColor: option.colorCode || option.value }}
                                                />
                                                <p className="text-xs mt-1 truncate">{option.name}</p>
                                                {option.additionalPrice && option.additionalPrice !== 0 && (
                                                    <span className="text-xs text-green-600">
                                                        +${option.additionalPrice}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <h5 className="text-sm font-medium">Add Custom Color</h5>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={editingValues[`${key}-color`] || '#000000'}
                                    onChange={(e) => setEditingValues(prev => ({
                                        ...prev,
                                        [`${key}-color`]: e.target.value
                                    }))}
                                    className="w-12 h-10 rounded border border-gray-300"
                                />
                                <Input
                                    placeholder="Color name (e.g., Ocean Blue)"
                                    value={editingValues[`${key}-name`] || ''}
                                    onChange={(e) => setEditingValues(prev => ({
                                        ...prev,
                                        [`${key}-name`]: e.target.value
                                    }))}
                                    className="flex-1"
                                />
                                <Input
                                    type="number"
                                    placeholder="Price +/-"
                                    value={editingValues[`${key}-price`] || ''}
                                    onChange={(e) => setEditingValues(prev => ({
                                        ...prev,
                                        [`${key}-price`]: e.target.value
                                    }))}
                                    className="w-24"
                                />
                                <Button
                                    type="button"
                                    onClick={() => {
                                        const colorCode = editingValues[`${key}-color`] || '#000000';
                                        const colorName = editingValues[`${key}-name`];
                                        const price = parseFloat(editingValues[`${key}-price`] || '0');

                                        if (colorName) {
                                            addValueToVariant(variantIndex, {
                                                value: colorCode,
                                                label: colorName,
                                                colorCode,
                                                additionalPrice: price
                                            });

                                            // Clear inputs
                                            setEditingValues(prev => ({
                                                ...prev,
                                                [`${key}-color`]: '#000000',
                                                [`${key}-name`]: '',
                                                [`${key}-price`]: ''
                                            }));
                                        }
                                    }}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                );
            case 'select':
            case 'multiselect':
                return (
                    <div className="space-y-4">
                        {template.options && template.options.length > 0 && (
                            <div className="space-y-3">
                                <h5 className="text-sm font-medium">Pre-configured Options</h5>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                                    {template.options.map((option: VariantOption) => {
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
                                                            label: option.name,
                                                            additionalPrice: option.additionalPrice
                                                        });
                                                    }
                                                }}
                                                disabled={isSelected}
                                                className="justify-start text-left h-auto py-2"
                                            >
                                                <div className="flex flex-col items-start w-full">
                                                    <span className="font-medium">{option.name}</span>
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
                                    placeholder={`Add custom ${variant.name.toLowerCase()} option`}
                                    value={editingValues[`${key}-value`] || ''}
                                    onChange={(e) => setEditingValues(prev => ({
                                        ...prev,
                                        [`${key}-value`]: e.target.value
                                    }))}
                                    className="flex-1"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const value = editingValues[`${key}-value`];
                                            const label = editingValues[`${key}-label`] || value;
                                            const price = parseFloat(editingValues[`${key}-price`] || '0');

                                            if (value) {
                                                addValueToVariant(variantIndex, {
                                                    value,
                                                    label,
                                                    additionalPrice: price
                                                });

                                                // Clear inputs
                                                setEditingValues(prev => ({
                                                    ...prev,
                                                    [`${key}-value`]: '',
                                                    [`${key}-label`]: '',
                                                    [`${key}-price`]: ''
                                                }));
                                            }
                                        }
                                    }}
                                />
                                <Input
                                    placeholder="Display name"
                                    value={editingValues[`${key}-label`] || ''}
                                    onChange={(e) => setEditingValues(prev => ({
                                        ...prev,
                                        [`${key}-label`]: e.target.value
                                    }))}
                                    className="flex-1"
                                />
                                <Input
                                    type="number"
                                    placeholder="Price +/-"
                                    value={editingValues[`${key}-price`] || ''}
                                    onChange={(e) => setEditingValues(prev => ({
                                        ...prev,
                                        [`${key}-price`]: e.target.value
                                    }))}
                                    className="w-24"
                                />
                                <Button
                                    type="button"
                                    onClick={() => {
                                        const value = editingValues[`${key}-value`];
                                        const label = editingValues[`${key}-label`] || value;
                                        const price = parseFloat(editingValues[`${key}-price`] || '0');

                                        if (value) {
                                            addValueToVariant(variantIndex, {
                                                value,
                                                label,
                                                additionalPrice: price
                                            });

                                            setEditingValues(prev => ({
                                                ...prev,
                                                [`${key}-value`]: '',
                                                [`${key}-label`]: '',
                                                [`${key}-price`]: ''
                                            }));
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
                                            additionalPrice: template.options?.find(o => o.value === 'true')?.additionalPrice || 0
                                        });
                                    }
                                }}
                                disabled={variant.values?.some((v: any) => v.value === 'true')}
                            >
                                Yes
                                {template.options?.find(o => o.value === 'true')?.additionalPrice && (
                                    <span className="ml-2 text-xs text-green-600">
                                        +${template.options.find(o => o.value === 'true')?.additionalPrice}
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
                                            additionalPrice: template.options?.find(o => o.value === 'false')?.additionalPrice || 0
                                        });
                                    }
                                }}
                                disabled={variant.values?.some((v: any) => v.value === 'false')}
                            >
                                No
                                {template.options?.find(o => o.value === 'false')?.additionalPrice && (
                                    <span className="ml-2 text-xs text-green-600">
                                        +${template.options.find(o => o.value === 'false')?.additionalPrice}
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
                                placeholder={`Add ${variant.name.toLowerCase()} value`}
                                value={editingValues[`${key}-value`] || ''}
                                onChange={(e) => setEditingValues(prev => ({
                                    ...prev,
                                    [`${key}-value`]: e.target.value
                                }))}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const value = editingValues[`${key}-value`];
                                        if (value) {
                                            addValueToVariant(variantIndex, { value });
                                            setEditingValues(prev => ({
                                                ...prev,
                                                [`${key}-value`]: ''
                                            }));
                                        }
                                    }
                                }}
                            />
                            <Button
                                type="button"
                                onClick={() => {
                                    const value = editingValues[`${key}-value`];
                                    if (value) {
                                        addValueToVariant(variantIndex, { value });
                                        setEditingValues(prev => ({
                                            ...prev,
                                            [`${key}-value`]: ''
                                        }));
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

    const renderSelectedValues = (variant: VariantTemplate, variantIndex: number) => {
        const currentValues = variant.values || [];
        
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
                <h5 className="text-sm font-medium">Selected Values ({variant.values.length})</h5>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {currentValues.map((value: any, valueIndex: number) => (
                        <div key={value.id} className="p-3 bg-gray-50 rounded-lg border">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                    {variant.inputType === 'color' && value.colorCode && (
                                        <div
                                            className="w-6 h-6 rounded-full border border-gray-300 flex-shrink-0"
                                            style={{ backgroundColor: value.colorCode }}
                                        />
                                    )}

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

                                        <div className="flex items-center gap-2 mb-2">
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

                                        {variant.inputType === 'color' && (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="file"
                                                        multiple
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            if (e.target.files) {
                                                                handleImageUpload(variantIndex, valueIndex, e.target.files);
                                                            }
                                                        }}
                                                        className="hidden"
                                                        id={`color-images-${variantIndex}-${valueIndex}`}
                                                    />
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            document.getElementById(`color-images-${variantIndex}-${valueIndex}`)?.click();
                                                        }}
                                                        className="h-7 text-xs"
                                                    >
                                                        <Upload className="h-3 w-3 mr-1" />
                                                        Upload Images ({value.images?.length || 0})
                                                    </Button>
                                                </div>

                                                {previewImages[`${variantIndex}-${valueIndex}`] && (
                                                    <div className="flex gap-1 flex-wrap">
                                                        {previewImages[`${variantIndex}-${valueIndex}`].slice(0, 5).map((url, imgIndex) => (
                                                            <div key={imgIndex} className="relative">
                                                                <Image
                                                                    src={url}
                                                                    width={50}
                                                                    height={50}
                                                                    alt={`Preview ${imgIndex + 1}`}
                                                                    className="w-12 h-12 object-cover rounded border"
                                                                />
                                                            </div>
                                                        ))}
                                                        {previewImages[`${variantIndex}-${valueIndex}`].length > 5 && (
                                                            <div className="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center text-xs">
                                                                +{previewImages[`${variantIndex}-${valueIndex}`].length - 5}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
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
                        Select from pre-configured variant types based on your product category
                    </p>
                </CardHeader>
                <CardContent>
                    {variantTemplates.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-medium mb-2">No Variant Templates Available</h3>
                            <p className="text-sm">
                                Select a product type in the previous step to see available variant options.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {variantTemplates.map(template => {
                                const isAdded = variantFields.some((field: any) => field.id === template.id);
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
                        const variant = field as VariantTemplate;

                        const template = variantTemplates.find(t => t.id === variant.templateId);

                        if (!template) return null;

                        return (
                            <Card key={variant.id} className="border-l-4 border-l-blue-500">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-base">{variant.name}</CardTitle>
                                            {variant.isRequired && (
                                                <Badge variant="destructive" className="text-xs">Required</Badge>
                                            )}
                                            <Badge variant="outline" className="text-xs">{variant.inputType}</Badge>
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
                                    {template.description && (
                                        <p className="text-sm text-muted-foreground">{template.description}</p>
                                    )}
                                </CardHeader>

                                <CardContent className="space-y-6">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            checked={variant.isRequired}
                                            onCheckedChange={(checked) => {
                                                setValue(`variants.${variantIndex}.required`, checked);
                                            }}
                                            id={`required-${variant.id}`}
                                        />
                                        <Label htmlFor={`required-${variant.id}`}>Required variant</Label>
                                    </div>

                                    <Separator />

                                    {renderVariantValueInput(variant, variantIndex, template)}

                                    <Separator />

                                    {renderSelectedValues(variant, variantIndex)}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {variantFields.length === 0 && (
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