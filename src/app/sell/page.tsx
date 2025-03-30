"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowUpRight, Boxes, CirclePlay, Rocket, Store, UserPlus, Zap } from "lucide-react";
import SellFooter from "@/components/footers/sell-page-footer";
import SellPageTestimonials from "@/features/sell-page/components/testimonials";
import SellPageFaq from "@/features/sell-page/components/faq";
import MeetOurTeam from "@/features/sell-page/components/meet-our-team";
import ContactUs from "@/features/sell-page/components/contact-us";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { motion } from "framer-motion";

const SellPage = () => {
    return (
        <>
            <div className="min-h-screen flex items-center pt-10 md:pt-32 justify-center px-4 sm:px-6 bg-gradient-to-b from-background to-muted/20">
                <div className="text-center max-w-6xl w-full">
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

                    {/* Value Proposition Metrics */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto px-4"
                    >
                        {[
                            { icon: Store, value: "500+", label: "Physical Vendors" },
                            { icon: UserPlus, value: "2.3k", label: "Virtual Entrepreneurs" },
                            { icon: Boxes, value: "50k+", label: "Products Listed" },
                            { icon: Zap, value: "Instant", label: "Sales Notifications" },
                        ].map((metric, index) => (
                            <div
                                key={index}
                                className="p-6 bg-background rounded-xl border hover:shadow-md transition-shadow duration-300"
                            >
                                <metric.icon className="h-8 w-8 mb-4 text-primary mx-auto" />
                                <h3 className="text-2xl font-bold">{metric.value}</h3>
                                <p className="text-muted-foreground mt-1">{metric.label}</p>
                            </div>
                        ))}
                    </motion.div>

                    {/* Platform Preview Mockup */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-20 mx-auto max-w-6xl rounded-3xl bg-background shadow-2xl overflow-hidden border"
                    >
                        <div className="aspect-video bg-muted/20 flex items-center justify-center">
                            <div className="relative w-full h-full">
                                <Image
                                    src="/banners/platform-preview.png"
                                    alt="Platform interface"
                                    layout="fill"
                                    objectFit="cover"
                                    className="opacity-75"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            <SellPageTestimonials />
            <MeetOurTeam />
            <ContactUs />
            <SellPageFaq />
            <SellFooter />
        </>
    );
};

export default SellPage;