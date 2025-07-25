import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Check, DollarSign } from "lucide-react";
import { useState } from "react";
import colorsData from '@/data/products-colors.json';
import { Input } from "@/components/ui/input";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface ColorOption {
    id: number;
    name: string;
    hex: string;
}

interface ColorSelectorProps {
    colors: ColorOption[];
    selectedColors: string[];
    onChange: (colorHexes: string[]) => void;
    error?: string;
};

export function ColorSelector({
    colors,
    onChange,
    selectedColors,
    error
}: ColorSelectorProps) {
    const toggleColor = (colorHex: string) => {
        if (selectedColors.includes(colorHex)) {
            onChange(selectedColors.filter(hex => hex !== colorHex));
        } else {
            onChange([...selectedColors, colorHex]);
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                {colors.map((color) => (
                    <ColorSwatch
                        key={color.id}
                        color={color}
                        isSelected={selectedColors.includes(color.hex)}
                        onSelect={() => toggleColor(color.hex)}
                    />
                ))}
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
    )
};

interface ColorSwatchProps {
    color: ColorOption;
    isSelected: boolean;
    onSelect: () => void;
}

function ColorSwatch({ color, isSelected, onSelect }: ColorSwatchProps) {
    return (
        <div className="flex flex-col items-center gap-1">
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        onClick={onSelect}
                        className={cn(
                            "relative w-10 h-10 rounded-full overflow-hidden transition-all duration-200",
                            "hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                            isSelected ? "ring-2 ring-blue-500 ring-offset-2" : "ring-1 ring-gray-200"
                        )}
                        aria-label={`Select ${color.name} color`}
                    >
                        <span
                            className="absolute inset-0"
                            style={{ backgroundColor: color.hex }}
                        />
                        {isSelected && (
                            <span className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                                <Check className="text-white h-5 w-5" />
                            </span>
                        )}
                    </button>
                </TooltipTrigger>
                <TooltipContent>
                    {color.name}
                </TooltipContent>
            </Tooltip>
            <span className="text-xs text-gray-600">{color.name}</span>
        </div>
    );
}


export function ColorSelectorFormField({ form, name = "colorImages" }: any) {
    const selectedColorHexes = form.watch(name)?.map((item: any) => item.colorHex) || [];
    const [showPriceInputs, setShowPriceInputs] = useState(false);

    const handleColorChange = (newSelectedHexes: string[]) => {
        const currentColorImages = form.getValues(name) || [];

        const filteredColors = currentColorImages.filter((item: any) =>
            newSelectedHexes.includes(item.colorHex)
        );

        const colorsToAdd = newSelectedHexes.filter(hex =>
            !currentColorImages.some((item: any) => item.colorHex === hex)
        ).map(hex => {
            const colorData = colorsData.find(c => c.hex === hex);
            return {
                colorHex: hex,
                images: [],
                colorName: colorData?.name || "",
                additionalPrice: 0
            };
        });

        form.setValue(name, [...filteredColors, ...colorsToAdd]);

        if ([...filteredColors, ...colorsToAdd].length > 0) {
            setShowPriceInputs(true);
        }
    };

    const handleAdditionalPriceChange = (colorHex: string, value: string) => {
        const currentColorImages = form.getValues(name) || [];
        const updatedColorImages = currentColorImages.map((colorImg: any) =>
            colorImg.colorHex === colorHex
                ? { ...colorImg, additionalPrice: parseFloat(value) || 0 }
                : colorImg
        );

        form.setValue(name, updatedColorImages, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true
        });
    };

    return (
        <div className="space-y-5">
            <FormField
                control={form.control}
                name={name}
                render={() => (
                    <FormItem>
                        <FormLabel>Product Colors</FormLabel>
                        <FormControl>
                            <ColorSelector
                                colors={colorsData}
                                selectedColors={selectedColorHexes}
                                onChange={handleColorChange}
                                error={form.formState.errors[name]?.message as string}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {showPriceInputs && form.watch(name)?.length > 0 && (
                <div className="space-y-4 border rounded-md p-4 bg-gray-50">
                    <h3 className="font-medium text-sm">Color Variant Pricing</h3>
                    <p className="text-xs text-gray-500">Set additional prices for each color variant</p>

                    <div className="grid gap-3">
                        {form.watch(name)?.map((colorImage: any) => {
                            const color = colorsData.find(c => c.hex === colorImage.colorHex);

                            return (
                                <div key={colorImage.colorHex} className="flex items-center gap-3">
                                    <div className="flex-shrink-0">
                                        <div
                                            className="w-8 h-8 rounded-full"
                                            style={{ backgroundColor: colorImage.colorHex }}
                                        />
                                    </div>
                                    <div className="flex-grow">
                                        <span className="text-sm font-medium">{color?.name || "Custom"}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">Additional Price:</span>
                                        <div className="flex items-center">
                                            <DollarSign className="h-4 w-4 text-gray-500 mr-0.5" />
                                            <Input
                                                type="number"
                                                className="w-24 h-8 text-sm"
                                                value={colorImage.additionalPrice || 0}
                                                onChange={(e) => handleAdditionalPriceChange(colorImage.colorHex, e.target.value)}
                                                min="0"
                                                step="0.01"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};