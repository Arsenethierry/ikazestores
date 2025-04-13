/* eslint-disable @typescript-eslint/no-explicit-any */
import { Check } from "lucide-react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import colorsData from '@/data/products-colors.json';

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
}

export function ColorSelector({ colors, selectedColors, onChange, error }: ColorSelectorProps) {
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
    );
}

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

    const handleColorChange = (newSelectedHexes: string[]) => {
        const currentColorImages = form.getValues(name) || [];

        // Remove colors that were deselected
        const filteredColors = currentColorImages.filter((item: any) =>
            newSelectedHexes.includes(item.colorHex)
        );

        // Add new selected colors
        const colorsToAdd = newSelectedHexes.filter(hex =>
            !currentColorImages.some((item: any) => item.colorHex === hex)
        ).map(hex => {
            const colorData = colorsData.find(c => c.hex === hex);
            return {
                colorHex: hex,
                images: [],
                colorName: colorData?.name || ""
            };
        });

        form.setValue(name, [...filteredColors, ...colorsToAdd]);
    };

    return (
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
    );
}