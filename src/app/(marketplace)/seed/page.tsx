'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Database, Trash2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface SeedingResult {
  success: boolean;
  message: string;
  categoriesCreated?: number;
  subcategoriesCreated?: number;
  error?: string;
}

interface SeedingStats {
  totalCategories: number;
  totalSubcategories: number;
  totalProductTypes: number;
}

const SeedPage: React.FC = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [seedingResult, setSeedingResult] = useState<SeedingResult | null>(null);
  const [clearingResult, setClearingResult] = useState<SeedingResult | null>(null);

  // Calculate stats from the catalog data
  const stats: SeedingStats = {
    totalCategories: 10,
    totalSubcategories: 29,
    totalProductTypes: 169
  };

  const handleSeedCatalog = async () => {
    setIsSeeding(true);
    setSeedingResult(null);
    
    try {
      const response = await fetch('/api/seed-catalog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result: SeedingResult = await response.json();
      setSeedingResult(result);
    } catch (error) {
      setSeedingResult({
        success: false,
        message: 'Failed to seed catalog',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClearCatalog = async () => {
    if (!confirm('Are you sure you want to clear all product catalog data? This action cannot be undone.')) {
      return;
    }

    setIsClearing(true);
    setClearingResult(null);
    
    try {
      const response = await fetch('/api/clear-catalog', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result: SeedingResult = await response.json();
      setClearingResult(result);
    } catch (error) {
      setClearingResult({
        success: false,
        message: 'Failed to clear catalog',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearAndSeed = async () => {
    if (!confirm('Are you sure you want to clear all existing data and reseed? This action cannot be undone.')) {
      return;
    }

    setIsClearing(true);
    setClearingResult(null);
    setSeedingResult(null);
    
    try {
      // First clear
      const clearResponse = await fetch('/api/clear-catalog', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const clearResult: SeedingResult = await clearResponse.json();
      setClearingResult(clearResult);
      
      if (clearResult.success) {
        setIsClearing(false);
        setIsSeeding(true);
        
        // Then seed
        const seedResponse = await fetch('/api/seed-catalog', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const seedResult: SeedingResult = await seedResponse.json();
        setSeedingResult(seedResult);
      }
    } catch (error) {
      setSeedingResult({
        success: false,
        message: 'Failed to clear and seed catalog',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsClearing(false);
      setIsSeeding(false);
    }
  };

  const renderAlert = (result: SeedingResult, title: string) => (
    <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
      <div className="flex items-center gap-2">
        {result.success ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <XCircle className="h-4 w-4 text-red-600" />
        )}
        <h4 className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
          {title}
        </h4>
      </div>
      <AlertDescription className={result.success ? 'text-green-700' : 'text-red-700'}>
        <p className="mt-1">{result.message}</p>
        {result.categoriesCreated && result.subcategoriesCreated && (
          <p className="mt-1">
            Created {result.categoriesCreated} categories and {result.subcategoriesCreated} subcategories.
          </p>
        )}
        {result.error && (
          <p className="mt-1 font-mono text-sm bg-white/50 p-2 rounded">
            Error: {result.error}
          </p>
        )}
      </AlertDescription>
    </Alert>
  );

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Catalog Seeding</h1>
        <p className="text-gray-600">
          Manage your product catalog data by seeding or clearing categories and subcategories.
        </p>
      </div>

      {/* Stats Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Catalog Overview
          </CardTitle>
          <CardDescription>
            This seeding process will create a comprehensive product catalog structure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.totalCategories}</div>
              <div className="text-sm text-blue-800">Categories</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.totalSubcategories}</div>
              <div className="text-sm text-green-800">Subcategories</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.totalProductTypes}</div>
              <div className="text-sm text-purple-800">Product Types</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Seeding Actions</CardTitle>
          <CardDescription>
            Choose an action to manage your product catalog data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleSeedCatalog}
              disabled={isSeeding || isClearing}
              className="flex-1"
              size="lg"
            >
              {isSeeding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Seeding Catalog...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Seed Catalog
                </>
              )}
            </Button>
            
            <Button 
              onClick={handleClearCatalog}
              disabled={isSeeding || isClearing}
              variant="destructive"
              className="flex-1"
              size="lg"
            >
              {isClearing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Clearing Data...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear Catalog
                </>
              )}
            </Button>
          </div>
          
          <div className="pt-2 border-t">
            <Button 
              onClick={handleClearAndSeed}
              disabled={isSeeding || isClearing}
              variant="outline"
              className="w-full"
              size="lg"
            >
              {isClearing || isSeeding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isClearing ? 'Clearing...' : 'Seeding...'}
                </>
              ) : (
                <>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Clear & Reseed (Recommended)
                </>
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50">
          <div className="text-sm text-gray-600">
            <p><strong>Seed Catalog:</strong> Adds catalog data to existing collections</p>
            <p><strong>Clear Catalog:</strong> Removes all existing catalog data</p>
            <p><strong>Clear & Reseed:</strong> Removes existing data and creates fresh catalog (recommended)</p>
          </div>
        </CardFooter>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        {clearingResult && renderAlert(clearingResult, "Clear Operation")}
        {seedingResult && renderAlert(seedingResult, "Seeding Operation")}
      </div>

      {/* Categories Preview */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Categories to be Created</CardTitle>
          <CardDescription>
            Preview of the main categories that will be seeded
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              'Fashion & Apparel',
              'Electronics & Technology', 
              'Home & Garden',
              'Health & Beauty',
              'Sports & Outdoors',
              'Books, Movies & Music',
              'Automotive',
              'Baby & Kids',
              'Food & Beverages'
            ].map((category) => (
              <Badge key={category} variant="secondary" className="p-2 justify-center">
                {category}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SeedPage;