"use client";

import SellFooter from "@/components/footers/sell-page-footer";
import SellPageTestimonials from "@/features/sell-page/components/testimonials";
import SellPageFaq from "@/features/sell-page/components/faq";
import MeetOurTeam from "@/features/sell-page/components/meet-our-team";
import ContactUs from "@/features/sell-page/components/contact-us";
import { HeroSection } from "./hero-section";
import { Boxes, Store, UserPlus, Zap } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

export const SellPage = () => {
    return (
        <>
            <div className="min-h-screen flex items-center pt-10 md:pt-32 justify-center px-4 sm:px-6 bg-gradient-to-b from-background to-muted/20">
                <HeroSection />
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
            <SellPageTestimonials />
            <MeetOurTeam />
            <ContactUs />
            <SellPageFaq />
            <SellFooter />
        </>
    );
};