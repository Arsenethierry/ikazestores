"use client";

import { create } from "zustand";
import { OrderFullfilmentRecords, Orders } from "../types/appwrite/appwrite";
import { OrderStatus, PhysicalStoreFulfillmentOrderStatus } from "../constants";
import { devtools } from "zustand/middleware";

export interface OrderFilters {
  status?: OrderStatus[];
  fulfillmentStatus?: PhysicalStoreFulfillmentOrderStatus[];
  commissionStatus?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  search?: string;
  virtualStoreId?: string;
  physicalStoreId?: string;
}

export interface OrderTableState {
  orders: Orders[];
  selectedOrders: Set<string>;
  filters: OrderFilters;
  sorting: {
    field: string;
    direction: "asc" | "desc";
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  loading: boolean;
  error: string | null;
}

export interface OrderState extends OrderTableState {
  setOrders: (orders: Orders[]) => void;
  addOrder: (order: Orders) => void;
  updateOrder: (orderId: string, updates: Partial<Orders>) => void;
  removeOrder: (orderId: string) => void;

  selectOrder: (orderId: string) => void;
  selectAllOrders: () => void;
  deselectOrder: (orderId: string) => void;
  deselectAllOrders: () => void;

  setFilters: (filters: Partial<OrderFilters>) => void;
  clearFilters: () => void;

  setSorting: (field: string, direction: "asc" | "desc") => void;

  setPagination: (page: number, limit?: number) => void;
  setTotal: (total: number) => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  bulkUpdateStatus: (orderIds: string[], status: OrderStatus) => void;
  bulkUpdateFulfillmentStatus: (
    orderIds: string[],
    status: PhysicalStoreFulfillmentOrderStatus
  ) => void;
}

const initialState: OrderTableState = {
  orders: [],
  selectedOrders: new Set(),
  filters: {},
  sorting: {
    field: "$createdAt",
    direction: "desc",
  },
  pagination: {
    page: 1,
    limit: 25,
    total: 0,
  },
  loading: false,
  error: null,
};

export const useOrderState = create<OrderState>()(
  devtools(
    (set, get) => ({
      ...initialState,
      setOrders: (orders) => set({ orders }),

      addOrder: (order) =>
        set((state) => ({
          orders: [order, ...state.orders],
        })),

      updateOrder: (orderId, updates) =>
        set((state) => ({
          orders: state.orders.map((order) =>
            order.$id === orderId ? { ...order, ...updates } : order
          ),
        })),

      removeOrder: (orderId) =>
        set((state) => ({
          orders: state.orders.filter((order) => order.$id !== orderId),
        })),

      selectOrder: (orderId) =>
        set((state) => {
          const newSelected = new Set(state.selectedOrders);
          newSelected.add(orderId);
          return { selectedOrders: newSelected };
        }),

      selectAllOrders: () =>
        set((state) => ({
          selectedOrders: new Set(state.orders.map((order) => order.$id)),
        })),

      deselectOrder: (orderId) =>
        set((state) => {
          const newSelected = new Set(state.selectedOrders);
          newSelected.delete(orderId);
          return { selectedOrders: newSelected };
        }),

      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
          pagination: { ...state.pagination, page: 1 },
        })),

      clearFilters: () =>
        set({
          filters: {},
          pagination: { ...get().pagination, page: 1 },
        }),

      setSorting: (field, direction) =>
        set({
          sorting: { field, direction },
        }),

      setPagination: (page, limit) =>
        set((state) => ({
          pagination: { ...state.pagination, page, ...(limit && { limit }) },
        })),

      setTotal: (total) =>
        set((state) => ({
          pagination: { ...state.pagination, total },
        })),

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      bulkUpdateStatus: (orderIds, status) =>
        set((state) => ({
          orders: state.orders.map((order) =>
            orderIds.includes(order.$id)
              ? { ...order, orderStatus: status }
              : order
          ),
        })),

      bulkUpdateFulfillmentStatus: (orderIds, status) =>
        set((state) => ({
          orders: state.orders.map((order) =>
            orderIds.includes(order.$id)
              ? {
                  ...order,
                  fulfillmentRecords: order.fulfillmentRecords?.map(
                    (record: OrderFullfilmentRecords) => ({
                      ...record,
                      physicalStoreFulfillmentOrderStatus: status,
                    })
                  ),
                }
              : order
          ),
        })),
    }),
    {
      name: "order-state",
      skipHydration: true,
    }
  )
);
