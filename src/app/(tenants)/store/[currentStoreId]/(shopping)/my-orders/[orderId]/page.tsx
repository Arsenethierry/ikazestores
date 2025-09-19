import { Alert, AlertDescription } from "@/components/ui/alert";
import { getAuthState } from "@/lib/user-permission";
import { searchOrdersAction } from "@/lib/actions/product-order-actions";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { OrderDetailsPage, OrderDetailsPageSkeleton } from "@/features/order/my-orders/order-details";

interface OrderDetailsPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function OrderDetails({ params }: OrderDetailsPageProps) {
  const { user } = await getAuthState();
  
  if (!user) {
    redirect('/sign-in?redirectUrl=' + encodeURIComponent(`/my-orders/${(await params).orderId}`));
  }

  return (
    <Suspense fallback={<OrderDetailsPageSkeleton />}>
      <OrderDetailsContent orderId={(await params).orderId} customerId={user.$id} />
    </Suspense>
  );
}

async function OrderDetailsContent({ 
  orderId, 
  customerId 
}: { 
  orderId: string; 
  customerId: string;
}) {
  try {
    // Search for the specific order by the customer
    const result = await searchOrdersAction({
      page: 1,
      limit: 1,
    });

    if (!result?.data?.success || !result.data.orders) {
      throw new Error('Failed to fetch orders');
    }

    // Find the specific order
    const order = result.data.orders.find(o => o.$id === orderId);
    
    if (!order) {
      notFound();
    }

    // Verify the order belongs to the current user
    if (order.customerId !== customerId) {
      return <UnauthorizedAccess />;
    }

    return (
      <OrderDetailsPage
        order={order} 
        customerId={customerId}
      />
    );
  } catch (error) {
    console.error('Error fetching order details:', error);
    return <ErrorFallback orderId={orderId} />;
  }
}

function UnauthorizedAccess() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center">
          <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">
            You don't have permission to view this order. You can only view orders that belong to your account.
          </p>
        </div>

        <div className="flex justify-center gap-4">
          <Link href="/my-orders">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Orders
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorFallback({ orderId }: { orderId: string }) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load order details. The order might not exist or there was a server error.
        </AlertDescription>
      </Alert>
      
      <div className="mt-6 flex justify-center gap-4">
        <Link href="/my-orders">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Orders
          </Button>
        </Link>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    </div>
  );
}