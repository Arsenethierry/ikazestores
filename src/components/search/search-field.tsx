"use client";

import { useEffect, useState } from "react";
import { useDebounce } from "../ui/multiselect";
import { searchVirtualProducts } from "@/features/products/actions/virtual-products-actions";
import { useRouter } from "next/navigation";
import { Popover, PopoverContent } from "../ui/popover";
import { Command, CommandInput, CommandItem, CommandList } from "../ui/command";

export const SearchField = ({ mobile }: { mobile?: boolean }) => {
    const router = useRouter();
    const [query, setQuery] = useState("");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const debouncedQuery = useDebounce(query, 300);

    useEffect(() => {
        const fetchResults = async () => {
            if (!debouncedQuery) {
                setResults([]);
                return;
            }
            setIsLoading(true);

            try {
                const products = await searchVirtualProducts(debouncedQuery);
                console.log("dnehde: ", products)
                setResults(products.documents);
                setIsOpen(products.total > 0);
            } catch (error) {
                console.error("Search failed:", error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchResults();
    }, [debouncedQuery]);

    const handleSelect = (productId: string) => {
        router.push(`/products/${productId}`);
        setIsOpen(false);
        setQuery("")
    }

    return (
        <div className={`relative ${mobile ? "block md:hidden" : "hidden md:block"}`}>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <Command shouldFilter={false}>
                    <CommandInput
                        value={query}
                        onValueChange={setQuery}
                        placeholder="Search products..."
                        onFocus={() => results.length > 0 && setIsOpen(true)}
                    />

                    <PopoverContent className="p-0" align="start">
                        <CommandList>
                            {!isLoading && Array.isArray(results) && results.length === 0 && debouncedQuery && (
                                <div className="py-3 text-center text-sm text-muted-foreground">
                                    No products found
                                </div>
                            )}
                            {Array.isArray(results) && results.map((product) => (
                                <CommandItem
                                    key={product?.$id}
                                    value={product?.$id}
                                    onSelect={() => product?.$id && handleSelect(product.$id)}
                                    className="cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
                                >
                                    <span className="truncate">{product?.title || 'Untitled Product'}</span>
                                </CommandItem>
                            ))}
                        </CommandList>
                    </PopoverContent>
                </Command>
            </Popover>
        </div>
    )
}