/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import data from '@/data/amazon_products_catalog.json';

interface Product {
    name: string;
    main_category: string;
    sub_category: string;
    product_url: string;
    actual_price: number | null;
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);

    // Flatten the data
    const allProducts: Product[] = [];
    for (const [mainCat, subCats] of Object.entries(data)) {
        for (const [subCat, products] of Object.entries(subCats)) {
            // @ts-ignore
            products.forEach((product: any) => {
                allProducts.push({
                    ...product,
                    main_category: mainCat,
                    sub_category: subCat,
                });
            });
        }
    }

    // Filtering
    const search = searchParams.get('search') || '';
    const mainCategory = searchParams.get('mainCategory') || '';
    const subCategory = searchParams.get('subCategory') || '';

    const filteredProducts = allProducts.filter((product) => {
        const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
        const matchesMain = mainCategory ? product.main_category === mainCategory : true;
        const matchesSub = subCategory ? product.sub_category === subCategory : true;
        return matchesSearch && matchesMain && matchesSub;
    });

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    // Get unique categories for dropdowns
    const mainCategories = Array.from(new Set(allProducts.map(p => p.main_category)));
    const subCategories = Array.from(
        new Set(allProducts
            .filter(p => !mainCategory || p.main_category === mainCategory)
            .map(p => p.sub_category)
        ))

    return NextResponse.json({
        products: paginatedProducts,
        total: filteredProducts.length,
        mainCategories,
        subCategories,
    });
}

export async function POST() {
    // For server actions
    return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
}