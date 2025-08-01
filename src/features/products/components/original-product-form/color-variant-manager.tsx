import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { DollarSign, ImageDown, Palette, Plus, Trash2, X, AlertCircle, Upload, Star, Check, Sparkles, Search, Filter, Zap, Crown } from "lucide-react";
import Image from "next/image";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Control, useFormContext } from "react-hook-form";

interface PredefinedColor {
    name: string;
    code: string;
    popular?: boolean;
    trending?: boolean;
    premium?: boolean;
    border?: boolean;
}

// Enhanced predefined color palette - compact version
const PREDEFINED_COLORS: PredefinedColor[] = [
    // Essential Colors
    { name: "Midnight Black", code: "#000000", popular: true },
    { name: "Pure White", code: "#FFFFFF", popular: true, border: true },
    { name: "Charcoal Gray", code: "#36454F", popular: true },
    { name: "Silver", code: "#C0C0C0", trending: true },
    { name: "Navy Blue", code: "#000080", popular: true },

    // Vibrant Collection
    { name: "Fire Red", code: "#DC143C", trending: true },
    { name: "Electric Blue", code: "#4169E1", trending: true },
    { name: "Emerald Green", code: "#50C878", premium: true },
    { name: "Orange", code: "#FF8C00", trending: true },
    { name: "Purple", code: "#9932CC", premium: true },

    // Premium Metallics
    { name: "Rose Gold", code: "#E8B4A6", premium: true },
    { name: "Champagne", code: "#F7E7CE", premium: true },
    { name: "Copper", code: "#B87333", premium: true },
    { name: "Platinum", code: "#E5E4E2", premium: true },
    { name: "Gold", code: "#CD7F32", premium: true },

    // Modern Pastels
    { name: "Blush Pink", code: "#FFB6C1" },
    { name: "Mint", code: "#98FB98" },
    { name: "Sky Blue", code: "#87CEEB" },
    { name: "Lavender", code: "#E6E6FA" },
    { name: "Peach", code: "#FFCBA4" },

    // Deep & Rich
    { name: "Burgundy", code: "#800020" },
    { name: "Forest Green", code: "#228B22" },
    { name: "Ocean Blue", code: "#0F52BA" },
    { name: "Amber", code: "#FFBF00" },
    { name: "Ruby", code: "#E0115F" },

    // Contemporary Colors
    { name: "Sage", code: "#9CAF88" },
    { name: "Dusty Rose", code: "#DCAE96" },
    { name: "Slate", code: "#6A5ACD" },
    { name: "Coral", code: "#FF7F7F" },
    { name: "Teal", code: "#008080" },

    // Earthy Tones
    { name: "Terracotta", code: "#E2725B" },
    { name: "Olive", code: "#808000" },
    { name: "Beige", code: "#F5F5DC" },
    { name: "Brown", code: "#8B4513" },
    { name: "Cream", code: "#FFFFF0", border: true },
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

type FilterType = "all" | "popular" | "trending" | "premium";

interface CustomColorState {
    colorName: string;
    colorCode: string;
    additionalPrice: number;
}

export const ColorVariantManager: React.FC<ColorVariantManagerProps> = ({ control }) => {
    const { watch, setValue } = useFormContext();
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [filterType, setFilterType] = useState<FilterType>("all");

    const enableColors = watch('enableColors') as boolean || false;
    const colorVariants = watch('colorVariants') as ColorVariantInput[] || [];

    const [customColor, setCustomColor] = useState<CustomColorState>({
        colorName: '',
        colorCode: '#000000',
        additionalPrice: 0
    });
    const [customImages, setCustomImages] = useState<File[]>([]);
    const [previewImages, setPreviewImages] = useState<string[]>([]);

    // Enhanced filtering
    const filteredColors = PREDEFINED_COLORS.filter((color: PredefinedColor) => {
        const matchesSearch = color.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterType === "all" ||
            (filterType === "popular" && color.popular) ||
            (filterType === "trending" && color.trending) ||
            (filterType === "premium" && color.premium);
        return matchesSearch && matchesFilter;
    });

    const handleImageChange = useCallback((files: FileList | null) => {
        if (!files) return;

        const fileArray = Array.from(files);

        if (fileArray.length > 5) {
            toast.error("Maximum 5 images per color");
            return;
        }

        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const invalidFiles = fileArray.filter((file: File) => !validTypes.includes(file.type));
        if (invalidFiles.length > 0) {
            toast.error("Only JPEG, PNG, and WebP images are allowed");
            return;
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        const oversizedFiles = fileArray.filter((file: File) => file.size > maxSize);
        if (oversizedFiles.length > 0) {
            toast.error("Each image must be smaller than 5MB");
            return;
        }

        setCustomImages(fileArray);

        // Clean up previous URLs
        previewImages.forEach((url: string) => URL.revokeObjectURL(url));

        // Create new preview URLs
        const urls = fileArray.map((file: File) => URL.createObjectURL(file));
        setPreviewImages(urls);
    }, [previewImages]);

    const removeImage = useCallback((index: number) => {
        const newImages = customImages.filter((_: File, i: number) => i !== index);
        const newPreviews = previewImages.filter((_: string, i: number) => i !== index);

        setCustomImages(newImages);

        // Revoke the removed URL
        URL.revokeObjectURL(previewImages[index]);
        setPreviewImages(newPreviews);
    }, [customImages, previewImages]);

    const addPredefinedColor = useCallback((color: PredefinedColor) => {
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
            category: "Predefined"
        };

        setValue('colorVariants', [...colorVariants, newColor]);
    }, [colorVariants, setValue]);

    const addCustomColor = useCallback(() => {
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

        setCustomColor({
            colorName: '',
            colorCode: '#000000',
            additionalPrice: 0
        });
        setCustomImages([]);
        previewImages.forEach((url: string) => URL.revokeObjectURL(url));
        setPreviewImages([]);

        setIsDialogOpen(false);
        toast.success(`✨ Created ${newColor.colorName}!`);
    }, [customColor, customImages, colorVariants, setValue, previewImages]);

    const removeColor = useCallback((colorId: string) => {
        const colorToRemove = colorVariants.find((c: ColorVariantInput) => c.id === colorId);
        const updatedColors = colorVariants.filter((c: ColorVariantInput) => c.id !== colorId);

        if (updatedColors.length > 0) {
            const hasDefault = updatedColors.some((c: ColorVariantInput) => c.isDefault);
            if (!hasDefault) {
                updatedColors[0].isDefault = true;
            }
        }

        setValue('colorVariants', updatedColors);
    }, [colorVariants, setValue]);

    const updateColorImages = useCallback((colorId: string, files: File[]) => {
        const updatedColors = colorVariants.map((c: ColorVariantInput) =>
            c.id === colorId ? { ...c, images: files } : c
        );
        setValue('colorVariants', updatedColors);
    }, [colorVariants, setValue]);

    const removeColorImage = useCallback((colorId: string, imageIndex: number) => {
        const color = colorVariants.find((c: ColorVariantInput) => c.id === colorId);
        if (!color || !color.images || imageIndex < 0 || imageIndex >= color.images.length) {
            toast.error("Invalid image or color not found");
            return;
        }

        const updatedColors = colorVariants.map((c: ColorVariantInput) => {
            if (c.id === colorId) {
                const newImages = [...c.images];
                newImages.splice(imageIndex, 1);
                return { ...c, images: newImages };
            }
            return c;
        });

        setValue('colorVariants', updatedColors);
    }, [colorVariants, setValue]);

    const updateColorPrice = useCallback((colorId: string, price: number) => {
        const updatedColors = colorVariants.map((c: ColorVariantInput) =>
            c.id === colorId ? { ...c, additionalPrice: price } : c
        );
        setValue('colorVariants', updatedColors);
    }, [colorVariants, setValue]);

    const setDefaultColor = useCallback((colorId: string) => {
        const updatedColors = colorVariants.map((c: ColorVariantInput) => ({
            ...c,
            isDefault: c.id === colorId
        }));
        setValue('colorVariants', updatedColors);
    }, [colorVariants, setValue]);

    const handleClose = useCallback(() => {
        previewImages.forEach((url: string) => URL.revokeObjectURL(url));
        setPreviewImages([]);
        setCustomImages([]);
        setCustomColor({
            colorName: '',
            colorCode: '#000000',
            additionalPrice: 0
        });
        setIsDialogOpen(false);
    }, [previewImages]);

    const createImagePreviewUrl = useCallback((file: File): string => {
        return URL.createObjectURL(file);
    }, []);

    if (!enableColors) {
        return (
            <Card className="border-2 border-dashed border-purple-300 hover:border-purple-400 transition-colors bg-gradient-to-br from-purple-50 to-pink-50">
                <CardContent className="p-6">
                    <div className="text-center space-y-4">
                        <div className="relative inline-block">
                            <Palette className="h-12 w-12 text-purple-500" />
                            <Sparkles className="h-4 w-4 absolute -top-1 -right-1 text-yellow-400 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Add Color Variants 🎨</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Give customers more choices with beautiful color options
                            </p>
                            <Button
                                type="button"
                                onClick={() => setValue('enableColors', true)}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                            >
                                <Palette className="h-4 w-4 mr-2" />
                                Enable Colors
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Compact Header */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-lg text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Palette className="h-5 w-5" />
                        <div>
                            <h2 className="text-lg font-semibold">Product Colors</h2>
                            <p className="text-sm text-purple-100">Choose from our color collection</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                            {colorVariants.length} selected
                        </Badge>
                        <Switch
                            checked={enableColors}
                            onCheckedChange={(checked: boolean) => {
                                setValue('enableColors', checked);
                                if (!checked) {
                                    setValue('colorVariants', []);
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Compact Search Bar */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search colors..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 h-9"
                            />
                        </div>
                        <div className="flex gap-1">
                            {[
                                { key: "all" as FilterType, label: "All", icon: Palette },
                                { key: "popular" as FilterType, label: "Popular", icon: Star },
                                { key: "trending" as FilterType, label: "Trending", icon: Zap },
                                { key: "premium" as FilterType, label: "Premium", icon: Crown }
                            ].map(({ key, label, icon: Icon }) => (
                                <Button
                                    key={key}
                                    type="button"
                                    variant={filterType === key ? "teritary" : "outline"}
                                    size="sm"
                                    onClick={() => setFilterType(key)}
                                    className="h-9 px-3"
                                >
                                    <Icon className="h-3 w-3 mr-1" />
                                    {label}
                                </Button>
                            ))}
                        </div>
                        <Button
                            type="button"
                            onClick={() => setIsDialogOpen(true)}
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 h-9"
                        >
                            <Plus className="h-3 w-3 mr-1" />
                            Custom
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Smaller Color Grid with Hex Codes */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            Color Palette
                            {searchTerm && (
                                <Badge variant="outline" className="text-xs">
                                    {filteredColors.length} results
                                </Badge>
                            )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            {PREDEFINED_COLORS.length} colors available
                        </p>
                    </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                        {filteredColors.map((color: PredefinedColor) => {
                            const isAdded = colorVariants.some((c: ColorVariantInput) =>
                                c.colorName.toLowerCase() === color.name.toLowerCase()
                            );

                            return (
                                <div key={color.name} className="group relative">
                                    <button
                                        type="button"
                                        className={`
                                            relative w-full rounded-lg border-2 transition-all duration-200 p-2
                                            ${isAdded
                                                ? 'border-green-400 ring-2 ring-green-200 scale-95'
                                                : 'border-gray-200 hover:border-purple-300 hover:scale-105'
                                            }
                                        `}
                                        onClick={() => addPredefinedColor(color)}
                                        disabled={isAdded}
                                    >
                                        {/* Color Circle */}
                                        <div
                                            className={`w-12 h-12 rounded-full mx-auto mb-2 ${color.border ? 'border border-gray-300' : ''}`}
                                            style={{ backgroundColor: color.code }}
                                        />

                                        {/* Color Name */}
                                        <p className="text-xs font-medium text-center mb-1 truncate">
                                            {color.name}
                                        </p>

                                        {/* Hex Code */}
                                        <p className="text-xs text-center text-gray-500 font-mono">
                                            {color.code}
                                        </p>

                                        {/* Compact Badges */}
                                        {(color.popular || color.trending || color.premium) && (
                                            <div className="absolute top-1 right-1">
                                                {color.popular && (
                                                    <div className="bg-red-500 text-white rounded-full p-0.5">
                                                        <Star className="h-2 w-2" />
                                                    </div>
                                                )}
                                                {color.trending && (
                                                    <div className="bg-yellow-500 text-white rounded-full p-0.5">
                                                        <Zap className="h-2 w-2" />
                                                    </div>
                                                )}
                                                {color.premium && (
                                                    <div className="bg-purple-500 text-white rounded-full p-0.5">
                                                        <Crown className="h-2 w-2" />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Success State */}
                                        {isAdded && (
                                            <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center rounded-lg">
                                                <div className="bg-green-500 text-white rounded-full p-1">
                                                    <Check className="h-3 w-3" />
                                                </div>
                                            </div>
                                        )}

                                        {/* Hover Effect */}
                                        {!isAdded && (
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center rounded-lg transition-all">
                                                <div className="bg-white/90 text-gray-800 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Plus className="h-3 w-3" />
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {filteredColors.length === 0 && (
                        <div className="text-center py-8">
                            <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm text-gray-500">No colors found matching "{searchTerm}"</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Selected Colors with Image Previews */}
            {colorVariants.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-500" />
                                Selected Colors ({colorVariants.length})
                            </CardTitle>
                            {colorVariants.some((c: ColorVariantInput) => !c.images || c.images.length === 0) && (
                                <Badge variant="destructive" className="text-xs">
                                    {colorVariants.filter((c: ColorVariantInput) => !c.images || c.images.length === 0).length} need images
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="space-y-3">
                            {colorVariants.map((color: ColorVariantInput) => (
                                <Card key={color.id} className="border border-gray-200">
                                    <CardContent className="p-3">
                                        <div className="flex items-center gap-3">
                                            {/* Color Info */}
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div
                                                    className="w-8 h-8 rounded border-2 border-gray-200 flex-shrink-0"
                                                    style={{ backgroundColor: color.colorCode }}
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-sm truncate">{color.colorName}</span>
                                                        {color.isDefault && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                <Star className="h-2 w-2 mr-1" />
                                                                Default
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 font-mono">{color.colorCode}</p>
                                                </div>
                                            </div>

                                            {/* Image Previews */}
                                            <div className="flex items-center gap-2">
                                                {color.images && color.images.length > 0 ? (
                                                    <div className="flex gap-1">
                                                        {color.images.slice(0, 3).map((file: File, index: number) => {
                                                            const previewUrl = createImagePreviewUrl(file);
                                                            return (
                                                                <div key={index} className="relative group">
                                                                    <Image
                                                                        src={previewUrl}
                                                                        alt={`${color.colorName} ${index + 1}`}
                                                                        width={32}
                                                                        height={32}
                                                                        className="w-8 h-8 object-cover rounded border"
                                                                        onLoad={() => URL.revokeObjectURL(previewUrl)}
                                                                    />
                                                                    <Button
                                                                        type="button"
                                                                        variant="destructive"
                                                                        size="sm"
                                                                        className="absolute -top-1 -right-1 h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                                                                        onClick={() => removeColorImage(color.id, index)}
                                                                    >
                                                                        <X className="h-2 w-2" />
                                                                    </Button>
                                                                </div>
                                                            );
                                                        })}
                                                        {color.images.length > 3 && (
                                                            <div className="w-8 h-8 bg-gray-100 rounded border flex items-center justify-center text-xs font-medium text-gray-600 relative group cursor-pointer"
                                                                title={`View all ${color.images.length} images`}
                                                            >
                                                                +{color.images.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 bg-red-100 rounded border flex items-center justify-center">
                                                        <AlertCircle className="h-3 w-3 text-red-500" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Price Input */}
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="h-3 w-3 text-gray-400" />
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={color.additionalPrice || 0}
                                                    onChange={(e) => updateColorPrice(color.id, parseFloat(e.target.value) || 0)}
                                                    className="w-16 h-7 text-xs"
                                                    placeholder="0.00"
                                                />
                                            </div>

                                            {/* Image Upload */}
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="file"
                                                    multiple
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        if (e.target.files) {
                                                            const files = Array.from(e.target.files);
                                                            // Add new files to existing images instead of replacing
                                                            const existingImages = color.images || [];
                                                            const allImages = [...existingImages, ...files];

                                                            if (allImages.length > 5) {
                                                                toast.error("Maximum 5 images per color");
                                                                return;
                                                            }

                                                            updateColorImages(color.id, allImages);
                                                        }
                                                    }}
                                                    className="w-32 h-7 text-xs"
                                                />
                                                <Badge variant={color.images?.length ? "default" : "destructive"} className="text-xs">
                                                    {color.images?.length || 0}/5
                                                </Badge>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1">
                                                {!color.isDefault && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setDefaultColor(color.id)}
                                                        className="h-7 px-2 text-xs"
                                                    >
                                                        Default
                                                    </Button>
                                                )}
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => removeColor(color.id)}
                                                    className="h-7 w-7 p-0"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Custom Color Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={handleClose}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Palette className="h-5 w-5" />
                            Create Custom Color
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Color Configuration */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm">Color Name *</Label>
                                <Input
                                    value={customColor.colorName}
                                    onChange={(e) => setCustomColor(prev => ({ ...prev, colorName: e.target.value }))}
                                    placeholder="e.g., Ocean Blue"
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label className="text-sm">Additional Price ($)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={customColor.additionalPrice}
                                    onChange={(e) => setCustomColor(prev => ({
                                        ...prev,
                                        additionalPrice: parseFloat(e.target.value) || 0
                                    }))}
                                    placeholder="0.00"
                                    className="mt-1"
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="text-sm">Color Code *</Label>
                            <div className="flex gap-2 mt-1">
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
                                    className="flex-1 font-mono"
                                />
                            </div>
                        </div>

                        {/* Image Upload */}
                        <div>
                            <Label className="text-sm">Color Images *</Label>
                            <Input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) => handleImageChange(e.target.files)}
                                className="mt-1"
                            />

                            {customImages.length === 0 && (
                                <Alert className="mt-2">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription className="text-sm">
                                        Please upload at least one image for this color
                                    </AlertDescription>
                                </Alert>
                            )}

                            {previewImages.length > 0 && (
                                <div className="grid grid-cols-4 gap-2 mt-3">
                                    {previewImages.map((url: string, index: number) => (
                                        <div key={index} className="relative group">
                                            <Image
                                                src={url}
                                                alt={`Preview ${index + 1}`}
                                                width={80}
                                                height={80}
                                                className="w-full h-20 object-cover rounded border"
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                className="absolute top-1 right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => removeImage(index)}
                                            >
                                                <X className="h-2 w-2" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
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
                                className="bg-green-500 hover:bg-green-600"
                            >
                                Create Color
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Compact Summary */}
            {colorVariants.length > 0 && (
                <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500 rounded text-white">
                                    <Check className="h-4 w-4" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-green-900">
                                        {colorVariants.length} color{colorVariants.length !== 1 ? 's' : ''} added! 🎉
                                    </h4>
                                    <p className="text-sm text-green-700">
                                        {colorVariants.reduce((total: number, color: ColorVariantInput) => total + (color.images?.length || 0), 0)} images uploaded
                                    </p>
                                </div>
                            </div>

                            {colorVariants.some((c: ColorVariantInput) => !c.images || c.images.length === 0) && (
                                <Alert variant="destructive" className="max-w-xs">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription className="text-xs">
                                        {colorVariants.filter((c: ColorVariantInput) => !c.images || c.images.length === 0).length} color(s) need images
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};