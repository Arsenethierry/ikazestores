import { create } from 'zustand';

interface ProductState {
  searchQuery: string;
  mainCategory: string;
  subCategory: string;
  page: number;
  pageSize: number;
  setSearchQuery: (query: string) => void;
  setMainCategory: (category: string) => void;
  setSubCategory: (category: string) => void;
  setPage: (page: number) => void;
}

export const useProductStore = create<ProductState>((set) => ({
  searchQuery: '',
  mainCategory: '',
  subCategory: '',
  page: 1,
  pageSize: 20,
  setSearchQuery: (query) => set({ searchQuery: query, page: 1 }),
  setMainCategory: (category) => set({ mainCategory: category, subCategory: '', page: 1 }),
  setSubCategory: (category) => set({ subCategory: category, page: 1 }),
  setPage: (page) => set({ page }),
}));