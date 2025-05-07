"use client";

import { Delete, Search } from "lucide-react";
import { JSX, useEffect, useRef, useState } from "react";
import { useDebounce } from "../ui/multiselect";
import { useQuery } from "@tanstack/react-query";
import { searchVirtualProducts } from "@/features/products/actions/virtual-products-actions";
import { VirtualProductTypes } from "@/lib/types";
import { useParams, useRouter } from "next/navigation";
import { slugify } from "@/lib/utils";
interface SearchResults {
  documents: VirtualProductTypes[];
  total: number;
  error?: string;
}

const categories = [
  {
    title: "Categories",
    items: [
      "decoration living ro...",
      "woman dresses",
      "human hair wigs glueless wear and go"
    ],
  },
  {
    title: "Sports Entertainment",
    items: [
      "Hoverboard",
      "Headlamp"
    ],
  },
  {
    title: "Other recommendations",
    items: [
      "dryne zip jacket",
      "FRIAN"
    ],
  },
];

export const ProductSearchField = (): JSX.Element => {
  const [searchValue, setSearchValue] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement | null>(null);

  const { currentStoreId } = useParams()

  const router = useRouter();

  const debounceSearchValue = useDebounce(searchValue, 300);

  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchRef]);

  const storeId = Array.isArray(currentStoreId) ? currentStoreId[0] : currentStoreId;
  
  const { data: results = { documents: [], total: 0 }, isLoading } = useQuery<SearchResults>({
    queryKey: ['search', debounceSearchValue, storeId],
    queryFn: () =>
      debounceSearchValue.trim().length >= 2
        ? searchVirtualProducts({ 
            query: debounceSearchValue, 
            limit: 10, 
            ...(storeId !== undefined && { currentStoreId: storeId })
          })
        : Promise.resolve({ documents: [], total: 0 }),
    enabled: debounceSearchValue.trim().length >= 2,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const handleSelect = (value: string): void => {
    setSearchValue(value);
    setIsOpen(false);

    const updatedRecent = [value, ...recentSearches.filter(item => item !== value)].slice(0, 5);
    setRecentSearches(updatedRecent);
    localStorage.setItem('recentSearches', JSON.stringify(updatedRecent));
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (searchValue.trim()) {
      handleSelect(searchValue);
      router.push(`/search?query=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  const clearRecentSearches = (): void => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  return (
    <div className="relative w-full max-w-2xl" ref={searchRef}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            type="text"
            placeholder="Search for products, brands, and categories..."
            className="w-full px-4 py-2 pl-10 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            value={searchValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchValue(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 100)}
          />
          <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
          {searchValue && (
            <button
              type="button"
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              onClick={() => setSearchValue('')}
            >
              <Delete />
            </button>
          )}
        </div>
      </form>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full mb-2"></div>
              <p>Searching...</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {debounceSearchValue.length >= 2 && results.total > 0 && (
                <div className="p-2">
                  <h3 className="px-2 py-1 text-sm font-semibold text-gray-500">
                    Search Results
                  </h3>
                  <ul className="space-y-1">
                    {results.documents.map((result) => (
                      <li
                        key={result.$id}
                        className="px-3 py-2 cursor-pointer hover:bg-blue-50 rounded-md transition-colors flex items-center"
                        onMouseDown={() => {
                          const updatedRecent = [result.title, ...recentSearches.filter(item => item !== result.title)].slice(0, 5);
                          setRecentSearches(updatedRecent);
                          localStorage.setItem('recentSearches', JSON.stringify(updatedRecent));
                          setSearchValue('')
                          router.push(`/products/${slugify(result.title)}/${result.$id}`);
                        }}
                      >
                        <div className="flex justify-between items-center w-full">
                          <div className="flex-1">
                            <div className="text-sm font-medium">{result.title}</div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {result.categoryNames && result.categoryNames.map((category: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full truncate max-w-32"
                                  title={category}
                                >
                                  {category}
                                </span>
                              ))}
                            </div>
                          </div>
                          <span className="font-medium text-gray-700 ml-2">${result.sellingPrice.toFixed(2)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {recentSearches.length > 0 && (
                <div className="p-2">
                  <div className="flex justify-between items-center px-2 py-1">
                    <h3 className="text-sm font-semibold text-gray-500">
                      Recent Searches
                    </h3>
                    <button
                      className="text-xs text-blue-500 hover:text-blue-700"
                      onClick={clearRecentSearches}
                    >
                      Clear
                    </button>
                  </div>
                  <ul className="space-y-1">
                    {recentSearches.map((item, index) => (
                      <li
                        key={index}
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 rounded-md transition-colors flex items-center"
                        onMouseDown={() => {
                          handleSelect(item);
                          // Redirect to search page with this item as query
                          router.push(`/search?query=${encodeURIComponent(item)}`);
                        }}
                      >
                        <span className="text-gray-400 mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(debounceSearchValue.length < 2 || results.total === 0) && categories.map((category) => (
                <div key={category.title} className="p-2">
                  <h3 className="px-2 py-1 text-sm font-semibold text-gray-500">
                    {category.title}
                  </h3>
                  <ul className="space-y-1">
                    {category.items.map((item) => (
                      <li
                        key={item}
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 rounded-md transition-colors"
                        onMouseDown={() => {
                          handleSelect(item);
                          // Redirect to search page with this category/item as query
                          router.push(`/search?query=${encodeURIComponent(item)}`);
                        }}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {searchValue.length >= 2 && !isLoading && results.total === 0 && (
                <div className="p-4 text-center text-gray-500">
                  No results found for &ldquo;{searchValue}&ldquo;
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};