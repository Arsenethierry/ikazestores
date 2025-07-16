import { Button } from "@/components/ui/button";
import Image from "next/image";

export const PromotionalSection = () => (
    <section className="py-20 bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-8">
                    <div className="space-y-4">
                        <span className="inline-block bg-yellow-400 text-black px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide">
                            Limited Time Offer
                        </span>
                        <h2 className="text-5xl md:text-6xl font-bold text-white leading-tight">
                            Mega Sale
                            <span className="block text-yellow-400">50% OFF</span>
                        </h2>
                        <p className="text-xl text-gray-300 max-w-lg">
                            Don&apos;t miss out on our biggest sale of the year. Premium products
                            at unbeatable prices.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <Button className="bg-yellow-400 hover:bg-yellow-500 text-black px-8 py-3 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                            Shop Sale
                        </Button>
                        <Button
                            variant="outline"
                            className="border-2 border-white text-white hover:bg-white hover:text-black px-8 py-3 rounded-full text-lg font-semibold transition-all duration-300"
                        >
                            View All Deals
                        </Button>
                    </div>

                    {/* Countdown Timer */}
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
                        <div className="text-center">
                            <p className="text-white mb-4 text-lg">Sale ends in:</p>
                            <div className="grid grid-cols-4 gap-4">
                                {["23", "14", "35", "42"].map((time, index) => (
                                    <div key={index} className="bg-white/20 rounded-lg p-3">
                                        <div className="text-2xl font-bold text-white">{time}</div>
                                        <div className="text-sm text-gray-300">
                                            {["Days", "Hours", "Min", "Sec"][index]}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-3xl blur-3xl"></div>
                    <div className="relative bg-white/10 backdrop-blur-md rounded-3xl p-8">
                        <Image
                            src="/images/product.png"
                            width={500}
                            height={400}
                            alt="Sale products"
                            className="w-full h-auto object-contain rounded-2xl"
                            priority
                        />
                    </div>
                </div>
            </div>
        </div>
    </section>
)