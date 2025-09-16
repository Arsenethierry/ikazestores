"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useProductParams } from "@/hooks/use-product-params";
import { PRICE_FILTER_VALUE } from "@/lib/constants";
import { CheckCircle2, Circle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export const FilterSidebar = ({ categories }: { categories: any[] }) => {
  const [priceRange, setPriceRange] = useState([PRICE_FILTER_VALUE.min, PRICE_FILTER_VALUE.max]);

  const {
    category,
    minPrice: queryMinPrice,
    maxPrice: queryMaxPrice,
    isPending,
    setCategory,
    setMinPrice: setQueryMinPrice,
    setMaxPrice: setQueryMaxPrice
  } = useProductParams();

  // Sync state with query params
  useEffect(() => {
    const min = queryMinPrice !== undefined ? queryMinPrice : PRICE_FILTER_VALUE.min;
    const max = queryMaxPrice !== undefined ? queryMaxPrice : PRICE_FILTER_VALUE.max;
    setPriceRange([min, max]);
  }, [queryMinPrice, queryMaxPrice]);

  const handleCategoryChange = (value: string) => {
    setCategory(value === category ? "" : value);
  };

  const handlePriceApply = () => {
    setQueryMinPrice(priceRange[0]);
    setQueryMaxPrice(priceRange[1]);
  };

  const handlePriceReset = () => {
    setPriceRange([PRICE_FILTER_VALUE.min, PRICE_FILTER_VALUE.max]);
    setQueryMinPrice(PRICE_FILTER_VALUE.min);
    setQueryMaxPrice(PRICE_FILTER_VALUE.max);
  };

  const stepSize = useMemo(() => {
    const range = PRICE_FILTER_VALUE.max - PRICE_FILTER_VALUE.min;
    return Math.max(1, Math.floor(range / 60));
  }, []);

  return (
    <div className="w-64 shrink-0 bg-white rounded-lg shadow p-4">
      <h2 className="font-medium text-lg mb-4">Filters</h2>

      <Accordion type="multiple" defaultValue={["category", "price"]} className="w-full">
        {/* Categories */}
        <AccordionItem value="category">
          <AccordionTrigger className="text-base font-medium py-2">Categories</AccordionTrigger>
          <AccordionContent>
            <div className="ml-2 space-y-2">
              <div
                className="flex items-center cursor-pointer hover:text-blue-600"
                onClick={() => setCategory("")}
              >
                {category === "" ? (
                  <CheckCircle2 size={16} className="mr-2 text-blue-600" />
                ) : (
                  <Circle size={16} className="mr-2" />
                )}
                <span
                  className={`text-sm font-medium ${category === "" ? "text-blue-600" : ""}`}
                >
                  All Categories
                </span>
              </div>

              {categories.map((cat) => (
                <div
                  key={cat.$id}
                  className="flex items-center cursor-pointer hover:text-blue-600"
                  onClick={() => handleCategoryChange(cat.categoryName)}
                >
                  {category === cat.categoryName ? (
                    <CheckCircle2 size={16} className="mr-2 text-blue-600" />
                  ) : (
                    <Circle size={16} className="mr-2" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      category === cat.categoryName ? "text-blue-600" : ""
                    }`}
                  >
                    {cat.categoryName}
                  </span>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Price */}
        <AccordionItem value="price">
          <AccordionTrigger className="text-base font-medium py-2">Price</AccordionTrigger>
          <AccordionContent>
            <div className="px-2 space-y-4">
              <Slider
                min={PRICE_FILTER_VALUE.min}
                max={PRICE_FILTER_VALUE.max}
                step={stepSize}
                value={priceRange}
                onValueChange={setPriceRange}
                className="py-4"
              />
              <div className="flex justify-between">
                <div className="border rounded-md w-24 px-2 py-1 text-center">
                  ${priceRange[0]}
                </div>
                <div className="border rounded-md w-24 px-2 py-1 text-center">
                  ${priceRange[1]}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handlePriceApply} size="sm" className="flex-1" disabled={isPending}>
                  Apply
                </Button>
                <Button
                  onClick={handlePriceReset}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  disabled={isPending}
                >
                  Reset
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
