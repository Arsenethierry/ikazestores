import { VirtualStoreTypes } from "@/lib/types";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { TagsNav } from "./tags-nav";
import HeroSection from "@/features/stores/components/home-page/hero-section";
import VSFooter from "@/features/stores/components/home-page/virtual-shop/footer";
import { StoreProductsList } from "@/features/products/components/store-products-list";

async function getStoreById<T>(endpoint: string): Promise<T | null> {
    try {
        const headersList = await headers();
        const host = headersList.get('host') || 'localhost:3000';
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';

        const baseUrl = `${protocol}://${host}`;
        const response = await fetch(`${baseUrl}${endpoint}`, {
            headers: {
                'Cookie': headersList.get('cookie') || '',
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Server fetch error for ${endpoint}:`, error);
        throw error;
    }
};

function StoreErrorBoundary({
    storeId
}: {
    storeId: string;
}) {
    return (
        <>
            <div className="text-center py-12">
                <h3 className='text-3xl text-red-600 mb-4'>Error Loading Store</h3>
                <p className='text-gray-600'>
                    Unable to load store with ID: {storeId}
                </p>
                <p className='text-sm text-gray-500 mt-2'>
                    Please try refreshing the page or contact support if the problem persists.
                </p>
            </div>
        </>
    );
}

async function page({
    params,
}: {
    params: Promise<{ currentStoreId: string }>;
}) {
    const { currentStoreId } = await params;

    try {
        const store = await getStoreById<VirtualStoreTypes>(
            `/api/virtual-stores/${currentStoreId}`
        );

        if (!store) {
            notFound();
        }

        return (
            <>
                <HeroSection />
                <TagsNav />
                {/* Pass store data to child components */}
                <StoreProductsList storeId={currentStoreId} />
                {/* <ReviewsSection storeId={store.$id} /> */}
                {/* <VerticalCarousel storeId={store.$id} /> */}
                <VSFooter />
            </>
        )
    } catch (error) {
        console.error('Page error:', error);
        return <StoreErrorBoundary storeId={currentStoreId} />;
    }
}

export default page;