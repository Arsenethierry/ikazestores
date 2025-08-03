"use client";

import { Check } from "lucide-react";
import { ProductColors } from "@/lib/types/appwrite/appwrite";
import { useCallback, useState } from "react";

interface ColorSelectorProps {
  colors: ProductColors[] | null;
  selectedColor?: ProductColors | null;
  onColorSelect: (color: ProductColors) => void;
  onColorHover?: (color: ProductColors | null) => void;
  previewColor?: ProductColors | null;
};

export const ProductColorsViewer = ({
  colors,
  selectedColor,
  onColorSelect,
  onColorHover,
  previewColor
}: ColorSelectorProps) => {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!colors || colors.length === 0) return null;

  const sortedColors = [...colors].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return 0;
  });

  const getContrastColor = (hexColor: string): 'white' | 'black' => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? 'black' : 'white';
  };

  const formatPrice = (price: number): string => {
    return price > 0 ? `+$${price}` : price < 0 ? `-$${Math.abs(price)}` : '';
  };

  const handleColorClick = useCallback(async (color: ProductColors) => {
    setIsUpdating(true);

    onColorSelect(color);

    requestAnimationFrame(() => {
      setIsUpdating(false);
    });
  }, [onColorSelect]);

  const handleColorHover = useCallback((color: ProductColors | null) => {
    if (onColorHover) {
      onColorHover(color);
    }
  }, [onColorHover]);

  const displayedSelectedColor = previewColor || selectedColor;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">
          Choose Color {selectedColor && `(${selectedColor.colorName})`}
        </h3>
      </div>

      <div className="flex space-x-3 flex-wrap gap-y-3">
        {sortedColors.map((color) => {
          const isSelected = selectedColor?.$id === color.$id;
          const isHovered = previewColor?.$id === color.$id;
          const isDisplayed = displayedSelectedColor?.$id === color.$id;
          const contrastColor = getContrastColor(color.colorCode);
          const priceText = color.additionalPrice ? formatPrice(color.additionalPrice) : '';

          return (
            <div key={color.$id} className="relative group">
              <button
                onClick={() => handleColorClick(color)}
                onMouseEnter={() => handleColorHover(color)}
                onMouseLeave={() => handleColorHover(null)}
                className={`relative w-12 h-12 rounded-lg border-2 transition-all duration-150 ${isDisplayed
                  ? 'border-orange-500 shadow-md scale-110'
                  : isHovered
                    ? 'border-gray-400 scale-105'
                    : 'border-gray-300 hover:border-gray-400'
                  } ${isUpdating && isSelected ? 'animate-pulse' : ''}`}
                style={{ backgroundColor: color.colorCode }}
                title={`${color.colorName}${priceText ? ` (${priceText})` : ''}`}
                aria-label={`Select ${color.colorName} color`}
              >
                {color.isDefault && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full"></div>
                )}

                {isDisplayed && (
                  <div className={`absolute inset-0 rounded-lg flex items-center justify-center ${isSelected ? '' : 'bg-black bg-opacity-10'
                    }`}>
                    <Check
                      className={`w-5 h-5 drop-shadow-sm ${contrastColor === 'white' ? 'text-white' : 'text-black'
                        }`}
                    />
                  </div>
                )}

                {(color.colorCode.toLowerCase() === '#ffffff' ||
                  color.colorCode.toLowerCase() === '#fff') && (
                    <div className="absolute inset-0 rounded-lg border border-gray-200"></div>
                  )}

                <div className={`absolute inset-0 rounded-lg bg-black transition-opacity ${isHovered && !isDisplayed ? 'opacity-5' : 'opacity-0'
                  }`} />
              </button>

              <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded whitespace-nowrap transition-opacity z-10 ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}>
                <div className="font-medium">{color.colorName}</div>
                {color.additionalPrice !== null && color.additionalPrice !== 0 && (
                  <div className="text-gray-300">
                    {formatPrice(color.additionalPrice)}
                  </div>
                )}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};