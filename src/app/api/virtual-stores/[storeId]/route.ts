import { createSessionClient } from "@/lib/appwrite";
import { DATABASE_ID, VIRTUAL_STORE_ID } from "@/lib/env-config";
import { VirtualStoreTypes } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const { storeId } = await params;
        if (!storeId || typeof storeId !== 'string') {
            return NextResponse.json(
                { error: 'Store ID is required and must be a string' },
                { status: 400 }
            )
        }
        const { databases } = await createSessionClient();
        const store = await databases.getDocument<VirtualStoreTypes>(
            DATABASE_ID,
            VIRTUAL_STORE_ID,
            storeId
        );

        return NextResponse.json(store)
    } catch (error) {
        console.log("getVirtualStoreById API error: ", error)
        if (error instanceof Error) {
            if (error.message.includes('Document not found')) {
                return NextResponse.json(
                    { error: 'Store not found' },
                    { status: 404 }
                )
            }

            if (error.message.includes('Unauthorized')) {
                return NextResponse.json(
                    { error: 'Unauthorized access' },
                    { status: 401 }
                )
            }
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}