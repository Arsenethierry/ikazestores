/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { VariantType } from "@/lib/schemas/product-variants-schema";
import { VariantGroup, VariantOptions, VariantTemplate } from "@/lib/types";
import { ChevronDown, Plus, RefreshCw, X } from "lucide-react";
import { useEffect, useState } from "react";

interface ProductVariantSelectorProps {
    variantTemplates: VariantTemplate[];
    variantGroups: VariantGroup[];
    onVariantChange: (selectedVariants: Record<string, any>) => void;
    initialVariants?: Record<string, any>;
}

export const ProductVariantSelector = ({
    onVariantChange,
    variantGroups,
    variantTemplates,
    initialVariants
}: ProductVariantSelectorProps) => {
    const [selectedVariants, setSelectedVariants] = useState<Record<string, any>>(initialVariants!);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const defaults: Record<string, any> = {};

        variantTemplates.forEach(template => {
            if (template.defaultValue && !selectedVariants[template.$id]) {
                defaults[template.$id] = template.defaultValue;
            } else if (template.type === VariantType.BOOLEAN && !selectedVariants[template.$id]) {
                defaults[template.$id] = false;
            }
        });

        if (Object.keys(defaults).length > 0) {
            setSelectedVariants(prev => ({ ...prev, ...defaults }));
        }
    }, [variantTemplates, selectedVariants]);

    useEffect(() => {
        onVariantChange(selectedVariants);
    }, [selectedVariants, onVariantChange]);

    const organizedVariants = () => {
        const templatesMap = variantTemplates.reduce((acc, template) => {
            acc[template.$id] = template;
            return acc;
        }, {} as Record<string, VariantTemplate>);

        const grouped = variantGroups.map(group => ({
            group,
            templates: group.variants && group.variants
                .map(id => templatesMap[id])
                .filter(Boolean)
        }));

        const usedTemplateIds = new Set(
            variantGroups.flatMap(group => group.variants)
        );

        const ungroupedTemplates = variantTemplates.filter(
            template => !usedTemplateIds.has(template.$id)
        );

        return {
            grouped,
            ungrouped: ungroupedTemplates
        }
    }

    const { grouped, ungrouped } = organizedVariants();

    const handleVariantChange = (templateId: string, value: any) => {
        setSelectedVariants(prev => ({
            ...prev,
            [templateId]: value
        }));
    };

    const toggleGroupExpansion = (groupId: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
    };

    // const calculateAdditionalPrice = (template: VariantTemplate, value: string) => {
    //     if (!template.variantOptions) return 0;

    //     const option = template.variantOptions.find(opt => opt.value === value);
    //     return option ? option.additionalPrice : 0;
    // }

    const renderVariantInput = (template: VariantTemplate) => {
        const value = selectedVariants[template.$id];

        switch (template.type) {
            case VariantType.SELECT:
                return (
                    <Select
                        value={value || ""}
                        onValueChange={(val) => handleVariantChange(template.$id, val)}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder={`Select ${template.name}`} />
                        </SelectTrigger>
                        <SelectContent>
                            {template.options?.map((option: VariantOptions) => (
                                <SelectItem key={option.value} value={option.value}>
                                    <div className="flex justify-between w-full">
                                        <span>{option.label}</span>
                                        {option.additionalPrice > 0 && (
                                            <span className="text-muted-foreground ml-2">
                                                +${option.additionalPrice.toFixed(2)}
                                            </span>
                                        )}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );

            case VariantType.BOOLEAN:
                return (
                    <div className="flex items-center space-x-2">
                        <Switch
                            checked={!!value}
                            onCheckedChange={(checked) => handleVariantChange(template.$id, checked)}
                        />
                        <span className="text-sm">
                            {value ? "Yes" : "No"}
                        </span>
                    </div>
                );
            case VariantType.TEXT:
                return (
                    <Input
                        type="text"
                        value={value || ""}
                        onChange={(e) => handleVariantChange(template.$id, e.target.value)}
                        placeholder={`Enter ${template.name}`}
                    />
                );

            case VariantType.NUMBER:
                return (
                    <Input
                        type="number"
                        value={value || ""}
                        onChange={(e) => handleVariantChange(template.$id, e.target.value)}
                        placeholder={`Enter ${template.name}`}
                    />
                );

            case VariantType.MULTISELECT:
                const selectedValues = Array.isArray(value) ? value : [];
                return (
                    <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                            {selectedValues.length > 0 ? selectedValues.map(val => {
                                const option = template.options?.find((opt: VariantOptions) => opt.value === val);
                                return (
                                    <Badge key={val} className="flex items-center gap-1 pr-1">
                                        {option?.label || val}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-4 w-4 ml-1"
                                            onClick={() => {
                                                const newValues = selectedValues.filter(v => v !== val);
                                                handleVariantChange(template.$id, newValues);
                                            }}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                );
                            }) : (
                                <span className="text-sm text-muted-foreground">No options selected</span>
                            )}
                        </div>
                        <Select
                            value=""
                            onValueChange={(val) => {
                                if (val && !selectedValues.includes(val)) {
                                    handleVariantChange(template.$id, [...selectedValues, val]);
                                }
                            }}
                        >
                            <SelectTrigger className="w-full">
                                <span className="flex items-center">
                                    <Plus className="mr-2 h-4 w-4" />
                                    <span>Add option</span>
                                </span>
                            </SelectTrigger>
                            <SelectContent>
                                {template.options?.filter((opt: VariantOptions) => !selectedValues.includes(opt.value)).map((option: VariantOptions) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        <div className="flex justify-between w-full">
                                            <span>{option.label}</span>
                                            {option.additionalPrice > 0 && (
                                                <span className="text-muted-foreground ml-2">
                                                    +${option.additionalPrice.toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                );

            default:
                return <p className="text-sm text-muted-foreground">Unsupported variant type</p>;
        }
    }

    const renderVariantItem = (template: VariantTemplate) => {
        return (
            <div key={template.$id} className="space-y-2 py-3">
                <div className="flex justify-between">
                    <Label className="flex items-center">
                        {template.name}
                        {template.isRequired && (
                            <span className="text-red-500 ml-1">*</span>
                        )}
                    </Label>
                    {selectedVariants[template.$id] && template.type !== VariantType.BOOLEAN && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2"
                            onClick={() => handleVariantChange(template.$id, null)}
                        >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            <span className="text-xs">Reset</span>
                        </Button>
                    )}
                </div>
                {template.description && (
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                )}
                <div className="mt-1">{renderVariantInput(template)}</div>
            </div>
        )
    }

    if (variantTemplates.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardContent className="p-4">
                {grouped.map(({ group, templates }) => (
                    <div key={group.$id} className="mb-4">
                        <Button
                            variant="ghost"
                            className="w-full flex justify-between items-center p-2 hover:bg-secondary"
                            onClick={() => toggleGroupExpansion(group.$id)}
                        >
                            <span className="font-medium">{group.name}</span>
                            <ChevronDown
                                className={`h-5 w-5 transition-transform ${expandedGroups[group.$id] ? "transform rotate-180" : ""
                                    }`}
                            />
                        </Button>

                        {group.description && (
                            <p className="text-sm text-muted-foreground px-2 mb-2">{group.description}</p>
                        )}

                        {templates && expandedGroups[group.$id] !== false && (
                            <div className="pl-2 space-y-1">
                                {templates.map(renderVariantItem)}
                            </div>
                        )}
                        <Separator className="my-4" />
                    </div>
                ))}

                {ungrouped.length > 0 && (
                    <div className="space-y-4">
                        {ungrouped.map(renderVariantItem)}
                    </div>
                )}

                {Object.keys(selectedVariants).length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                        <h4 className="text-sm font-medium mb-2">Selected Options:</h4>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(selectedVariants).map(([templateId, value]) => {
                                const template = variantTemplates.find(t => t.$id === templateId);
                                if (!template || value === null || value === '' || (Array.isArray(value) && value.length === 0)) return null;

                                let displayValue;

                                if (template.type === VariantType.SELECT) {
                                    const option = template.variantOptions?.find(opt => opt.value === value);
                                    displayValue = option?.label || value;
                                } else if (template.type === VariantType.BOOLEAN) {
                                    displayValue = value ? "Yes" : "No";
                                } else if (template.type === VariantType.MULTISELECT && Array.isArray(value)) {
                                    const selectedLabels = value.map(v => {
                                        const option = template.options?.find((opt: VariantOptions) => opt.value === v);
                                        return option?.label || v;
                                    }).join(", ");
                                    displayValue = selectedLabels;
                                } else {
                                    displayValue = value;
                                }

                                return (
                                    <Badge key={templateId} variant="outline" className="px-2 py-1">
                                        <span className="font-medium mr-1">{template.name}:</span>
                                        <span>{displayValue}</span>
                                    </Badge>
                                )
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}