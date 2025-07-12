/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
// import VariantTemplateForm from "../enhanced-variant-template-form";
import { Edit } from "lucide-react";
// import { VariantTemplatePreview } from "./variant-template-preview";

export const CreateTemplateModal = ({
    // storeId,
    // productTypeId,
    // onClose
}: {
    storeId?: string;
    // productTypeId?: string;
    onClose: () => void;
}) => {
    return (
        <div className="p-6 max-w-2xl mx-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold">Create Variant Template</h2>
                <p className="text-muted-foreground">
                    Create a new variant template with basic options
                </p>
            </div>
            {/* <VariantTemplateForm
                mode="create"
                storeId={storeId}
                // productTypeId={productTypeId}
                // onSuccess={onClose}
                // onCancel={onClose}
                // simplified={true}
            /> */}
        </div>
    )
};

export const EditTemplateModal = ({
    template,
    // storeId,
    // onClose
}: {
    template: any;
    storeId?: string;
    onClose: () => void;
}) => {
    return (
        <div className="p-6 max-w-2xl mx-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold">Edit {template.name}</h2>
                <p className="text-muted-foreground">
                    Make quick changes to this variant template
                </p>
            </div>
            {/* <VariantTemplateForm
                mode="edit"
                initialData={template}
                storeId={storeId}
                // onSuccess={onClose}
                // onCancel={onClose}
                // simplified={true}
            /> */}
        </div>
    )
}

export const ViewTemplateModal = ({
    template,
    onClose,
    onEdit,
    readonly
}: {
    template: any;
    onClose: () => void;
    onEdit: () => void;
    readonly: boolean;
}) => {
    return (
        <div className="p-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold">{template.name}</h2>
                    <p className="text-muted-foreground">
                        {template.description || "Variant template details"}
                    </p>
                </div>
                <div className="flex gap-2">
                    {!readonly && (
                        <Button onClick={onEdit}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                        </Button>
                    )}
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
            {/* <VariantTemplatePreview template={template} /> */}
        </div>
    );
}