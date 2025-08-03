import { Award, Shield, Truck } from "lucide-react";

export const TrustBadges = () => {
    return (
        <div className="grid grid-cols-3 gap-4 py-6 border-t border-b border-gray-200">
            <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Truck className="w-6 h-6 text-green-600" />
                </div>
                <div>
                    <p className="font-semibold text-sm">Free Shipping</p>
                    <p className="text-xs text-gray-600">On orders over $50</p>
                </div>
            </div>

            <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                    <p className="font-semibold text-sm">Secure Payment</p>
                    <p className="text-xs text-gray-600">100% protected</p>
                </div>
            </div>

            <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Award className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                    <p className="font-semibold text-sm">Warranty</p>
                    <p className="text-xs text-gray-600">1 year coverage</p>
                </div>
            </div>
        </div>
    );
};