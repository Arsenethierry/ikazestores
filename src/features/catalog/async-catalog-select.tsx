"use client";

import { searchCategories, searchProductTypes, searchSubcategories } from '@/lib/actions/original-products-actions';
import React from 'react';
import AsyncSelect from 'react-select/async';

interface SelectOption {
  value: string;
  label: string;
  description?: string | null;
}

interface AsyncCategorySelectProps {
  value?: SelectOption | null;
  onChange: (option: SelectOption | null) => void;
  placeholder?: string;
  isDisabled?: boolean;
}

export const AsyncCategorySelect: React.FC<AsyncCategorySelectProps> = ({
  value,
  onChange,
  placeholder = "Search categories...",
  isDisabled = false,
}) => {
  const loadOptions = async (inputValue: string): Promise<SelectOption[]> => {
    try {
      const result = await searchCategories({ search: inputValue, limit: 20 });
      
      if (result?.data?.success && result.data.data) {
        return result.data.data;
      }
      
      return [];
    } catch (error) {
      console.error('Failed to load categories:', error);
      return [];
    }
  };

  return (
    <AsyncSelect<SelectOption>
      cacheOptions
      defaultOptions
      loadOptions={loadOptions}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      isDisabled={isDisabled}
      isClearable
      className="react-select-container"
      classNamePrefix="react-select"
      styles={{
        control: (base, state) => ({
          ...base,
          borderColor: state.isFocused ? 'hsl(var(--ring))' : 'hsl(var(--border))',
          backgroundColor: 'hsl(var(--background))',
          minHeight: '40px',
          '&:hover': {
            borderColor: 'hsl(var(--ring))',
          },
        }),
        menu: (base) => ({
          ...base,
          backgroundColor: 'hsl(var(--popover))',
          border: '1px solid hsl(var(--border))',
        }),
        option: (base, state) => ({
          ...base,
          backgroundColor: state.isSelected 
            ? 'hsl(var(--accent))' 
            : state.isFocused 
            ? 'hsl(var(--accent) / 0.5)' 
            : 'transparent',
          color: 'hsl(var(--foreground))',
          cursor: 'pointer',
          ':active': {
            backgroundColor: 'hsl(var(--accent))',
          },
        }),
        singleValue: (base) => ({
          ...base,
          color: 'hsl(var(--foreground))',
        }),
        input: (base) => ({
          ...base,
          color: 'hsl(var(--foreground))',
        }),
        placeholder: (base) => ({
          ...base,
          color: 'hsl(var(--muted-foreground))',
        }),
      }}
      formatOptionLabel={(option) => (
        <div>
          <div className="font-medium">{option.label}</div>
          {option.description && (
            <div className="text-xs text-muted-foreground">{option.description}</div>
          )}
        </div>
      )}
    />
  );
};

interface AsyncSubcategorySelectProps {
  categoryId: string | null;
  value?: SelectOption | null;
  onChange: (option: SelectOption | null) => void;
  placeholder?: string;
  isDisabled?: boolean;
}

