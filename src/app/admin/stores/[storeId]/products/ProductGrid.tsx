// ProductGrid.jsx
import React from 'react';
import ProductCard from './ProductCard';

const products = [
  {
    id: 1,
    name: 'Tyson Jogger - Black',
    price: 14.00,
    originalPrice: 34.99,
    rating: 4.5,
    reviews: 309,
    image: '/images/tyson-jogger.jpg',
  },
  {
    id: 2,
    name: 'Kallan Knit Dress - Black',
    price: 14.00,
    originalPrice: 34.99,
    rating: 4.7,
    reviews: 474,
    image: '/images/kallan-dress.jpg',
  },
  {
    id: 3,
    name: 'Almost Every Day Leggings - Black',
    price: 8.00,
    originalPrice: 14.99,
    rating: 4.2,
    reviews: 492,
    image: '/images/everyday-leggings.jpg',
  },
  {
    id: 4,
    name: 'Robin Crop Top - White',
    price: 6.00,
    originalPrice: 14.99,
    rating: 4.8,
    reviews: 267,
    image: '/images/robin-crop-top.jpg',
    discount: 60,
  },
  {
    id: 5,
    name: 'Nova Season Jumpsuit - Black',
    price: 14.00,
    originalPrice: 24.99,
    rating: 4.6,
    reviews: 444,
    image: '/images/nova-jumpsuit.jpg',
    discount: 44,
  },
  {
    id: 6,
    name: 'On The Go Fleece Pant Set - Charcoal',
    price: 49.99,
    rating: 4.4,
    reviews: 198,
    image: '/images/fleece-pant-set.jpg',
  },
];

export const ProductGridComponent = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};