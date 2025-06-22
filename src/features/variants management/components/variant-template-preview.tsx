// "use client";

// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Switch } from "@/components/ui/switch";
// import { Input } from "@/components/ui/input";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Slider } from "@/components/ui/slider";
// import {
//     Globe,
//     Store,
//     CheckCircle,
//     XCircle
// } from "lucide-react";
// import { VariantTemplate } from "@/lib/types";

// interface VariantTemplatePreviewProps {
//     template: VariantTemplate;
//     interactive?: boolean;
// }

// export function VariantTemplatePreview({
//     template,
//     interactive = false
// }: VariantTemplatePreviewProps) {
//     const renderVariantControl = () => {
//         switch (template.type) {
//             case 'select':
//                 return (
//                     <Select disabled={!interactive}>
//                         <SelectTrigger>
//                             <SelectValue placeholder="Select an option" />
//                         </SelectTrigger>
//                         <SelectContent>
//                             {template.options?.map((option) => (
//                                 <SelectItem key={option.value} value={option.value}>
//                                     <div className="flex items-center justify-between w-full">
//                                         <span>{option.label || option.value}</span>
//                                         {option.additionalPrice > 0 && (
//                                             <Badge variant="outline" className="ml-2">
//                                                 +${option.additionalPrice}
//                                             </Badge>
//                                         )}
//                                     </div>
//                                 </SelectItem>
//                             ))}
//                         </SelectContent>
//                     </Select>
//                 );

//             case 'multiselect':
//                 return (
//                     <div className="space-y-2">
//                         {template.options?.map((option) => (
//                             <div key={option.value} className="flex items-center space-x-2">
//                                 <Checkbox id={option.value} disabled={!interactive} />
//                                 <label
//                                     htmlFor={option.value}
//                                     className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
//                                 >
//                                     {option.label || option.value}
//                                     {option.additionalPrice > 0 && (
//                                         <Badge variant="outline" className="ml-2">
//                                             +${option.additionalPrice}
//                                         </Badge>
//                                     )}
//                                 </label>
//                             </div>
//                         ))}
//                         {template.minSelections && template.maxSelections && (
//                             <p className="text-xs text-muted-foreground">
//                                 Select {template.minSelections} to {template.maxSelections} options
//                             </p>
//                         )}
//                     </div>
//                 );

//             case 'color':
//                 return (
//                     <div className="grid grid-cols-4 gap-3">
//                         {template.options?.map((option) => (
//                             <div key={option.value} className="text-center">
//                                 <div
//                                     className="w-8 h-8 rounded-full border mx-auto mb-1 cursor-pointer"
//                                     style={{ backgroundColor: option.hex || '#ccc' }}
//                                     title={option.label || option.value}
//                                 />
//                                 <div className="text-xs font-medium">{option.label}</div>
//                                 {option.additionalPrice > 0 && (
//                                     <div className="text-xs text-muted-foreground">
//                                         +${option.additionalPrice}
//                                     </div>
//                                 )}
//                             </div>
//                         ))}
//                     </div>
//                 );

//             case 'boolean':
//                 return (
//                     <div className="flex items-center space-x-2">
//                         <Switch disabled={!interactive} />
//                         <span className="text-sm">Enable this option</span>
//                     </div>
//                 );

//             case 'text':
//                 return (
//                     <Input
//                         placeholder={`Enter ${template.name.toLowerCase()}...`}
//                         disabled={!interactive}
//                     />
//                 );

//             case 'number':
//                 return (
//                     <Input
//                         type="number"
//                         placeholder={`Enter ${template.name.toLowerCase()}...`}
//                         disabled={!interactive}
//                     />
//                 );

//             case 'range':
//                 return (
//                     <div className="space-y-2">
//                         <Slider
//                             defaultValue={[50]}
//                             max={100}
//                             step={1}
//                             disabled={!interactive}
//                             className="w-full"
//                         />
//                         <div className="flex justify-between text-xs text-muted-foreground">
//                             <span>Min</span>
//                             <span>Max</span>
//                         </div>
//                     </div>
//                 );

//             default:
//                 return (
//                     <div className="text-sm text-muted-foreground">
//                         Preview not available for this variant type
//                     </div>
//                 );
//         }
//     };

