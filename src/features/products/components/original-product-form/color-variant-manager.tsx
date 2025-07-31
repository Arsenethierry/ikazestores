import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { DollarSign, ImageDown, Palette, Plus, Trash2, X, AlertCircle, Upload, Star } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Control, useFormContext } from "react-hook-form";

// Predefined color palette for all products
const PREDEFINED_COLORS = [
    { name: "Classic Black", code: "#000000", category: "Basic" },
    { name: "Pure White", code: "#FFFFFF", category: "Basic" },
    { name: "Charcoal Gray", code: "#36454F", category: "Basic" },
    { name: "Silver", code: "#C0C0C0", category: "Basic" },
    { name: "Navy Blue", code: "#000080", category: "Basic" },
    
    { name: "Crimson Red", code: "#DC143C", category: "Vibrant" },
    { name: "Forest Green", code: "#228B22", category: "Vibrant" },
    { name: "Royal Blue", code: "#4169E1", category: "Vibrant" },
    { name: "Golden Yellow", code: "#FFD700", category: "Vibrant" },
    { name: "Deep Purple", code: "#9932CC", category: "Vibrant" },
    
    { name: "Rose Gold", code: "#E8B4A6", category: "Premium" },
    { name: "Champagne", code: "#F7E7CE", category: "Premium" },
    { name: "Copper", code: "#B87333", category: "Premium" },
    { name: "Platinum", code: "#E5E4E2", category: "Premium" },
    { name: "Bronze", code: "#CD7F32", category: "Premium" },
    
    { name: "Pastel Pink", code: "#FFB6C1", category: "Pastel" },
    { name: "Mint Green", code: "#98FB98", category: "Pastel" },
    { name: "Sky Blue", code: "#87CEEB", category: "Pastel" },
    { name: "Lavender", code: "#E6E6FA", category: "Pastel" },
    { name: "Peach", code: "#FFCBA4", category: "Pastel" },
    
    { name: "Burgundy", code: "#800020", category: "Rich" },
    { name: "Emerald", code: "#50C878", category: "Rich" },
    { name: "Sapphire", code: "#0F52BA", category: "Rich" },
    { name: "Amber", code: "#FFBF00", category: "Rich" },
    { name: "Ruby", code: "#E0115F", category: "Rich" },
];

export interface ColorVariantInput {
    id: string;
    colorName: string;
    colorCode: string;
    images: File[];
    additionalPrice?: number;
    isDefault?: boolean;
    category?: string;
}

interface ColorVariantManagerProps {
    control: Control<any>;
}

