"use client";

import { cancelOrder, createOrder, getLogedInUserOrders, getOrderById, getPhysicalStoreFulfillmentOrders, getVirtualStoreOrders, updateFulfillmentStatus } from "@/lib/actions/product-order-actions";
import { OrderStatus, PhysicalStoreFulfillmentOrderStatus } from "@/lib/constants";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGetOrderById = (orderId: string) => {
    return useQuery({
        queryKey: ["order", orderId],
        queryFn: () => getOrderById(orderId),
        enabled: !!orderId,
        staleTime: 1000 * 60 * 5,
    });
};

export const useCreateOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createOrder,
        onSuccess: (result) => {
            if (result.success && result.data) {
                toast.success(result.success);
                
                queryClient.invalidateQueries({ queryKey: ["user-orders"] });
                queryClient.invalidateQueries({ queryKey: ["virtual-store-orders", result.data.virtualStoreId] });
                
                if (result.data.physicalStoreBreakdown) {
                    result.data.physicalStoreBreakdown.forEach(({ physicalStoreId }) => {
                        queryClient.invalidateQueries({ queryKey: ["physical-store-order-fulfillment", physicalStoreId] });
                    });
                }
                
                queryClient.invalidateQueries({ queryKey: ["order-analytics"] });
                queryClient.invalidateQueries({ queryKey: ["commission-records"] });
                
            } else if (result.error) {
                toast.error(result.error);
            }
        },
        onError: (error) => {
            const errorMessage = error instanceof Error ? error.message : "Failed to place order";
            toast.error(errorMessage);
            console.error("Order creation error:", error);
        }
    });
};

export const useGetUserOrders = (options: {
    limit?: number;
    offset?: number;
    status?: OrderStatus;
} = {}) => {
    return useQuery({
        queryKey: ["user-orders", options],
        queryFn: () => getLogedInUserOrders(options),
        staleTime: 1000 * 60 * 2,
    });
};

export const useCancelOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (orderId: string) => cancelOrder(orderId),
        onSuccess: (result, orderId) => {
            if (result.success) {
                toast.success(result.success);

                queryClient.invalidateQueries({ queryKey: ["user-orders"] });
                queryClient.invalidateQueries({ queryKey: ["order", orderId] });
            } else if (result.error) {
                toast.error(result.error);
            }
        },
        onError: (error) => {
            toast.error("Failed to cancel order");
            console.error("Cancel order error:", error);
        },
    });
};

export const useGetPhysicalStoreFulfillmentOrders = (
    physicalStoreId: string,
    options: {
        status?: PhysicalStoreFulfillmentOrderStatus;
        limit?: number;
        offset?: number;
    } = {}
) => {
    return useQuery({
        queryKey: ["physical-store-orders-fulfillment", physicalStoreId, options],
        queryFn: () => getPhysicalStoreFulfillmentOrders(physicalStoreId, options),
        enabled: !!physicalStoreId,
        staleTime: 1000 * 60 * 3, // 3 minutes
        refetchInterval: 1000 * 60 * 5, // Auto-refresh every 5 minutes
    });
};

export const useUpdateFulfillmentStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            fulfillmentId,
            status,
            trackingNumber
        }: {
            fulfillmentId: string;
            status: PhysicalStoreFulfillmentOrderStatus;
            trackingNumber?: string;
        }) => updateFulfillmentStatus(fulfillmentId, status, trackingNumber),
        onSuccess: (result, variables) => {
            if (result.success) {
                toast.success(result.success);

                queryClient.invalidateQueries({ queryKey: ["physical-store-order-fulfillment"] });

                queryClient.setQueryData(
                    ["physical-store-order-fulfillment"],
                    (oldData: any) => {
                        if (!oldData) return oldData;

                        return {
                            ...oldData,
                            data: {
                                ...oldData.data,
                                documents: oldData.data.documents.map((doc: any) =>
                                    doc.$id === variables.fulfillmentId
                                        ? { ...doc, status: variables.status, trackingNumber: variables.trackingNumber }
                                        : doc
                                )
                            }
                        };
                    }
                );
            } else if (result.error) {
                toast.error(result.error)
            }
        },
        onError: (error) => {
            toast.error("Failed to update fulfillment status");
            console.error("Update fulfillment status error:", error);
        },
    })
};

