"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OrderStatus, PaymentStatus } from "@/lib/constants";
import {
  cancelOrderAction,
  requestReturnAction,
  downloadInvoiceAction,
  trackShipmentAction,
} from "@/lib/actions/product-order-actions";
import { OrderWithItems } from "@/lib/models/OrderModel";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  Download,
  MapPin,
  Package,
  Phone,
  Receipt,
  RotateCcw,
  Truck,
  User,
  X,
  AlertCircle,
  FileText,
  Eye,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface OrderDetailsPageProps {
  order: OrderWithItems;
  customerId: string;
}

export function OrderDetailsPage({ order, customerId }: OrderDetailsPageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [showTrackingDialog, setShowTrackingDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [returnData, setReturnData] = useState({
    reason: "",
    description: "",
  });
  const [trackingData, setTrackingData] = useState<any>(null);

  // Status helpers
  const canCancel = [OrderStatus.PENDING, OrderStatus.PROCESSING].includes(
    order.orderStatus as OrderStatus
  );
  const canReturn = order.orderStatus === OrderStatus.DELIVERED;
  const canDownloadInvoice = [
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
  ].includes(order.orderStatus as OrderStatus);
  const canTrack = [
    OrderStatus.PROCESSING,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
  ].includes(order.orderStatus as OrderStatus);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case OrderStatus.PENDING:
        return "bg-yellow-100 text-yellow-800";
      case OrderStatus.PROCESSING:
        return "bg-blue-100 text-blue-800";
      case OrderStatus.SHIPPED:
        return "bg-purple-100 text-purple-800";
      case OrderStatus.DELIVERED:
        return "bg-green-100 text-green-800";
      case OrderStatus.CANCELLED:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case PaymentStatus.CONFIRMED:
        return "bg-green-100 text-green-800";
      case PaymentStatus.PENDING:
        return "bg-yellow-100 text-yellow-800";
      case PaymentStatus.FAILED:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Action handlers
  const handleCancelOrder = () => {
    if (!cancelReason.trim()) {
      toast.error("Please provide a cancellation reason");
      return;
    }

    startTransition(async () => {
      try {
        const result = await cancelOrderAction({
          orderId: order.$id,
          reason: cancelReason,
        });

        if (result?.data?.success) {
          toast.success("Order cancelled successfully");
          router.refresh();
          setShowCancelDialog(false);
        } else {
          toast.error(result?.data?.message || "Failed to cancel order");
        }
      } catch (error) {
        toast.error("Failed to cancel order");
      }
    });
  };

  const handleReturnRequest = () => {
    if (!returnData.reason.trim()) {
      toast.error("Please provide a return reason");
      return;
    }

    startTransition(async () => {
      try {
        const result = await requestReturnAction({
          orderId: order.$id,
          reason: returnData.reason,
          description: returnData.description,
        });

        if (result?.data) {
          toast.success("Return request submitted successfully");
          router.refresh();
          setShowReturnDialog(false);
        } else {
          toast.error(result?.data?.error || "Failed to request return");
        }
      } catch (error) {
        toast.error("Failed to request return");
      }
    });
  };

  const handleDownloadInvoice = () => {
    startTransition(async () => {
      try {
        const result = await downloadInvoiceAction({
          orderId: order.$id,
        });

        if (result?.data?.success && result.data.downloadUrl) {
          window.open(result.data.downloadUrl, '_blank');
          toast.success("Invoice download started");
        } else {
          toast.error("Failed to download invoice");
        }
      } catch (error) {
        toast.error("Failed to download invoice");
      }
    });
  };

  const handleTrackShipment = () => {
    startTransition(async () => {
      try {
        const result = await trackShipmentAction({
          orderId: order.$id,
        });

        if (result?.data?.success) {
          setTrackingData(result.data.trackingData);
          setShowTrackingDialog(true);
        } else {
          toast.error("Failed to track shipment");
        }
      } catch (error) {
        toast.error("Failed to track shipment");
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
          <p className="text-muted-foreground">
            Placed on {format(new Date(order.orderDate), "PPP")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(order.orderStatus)}>
            {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
          </Badge>
        </div>
      </div>

      {/* Action Buttons */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelDialog(true)}
                disabled={isPending}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel Order
              </Button>
            )}
            
            {canReturn && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReturnDialog(true)}
                disabled={isPending}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Request Return
              </Button>
            )}
            
            {canDownloadInvoice && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadInvoice}
                disabled={isPending}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Invoice
              </Button>
            )}
            
            {canTrack && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleTrackShipment}
                disabled={isPending}
              >
                <Truck className="h-4 w-4 mr-2" />
                Track Order
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/my-orders')}
            >
              <Eye className="h-4 w-4 mr-2" />
              View All Orders
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items ({order.items?.documents.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items?.documents.map((item) => (
                <div key={item.$id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="relative h-16 w-16 flex-shrink-0">
                    <Image
                      src={item.productImage || '/placeholder-product.jpg'}
                      alt={item.productName}
                      fill
                      className="object-cover rounded-md"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{item.productName}</h3>
                    <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {item.sellingPrice} RWF
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Subtotal: {item.subtotal} RWF
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Order Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Order Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Order Placed</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(order.orderDate), "PPp")}
                    </p>
                  </div>
                </div>

                {order.orderStatus !== OrderStatus.PENDING && (
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Package className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Processing</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(order.$updatedAt), "PPp")}
                      </p>
                    </div>
                  </div>
                )}

                {[OrderStatus.SHIPPED, OrderStatus.DELIVERED].includes(order.orderStatus as OrderStatus) && (
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Truck className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">Shipped</p>
                      <p className="text-sm text-muted-foreground">
                        Your order is on its way
                      </p>
                    </div>
                  </div>
                )}

                {order.orderStatus === OrderStatus.DELIVERED && (
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Delivered</p>
                      <p className="text-sm text-muted-foreground">
                        {order.deliveredAt ? format(new Date(order.deliveredAt), "PPp") : "Recently delivered"}
                      </p>
                    </div>
                  </div>
                )}

                {order.orderStatus === OrderStatus.CANCELLED && (
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                      <X className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium">Cancelled</p>
                      <p className="text-sm text-muted-foreground">
                        {order.cancellationReason || "Order was cancelled"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{order.subtotal} RWF</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{order.shippingCost} RWF</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>{order.taxAmount} RWF</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{order.discountAmount} RWF</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{order.totalAmount} RWF</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Payment Method</span>
                <span className="capitalize">{order.paymentMethod.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Payment Status</span>
                <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                  {order.paymentStatus && order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Delivery Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium">Delivery Address</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {order.deliveryAddress}
                </p>
              </div>
              {order.estimatedDeliveryDate && (
                <div>
                  <p className="font-medium">Estimated Delivery</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(order.estimatedDeliveryDate), "PPP")}
                  </p>
                </div>
              )}
              <div>
                <p className="font-medium">Contact</p>
                <p className="text-sm text-muted-foreground">
                  {order.customerPhone}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Support */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Need Help?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Have questions about your order? Our support team is here to help.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel Order Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel order #{order.orderNumber}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cancel-reason">Reason for cancellation *</Label>
              <Textarea
                id="cancel-reason"
                placeholder="Please tell us why you're cancelling this order..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              Keep Order
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelOrder}
              disabled={isPending || !cancelReason.trim()}
            >
              Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Request Dialog */}
      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Return</DialogTitle>
            <DialogDescription>
              Request a return for order #{order.orderNumber}. Returns must be requested within 30 days of delivery.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="return-reason">Reason for return *</Label>
              <Input
                id="return-reason"
                placeholder="e.g., Wrong size, Defective item, etc."
                value={returnData.reason}
                onChange={(e) => setReturnData(prev => ({ ...prev, reason: e.target.value }))}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="return-description">Additional details</Label>
              <Textarea
                id="return-description"
                placeholder="Please provide additional details about your return request..."
                value={returnData.description}
                onChange={(e) => setReturnData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReturnDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReturnRequest}
              disabled={isPending || !returnData.reason.trim()}
            >
              Submit Return Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tracking Dialog */}
      <Dialog open={showTrackingDialog} onOpenChange={setShowTrackingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Track Your Order</DialogTitle>
            <DialogDescription>
              Order #{order.orderNumber} - {trackingData?.carrier}
            </DialogDescription>
          </DialogHeader>
          {trackingData && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-medium">Tracking Number</p>
                <p className="font-mono text-sm">{trackingData.trackingNumber}</p>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Tracking Events</h4>
                {trackingData.events.map((event: any, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="h-2 w-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">{event.status}</p>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(event.timestamp), "PPp")} - {event.location}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowTrackingDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Loading component for when the order is being fetched
export function OrderDetailsPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-8 w-8" />
        <div className="flex-1">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-28" />
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4 p-4 border rounded-lg mb-4">
                  <Skeleton className="h-16 w-16" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}