export const AsyncSubcategorySelect: React.FC<AsyncSubcategorySelectProps> = ({
  categoryId,
  value,
  onChange,
  placeholder = "Search subcategories...",
  isDisabled = false,
}) => {
  const loadOptions = async (inputValue: string): Promise<SelectOption[]> => {
    if (!categoryId) return [];

    try {
      const result = await searchSubcategories({ 
        categoryId, 
        search: inputValue, 
        limit: 20 
      });
      
      if (result?.data?.success && result.data.data) {
        return result.data.data;
      }
      
      return [];
    } catch (error) {
      console.error('Failed to load subcategories:', error);
      return [];
    }
  };

  return (
    <AsyncSelect<SelectOption>
      key={categoryId} // Force re-render when category changes
      cacheOptions
      defaultOptions
      loadOptions={loadOptions}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      isDisabled={isDisabled || !categoryId}
      isClearable
      className="react-select-container"
      classNamePrefix="react-select"
      noOptionsMessage={() => 
        !categoryId ? "Select a category first" : "No subcategories found"
      }
      styles={{
        control: (base, state) => ({
          ...base,
          borderColor: state.isFocused ? 'hsl(var(--ring))' : 'hsl(var(--border))',
          backgroundColor: 'hsl(var(--background))',
          minHeight: '40px',
          '&:hover': {
            borderColor: 'hsl(var(--ring))',
          },
        }),
        menu: (base) => ({
          ...base,
          backgroundColor: 'hsl(var(--popover))',
          border: '1px solid hsl(var(--border))',
        }),
        option: (base, state) => ({
          ...base,
          backgroundColor: state.isSelected 
            ? 'hsl(var(--accent))' 
            : state.isFocused 
            ? 'hsl(var(--accent) / 0.5)' 
            : 'transparent',
          color: 'hsl(var(--foreground))',
          cursor: 'pointer',
        }),
        singleValue: (base) => ({
          ...base,
          color: 'hsl(var(--foreground))',
        }),
        input: (base) => ({
          ...base,
          color: 'hsl(var(--foreground))',
        }),
        placeholder: (base) => ({
          ...base,
          color: 'hsl(var(--muted-foreground))',
        }),
      }}
      formatOptionLabel={(option) => (
        <div>
          <div className="font-medium">{option.label}</div>
          {option.description && (
            <div className="text-xs text-muted-foreground">{option.description}</div>
          )}
        </div>
      )}
    />
  );
};

interface AsyncProductTypeSelectProps {
  subcategoryId: string | null;
  value?: SelectOption | null;
  onChange: (option: SelectOption | null) => void;
  placeholder?: string;
  isDisabled?: boolean;
}

export const AsyncProductTypeSelect: React.FC<AsyncProductTypeSelectProps> = ({
  subcategoryId,
  value,
  onChange,
  placeholder = "Search product types...",
  isDisabled = false,
}) => {
  const loadOptions = async (inputValue: string): Promise<SelectOption[]> => {
    if (!subcategoryId) return [];

    try {
      const result = await searchProductTypes({ 
        subcategoryId, 
        search: inputValue, 
        limit: 20 
      });
      
      if (result?.data?.success && result.data.data) {
        return result.data.data;
      }
      
      return [];
    } catch (error) {
      console.error('Failed to load product types:', error);
      return [];
    }
  };

  return (
    <AsyncSelect<SelectOption>
      key={subcategoryId} // Force re-render when subcategory changes
      cacheOptions
      defaultOptions
      loadOptions={loadOptions}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      isDisabled={isDisabled || !subcategoryId}
      isClearable
      className="react-select-container"
      classNamePrefix="react-select"
      noOptionsMessage={() => 
        !subcategoryId ? "Select a subcategory first" : "No product types found"
      }
      styles={{
        control: (base, state) => ({
          ...base,
          borderColor: state.isFocused ? 'hsl(var(--ring))' : 'hsl(var(--border))',
          backgroundColor: 'hsl(var(--background))',
          minHeight: '40px',
          '&:hover': {
            borderColor: 'hsl(var(--ring))',
          },
        }),
        menu: (base) => ({
          ...base,
          backgroundColor: 'hsl(var(--popover))',
          border: '1px solid hsl(var(--border))',
        }),
        option: (base, state) => ({
          ...base,
          backgroundColor: state.isSelected 
            ? 'hsl(var(--accent))' 
            : state.isFocused 
            ? 'hsl(var(--accent) / 0.5)' 
            : 'transparent',
          color: 'hsl(var(--foreground))',
          cursor: 'pointer',
        }),
        singleValue: (base) => ({
          ...base,
          color: 'hsl(var(--foreground))',
        }),
        input: (base) => ({
          ...base,
          color: 'hsl(var(--foreground))',
        }),
        placeholder: (base) => ({
          ...base,
          color: 'hsl(var(--muted-foreground))',
        }),
      }}
      formatOptionLabel={(option) => (
        <div>
          <div className="font-medium">{option.label}</div>
          {option.description && (
            <div className="text-xs text-muted-foreground">{option.description}</div>
          )}
        </div>
      )}
    />
  );
};