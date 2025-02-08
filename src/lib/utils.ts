import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ImageDimensionConstraints } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const convertFileToUrl = (file: File) => URL.createObjectURL(file);

export const validateImageDimensions = (
  file: File,
  dimensions?: ImageDimensionConstraints
): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!dimensions) {
      resolve(true);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const tolerance = dimensions.tolerance ?? 0.1;

      if (dimensions.width && dimensions.height) {
        if (
          img.width !== dimensions.width ||
          img.height !== dimensions.height
        ) {
          resolve(false);
          return;
        }
      }

      if (dimensions.ratio) {
        const actualRatio = img.width / img.height;
        const targetRatio = dimensions.ratio;
        const ratioDiff = Math.abs(actualRatio - targetRatio);

        if (ratioDiff > tolerance) {
          resolve(false);
          return;
        }
      }

      resolve(true);
    };

    img.src = objectUrl;
  });
};