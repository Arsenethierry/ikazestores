"use client";

import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useDebouncedCallback } from '@/hooks/use-debounce-callback';
import { Search, Filter } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

interface SubscribersFiltersProps {
    currentSearch: string;
    currentStatus: string;
}

export function SubscribersFilters({ 
    currentSearch, 
    currentStatus 
}: SubscribersFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const updateSearchParams = useCallback((key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        
        if (value && value !== 'all') {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        
        // Reset to page 1 when filters change
        if (key !== 'page') {
            params.delete('page');
        }

        // Next.js automatically handles the transition
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, [pathname, router, searchParams]);

    // Debounced search to avoid too many requests
    const debouncedSearch = useDebouncedCallback((value: string) => {
        updateSearchParams('search', value);
    }, 500);

    const handleStatusChange = (value: string) => {
        updateSearchParams('status', value);
    };

    return (
        <div className="flex items-center gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by email..."
                    defaultValue={currentSearch}
                    onChange={(e) => debouncedSearch(e.target.value)}
                    className="pl-10"
                />
            </div>
            <Select 
                value={currentStatus} 
                onValueChange={handleStatusChange}
            >
                <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}