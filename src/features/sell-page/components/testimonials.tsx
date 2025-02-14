import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Store, Warehouse, Boxes, Zap, Coins } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: "Sarah Thompson",
    type: "physical",
    role: "Boutique Owner",
    store: "Urban Threads Apparel",
    testimonial: "Our sales increased 40% by being part of this network. Virtual stores helped us reach customers we'd never access alone!",
    avatar: "https://randomuser.me/api/portraits/women/1.jpg",
  },
  {
    id: 2,
    name: "Raj Patel",
    type: "virtual",
    role: "Digital Entrepreneur",
    store: "Global Home Essentials",
    testimonial: "Started with zero inventory - now earning passive income through 12 physical suppliers. The commission system is transparent and fair.",
    avatar: "https://randomuser.me/api/portraits/men/6.jpg",
  },
  {
    id: 3,
    name: "Emily & Mark Chen",
    type: "physical",
    role: "Artisan Workshop",
    store: "Crafted Traditions",
    testimonial: "Real-time notifications help us manage stock across 50+ virtual stores effortlessly. It's like having a digital sales team 24/7.",
    avatar: "https://randomuser.me/api/portraits/women/3.jpg",
  },
  {
    id: 4,
    name: "Alex Ramirez",
    type: "virtual",
    role: "Fitness Curator",
    store: "Active Lifestyle Hub",
    testimonial: "Built my niche store in 2 days using existing inventories. The automated fulfillment saves me hours daily!",
    avatar: "https://randomuser.me/api/portraits/men/4.jpg",
  },
  {
    id: 5,
    name: "Linda Goldberg",
    type: "physical",
    role: "Home Decor Supplier",
    store: "Luxe Living Wholesale",
    testimonial: "Expanded our B2B network without extra marketing costs. Virtual partners handle sales while we focus on quality.",
    avatar: "https://randomuser.me/api/portraits/women/5.jpg",
  },
  {
    id: 6,
    name: "Tomás Silva",
    type: "virtual",
    role: "Tech Gadgets Curator",
    store: "Future Tech Finds",
    testimonial: "Earn commissions even when sleeping! The cross-store notification system helps optimize my product selection.",
    avatar: "https://randomuser.me/api/portraits/men/2.jpg",
  },
];

const SellPageTestimonials = () => (
  <div className="flex justify-center items-center py-12 px-6 bg-muted/50">
    <div className="w-full">
      <h2 className="mb-8 sm:mb-14 text-5xl md:text-6xl font-bold text-center tracking-tight">
        Success Stories from Our Network
      </h2>
      <div className="w-full max-w-screen-xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="flex flex-col bg-background rounded-xl p-8 border hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center mb-4 gap-2">
                {testimonial.type === 'physical' ? (
                  <Warehouse className="w-6 h-6 text-blue-600" />
                ) : (
                  <Store className="w-6 h-6 text-green-600" />
                )}
                <span className="text-sm font-medium">
                  {testimonial.type === 'physical' ? 'Physical Supplier' : 'Virtual Entrepreneur'}
                </span>
              </div>
              
              <p className="mb-6 text-[17px] italic">
                &quot;{testimonial.testimonial}&quot;
              </p>
              
              <div className="mt-auto flex items-center gap-4">
                <Avatar>
                  <AvatarFallback className="text-xl font-medium bg-primary text-primary-foreground">
                    {testimonial.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold">{testimonial.name}</p>
                  <div className="flex items-center gap-2">
                    {testimonial.type === 'physical' ? (
                      <Boxes className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Zap className="w-4 h-4 text-muted-foreground" />
                    )}
                    <p className="text-sm text-muted-foreground">
                      {testimonial.store}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-1 text-sm text-muted-foreground">
                <Coins className="w-4 h-4" />
                <span>
                  {testimonial.type === 'physical' 
                    ? 'Earns from 15+ virtual stores' 
                    : 'Works with 8 physical suppliers'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default SellPageTestimonials;