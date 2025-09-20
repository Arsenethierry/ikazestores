"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useState, useMemo, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { 
  DecreaseCartItemQuantity, 
  IncreaseCartItemQuantity, 
  RemoveCartItem 
} from './cart-actions-buttons';
import { useCartStore } from '../use-cart-store';
import { getCurrencySymbol } from '@/features/products/currency/currency-utils';
import { 
  ShoppingCart, 
  Trash2, 
  Heart, 
  Info, 
  Truck, 
  Shield, 
  Clock,
  ArrowRight,
  Gift,
  Percent,
  CreditCard,
  Bookmark,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useConfirm } from '@/hooks/use-confirm';

// Enhanced cart page with single currency support
export const CartPage = () => {
  const { items, totalItems, clearCart } = useCartStore();
  const router = useRouter();
  
  // Refs
  const confirmClearRef = useRef<ConfirmClearCartRef>(null);
  
  // State management
  const [selectedItems, setSelectedItems] = useState<string[]>(items.map(item => item.id));
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [savedItems, setSavedItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Sync selected items when cart items change
  useEffect(() => {
    setSelectedItems(prev => prev.filter(id => items.some(item => item.id === id)));
  }, [items]);

  // Calculations - simplified for single currency
  const calculations = useMemo(() => {
    const selectedItemsData = items.filter(item => selectedItems.includes(item.id));
    
    // Calculate totals (assuming single currency)
    const subtotal = selectedItemsData.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalSelectedItems = selectedItemsData.reduce((sum, item) => sum + item.quantity, 0);
    const currency = selectedItemsData[0]?.productCurrency || 'USD'; // Get currency from first item
    
    const estimatedTax = 0; // Calculate based on your tax logic
    const shippingCost = totalSelectedItems > 0 ? (subtotal > 100000 ? 0 : 50) : 0;

    return {
      selectedItemsData,
      subtotal,
      totalSelectedItems,
      currency,
      estimatedTax,
      shippingCost,
      promoDiscount
    };
  }, [selectedItems, items, promoDiscount]);

  const handleSelectAll = (checked: boolean) => {
    setSelectedItems(checked ? items.map(item => item.id) : []);
  };

  const handleItemSelection = (itemId: string) => (checked: boolean) => {
    setSelectedItems(prev =>
      checked ? [...prev, itemId] : prev.filter(id => id !== itemId)
    );
  };

  const handleSaveForLater = (itemId: string) => {
    setSavedItems(prev => [...prev, itemId]);
    setSelectedItems(prev => prev.filter(id => id !== itemId));
    toast.success("Item saved for later");
  };

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) return;
    
    setIsApplyingPromo(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (promoCode.toLowerCase() === 'save10') {
      setPromoDiscount(10);
      toast.success("Promo code applied! 10% discount");
    } else {
      toast.error("Invalid promo code");
    }
    setIsApplyingPromo(false);
  };

  const handleClearCart = async () => {
    if (confirmClearRef.current) {
      await confirmClearRef.current.confirmClear();
    }
  };

  const handlePlaceOrder = () => {
    setIsLoading(true);
    setTimeout(() => {
      router.push(`/place-order?products=${encodeURIComponent(selectedItems.join(','))}`);
      setIsLoading(false);
    }, 500);
  };

  // Calculate final totals
  const discountAmount = calculations.subtotal * calculations.promoDiscount / 100;
  const finalTotal = calculations.subtotal - discountAmount + calculations.shippingCost + calculations.estimatedTax;

  if (totalItems === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto px-4">
          <div className="relative">
            <div className="h-32 w-32 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <ShoppingCart className="h-16 w-16 text-gray-400" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">
              Looks like you haven't added anything to your cart yet. Start shopping to fill it up!
            </p>
          </div>
          <div className="space-y-3">
            <Button onClick={() => router.push('/products')} className="w-full">
              Continue Shopping
            </Button>
            <Button variant="outline" onClick={() => router.push('/saved-items')} className="w-full">
              <Heart className="h-4 w-4 mr-2" />
              View Saved Items
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Shopping Cart</h1>
          <p className="text-gray-600 mt-1">
            {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearCart}
            disabled={totalItems === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Cart
          </Button>
        </div>
      </div>

      <Alert className="mb-6 bg-green-50 border-green-200">
        <Shield className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Truck className="h-4 w-4" />
              Free shipping on orders over 100000 {calculations.currency}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              2-3 day delivery
            </span>
            <span className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              Secure checkout
            </span>
          </div>
        </AlertDescription>
      </Alert>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedItems.length === items.length && items.length > 0}
                  onCheckedChange={handleSelectAll}
                  className="h-5 w-5"
                />
                <span className="font-medium">
                  Select all items ({calculations.totalSelectedItems} of {totalItems} selected)
                </span>
              </div>
              
              {selectedItems.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedItems([])}
                >
                  Deselect All
                </Button>
              )}
            </div>
          </Card>

          <div className="space-y-3">
            {items.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                isSelected={selectedItems.includes(item.id)}
                onSelectionChange={handleItemSelection(item.id)}
                onSaveForLater={() => handleSaveForLater(item.id)}
                isSaved={savedItems.includes(item.id)}
              />
            ))}
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">You might also like</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Add recommended products here */}
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-100 rounded-lg h-32 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">Product {i}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <div className="sticky top-6 space-y-4">
            {/* Promo Code */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  Promo Code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleApplyPromoCode}
                    disabled={!promoCode.trim() || isApplyingPromo}
                    size="sm"
                  >
                    {isApplyingPromo ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Apply'}
                  </Button>
                </div>
                {promoDiscount > 0 && (
                  <Badge variant="secondary" className="w-fit">
                    {promoDiscount}% discount applied
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Price breakdown */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{getCurrencySymbol(calculations.currency)} {calculations.subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      Shipping
                      {calculations.shippingCost === 0 && calculations.totalSelectedItems > 0 && (
                        <Badge variant="secondary" className="text-xs">FREE</Badge>
                      )}
                    </span>
                    <span>
                      {calculations.shippingCost === 0 && calculations.totalSelectedItems > 0 
                        ? 'FREE' 
                        : `${getCurrencySymbol(calculations.currency)} ${calculations.shippingCost.toFixed(2)}`
                      }
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Estimated Tax</span>
                    <span>{getCurrencySymbol(calculations.currency)} {calculations.estimatedTax.toFixed(2)}</span>
                  </div>

                  {promoDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({promoDiscount}%)</span>
                      <span>-{getCurrencySymbol(calculations.currency)} {discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Total */}
                <div className="flex justify-between items-center font-semibold text-lg">
                  <span>Total</span>
                  <span>{getCurrencySymbol(calculations.currency)} {finalTotal.toFixed(2)}</span>
                </div>

                {/* Savings indicator */}
                {calculations.shippingCost === 0 && calculations.totalSelectedItems > 0 && (
                  <Alert className="bg-green-50 border-green-200">
                    <Gift className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 text-sm">
                      You're saving {getCurrencySymbol(calculations.currency)} 50 on shipping!
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>

              <CardFooter className="flex flex-col gap-3">
                <Button
                  onClick={handlePlaceOrder}
                  disabled={selectedItems.length === 0 || isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="h-4 w-4 mr-2" />
                  )}
                  {isLoading ? 'Processing...' : `Checkout (${calculations.totalSelectedItems} items)`}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => router.push('/products')}
                  className="w-full"
                >
                  Continue Shopping
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>

      <ConfirmClearCart ref={confirmClearRef} />
    </div>
  );
};

interface CartItemCardProps {
  item: any;
  isSelected: boolean;
  onSelectionChange: (checked: boolean) => void;
  onSaveForLater: () => void;
  isSaved: boolean;
}

const CartItemCard = ({ 
  item, 
  isSelected, 
  onSelectionChange, 
  onSaveForLater,
  isSaved 
}: CartItemCardProps) => {
  const [imageError, setImageError] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      isSelected ? "ring-2 ring-blue-500 ring-opacity-50" : "",
      isSaved ? "opacity-60" : ""
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Selection Checkbox */}
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelectionChange}
            className="mt-2 h-5 w-5"
            disabled={isSaved}
          />

          {/* Product Image */}
          <div className="relative h-20 w-20 flex-shrink-0">
            {imageError ? (
              <div className="h-full w-full bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-gray-400 text-xs text-center">
                  No Image
                </div>
              </div>
            ) : (
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover rounded-lg"
                onError={() => setImageError(true)}
              />
            )}
          </div>

          {/* Product Details */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-base truncate pr-2" title={item.name}>
                  {item.name}
                </h3>
                <div className="text-sm text-gray-500 mt-1">
                  {getCurrencySymbol(item.productCurrency)} {item.price.toFixed(2)} each
                </div>
                
                {/* Stock status */}
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    In Stock
                  </Badge>
                  {/* Add more badges for attributes like size, color, etc. */}
                </div>
              </div>

              {/* Price and Actions */}
              <div className="flex flex-col items-end gap-3 ml-4">
                <div className="font-semibold text-lg">
                  {getCurrencySymbol(item.productCurrency)} {(item.price * item.quantity).toFixed(2)}
                </div>
                
                {/* Quantity Controls */}
                <div className="flex items-center gap-2">
                  <DecreaseCartItemQuantity item={item} />
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <IncreaseCartItemQuantity item={item} />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSaveForLater}
                    disabled={isSaved}
                    className="text-xs"
                  >
                    <Bookmark className="h-3 w-3 mr-1" />
                    {isSaved ? 'Saved' : 'Save'}
                  </Button>
                  <RemoveCartItem item={item} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface ConfirmClearCartProps {
  onClearComplete?: () => void;
}

export interface ConfirmClearCartRef {
  confirmClear: () => Promise<void>;
}

export const ConfirmClearCart = forwardRef<ConfirmClearCartRef, ConfirmClearCartProps>(
  ({ onClearComplete }, ref) => {
    const { clearCart } = useCartStore();
    
    const [ConfirmationDialog, confirm] = useConfirm(
      "Clear Cart",
      "Are you sure you want to remove all items from your cart? This action cannot be undone.",
      "destructive"
    );

    const handleConfirmClear = async () => {
      const confirmed = await confirm();
      if (confirmed) {
        clearCart();
        toast.success("Cart cleared successfully");
        onClearComplete?.();
      }
    };

    useImperativeHandle(ref, () => ({
      confirmClear: handleConfirmClear
    }));

    return <ConfirmationDialog />;
  }
);