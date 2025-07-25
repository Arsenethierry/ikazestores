'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useCategories } from '../hooks/useProducts';
import { useProductStore } from '../productStore';

export const ProductFilters = () => {
  const { 
    searchQuery, 
    mainCategory, 
    subCategory, 
    setSearchQuery, 
    setMainCategory, 
    setSubCategory
  } = useProductStore();
  
  const { data: categories, isLoading } = useCategories();

  const selectedMain = categories?.find((c: any) => c.name === mainCategory);
  
  // Convert empty strings to "all" for Select components
  const mainCategoryValue = mainCategory === "" ? "all" : mainCategory;
  const subCategoryValue = subCategory === "" ? "all" : subCategory;
  
  // Handle conversion when values change
  const handleMainCategoryChange = (value: string) => {
    setMainCategory(value === "all" ? "" : value);
    setSubCategory("");
  };
  
  const handleSubCategoryChange = (value: string) => {
    setSubCategory(value === "all" ? "" : value);
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="space-y-2">
        <Label htmlFor="search">Search Products</Label>
        <Input
          id="search"
          placeholder="Search by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label>Main Category</Label>
        <Select 
          value={mainCategoryValue} 
          onValueChange={handleMainCategoryChange}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories?.map((category: any) => (
              <SelectItem key={category.name} value={category.name}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label>Sub Category</Label>
        <Select 
          value={subCategoryValue} 
          onValueChange={handleSubCategoryChange}
          disabled={!mainCategory || isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="All sub-categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sub-categories</SelectItem>
            {selectedMain?.subCategories?.map((sub: string) => (
              <SelectItem key={sub} value={sub}>
                {sub}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-end">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => {
            setMainCategory("");
            setSubCategory("");
            setSearchQuery("");
          }}
        >
          Reset Filters
        </Button>
      </div>
    </div>
  );
};