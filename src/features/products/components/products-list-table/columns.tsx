"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { DocumentType } from "@/lib/types"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, CheckIcon } from "lucide-react"
import { PhysicalProductMenuActions } from "../physical-product-actions"

export const productListColumns: ColumnDef<DocumentType>[] = [
    {
        accessorKey: "$id",
        header: "ID",
    },
    {
        accessorKey: "title",
        header: "Product Title",
    },
    {
        accessorKey: "price",
        header: ({ column }) => <Button
            variant={'ghost'}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="inline-flex"
        >
            <span>Price </span>
            <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>,
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("price"))
            const formatted = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
            }).format(amount)

            return <div className="font-medium">{formatted}</div>
        }
    },
    {
        id: "isPublished",
        header: "Publish Status",
        cell: ({ row }) => {
            const product = row.original;

            return (
                <div className="inline-flex items-center gap-2">
                    <Switch id={product.$id} checked={product?.isPublished ?? false} aria-label="Toggle switch" />
                    <Label htmlFor={product.$id} className="text-sm font-medium">
                        {product?.isPublished ? "On" : "Off"}
                    </Label>
                </div>
            )
        }
    },
    {
        id: "isVerified",
        header: "Verify Status",
        cell: () => {
            // const product = row.original;

            return (
                <Badge variant="outline" className="gap-1">
                    Verified
                    <CheckIcon className="text-emerald-500" size={12} aria-hidden="true" />
                </Badge>
            )
        }
    },
    {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
            const product = row.original;

            return (
                <PhysicalProductMenuActions product={product} />
            )
        }
    }
];