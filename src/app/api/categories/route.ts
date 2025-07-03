/* eslint-disable @typescript-eslint/ban-ts-comment */
import { NextResponse } from 'next/server';
import data from '@/data/amazon_products_catalog.json';

export async function GET() {
  const mainCategories = Object.keys(data);
  const categoryTree = mainCategories.map(mainCat => ({
    name: mainCat,
    // @ts-ignore
    subCategories: Object.keys(data[mainCat]),
  }));

  return NextResponse.json(categoryTree);
}