//     return (
//         <div className="space-y-6">
//             {/* Template Overview */}
//             <Card>
//                 <CardHeader>
//                     <div className="flex items-center justify-between">
//                         <div>
//                             <CardTitle className="flex items-center gap-2">
//                                 {template.name}
//                                 {template.isRequired && (
//                                     <Badge variant="secondary">Required</Badge>
//                                 )}
//                             </CardTitle>
//                             <CardDescription>
//                                 {template.description || "No description provided"}
//                             </CardDescription>
//                         </div>
//                         <div className="flex items-center gap-2">
//                             <Badge variant="outline" className="capitalize">
//                                 {template.type}
//                             </Badge>
//                             {!template.storeId ? (
//                                 <Badge variant="outline">
//                                     <Globe className="w-3 h-3 mr-1" />
//                                     Global
//                                 </Badge>
//                             ) : (
//                                 <Badge variant="secondary">
//                                     <Store className="w-3 h-3 mr-1" />
//                                     Store
//                                 </Badge>
//                             )}
//                             <Badge variant={template.isActive ? "default" : "secondary"}>
//                                 {template.isActive ? (
//                                     <CheckCircle className="w-3 h-3 mr-1" />
//                                 ) : (
//                                     <XCircle className="w-3 h-3 mr-1" />
//                                 )}
//                                 {template.isActive ? "Active" : "Inactive"}
//                             </Badge>
//                         </div>
//                     </div>
//                 </CardHeader>
//                 <CardContent>
//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
//                         <div>
//                             <span className="font-medium text-muted-foreground">Type:</span>
//                             <p className="capitalize">{template.type}</p>
//                         </div>
//                         <div>
//                             <span className="font-medium text-muted-foreground">Options:</span>
//                             <p>{template.options?.length || 0} defined</p>
//                         </div>
//                         <div>
//                             <span className="font-medium text-muted-foreground">Scope:</span>
//                             <p>{template.storeId ? "Store-specific" : "Global"}</p>
//                         </div>
//                         {template.type === 'multiselect' && (
//                             <>
//                                 <div>
//                                     <span className="font-medium text-muted-foreground">Min Selections:</span>
//                                     <p>{template.minSelections || 0}</p>
//                                 </div>
//                                 <div>
//                                     <span className="font-medium text-muted-foreground">Max Selections:</span>
//                                     <p>{template.maxSelections || "No limit"}</p>
//                                 </div>
//                             </>
//                         )}
//                         <div>
//                             <span className="font-medium text-muted-foreground">Custom Values:</span>
//                             <p>{template.allowCustomValues ? "Allowed" : "Not allowed"}</p>
//                         </div>
//                     </div>
//                 </CardContent>
//             </Card>

//             {/* Live Preview */}
//             <Card>
//                 <CardHeader>
//                     <CardTitle>Customer View Preview</CardTitle>
//                     <CardDescription>
//                         How this variant will appear to customers
//                     </CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                     <div className="border rounded-lg p-4 bg-muted/50">
//                         <div className="mb-3">
//                             <div className="flex items-center gap-2">
//                                 <span className="font-medium">{template.name}</span>
//                                 {template.isRequired && (
//                                     <Badge variant="destructive" className="text-xs">Required</Badge>
//                                 )}
//                             </div>
//                             {template.description && (
//                                 <p className="text-sm text-muted-foreground mt-1">
//                                     {template.description}
//                                 </p>
//                             )}
//                         </div>
//                         {renderVariantControl()}
//                     </div>
//                 </CardContent>
//             </Card>

//             {/* Options Details */}
//             {template.options && template.options.length > 0 && (
//                 <Card>
//                     <CardHeader>
//                         <CardTitle>Options ({template.options.length})</CardTitle>
//                         <CardDescription>
//                             Available choices for this variant
//                         </CardDescription>
//                     </CardHeader>
//                     <CardContent>
//                         <div className="space-y-3">
//                             {template.options.map((option, index) => (
//                                 <div key={option.value} className="flex items-center justify-between p-3 border rounded-lg">
//                                     <div className="flex items-center gap-3">
//                                         <div className="text-sm font-medium text-muted-foreground">
//                                             #{index + 1}
//                                         </div>
//                                         {template.type === 'color' && option.hex && (
//                                             <div
//                                                 className="w-4 h-4 rounded border"
//                                                 style={{ backgroundColor: option.hex }}
//                                             />
//                                         )}
//                                         <div>
//                                             <div className="font-medium">{option.label || option.value}</div>
//                                             <div className="text-sm text-muted-foreground">
//                                                 Value: {option.value}
//                                             </div>
//                                         </div>
//                                     </div>
//                                     <div className="flex items-center gap-2">
//                                         {option.additionalPrice > 0 && (
//                                             <Badge variant="outline">+${option.additionalPrice}</Badge>
//                                         )}
//                                         {option.isDefault && (
//                                             <Badge variant="secondary">Default</Badge>
//                                         )}
//                                         <Badge variant={option.isActive ? "default" : "secondary"}>
//                                             {option.isActive ? "Active" : "Inactive"}
//                                         </Badge>
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//                     </CardContent>
//                 </Card>
//             )}

