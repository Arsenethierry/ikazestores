"use client";

import { Delete, Search, Clock } from "lucide-react";
import { JSX, useEffect, useRef, useState } from "react";
import { useDebounce } from "../ui/multiselect";
import { useParams, useRouter } from "next/navigation";
import { slugify } from "@/lib/utils";
import { VirtualProductTypes } from "@/lib/types";
import { searchVirtualStoreProducts } from "@/lib/actions/affiliate-product-actions";

type SearchResponse = {
  documents: VirtualProductTypes[];
  total: number;
  hasMore?: boolean;
  success?: boolean;
  error?: string;
};

// Simple in-memory cache
const searchCache = new Map<string, SearchResponse>();
const cacheKey = (storeId: string, q: string, limit: number) =>
  `${storeId}::${q}::${limit}`;

const categories = [
  {
    title: "Categories",
    items: [
      "decoration living ro...",
      "woman dresses",
      "human hair wigs glueless wear and go",
    ],
  },
  { title: "Sports Entertainment", items: ["Hoverboard", "Headlamp"] },
  { title: "Other recommendations", items: ["dryne zip jacket", "FRIAN"] },
];

export const ProductSearchField = (): JSX.Element => {
  const [searchValue, setSearchValue] = useState<string>("");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const searchRef = useRef<HTMLDivElement | null>(null);
  const requestVersionRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { currentStoreId } = useParams();
  const router = useRouter();
  const storeId = Array.isArray(currentStoreId)
    ? currentStoreId[0]
    : (currentStoreId as string | undefined);

  const debounceSearchValue = useDebounce(searchValue, 300);
  const limit = 10;

  useEffect(() => {
    setErrorMsg(null);

    const q = debounceSearchValue.trim();
    if (!storeId || q.length < 2) {
      setSearchResults(null);
      setIsLoading(false);
      return;
    }

    // Check cache first
    const key = cacheKey(storeId, q, limit);
    if (searchCache.has(key)) {
      setSearchResults(searchCache.get(key)!);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const thisRequest = ++requestVersionRef.current;
    setIsLoading(true);

    // Call server action with correct parameter structure
    searchVirtualStoreProducts(storeId, {
      search: q,
      limit,
      page: 1,
    })
      .then((res) => {
        // Ignore stale responses
        if (requestVersionRef.current !== thisRequest) return;

        if (!res || res.error) {
          setErrorMsg(res?.error || "Error searching products. Please try again.");
          setSearchResults(null);
          return;
        }

        const response: SearchResponse = {
          documents: res.documents,
          total: res.total,
          hasMore: res.hasMore,
          success: res.success,
        };

        searchCache.set(key, response);
        setSearchResults(response);
      })
      .catch((error) => {
        if (requestVersionRef.current !== thisRequest) return;
        console.error("Search error:", error);
        setErrorMsg("Error searching products. Please try again.");
        setSearchResults(null);
      })
      .finally(() => {
        if (requestVersionRef.current === thisRequest) {
          setIsLoading(false);
        }
      });

    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debounceSearchValue, storeId]);

  // Load recent searches - use state instead of localStorage
  const recentSearchesKey = `recentSearches_${storeId}`;
  useEffect(() => {
    const saved = sessionStorage.getItem?.(recentSearchesKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setRecentSearches(parsed);
      } catch {
        setRecentSearches([]);
      }
    }
  }, [recentSearchesKey]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveToRecentSearches = (value: string): void => {
    if (!value.trim()) return;
    try {
      const updated = [
        value.trim(),
        ...recentSearches.filter((i) => i !== value.trim()),
      ].slice(0, 5);
      setRecentSearches(updated);
      sessionStorage.setItem?.(recentSearchesKey, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save recent search:", e);
    }
  };

  const handleSelect = (value: string): void => {
    setSearchValue(value);
    setIsOpen(false);
    saveToRecentSearches(value);
  };

  const handleSubmit = (e: React.FormEvent | null): void => {
    e?.preventDefault?.();
    if (searchValue.trim()) {
      saveToRecentSearches(searchValue);
      router.push(`/search?query=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  const clearRecentSearches = (): void => {
    setRecentSearches([]);
    try {
      sessionStorage.removeItem?.(recentSearchesKey);
    } catch (e) {
      console.error("Failed to clear recent searches:", e);
    }
  };

  const handleProductSelect = (product: VirtualProductTypes): void => {
    saveToRecentSearches(product.name);
    setSearchValue("");
    setIsOpen(false);
    router.push(`/products/${slugify(product.name)}/${product.$id}`);
  };

  const handleCategorySelect = (item: string): void => {
    handleSelect(item);
    router.push(`/search?query=${encodeURIComponent(item)}`);
  };

  const handleRecentSearchSelect = (item: string): void => {
    handleSelect(item);
    router.push(`/search?query=${encodeURIComponent(item)}`);
  };

  // View logic
  const docs = searchResults?.documents ?? [];
  const total = searchResults?.total ?? 0;
  const showSearchResults = debounceSearchValue.length >= 2 && docs.length > 0;
  const showNoResults =
    debounceSearchValue.length >= 2 && !isLoading && docs.length === 0;
  const showCategories = debounceSearchValue.length < 2;
  const showRecentSearches = recentSearches.length > 0;

  return (
    <div className="relative w-full max-w-2xl" ref={searchRef}>
      <form onSubmit={(e) => handleSubmit(e)}>
        <div className="relative">
          <input
            type="text"
            placeholder="Search for products, brands, and categories..."
            className="w-full px-4 py-2 pl-10 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setIsOpen(true)}
            autoComplete="off"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
          {searchValue && (
            <button
              type="button"
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
              onClick={() => setSearchValue("")}
              aria-label="Clear search"
            >
              <Delete className="w-5 h-5" />
            </button>
          )}
        </div>
      </form>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-96 overflow-y-auto">
          {isLoading && debounceSearchValue.length >= 2 && (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full mb-2"></div>
              <p>Searching...</p>
            </div>
          )}

          {errorMsg && debounceSearchValue.length >= 2 && (
            <div className="p-4 text-center text-red-500">
              <p>{errorMsg}</p>
            </div>
          )}

          {!isLoading && !errorMsg && (
            <div className="divide-y divide-gray-100">
              {/* Search Results */}
              {showSearchResults && (
                <div className="p-2">
                  <h3 className="px-2 py-1 text-sm font-semibold text-gray-500">
                    Search Results ({total})
                  </h3>
                  <ul className="space-y-1">
                    {docs.map((result) => {
                      const price =
                        (result as any).price ??
                        (result.basePrice || 0) + (result.commission || 0);
                      return (
                        <li
                          key={result.$id}
                          className="px-3 py-2 cursor-pointer hover:bg-blue-50 rounded-md transition-colors flex items-center"
                          onMouseDown={() => handleProductSelect(result)}
                        >
                          <div className="flex justify-between items-center w-full">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">
                                {result.name}
                              </div>
                              {result.tags && result.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {result.tags.slice(0, 3).map((tag, idx) => (
                                    <span
                                      key={idx}
                                      className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full truncate max-w-32"
                                      title={tag}
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                  {result.tags.length > 3 && (
                                    <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                                      +{result.tags.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <span className="font-medium text-gray-700 ml-2 flex-shrink-0">
                              ${Number(price).toFixed(2)}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  {total > limit && (
                    <div className="px-3 py-2 text-sm text-blue-600 border-t border-gray-100 mt-2">
                      <button
                        onClick={() => handleSubmit(null)}
                        className="hover:underline"
                      >
                        View all {total} results →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* No Results */}
              {showNoResults && (
                <div className="p-4 text-center text-gray-500">
                  <p>No results found for &quot;{searchValue}&quot;</p>
                  <p className="text-sm mt-1">Try adjusting your search terms</p>
                </div>
              )}

              {/* Recent Searches */}
              {showRecentSearches &&
                (showCategories || (!showSearchResults && !showNoResults)) && (
                  <div className="p-2">
                    <div className="flex justify-between items-center px-2 py-1">
                      <h3 className="text-sm font-semibold text-gray-500 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Recent Searches
                      </h3>
                      <button
                        className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
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
                          onMouseDown={() => handleRecentSearchSelect(item)}
                        >
                          <Clock className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                          <span className="truncate">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* Static categories */}
              {showCategories &&
                categories.map((category) => (
                  <div key={category.title} className="p-2">
                    <h3 className="px-2 py-1 text-sm font-semibold text-gray-500">
                      {category.title}
                    </h3>
                    <ul className="space-y-1">
                      {category.items.map((item) => (
                        <li
                          key={item}
                          className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 rounded-md transition-colors"
                          onMouseDown={() => handleCategorySelect(item)}
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};