export const useGetVirtualStoreOrders = (
    virtualStoreId: string,
    options: {
        status?: OrderStatus;
        limit?: number;
        offset?: number;
    } = {}
) => {
    return useQuery({
        queryKey: ["virtual-store-orders", virtualStoreId, options],
        queryFn: () => getVirtualStoreOrders(virtualStoreId, options),
        enabled: !!virtualStoreId,
        staleTime: 1000 * 60 * 2,
        refetchInterval: 1000 * 60 * 3,
    });
};

export const useOrderFilters = () => {
    const orderStatuses = [
        { value: OrderStatus.PENDING, label: "Pending", color: "bg-yellow-100 text-yellow-800" },
        { value: OrderStatus.PROCESSING, label: "Processing", color: "bg-blue-100 text-blue-800" },
        { value: OrderStatus.SHIPPED, label: "Shipped", color: "bg-purple-100 text-purple-800" },
        { value: OrderStatus.DELIVERED, label: "Delivered", color: "bg-green-100 text-green-800" },
        { value: OrderStatus.CANCELLED, label: "Cancelled", color: "bg-red-100 text-red-800" },
    ];

    const fulfillmentStatuses = [
        { value: "pending_fulfillment", label: "Pending Fulfillment", color: "bg-yellow-100 text-yellow-800" },
        { value: "processing", label: "Processing", color: "bg-blue-100 text-blue-800" },
        { value: "shipped", label: "Shipped", color: "bg-purple-100 text-purple-800" },
        { value: "completed", label: "Completed", color: "bg-green-100 text-green-800" },
    ];

    const getStatusBadgeClass = (status: OrderStatus | string) => {
        const allStatuses = [...orderStatuses, ...fulfillmentStatuses];
        const statusConfig = allStatuses.find(s => s.value === status);
        return statusConfig?.color || "bg-gray-100 text-gray-800";
    };

    const getStatusLabel = (status: OrderStatus | string) => {
        const allStatuses = [...orderStatuses, ...fulfillmentStatuses];
        const statusConfig = allStatuses.find(s => s.value === status);
        return statusConfig?.label || status;
    };

    return {
        orderStatuses,
        fulfillmentStatuses,
        getStatusBadgeClass,
        getStatusLabel,
    };
};

// Infinite scroll hook for orders
export const useInfiniteOrders = (
    queryType: 'user' | 'virtual-store' | 'physical-fulfillment',
    storeId?: string,
    filters: {
        status?: OrderStatus | string;
        search?: string;
    } = {}
) => {
    return useQuery({
        queryKey: ["infinite-orders", queryType, storeId, filters],
        queryFn: async () => {
            switch (queryType) {
                case 'user':
                    return getLogedInUserOrders({ limit: 20, offset: 0, status: filters.status as OrderStatus });
                case 'virtual-store':
                    return getVirtualStoreOrders(storeId!, { limit: 20, offset: 0, status: filters.status as OrderStatus });
                case 'physical-fulfillment':
                    return getPhysicalStoreFulfillmentOrders(storeId!, {
                        limit: 20,
                        offset: 0,
                        status: filters.status as any
                    });
                default:
                    throw new Error('Invalid query type');
            }
        },
        enabled: queryType === 'user' || !!storeId,
        staleTime: 1000 * 60 * 2,
    });
};

// Real-time order updates hook (for notifications)---> TO BE UPDATED LATER
export const useOrderUpdates = (userId: string) => {
    const queryClient = useQueryClient();

    // This would typically use WebSocket or Server-Sent Events
    // For now, just providing the structure
    return {
        subscribe: () => {
            // Subscribe to order updates
            console.log("Subscribing to order updates for user:", userId);
        },
        unsubscribe: () => {
            // Unsubscribe from order updates
            console.log("Unsubscribing from order updates");
        },
        invalidateOrderQueries: () => {
            queryClient.invalidateQueries({ queryKey: ["user-orders"] });
            queryClient.invalidateQueries({ queryKey: ["virtual-store-orders"] });
            queryClient.invalidateQueries({ queryKey: ["physical-store-order-fulfillment"] });
        }
    };
};