//             {/* Associations */}
//             {(template.categoryIds?.length > 0 || template.productTypeIds?.length > 0) && (
//                 <Card>
//                     <CardHeader>
//                         <CardTitle>Associations</CardTitle>
//                         <CardDescription>
//                             Categories and product types this template is linked to
//                         </CardDescription>
//                     </CardHeader>
//                     <CardContent>
//                         <div className="space-y-4">
//                             {template.categoryIds && template.categoryIds.length > 0 && (
//                                 <div>
//                                     <h4 className="font-medium mb-2">Categories ({template.categoryIds.length})</h4>
//                                     <div className="flex flex-wrap gap-2">
//                                         {template.categoryIds.map((categoryId: string) => (
//                                             <Badge key={categoryId} variant="outline">
//                                                 {categoryId}
//                                             </Badge>
//                                         ))}
//                                     </div>
//                                 </div>
//                             )}
//                             {template.productTypeIds && template.productTypeIds.length > 0 && (
//                                 <div>
//                                     <h4 className="font-medium mb-2">Product Types ({template.productTypeIds.length})</h4>
//                                     <div className="flex flex-wrap gap-2">
//                                         {template.productTypeIds.map((productTypeId: string) => (
//                                             <Badge key={productTypeId} variant="outline">
//                                                 {productTypeId}
//                                             </Badge>
//                                         ))}
//                                     </div>
//                                 </div>
//                             )}
//                         </div>
//                     </CardContent>
//                 </Card>
//             )}

//             <Card>
//                 <CardHeader>
//                     <CardTitle>Advanced Settings</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                         <div className="space-y-3">
//                             <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
//                                 <span className="text-sm font-medium">Required Field</span>
//                                 <Badge variant={template.isRequired ? "secondary" : "outline"}>
//                                     {template.isRequired ? "Yes" : "No"}
//                                 </Badge>
//                             </div>
//                             <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
//                                 <span className="text-sm font-medium">Allow Custom Values</span>
//                                 <Badge variant={template.allowCustomValues ? "secondary" : "outline"}>
//                                     {template.allowCustomValues ? "Yes" : "No"}
//                                 </Badge>
//                             </div>
//                             <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
//                                 <span className="text-sm font-medium">Status</span>
//                                 <Badge variant={template.isActive ? "default" : "secondary"}>
//                                     {template.isActive ? "Active" : "Inactive"}
//                                 </Badge>
//                             </div>
//                         </div>
//                         <div className="space-y-3">
//                             {template.type === 'multiselect' && (
//                                 <>
//                                     <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
//                                         <span className="text-sm font-medium">Min Selections</span>
//                                         <Badge variant="outline">{template.minSelections || 0}</Badge>
//                                     </div>
//                                     <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
//                                         <span className="text-sm font-medium">Max Selections</span>
//                                         <Badge variant="outline">{template.maxSelections || "Unlimited"}</Badge>
//                                     </div>
//                                 </>
//                             )}
//                             <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
//                                 <span className="text-sm font-medium">Default Value</span>
//                                 <Badge variant="outline">{template.defaultValue || "None"}</Badge>
//                             </div>
//                         </div>
//                     </div>
//                 </CardContent>
//             </Card>

//             {/* Metadata */}
//             <Card>
//                 <CardHeader>
//                     <CardTitle>Template Information</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
//                         <div>
//                             <span className="font-medium text-muted-foreground">Created:</span>
//                             <p>{new Date(template.$createdAt).toLocaleDateString()}</p>
//                         </div>
//                         <div>
//                             <span className="font-medium text-muted-foreground">Last Updated:</span>
//                             <p>{new Date(template.$updatedAt).toLocaleDateString()}</p>
//                         </div>
//                         <div>
//                             <span className="font-medium text-muted-foreground">Template ID:</span>
//                             <p className="font-mono text-xs">{template.$id}</p>
//                         </div>
//                         <div>
//                             <span className="font-medium text-muted-foreground">Created By:</span>
//                             <p>{template.createdBy}</p>
//                         </div>
//                     </div>
//                 </CardContent>
//             </Card>
//         </div>
//     );
// }

import React from 'react';

function Prev() {
    return (
        <div>
            
        </div>
    );
}

export default Prev;