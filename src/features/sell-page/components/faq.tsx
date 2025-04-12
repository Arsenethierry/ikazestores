import {
    Accordion,
    AccordionContent,
    AccordionItem,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { PlusIcon, Warehouse, Store, Shuffle, Coins, Boxes, Zap, HeadsetIcon, UserPlus } from "lucide-react";
import Link from "next/link";

const faq = [
    {
        type: "physical",
        question: "How does listing my physical inventory benefit my business?",
        answer:
            "Gain instant access to our network of virtual entrepreneurs who market your products through their curated stores. Expand your reach without additional marketing costs while maintaining control over inventory and fulfillment.",
    },
    {
        type: "virtual",
        question: "Can I really start a store with zero inventory?",
        answer:
            "Absolutely! Browse and select products from verified physical suppliers. When you make a sale, we automatically notify the supplier and handle fulfillment. Earn commissions on every sale through your storefront.",
    },
    {
        type: "both",
        question: "How are inventory updates synchronized across stores?",
        answer:
            "Our real-time system updates all virtual stores within seconds when inventory changes. You'll receive instant notifications if a product you're listing becomes unavailable.",
    },
    {
        type: "general",
        question: "What's the commission structure between physical and virtual stores?",
        answer:
            "We facilitate transparent revenue sharing. Physical suppliers set base prices, virtual entrepreneurs add their margin. Typical splits range 70/30 (physical/virtual) but are fully customizable.",
    },
    {
        type: "virtual",
        question: "Can I sell the same product as other virtual stores?",
        answer:
            "Yes! Differentiate through pricing, bundles, or branding. Our system tracks all sales and automatically updates availability across the network.",
    },
    {
        type: "physical",
        question: "How do I handle fulfillment for virtual store sales?",
        answer:
            "We provide automated order routing with shipping labels and tracking. Simply fulfill orders as they come in - same process as your regular sales.",
    },
    {
        type: "general",
        question: "What happens if multiple virtual stores sell the same product?",
        answer:
            "First sale gets priority. Other stores are instantly notified to update their listings. We provide analytics to help optimize your product selection.",
    },
    {
        type: "virtual",
        question: "How quickly can I launch my virtual store?",
        answer:
            "Most entrepreneurs are live within 2 hours! Use our AI-assisted store builder and product import tools to create a unique storefront rapidly.",
    },
];

const SellPageFaq = () => {
    return (
        <div className="flex items-center justify-center px-6 py-12 bg-primary/5">
            <div className="w-full max-w-4xl">
                <div className="text-center">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                        Partnership Ecosystem FAQ
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Answers for physical suppliers and digital entrepreneurs in our network
                    </p>
                </div>

                <Accordion
                    type="single"
                    collapsible
                    className="mt-8 space-y-4"
                    defaultValue="question-0"
                >
                    {faq.map(({ question, answer, type }, index) => (
                        <AccordionItem
                            key={question}
                            value={`question-${index}`}
                            className="bg-background py-1 px-4 rounded-xl border hover:shadow-lg transition-shadow"
                        >
                            <AccordionPrimitive.Header className="flex">
                                <AccordionPrimitive.Trigger
                                    className={cn(
                                        "flex flex-1 items-center justify-between py-4 font-semibold tracking-tight transition-all hover:underline [&[data-state=open]>svg]:rotate-45",
                                        "text-start text-lg"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        {type === 'physical' ? (
                                            <Warehouse className="w-5 h-5 text-blue-600" />
                                        ) : type === 'virtual' ? (
                                            <Store className="w-5 h-5 text-green-600" />
                                        ) : (
                                            <Shuffle className="w-5 h-5 text-purple-600" />
                                        )}
                                        {question}
                                    </div>
                                    <PlusIcon className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200" />
                                </AccordionPrimitive.Trigger>
                            </AccordionPrimitive.Header>
                            <AccordionContent className="pb-4">
                                <div className="flex gap-4">
                                    <div className="flex-1">{answer}</div>
                                    {type === 'physical' && (
                                        <Boxes className="w-12 h-12 text-blue-100" />
                                    )}
                                    {type === 'virtual' && (
                                        <Zap className="w-12 h-12 text-green-100" />
                                    )}
                                    {type === 'general' && (
                                        <Coins className="w-12 h-12 text-purple-100" />
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>

                {/* CTA Section */}
                <div className="mt-12 p-8 rounded-xl bg-background border text-center">
                    <div className="max-w-2xl mx-auto">
                        <h3 className="text-2xl font-bold">Still have questions?</h3>
                        <p className="mt-2 text-muted-foreground">
                            Our partnership team is ready to help both physical suppliers and virtual entrepreneurs
                        </p>
                        <div className="mt-6 flex justify-center gap-4">
                            <Button variant="outline" className="gap-2" asChild>
                                <Link href="#">
                                    <HeadsetIcon className="w-4 h-4" /> Support Hub
                                </Link>
                            </Button>
                            <Button className="gap-2" asChild>
                                <Link href="/sign-up">
                                    <UserPlus className="w-4 h-4" /> Join Network
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellPageFaq;