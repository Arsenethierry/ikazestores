import { PRICE_FILTER_VALUE } from "@/lib/constants";
import { FilterState } from "@/lib/types";
import { create } from "zustand";

interface FilterStore extends FilterState {
    setPrice: (range: { min: number; max: number }) => void;
    toggleSize: (size: string) => void;
    toggleProductType: (type: string) => void;
    resetFielters: () => void;
    setFiltersFromParams: (params: Record<string, string | string[] | undefined>) => void;
};

export const useFilterStore = create<FilterStore>((set) => ({
    price: { min: 1, max: 20000 },
    sizes: [],
    productTypes: [],

    setPrice: (range) => set({ price: range }),
    toggleSize: (size) => set((state) => ({
        sizes: state.sizes.includes(size)
            ? state.sizes.filter(s => s !== size)
            : [...state.productTypes, size]
    })),
    toggleProductType: (type) => set((state) => ({
        productTypes: state.productTypes.includes(type)
            ? state.productTypes.filter(t => t !== type)
            : [...state.productTypes, type]
    })),

    resetFielters: () => set({ price: { min: PRICE_FILTER_VALUE.min, max: PRICE_FILTER_VALUE.max }, sizes: [], productTypes: [] }),

    setFiltersFromParams: (params) => set({
        price: {
            min: Number(params.minPrice) || PRICE_FILTER_VALUE.min,
            max: Number(params.maxPrice)
        },
        sizes: typeof params.sizes === "string" ? params.sizes.split(',') : [],
        productTypes: typeof params.types === 'string' ? params.types.split(',') : []
    })
}))