export const ColorVariantManager: React.FC<ColorVariantManagerProps> = ({ control }) => {
    const { watch, setValue } = useFormContext();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>("Basic");
    
    const enableColors = watch('enableColors') || false;
    const colorVariants = watch('colorVariants') || [];

    const [customColor, setCustomColor] = useState({
        colorName: '',
        colorCode: '#000000',
        additionalPrice: 0
    });
    const [customImages, setCustomImages] = useState<File[]>([]);
    const [previewImages, setPreviewImages] = useState<string[]>([]);

    const categories = [...new Set(PREDEFINED_COLORS.map(color => color.category))];
    const filteredColors = PREDEFINED_COLORS.filter(color => color.category === selectedCategory);

    const handleImageChange = (files: FileList | null) => {
        if (!files) return;

        const fileArray = Array.from(files);
        
        if (fileArray.length > 5) {
            toast.error("Maximum 5 images per color");
            return;
        }

        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const invalidFiles = fileArray.filter(file => !validTypes.includes(file.type));
        if (invalidFiles.length > 0) {
            toast.error("Only JPEG, PNG, and WebP images are allowed");
            return;
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        const oversizedFiles = fileArray.filter(file => file.size > maxSize);
        if (oversizedFiles.length > 0) {
            toast.error("Each image must be smaller than 5MB");
            return;
        }

        setCustomImages(fileArray);
        
        // Clean up previous URLs
        previewImages.forEach(url => URL.revokeObjectURL(url));
        
        // Create new preview URLs
        const urls = fileArray.map(file => URL.createObjectURL(file));
        setPreviewImages(urls);
    };

    const removeImage = (index: number) => {
        const newImages = customImages.filter((_, i) => i !== index);
        const newPreviews = previewImages.filter((_, i) => i !== index);

        setCustomImages(newImages);
        
        // Revoke the removed URL
        URL.revokeObjectURL(previewImages[index]);
        setPreviewImages(newPreviews);
    };

    const addPredefinedColor = (color: typeof PREDEFINED_COLORS[0]) => {
        const existingColor = colorVariants.find((c: ColorVariantInput) => 
            c.colorName.toLowerCase() === color.name.toLowerCase()
        );
        
        if (existingColor) {
            toast.error("Color already added");
            return;
        }

        const newColor: ColorVariantInput = {
            id: `color-${Date.now()}`,
            colorName: color.name,
            colorCode: color.code,
            images: [],
            additionalPrice: 0,
            isDefault: colorVariants.length === 0,
            category: color.category
        };

        setValue('colorVariants', [...colorVariants, newColor]);
        toast.success(`Added ${color.name}`);
    };

    const addCustomColor = () => {
        if (!customColor.colorName.trim()) {
            toast.error("Color name is required");
            return;
        }

        if (customImages.length === 0) {
            toast.error("At least one image is required for each color");
            return;
        }

        const existingColor = colorVariants.find((c: ColorVariantInput) => 
            c.colorName.toLowerCase() === customColor.colorName.toLowerCase()
        );
        
        if (existingColor) {
            toast.error("Color name already exists");
            return;
        }

        const newColor: ColorVariantInput = {
            id: `custom-color-${Date.now()}`,
            colorName: customColor.colorName,
            colorCode: customColor.colorCode,
            images: customImages,
            additionalPrice: customColor.additionalPrice,
            isDefault: colorVariants.length === 0,
            category: "Custom"
        };

        setValue('colorVariants', [...colorVariants, newColor]);
        
        // Reset form
        setCustomColor({
            colorName: '',
            colorCode: '#000000',
            additionalPrice: 0
        });
        setCustomImages([]);
        previewImages.forEach(url => URL.revokeObjectURL(url));
        setPreviewImages([]);
        
        setIsDialogOpen(false);
        toast.success(`Added custom color: ${newColor.colorName}`);
    };

    const removeColor = (colorId: string) => {
        const updatedColors = colorVariants.filter((c: ColorVariantInput) => c.id !== colorId);
        
        // If we removed the default color, make the first remaining color default
        if (updatedColors.length > 0) {
            const hasDefault = updatedColors.some((c: ColorVariantInput) => c.isDefault);
            if (!hasDefault) {
                updatedColors[0].isDefault = true;
            }
        }
        
        setValue('colorVariants', updatedColors);
        toast.success("Color removed");
    };

    const updateColorImages = (colorId: string, files: File[]) => {
        const updatedColors = colorVariants.map((c: ColorVariantInput) => 
            c.id === colorId ? { ...c, images: files } : c
        );
        setValue('colorVariants', updatedColors);
    };

    const updateColorPrice = (colorId: string, price: number) => {
        const updatedColors = colorVariants.map((c: ColorVariantInput) => 
            c.id === colorId ? { ...c, additionalPrice: price } : c
        );
        setValue('colorVariants', updatedColors);
    };

    const setDefaultColor = (colorId: string) => {
        const updatedColors = colorVariants.map((c: ColorVariantInput) => ({
            ...c,
            isDefault: c.id === colorId
        }));
        setValue('colorVariants', updatedColors);
        toast.success("Default color updated");
    };

    const handleClose = () => {
        // Clean up preview URLs when closing
        previewImages.forEach(url => URL.revokeObjectURL(url));
        setPreviewImages([]);
        setCustomImages([]);
        setCustomColor({
            colorName: '',
            colorCode: '#000000',
            additionalPrice: 0
        });
        setIsDialogOpen(false);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Palette className="h-5 w-5" />
                            Product Colors
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Add color variants with their respective images (optional for products)
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            checked={enableColors}
                            onCheckedChange={(checked) => {
                                setValue('enableColors', checked);
                                if (!checked) {
                                    setValue('colorVariants', []);
                                }
                            }}
                            id="enable-colors"
                        />
                        <Label htmlFor="enable-colors">Enable Colors</Label>
                    </div>
                </div>
            </CardHeader>

            {enableColors && (
                <CardContent className="space-y-6">
                    {/* Color Selection */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium">Choose from Predefined Colors</h4>
                            <div className="flex gap-2">
                                {categories.map(category => (
                                    <Button
                                        key={category}
                                        type="button"
                                        variant={selectedCategory === category ? "teritary" : "outline"}
                                        size="sm"
                                        onClick={() => setSelectedCategory(category)}
                                    >
                                        {category}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-48 overflow-y-auto">
                            {filteredColors.map((color) => {
                                const isAdded = colorVariants.some((c: ColorVariantInput) => 
                                    c.colorName.toLowerCase() === color.name.toLowerCase()
                                );
                                
                                return (
                                    <button
                                        key={color.name}
                                        type="button"
                                        className={`
                                            relative p-2 rounded-lg border-2 transition-all hover:scale-105
                                            ${isAdded
                                                ? 'border-green-500 ring-2 ring-green-200 opacity-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }
                                        `}
                                        onClick={() => addPredefinedColor(color)}
                                        disabled={isAdded}
                                    >
                                        <div
                                            className="w-8 h-8 rounded-full border border-gray-300 mx-auto mb-1"
                                            style={{ backgroundColor: color.code }}
                                        />
                                        <p className="text-xs text-center truncate">{color.name}</p>
                                        {isAdded && (
                                            <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                                ✓
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDialogOpen(true)}
                                className="flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Add Custom Color
                            </Button>
                        </div>
                    </div>

                    {/* Selected Colors */}
                    {colorVariants.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium">Selected Colors ({colorVariants.length})</h4>
                                {colorVariants.some((c: ColorVariantInput) => !c.images || c.images.length === 0) && (
                                    <Alert variant="destructive" className="max-w-md">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription className="text-xs">
                                            Some colors are missing images. Upload at least one image per color.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {colorVariants.map((color: ColorVariantInput) => (
                                    <Card 
                                        key={color.id} 
                                        className={`${
                                            !color.images || color.images.length === 0 
                                                ? 'border-red-300 bg-red-50' 
                                                : 'border-gray-200'
                                        }`}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-6 h-6 rounded-full border-2 border-gray-200"
                                                        style={{ backgroundColor: color.colorCode }}
                                                    />
                                                    <span className="font-medium">{color.colorName}</span>
                                                    {color.isDefault && (
                                                        <Badge variant="default" className="text-xs">
                                                            <Star className="h-3 w-3 mr-1" />
                                                            Default
                                                        </Badge>
                                                    )}
                                                    {color.category && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {color.category}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => removeColor(color.id)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>

                                            {/* Price Input */}
                                            <div className="flex items-center gap-2 mb-3">
                                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                                <Label className="text-sm">Additional Price:</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={color.additionalPrice || 0}
                                                    onChange={(e) => updateColorPrice(color.id, parseFloat(e.target.value) || 0)}
                                                    className="w-20 h-8"
                                                />
                                            </div>

                                            {/* Image Upload */}
                                            <div className="space-y-2">
                                                <Label className="text-sm">Color Images:</Label>
                                                <Input
                                                    type="file"
                                                    multiple
                                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                                    onChange={(e) => {
                                                        if (e.target.files) {
                                                            const files = Array.from(e.target.files);
                                                            updateColorImages(color.id, files);
                                                        }
                                                    }}
                                                    className="text-xs"
                                                />
                                                
                                                {!color.images || color.images.length === 0 ? (
                                                    <div className="flex items-center justify-center p-4 border-2 border-dashed border-red-300 rounded-lg bg-red-50">
                                                        <div className="text-center">
                                                            <AlertCircle className="h-6 w-6 text-red-400 mx-auto mb-1" />
                                                            <p className="text-xs text-red-600">No images uploaded</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {color.images.slice(0, 3).map((file, index) => (
                                                            <div key={index} className="aspect-square bg-gray-100 rounded border flex items-center justify-center">
                                                                <ImageDown className="h-4 w-4 text-green-500" />
                                                            </div>
                                                        ))}
                                                        {color.images.length > 3 && (
                                                            <div className="aspect-square bg-gray-100 rounded border flex items-center justify-center text-xs">
                                                                +{color.images.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between">
                                                    <Badge variant="outline" className="text-xs">
                                                        {color.images?.length || 0} image{(color.images?.length || 0) !== 1 ? 's' : ''}
                                                    </Badge>
                                                    {!color.isDefault && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setDefaultColor(color.id)}
                                                            className="text-xs h-6"
                                                        >
                                                            Set Default
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Custom Color Dialog */}
                    <Dialog open={isDialogOpen} onOpenChange={handleClose}>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Palette className="h-5 w-5" />
                                    Add Custom Color
                                </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Color Name *</Label>
                                        <Input
                                            value={customColor.colorName}
                                            onChange={(e) => setCustomColor(prev => ({ ...prev, colorName: e.target.value }))}
                                            placeholder="e.g., Ocean Blue, Forest Green"
                                        />
                                    </div>
                                    <div>
                                        <Label>Color Code *</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="color"
                                                value={customColor.colorCode}
                                                onChange={(e) => setCustomColor(prev => ({ ...prev, colorCode: e.target.value }))}
                                                className="w-16 h-10 p-1"
                                            />
                                            <Input
                                                type="text"
                                                value={customColor.colorCode}
                                                onChange={(e) => setCustomColor(prev => ({ ...prev, colorCode: e.target.value }))}
                                                placeholder="#000000"
                                                className="flex-1"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <Label>Additional Price ($)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={customColor.additionalPrice}
                                        onChange={(e) => setCustomColor(prev => ({ 
                                            ...prev, 
                                            additionalPrice: parseFloat(e.target.value) || 0 
                                        }))}
                                        placeholder="0.00"
                                    />
                                </div>

                                <div>
                                    <Label className="flex items-center gap-2">
                                        Color Images *
                                        <Badge variant="destructive" className="text-xs">Required</Badge>
                                    </Label>
                                    <Input
                                        type="file"
                                        multiple
                                        accept="image/jpeg,image/jpg,image/png,image/webp"
                                        onChange={(e) => handleImageChange(e.target.files)}
                                        className="mt-2"
                                    />
                                    
                                    {customImages.length === 0 && (
                                        <Alert variant="destructive" className="mt-2">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription>
                                                Please upload at least one image for this color
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {previewImages.length > 0 && (
                                        <div className="grid grid-cols-3 gap-4 mt-4">
                                            {previewImages.map((url, index) => (
                                                <div key={index} className="relative group">
                                                    <Image
                                                        src={url}
                                                        alt={`Preview ${index + 1}`}
                                                        width={120}
                                                        height={120}
                                                        className="w-full h-24 object-cover rounded-lg border"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="sm"
                                                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => removeImage(index)}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end gap-2 pt-4 border-t">
                                    <Button type="button" variant="outline" onClick={handleClose}>
                                        Cancel
                                    </Button>
                                    <Button 
                                        type="button" 
                                        onClick={addCustomColor}
                                        disabled={
                                            !customColor.colorName.trim() || 
                                            customImages.length === 0 ||
                                            !/^#[0-9A-F]{6}$/i.test(customColor.colorCode)
                                        }
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        Add Custom Color
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            )}

            {!enableColors && (
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <h3 className="font-medium">Colors Disabled</h3>
                        <p className="text-sm">Enable colors to add color variants to this product</p>
                    </div>
                </CardContent>
            )}
        </Card>
    );
};