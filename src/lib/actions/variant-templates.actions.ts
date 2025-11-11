"use server";

import { cache } from "react";
import { getVirtualStoreProducts } from "./affiliate-product-actions";
import {
  getVariantsForProductType,
  getVariantTemplateDetails,
  getVariantOptionsForTemplate,
} from "./catalog-server-actions";

interface VariantTemplateWithOptions {
  $id: string;
  variantTemplateName: string;
  description: string | null;
  inputType: string;
  isRequired: boolean;
  sortOrder: number;
  group?: string;
  variantOptions: Array<{
    $id: string;
    value: string;
    label: string;
    colorCode: string | null;
    additionalPrice: number;
    sortOrder: number;
  }>;
}

/**
 * Get all unique variant templates used by products in a virtual store
 * Cached for performance optimization
 */
export const getVariantTemplatesByStoreProducts = cache(
  async (virtualStoreId: string) => {
    try {
      // 1. Get all products in the virtual store (just first batch to get product types)
      const productsResult = await getVirtualStoreProducts(virtualStoreId, {
        limit: 100,
        offset: 0,
      });

      if (!productsResult.documents || productsResult.documents.length === 0) {
        return {
          documents: [],
          total: 0,
        };
      }

      // 2. Extract unique product type IDs
      const productTypeIds = new Set<string>();
      productsResult.documents.forEach((product) => {
        if (product.productTypeId) {
          productTypeIds.add(product.productTypeId);
        }
      });

      if (productTypeIds.size === 0) {
        return {
          documents: [],
          total: 0,
        };
      }

      // 3. Get variant assignments for all product types
      const allAssignments = await Promise.all(
        Array.from(productTypeIds).map((productTypeId) =>
          getVariantsForProductType({ productTypeId })
        )
      );

      // 4. Extract unique variant template IDs
      const variantTemplateIds = new Set<string>();
      allAssignments.forEach((assignmentResult) => {
        if (assignmentResult.success && assignmentResult.data) {
          assignmentResult.data.documents.forEach((assignment) => {
            variantTemplateIds.add(assignment.variantTemplateId);
          });
        }
      });

      if (variantTemplateIds.size === 0) {
        return {
          documents: [],
          total: 0,
        };
      }

      // 5. Get template details and options for each unique template
      const templatesWithOptions = await Promise.all(
        Array.from(variantTemplateIds).map(async (templateId) => {
          const [templateResult, optionsResult] = await Promise.all([
            getVariantTemplateDetails(templateId),
            getVariantOptionsForTemplate({ variantTemplateId: templateId }),
          ]);

          if (!templateResult.success || !templateResult.data) {
            return null;
          }

          const template = templateResult.data;
          const options = optionsResult.success
            ? optionsResult.data?.documents || []
            : [];

          return {
            $id: template.$id,
            variantTemplateName: template.variantTemplateName,
            description: template.description,
            inputType: template.inputType,
            isRequired: template.isRequired,
            sortOrder: template.sortOrder,
            group: determineVariantGroup(
              template.variantTemplateName,
              template.inputType
            ),
            variantOptions: options.map((option) => ({
              $id: option.$id,
              value: option.value,
              label: option.label,
              colorCode: option.colorCode,
              additionalPrice: option.additionalPrice,
              sortOrder: option.sortOrder,
            })),
          } as VariantTemplateWithOptions;
        })
      );

      // Filter out null results and sort by sortOrder
      const validTemplates = templatesWithOptions
        .filter((t): t is VariantTemplateWithOptions => t !== null)
        .sort((a, b) => a.sortOrder - b.sortOrder);

      return {
        documents: validTemplates,
        total: validTemplates.length,
      };
    } catch (error) {
      console.error(
        "Error fetching variant templates by store products:",
        error
      );
      return {
        documents: [],
        total: 0,
      };
    }
  }
);

/**
 * Determine the group/category for a variant template
 * This helps organize filters in the UI
 */
function determineVariantGroup(
  templateName: string,
  inputType: string
): string {
  const nameLower = templateName.toLowerCase();

  // Color group
  if (
    inputType === "color" ||
    nameLower.includes("color") ||
    nameLower.includes("colour")
  ) {
    return "Colors";
  }

  // Size/Dimensions group
  if (
    nameLower.includes("size") ||
    nameLower.includes("dimension") ||
    nameLower.includes("length") ||
    nameLower.includes("width") ||
    nameLower.includes("height")
  ) {
    return "Size & Fit";
  }

  // Material group
  if (
    nameLower.includes("material") ||
    nameLower.includes("fabric") ||
    nameLower.includes("finish")
  ) {
    return "Material & Finish";
  }

  // Capacity/Storage group
  if (
    nameLower.includes("capacity") ||
    nameLower.includes("storage") ||
    nameLower.includes("memory") ||
    nameLower.includes("gb") ||
    nameLower.includes("tb")
  ) {
    return "Capacity & Storage";
  }

  // Style group
  if (
    nameLower.includes("style") ||
    nameLower.includes("design") ||
    nameLower.includes("pattern")
  ) {
    return "Style & Design";
  }

  // Technical specs
  if (
    nameLower.includes("processor") ||
    nameLower.includes("ram") ||
    nameLower.includes("screen") ||
    nameLower.includes("battery") ||
    nameLower.includes("power")
  ) {
    return "Technical Specifications";
  }

  // Default group
  return "Product Options";
}

/**
 * Get variant templates for a specific product type
 * Used when filtering by product type
 */
export async function getVariantTemplatesForProductType(productTypeId: string) {
  try {
    const assignmentsResult = await getVariantsForProductType({
      productTypeId,
    });

    if (!assignmentsResult.success || !assignmentsResult.data) {
      return {
        documents: [],
        total: 0,
      };
    }

    const templatesWithOptions = await Promise.all(
      assignmentsResult.data.documents.map(async (assignment) => {
        const [templateResult, optionsResult] = await Promise.all([
          getVariantTemplateDetails(assignment.variantTemplateId),
          getVariantOptionsForTemplate({
            variantTemplateId: assignment.variantTemplateId,
          }),
        ]);

        if (!templateResult.success || !templateResult.data) {
          return null;
        }

        const template = templateResult.data;
        const options = optionsResult.success
          ? optionsResult.data?.documents || []
          : [];

        return {
          $id: template.$id,
          variantTemplateName: template.variantTemplateName,
          description: template.description,
          inputType: template.inputType,
          isRequired: template.isRequired || assignment.isRequired,
          sortOrder: assignment.sortOrder || template.sortOrder,
          group: determineVariantGroup(
            template.variantTemplateName,
            template.inputType
          ),
          variantOptions: options.map((option) => ({
            $id: option.$id,
            value: option.value,
            label: option.label,
            colorCode: option.colorCode,
            additionalPrice: option.additionalPrice,
            sortOrder: option.sortOrder,
          })),
        } as VariantTemplateWithOptions;
      })
    );

    const validTemplates = templatesWithOptions
      .filter((t): t is VariantTemplateWithOptions => t !== null)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return {
      documents: validTemplates,
      total: validTemplates.length,
    };
  } catch (error) {
    console.error("Error fetching variant templates for product type:", error);
    return {
      documents: [],
      total: 0,
    };
  }
}
