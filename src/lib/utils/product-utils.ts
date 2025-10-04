// utils/product-utils.ts (or wherever compute* lives)
import { CreateProductSchema } from "../schemas/products-schems";

/** Minimal HTML -> text sanitizer (SSR-safe, no DOM deps) */
function decodeHtmlEntities(input: string): string {
  const named: Record<string, string> = {
    amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  };
  return input
    // numeric (decimal)
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
    // numeric (hex)
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    // named
    .replace(/&([a-zA-Z]+);/g, (_, n) => named[n] ?? `&${n};`);
}

function stripHtmlTags(input: string): string {
  // remove script/style contents first
  const withoutBlocks = input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ");
  // then drop all tags
  return withoutBlocks.replace(/<[^>]+>/g, " ");
}

/** End-to-end sanitize: decode entities, strip tags, collapse whitespace */
function sanitizeText(raw?: string | null): string {
  if (!raw) return "";
  const decoded = decodeHtmlEntities(String(raw));
  const stripped = stripHtmlTags(decoded);
  return stripped.replace(/\s+/g, " ").trim();
}

/** Tokenize to letters/numbers only, keep Unicode, drop punctuation */
function tokenizeForKeywords(text: string): string[] {
  const cleaned = text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, " "); // Unicode: letters/numbers/spaces only
  return Array.from(
    new Set(cleaned.split(/\s+/).filter(w => w.length > 2))
  );
}

export async function computeProductDenormalizedFields(
  productData: CreateProductSchema,
  categoryData: {
    categoryName: string;
    subcategoryName: string;
    productTypeName: string;
  }
) {
  const denormalized = {
    ...computeCategoryDenormalization(productData, categoryData),
    ...computeVariantDenormalization(productData),
    ...computeColorDenormalization(productData),
    ...initializePopularityFields(),
    ...computeSearchDenormalization(productData), // now sanitized
  };
  return denormalized;
}

function computeCategoryDenormalization(
  productData: CreateProductSchema,
  categoryData: {
    categoryName: string;
    subcategoryName: string;
    productTypeName: string;
  }
) {
  const categoryPath = [
    categoryData.categoryName,
    categoryData.subcategoryName,
    categoryData.productTypeName,
  ].filter(Boolean).join(" > ");

  return {
    categoryName: categoryData.categoryName,
    subcategoryName: categoryData.subcategoryName,
    productTypeName: categoryData.productTypeName,
    categoryPath,
    categoryIds: [
      productData.categoryId,
      productData.subcategoryId,
      productData.productTypeId,
    ].filter(Boolean),
  };
}

function computeColorDenormalization(productData: CreateProductSchema) {
  const colorVariants = productData.colorVariants || [];
  return { availableColorCodes: colorVariants.map(c => c.colorCode) };
}

function computeVariantDenormalization(productData: CreateProductSchema) {
  const variants = productData.variants || [];
  const nonColorVariants = variants.filter(v => {
    const name = (v.name ?? "").toLowerCase();
    const type = (v.type ?? "").toLowerCase();
    const colorKeywords = ["color", "colour", "hue", "shade", "tint", "paint"];
    return !colorKeywords.some(kw => name.includes(kw) || type.includes(kw));
  });

  const availableVariantTypes = nonColorVariants.map(v => sanitizeText(v.name));
  const availableVariantValues = nonColorVariants.flatMap(v =>
    (v.values || []).map(val => sanitizeText(val.label || val.value))
  );

  return {
    hasVariants: productData.hasVariants && nonColorVariants.length > 0,
    variantCount: nonColorVariants.length,
    availableVariantTypes,
    availableVariantValues,
  };
}

function computeSearchDenormalization(productData: CreateProductSchema) {
  const name = sanitizeText(productData.name);
  const description = sanitizeText(productData.description);          // <— strips editor HTML
  const shortDescription = sanitizeText(productData.shortDescription);

  const tagTexts = (productData.tags || []).map(sanitizeText);
  const variantNames = (productData.variants || []).map(v => sanitizeText(v.name));
  const variantValues = (productData.variants || []).flatMap(v =>
    (v.values || []).map(val => sanitizeText(val.label || val.value))
  );
  const colorNames = (productData.colorVariants || []).map(c => sanitizeText(c.colorName));

  const searchText = [
    name,
    description,
    shortDescription,
    ...tagTexts,
    ...variantNames,
    ...variantValues,
    ...colorNames,
  ].filter(Boolean).join(" ").toLowerCase();

  const searchKeywords = tokenizeForKeywords(searchText);

  const normalizedName = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "") // normalized slug-ish form for sorting
    .trim();

  return { searchText, searchKeywords, normalizedName };
}

function initializePopularityFields() {
  return {
    viewCount: 0,
    orderCount: 0,
    saveCount: 0,
    rating: 0,
    reviewCount: 0,
    popularityScore: 0,
  };
}

export function updatePopularityMetrics(current: {
  viewCount: number;
  orderCount: number;
  saveCount: number;
  rating: number;
  reviewCount: number;
}) {
  const popularityScore =
    current.viewCount * 0.1 +
    current.orderCount * 5 +
    current.saveCount * 2 +
    current.rating * current.reviewCount * 10;

  return { popularityScore: Math.round(popularityScore) };
}

export function recomputeDenormalizedFields(
  existingProduct: any,
  updates: Partial<CreateProductSchema>,
  categoryData?: { categoryName: string; subcategoryName: string; productTypeName: string; }
) {
  const mergedData = { ...existingProduct, ...updates };
  return {
    ...(updates.variants ? computeVariantDenormalization(mergedData) : {}),
    ...(updates.colorVariants || updates.enableColors
      ? computeColorDenormalization(mergedData)
      : {}),
    ...(updates.name || updates.description || updates.tags || updates.variants
      ? computeSearchDenormalization(mergedData) // sanitized
      : {}),
    ...(categoryData
      ? computeCategoryDenormalization(mergedData, categoryData)
      : {}),
  };
}
