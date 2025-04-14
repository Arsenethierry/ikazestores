'use client';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ChevronDown, Search } from 'lucide-react';
import { useState } from 'react';
import { useCurrency } from './currency-context';

// Map of currency codes to country flags (emoji)
const currencyFlags: Record<string, string> = {
  USD: '🇺🇸',
  EUR: '🇪🇺',
  GBP: '🇬🇧',
  JPY: '🇯🇵',
  CAD: '🇨🇦',
  AUD: '🇦🇺',
  CNY: '🇨🇳',
  INR: '🇮🇳',
  // Add more as needed
};

// Map of currency codes to full names
const currencyNames: Record<string, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  JPY: 'Japanese Yen',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar',
  CNY: 'Chinese Yuan',
  INR: 'Indian Rupee',
  // Add more as needed
};

export const CurrencySelector = () => {
  const { currentCurrency, setCurrency, supportedCurrencies, isLoading } = useCurrency();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  
  if (isLoading) {
    return <span className="text-sm text-gray-500">Loading...</span>;
  }
  
  const filteredCurrencies = supportedCurrencies.filter(currency => 
    currency.toLowerCase().includes(search.toLowerCase()) || 
    (currencyNames[currency] && currencyNames[currency].toLowerCase().includes(search.toLowerCase()))
  );
  
  const handleCurrencySelect = (currency: string) => {
    setCurrency(currency);
    setOpen(false); // Close the popover after selection
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="muted" size="xs" className="gap-1">
          {currencyFlags[currentCurrency] || ''} {currentCurrency}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="end">
        <div className="p-2 border-b">
          <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-slate-100">
            <Search className="h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search currency..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 border-none bg-transparent focus-visible:ring-0 p-0"
              // Clear search when popover opens
              onFocus={() => setSearch('')}
            />
          </div>
        </div>
        <div className="max-h-60 overflow-auto py-1">
          {filteredCurrencies.length === 0 ? (
            <div className="px-2 py-1 text-sm text-slate-500 text-center">
              No currencies found
            </div>
          ) : (
            filteredCurrencies.map((currency) => (
              <button
                key={currency}
                className={`w-full text-left px-2 py-1.5 text-sm flex items-center gap-2 hover:bg-slate-100 ${
                  currency === currentCurrency ? 'bg-slate-100 font-medium' : ''
                }`}
                onClick={() => handleCurrencySelect(currency)}
              >
                <span className="text-base">{currencyFlags[currency] || ''}</span>
                <span>{currency}</span>
                <span className="text-xs text-slate-500 ml-auto">
                  {currencyNames[currency] || ''}
                </span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};