"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { OrderStatus, PhysicalStoreFulfillmentOrderStatus } from "@/lib/constants";
import { 
  CalendarIcon, 
  Filter, 
  X, 
  Search,
  RotateCcw 
} from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

export interface OrderFilters {
  status?: OrderStatus[];
  fulfillmentStatus?: PhysicalStoreFulfillmentOrderStatus[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  search?: string;
}

interface OrdersFiltersProps {
  storeType: 'virtual' | 'physical';
  permissions: {
    canUpdateStatus: boolean;
    canUpdateFulfillment: boolean;
    canCancel: boolean;
    canBulkUpdate: boolean;
    canViewAll: boolean;
  };
  filters: OrderFilters;
  onFiltersChange: (filters: OrderFilters) => void;
  onClearFilters: () => void;
}

export function OrdersFilters({ 
  storeType, 
  permissions,
  filters,
  onFiltersChange,
  onClearFilters
}: OrdersFiltersProps) {
  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    filters.dateRange ? {
      from: filters.dateRange.from,
      to: filters.dateRange.to
    } : undefined
  );

  // Sync local search state with props when filters change externally
  useEffect(() => {
    if (filters.search !== searchTerm && !searchTimeout) {
      setSearchTerm(filters.search || "");
    }
  }, [filters.search]);

  // Sync date range with props when filters change externally  
  useEffect(() => {
    if (filters.dateRange) {
      setDateRange({
        from: filters.dateRange.from,
        to: filters.dateRange.to
      });
    } else {
      setDateRange(undefined);
    }
  }, [filters.dateRange]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Debounce search
    const timeout = setTimeout(() => {
      onFiltersChange({ ...filters, search: value || undefined });
      setSearchTimeout(null);
    }, 500);
    
    setSearchTimeout(timeout);
  };

  const handleStatusFilter = (status: OrderStatus, checked: boolean) => {
    const currentStatuses = filters.status || [];
    const updatedStatuses = checked
      ? [...currentStatuses, status]
      : currentStatuses.filter((s: OrderStatus) => s !== status);
    
    onFiltersChange({ 
      ...filters, 
      status: updatedStatuses.length > 0 ? updatedStatuses : undefined 
    });
  };

  const handleFulfillmentFilter = (status: PhysicalStoreFulfillmentOrderStatus, checked: boolean) => {
    const currentStatuses = filters.fulfillmentStatus || [];
    const updatedStatuses = checked
      ? [...currentStatuses, status]
      : currentStatuses.filter((s: PhysicalStoreFulfillmentOrderStatus) => s !== status);
    
    onFiltersChange({ 
      ...filters, 
      fulfillmentStatus: updatedStatuses.length > 0 ? updatedStatuses : undefined 
    });
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      onFiltersChange({ 
        ...filters,
        dateRange: { 
          from: range.from, 
          to: range.to 
        } 
      });
    } else {
      onFiltersChange({ 
        ...filters,
        dateRange: undefined 
      });
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status?.length) count++;
    if (filters.fulfillmentStatus?.length) count++;
    if (filters.dateRange) count++;
    if (filters.search) count++;
    return count;
  };

  const handleClearAll = () => {
    setSearchTerm("");
    setDateRange(undefined);
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    onClearFilters();
  };

  const handleQuickFilter = (filterType: 'pending' | 'thisWeek') => {
    if (filterType === 'pending') {
      onFiltersChange({ 
        ...filters,
        status: [OrderStatus.PENDING] 
      });
    } else if (filterType === 'thisWeek') {
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      handleDateRangeChange({ from: weekAgo, to: today });
    }
  };

  const activeFiltersCount = getActiveFiltersCount();

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          {activeFiltersCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleClearAll}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search Orders</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by order number, customer email..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Quick Filters Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Order Status Filter */}
          <div className="space-y-2">
            <Label>Order Status</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  size="sm"
                >
                  Status
                  {filters.status?.length ? (
                    <Badge variant="secondary" className="ml-auto">
                      {filters.status.length}
                    </Badge>
                  ) : null}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-60" align="start">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Select Statuses</h4>
                  <div className="space-y-2">
                    {Object.values(OrderStatus).map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={status}
                          checked={filters.status?.includes(status) || false}
                          onCheckedChange={(checked) => 
                            handleStatusFilter(status, !!checked)
                          }
                        />
                        <Label 
                          htmlFor={status} 
                          className="text-sm capitalize cursor-pointer"
                        >
                          {status}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Fulfillment Status Filter (Physical stores only) */}
          {storeType === 'physical' && (
            <div className="space-y-2">
              <Label>Fulfillment Status</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    size="sm"
                  >
                    Fulfillment
                    {filters.fulfillmentStatus?.length ? (
                      <Badge variant="secondary" className="ml-auto">
                        {filters.fulfillmentStatus.length}
                      </Badge>
                    ) : null}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60" align="start">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Select Fulfillment Status</h4>
                    <div className="space-y-2">
                      {Object.values(PhysicalStoreFulfillmentOrderStatus).map((status) => (
                        <div key={status} className="flex items-center space-x-2">
                          <Checkbox
                            id={`fulfillment-${status}`}
                            checked={filters.fulfillmentStatus?.includes(status) || false}
                            onCheckedChange={(checked) => 
                              handleFulfillmentFilter(status, !!checked)
                            }
                          />
                          <Label 
                            htmlFor={`fulfillment-${status}`} 
                            className="text-sm capitalize cursor-pointer"
                          >
                            {status.replace('_', ' ')}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Date Range Filter */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  size="sm"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "MMM dd")} -{" "}
                        {format(dateRange.to, "MMM dd")}
                      </>
                    ) : (
                      format(dateRange.from, "MMM dd, yyyy")
                    )
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={handleDateRangeChange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <Label>Quick Filters</Label>
            <div className="flex flex-wrap gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickFilter('pending')}
                className="text-xs h-7"
              >
                Pending
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickFilter('thisWeek')}
                className="text-xs h-7"
              >
                This Week
              </Button>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Active Filters</Label>
            <div className="flex flex-wrap gap-1">
              {filters.status?.map((status: OrderStatus) => (
                <Badge 
                  key={status} 
                  variant="secondary" 
                  className="text-xs"
                >
                  Status: {status}
                  <button
                    onClick={() => handleStatusFilter(status, false)}
                    className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              
              {filters.fulfillmentStatus?.map((status: PhysicalStoreFulfillmentOrderStatus) => (
                <Badge 
                  key={status} 
                  variant="secondary" 
                  className="text-xs"
                >
                  Fulfillment: {status.replace('_', ' ')}
                  <button
                    onClick={() => handleFulfillmentFilter(status, false)}
                    className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}

              {filters.dateRange && (
                <Badge variant="secondary" className="text-xs">
                  {format(filters.dateRange.from, "MMM dd")} - {format(filters.dateRange.to, "MMM dd")}
                  <button
                    onClick={() => {
                      onFiltersChange({ 
                        ...filters,
                        dateRange: undefined 
                      });
                      setDateRange(undefined);
                    }}
                    className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              {filters.search && (
                <Badge variant="secondary" className="text-xs">
                  Search: "{filters.search}"
                  <button
                    onClick={() => {
                      onFiltersChange({ 
                        ...filters,
                        search: undefined 
                      });
                      setSearchTerm("");
                    }}
                    className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}