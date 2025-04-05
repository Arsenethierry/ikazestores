"use client";

import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { ArrowUpRight, CirclePlay, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const HeroSection = () => {
    return (
        <div className="text-center max-w-6xl w-full my-10 mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <Badge variant="outline" className="mb-6 py-2 px-4 rounded-full border-primary/20">
                    <Rocket className="w-4 h-4 mr-2 text-primary" />
                    <span className="text-primary">Next-Gen Commerce Platform</span>
                </Badge>
            </motion.div>

            <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1] tracking-tighter balance"
            >
                Bridge Physical & Virtual Commerce,
                <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent block md:inline">
                    Earn Together
                </span>
            </motion.h1>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-6 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto px-4"
            >
                Transform your existing retail space into a digital revenue stream or launch your
                virtual store with zero inventory. Our automated platform connects physical
                suppliers with digital entrepreneurs in real-time.
            </motion.p>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 px-4"
            >
                <Button
                    className="rounded-full text-base gap-2 shadow-lg hover:shadow-primary/20 transition-shadow"
                    asChild
                >
                    <Link href="/sell/new-store">
                        Launch Your Store <ArrowUpRight className="h-5 w-5" />
                    </Link>
                </Button>
                <Button
                    variant="outline"
                    className="rounded-full text-base gap-2 hover:bg-accent/50 transition-colors"
                >
                    <CirclePlay className="h-5 w-5" /> Platform Demo
                </Button>
            </motion.div>
        </div>
    )
}