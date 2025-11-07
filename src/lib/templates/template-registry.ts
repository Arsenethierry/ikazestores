import { ComponentType } from "react";

export interface TemplateComponent {
  HeroSection: ComponentType<any>;
  ProductShowcase: ComponentType<any>;
  FeaturedCategories: ComponentType<any>;
  Footer: ComponentType<any>;
}

export interface TemplateConfig {
  id: string;
  name: string;
  category: string;
  description: string;
  previewImage: string;
  features: string[];
  // Path to the template (used for dynamic imports)
  path: string;
}

export const TEMPLATE_REGISTRY: Record<string, TemplateConfig> = {
  'template-modern-01': {
    id: 'template-modern-01',
    name: 'Modern Minimalist',
    category: 'modern',
    description: 'Clean and contemporary design with focus on products',
    previewImage: '/templates/previews/modern-01.jpg',
    features: ['Hero Slider', 'Product Grid', 'Quick View', 'Wishlist'],
    loader: () => import('@/templates/modern-01'),
  },
//   'template-classic-01': {
//     id: 'template-classic-01',
//     name: 'Classic Elegance',
//     category: 'classic',
//     description: 'Traditional e-commerce layout with timeless design',
//     previewImage: '/templates/previews/classic-01.jpg',
//     features: ['Banner Carousel', 'Category Navigation', 'Featured Products'],
//     loader: () => import('@/templates/classic-01'),
//   },
  // Add more templates as you build them
};

export const DEFAULT_TEMPLATE_ID = 'template-modern-01';

// Get template configuration
export function getTemplateConfig(templateId?: string | null): TemplateConfig {
  const id = templateId || DEFAULT_TEMPLATE_ID;
  return TEMPLATE_REGISTRY[id] || TEMPLATE_REGISTRY[DEFAULT_TEMPLATE_ID];
}

export function preloadTemplate(templateId: string) {
  const config = getTemplateConfig(templateId);
  config.loader();
}