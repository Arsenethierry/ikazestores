"use client";

import { VirtualStoreTypes } from '@/lib/types';
import { generateColorFromName, getStoreLogoInitials, splitStoreName } from '@/lib/utils';
import { ShoppingBag, Sparkles, TrendingUp, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface StoreAuthLayoutClientProps {
    children: React.ReactNode;
    store: VirtualStoreTypes;
}

export const StoreAuthLayoutClient = ({ children, store }: StoreAuthLayoutClientProps) => {
    const colors = generateColorFromName(store.storeName);
    const { firstPart, secondPart } = splitStoreName(store.storeName);
    const { firstInitial, secondInitial } = getStoreLogoInitials(store.storeName);

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Branding Section */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
                style={{
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
                }}
            >
                {/* Decorative Elements */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
                </div>

                <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
                    {/* Store Logo & Name */}
                    <Link href="/" className="flex items-center gap-4 group">
                        {store.storeLogoUrl ? (
                            <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-white/10 backdrop-blur-sm group-hover:scale-105 transition-transform">
                                <Image
                                    src={store.storeLogoUrl}
                                    alt={`${store.storeName} logo`}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        ) : (
                            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-2xl font-bold group-hover:scale-105 transition-transform">
                                {firstInitial}
                                <span className="opacity-80">{secondInitial}</span>
                            </div>
                        )}
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold">{firstPart}</span>
                            <span className="text-xl font-medium opacity-90">{secondPart}</span>
                        </div>
                    </Link>

                    {/* Store Bio & Features */}
                    <div className="space-y-8">
                        {store.storeBio && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <p className="text-xl leading-relaxed opacity-90">
                                    {store.storeBio}
                                </p>
                            </motion.div>
                        )}

                        {store.desccription && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6"
                            >
                                <p className="text-base opacity-80">
                                    {store.desccription}
                                </p>
                            </motion.div>
                        )}

                        {/* Feature Highlights */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="grid grid-cols-2 gap-4"
                        >
                            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                                    <ShoppingBag className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">Curated Products</p>
                                    <p className="text-xs opacity-70">Quality Guaranteed</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">Best Prices</p>
                                    <p className="text-xs opacity-70">Competitive Deals</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">Exclusive Deals</p>
                                    <p className="text-xs opacity-70">Member Benefits</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">Trusted Store</p>
                                    <p className="text-xs opacity-70">Verified Seller</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Footer Text */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-sm opacity-70"
                    >
                        <p>Operating in {store.operatingCountry}</p>
                        <p className="mt-1">
                            Powered by{' '}
                            <Link href="https://ikazestores.com" className="underline hover:opacity-80">
                                IkazeStores
                            </Link>
                        </p>
                    </motion.div>
                </div>
            </motion.div>

            {/* Right Side - Auth Form */}
            <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 bg-gray-50">
                {/* Mobile Store Header */}
                <div className="lg:hidden w-full max-w-md mb-8">
                    <Link href="/" className="flex items-center gap-3">
                        {store.storeLogoUrl ? (
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden">
                                <Image
                                    src={store.storeLogoUrl}
                                    alt={`${store.storeName} logo`}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        ) : (
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white"
                                style={{
                                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
                                }}
                            >
                                {firstInitial}
                                <span className="opacity-80">{secondInitial}</span>
                            </div>
                        )}
                        <div className="flex flex-col">
                            <span
                                className="text-lg font-bold"
                                style={{ color: colors.primary }}
                            >
                                {firstPart}
                            </span>
                            <span
                                className="text-base font-medium"
                                style={{ color: colors.secondary }}
                            >
                                {secondPart}
                            </span>
                        </div>
                    </Link>
                </div>

                {/* Auth Form Container */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-full max-w-md"
                >
                    {children}
                </motion.div>

                {/* Mobile Store Info */}
                {(store.storeBio || store.desccription) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="lg:hidden w-full max-w-md mt-8 p-4 bg-white rounded-xl border"
                    >
                        <p className="text-sm text-muted-foreground">
                            {store.storeBio || store.desccription}
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    );
};