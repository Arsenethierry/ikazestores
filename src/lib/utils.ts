import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ImageDimensionConstraints } from "./types";
import lod from 'lodash';
import DOMPurify from "isomorphic-dompurify";

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

export const getStoreInitials = (name: string) => {
  const words = name.trim().split(/\s+/);

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

export const dateFormatter = (dateObject: Date) => new Intl.DateTimeFormat("en-US", {
  month: "2-digit",
  day: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
}).format(dateObject);

export const slugify = (text: string) => {
  return lod.kebabCase(text)
};

export const sanitizedProductDescription = (description: string) => {
  return DOMPurify.sanitize(description, { USE_PROFILES: { html: true } });
}

export const getStoreLogoInitials = (name: string) => {
  const words = name.trim().split(/\s+/);

  if (words.length >= 2) {
    return {
      firstInitial: words[0][0].toUpperCase(),
      secondInitial: words[1][0].toUpperCase()
    };
  }

  if (name.length >= 2) {
    return {
      firstInitial: name[0].toUpperCase(),
      secondInitial: name[1].toLowerCase()
    };
  }

  return {
    firstInitial: name[0].toUpperCase(),
    secondInitial: ""
  };
};

export const splitStoreName = (name: string) => {
  const cleanedName = name.trim();
  const words = cleanedName.split(/\s+/);

  if (words.length > 1) {

    const midpoint = Math.ceil(words.length / 2);
    return {
      firstPart: words.slice(0, midpoint).join(' '),
      secondPart: words.slice(midpoint).join(' ')
    };
  }

  if (cleanedName.length < 6) {
    return {
      firstPart: cleanedName,
      secondPart: ""
    };
  }

  for (let i = Math.floor(cleanedName.length / 2); i < cleanedName.length - 1; i++) {
    const isVowel = /[aeiou]/i.test(cleanedName[i]);
    const nextIsConsonant = /[bcdfghjklmnpqrstvwxyz]/i.test(cleanedName[i + 1]);
    if (isVowel && nextIsConsonant) {
      return {
        firstPart: cleanedName.slice(0, i + 1),
        secondPart: cleanedName.slice(i + 1)
      };
    }
  }

  const splitIndex = Math.ceil(cleanedName.length / 2);
  return {
    firstPart: cleanedName.slice(0, splitIndex),
    secondPart: cleanedName.slice(splitIndex)
  };
};

export const generateColorFromName = (name: string) => {
  const hash = Array.from(name).reduce(
    (hash, char) => ((hash << 5) - hash) + char.charCodeAt(0), 0
  );
  const hue = Math.abs(hash % 360);
  const saturation = 65 + (Math.abs((hash >> 8) % 20));
  const lightness = 45 + (Math.abs((hash >> 16) % 10));

  const secondaryHue = (hue + 180 + (hash % 60)) % 360;

  return {
    primary: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
    secondary: `hsl(${secondaryHue}, ${saturation}%, ${lightness}%)`
  };
}