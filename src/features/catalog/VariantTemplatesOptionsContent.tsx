import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Palette, 
  Target, 
  ListFilter, 
  CheckCircle, 
  DollarSign, 
  AlertCircle, 
  Plus,
  Trash2
} from 'lucide-react';
import { 
  getVariantsForProductType,
  getVariantTemplateDetails,
  getVariantOptionsForTemplate
} from '@/lib/actions/catalog-server-actions';
import { VariantTemplateActions } from './components/VariantTemplateActions';

interface VariantTemplatesOptionsContentProps {
    productTypeId: string;
}

export async function VariantTemplatesOptionsContent({ productTypeId }: VariantTemplatesOptionsContentProps) {
    const variantsResponse = await getVariantsForProductType({ productTypeId });
    
    if (!variantsResponse.success || !variantsResponse.data) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Palette className="h-5 w-5 mr-2" />
                        Variant Templates & Options
                    </CardTitle>
                    <CardDescription>
                        Failed to load variant templates
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-red-500">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                        <div className="text-sm">Failed to load variant templates</div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const assignments = variantsResponse.data.documents;

    const variantTemplatesWithOptions = await Promise.all(
        assignments.map(async (assignment) => {
            const [templateResult, optionsResult] = await Promise.all([
                getVariantTemplateDetails(assignment.variantTemplateId),
                getVariantOptionsForTemplate({
                    variantTemplateId: assignment.variantTemplateId,
                }),
            ]);

            return {
                assignment,
                template: templateResult.success ? templateResult.data : null,
                options: optionsResult.success
                    ? optionsResult.data?.documents || []
                    : [],
            };
        })
    );

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center">
                            <Palette className="h-5 w-5 mr-2" />
                            Variant Templates & Options
                        </CardTitle>
                        <CardDescription>
                            Detailed view of all assigned variant templates and their options
                        </CardDescription>
                    </div>
                    <VariantTemplateActions productTypeId={productTypeId} />
                </div>
            </CardHeader>
            <CardContent>
                {variantTemplatesWithOptions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">No variant templates assigned</h3>
                        <p className="text-muted-foreground mb-4">
                            Assign variant templates to define product options like color, size, etc.
                        </p>
                        <VariantTemplateActions productTypeId={productTypeId} />
                    </div>
                ) : (
                    <Accordion type="multiple" className="w-full">
                        {variantTemplatesWithOptions.map(({ assignment, template, options }, index) => (
                            <AccordionItem 
                                value={index.toString()} 
                                key={assignment.$id} 
                                className="border-l-4 border-l-purple-200 pl-4 py-2"
                            >
                                <AccordionTrigger className="justify-start gap-4 py-3 text-[15px] leading-6 hover:no-underline [&>svg]:-order-1 [&>svg]:h-4 [&>svg]:w-4">
                                    <div className="flex items-center space-x-3 flex-1">
                                        <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg shadow-sm">
                                            <Target className="h-4 w-4 text-purple-700" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className="font-semibold text-gray-900">
                                                {assignment.variantTemplateName || template?.variantTemplateName}
                                            </div>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <Badge variant="outline" className="text-xs px-2 py-0.5">
                                                    {assignment.inputType || template?.inputType}
                                                </Badge>
                                                {assignment.isRequired && (
                                                    <Badge variant="destructive" className="text-xs px-2 py-0.5">
                                                        Required
                                                    </Badge>
                                                )}
                                                <span className="text-xs text-muted-foreground">
                                                    Sort: {assignment.sortOrder}
                                                </span>
                                                <Badge variant="secondary" className="text-xs px-2 py-0.5 ml-auto">
                                                    {options.length} option{options.length !== 1 ? 's' : ''}
                                                </Badge>
                                            </div>
                                        </div>
                                        <VariantTemplateActions 
                                            productTypeId={productTypeId} 
                                            assignmentId={assignment.$id}
                                            variantTemplateId={assignment.variantTemplateId}
                                            showRemoveOnly 
                                        />
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="ps-11 pb-4 pt-2">
                                    {/* Template Description */}
                                    {template?.description && (
                                        <div className="text-sm text-muted-foreground mb-4 p-3 bg-gray-50 rounded-lg border-l-2 border-purple-200">
                                            {template.description}
                                        </div>
                                    )}

                                    {/* Options Display */}
                                    {options.length > 0 ? (
                                        <div className="space-y-3">
                                            <div className="text-sm font-semibold text-gray-700 flex items-center">
                                                <ListFilter className="h-4 w-4 mr-2" />
                                                Available Options:
                                            </div>
                                            <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                                {options.map((option) => (
                                                    <div key={option.$id} className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all hover:shadow-md hover:border-purple-300">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-center space-x-3 flex-1">
                                                                {/* Color swatch for color variants */}
                                                                {(assignment.inputType === 'color' || template?.inputType === 'color') && option.colorCode && (
                                                                    <div className="relative">
                                                                        <div 
                                                                            className="w-8 h-8 rounded-lg border-2 border-white shadow-sm ring-1 ring-gray-200"
                                                                            style={{ backgroundColor: option.colorCode }}
                                                                        />
                                                                        {option.isDefault && (
                                                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="font-medium text-gray-900 truncate">
                                                                        {option.label}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500 mt-0.5">
                                                                        Value: <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-xs">{option.value}</span>
                                                                    </div>
                                                                    {(assignment.inputType === 'color' || template?.inputType === 'color') && option.colorCode && (
                                                                        <div className="text-xs text-gray-500 mt-0.5">
                                                                            Color: <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-xs">{option.colorCode}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-col items-end space-y-1">
                                                                {/* Price badge */}
                                                                {option.additionalPrice !== 0 && (
                                                                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                                        option.additionalPrice > 0 
                                                                            ? 'bg-green-100 text-green-800' 
                                                                            : 'bg-red-100 text-red-800'
                                                                    }`}>
                                                                        <DollarSign className="h-3 w-3 mr-0.5" />
                                                                        {option.additionalPrice > 0 ? '+' : ''}{option.additionalPrice}
                                                                    </div>
                                                                )}
                                                                
                                                                {/* Default badge */}
                                                                {option.isDefault && (
                                                                    <Badge variant="outline" className="text-xs px-2 py-0.5 bg-green-50 border-green-200 text-green-700">
                                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                                        Default
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                            <div className="text-sm">No options available for this template</div>
                                        </div>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </CardContent>
        </Card>
    );
}