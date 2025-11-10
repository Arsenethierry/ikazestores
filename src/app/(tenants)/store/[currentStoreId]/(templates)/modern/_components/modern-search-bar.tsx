"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ModernSearchBarProps {
    storeId: string;
}

export const ModernSearchBar = ({ storeId }: ModernSearchBarProps) => {
    const [query, setQuery] = useState('');
    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/store/${storeId}/products?query=${encodeURIComponent(query.trim())}`);
        }
    };

    return (
        <div className="relative">
            <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                placeholder="Search for products"
                className="w-full h-11 pl-4 pr-12 rounded-full bg-white text-slate-900 border-0 focus-visible:ring-2 focus-visible:ring-primary"
            />
            <Button
                onClick={handleSearch}
                size="icon"
                className="absolute right-1 top-1 h-9 w-9 rounded-full bg-primary hover:bg-primary/90"
            >
                <Search className="h-4 w-4" />
            </Button>
        </div>
    );
};