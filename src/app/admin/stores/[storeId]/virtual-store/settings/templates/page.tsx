'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, Palette } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  previewImage: string;
  features: string[];
}

interface TemplateSelectionProps {
  currentStoreId: string;
  currentTemplateId: string;
  storeName: string;
}

export default function TemplateSelection({
  currentStoreId,
  currentTemplateId = 'template-modern-01',
  storeName,
}: TemplateSelectionProps) {
  const [activeTemplate, setActiveTemplate] = useState(currentTemplateId);
  const [isApplying, setIsApplying] = useState(false);
  const router = useRouter();

  // Available templates
  const templates: Template[] = [
    {
      id: 'template-modern-01',
      name: 'Modern Minimalist',
      description: 'Clean design with sidebar navigation and card-based layouts',
      category: 'Modern',
      previewImage: '/templates/modern-preview.jpg',
      features: ['Sidebar Navigation', 'Card Layouts', 'Product Filters', 'Dark Mode'],
    },
    {
      id: 'template-classic-01',
      name: 'Classic E-commerce',
      description: 'Traditional layout with header navigation and full-width content',
      category: 'Classic',
      previewImage: '/templates/classic-preview.jpg',
      features: ['Header Navigation', 'Full Width', 'Banner Section', 'Grid Layout'],
    },
    // Add more templates here as you create them
  ];

  const handleApplyTemplate = async (templateId: string) => {
    setIsApplying(true);

    try {
      // Call your update API
      const response = await fetch('/api/store/update-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: currentStoreId,
          templateId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update template');
      }

      setActiveTemplate(templateId);
      toast.success('Template applied successfully!');
      
      // Refresh the page to see changes
      router.refresh();
    } catch (error) {
      console.error('Error applying template:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to apply template');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Store Templates</h2>
        <p className="text-muted-foreground mt-2">
          Choose a design template for <strong>{storeName}</strong>. Changes take effect immediately.
        </p>
      </div>

      {/* Current Template Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Current Template
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant="default" className="text-sm">
              {templates.find(t => t.id === activeTemplate)?.name || 'Modern Minimalist'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Active since {new Date().toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card
            key={template.id}
            className={`relative overflow-hidden transition-all ${
              activeTemplate === template.id
                ? 'border-primary border-2 shadow-lg'
                : 'border-border hover:border-primary/50'
            }`}
          >
            {/* Active Badge */}
            {activeTemplate === template.id && (
              <div className="absolute top-4 right-4 z-10">
                <Badge className="bg-primary text-primary-foreground shadow-lg">
                  <Check className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>
            )}

            {/* Preview Image */}
            <div className="relative aspect-video bg-slate-100 dark:bg-slate-900">
              <Image
                src={template.previewImage}
                alt={template.name}
                fill
                className="object-cover"
                onError={(e) => {
                  // Fallback if image doesn't exist
                  e.currentTarget.src = '/placeholder.jpg';
                }}
              />
            </div>

            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <Badge variant="outline" className="mt-2 text-xs">
                    {template.category}
                  </Badge>
                </div>
              </div>
              <CardDescription className="mt-2">{template.description}</CardDescription>
            </CardHeader>

            <CardContent>
              {/* Features */}
              <div className="space-y-3 mb-4">
                <p className="text-sm font-medium">Features:</p>
                <div className="flex flex-wrap gap-2">
                  {template.features.map((feature, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              {activeTemplate === template.id ? (
                <Button disabled className="w-full" variant="outline">
                  <Check className="h-4 w-4 mr-2" />
                  Currently Active
                </Button>
              ) : (
                <Button
                  onClick={() => handleApplyTemplate(template.id)}
                  disabled={isApplying}
                  className="w-full"
                >
                  {isApplying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <Palette className="h-4 w-4 mr-2" />
                      Apply Template
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Help Text */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-lg">Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • Templates change the look and feel of your store instantly
          </p>
          <p>
            • Your products and data remain the same across all templates
          </p>
          <p>
            • You can switch between templates anytime at no extra cost
          </p>
          <p>
            • Preview your store after applying: <strong>{storeName}.yourdomain.com</strong>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}