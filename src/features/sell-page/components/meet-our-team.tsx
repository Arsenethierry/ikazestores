import Image from "next/image";
import { Warehouse, Store, Shuffle, Zap, Boxes, UserCheck, Coins, Globe } from 'lucide-react';

const teamMembers = [
    {
        name: "Alex Chen",
        title: "Marketplace Architect",
        focus: "Physical-Virtual Integration",
        icon: <Shuffle className="w-5 h-5" />,
        imageUrl: "https://images.pexels.com/photos/3785079/pexels-photo-3785079.jpeg?auto=compress&cs=tinysrgb&w=600",
    },
    {
        name: "Priya Kapoor",
        title: "Partner Success Lead",
        focus: "Physical Store Onboarding",
        icon: <Warehouse className="w-5 h-5" />,
        imageUrl: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=600",
    },
    {
        name: "Marcus Lee",
        title: "Digital Ecosystems",
        focus: "Virtual Store Tools",
        icon: <Store className="w-5 h-5" />,
        imageUrl: "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=600",
    },
    {
        name: "Aisha Diallo",
        title: "Logistics Architect",
        focus: "Order Fulfillment",
        icon: <Boxes className="w-5 h-5" />,
        imageUrl: "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=600",
    },
    {
        name: "Omar Hassan",
        title: "Commission Systems",
        focus: "Revenue Sharing Models",
        icon: <Coins className="w-5 h-5" />,
        imageUrl: "https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=600",
    },
    {
        name: "Emma Johansson",
        title: "Seller Experience",
        focus: "Virtual Store UX",
        icon: <UserCheck className="w-5 h-5" />,
        imageUrl: "https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=600",
    },
    {
        name: "Diego Rivera",
        title: "Growth Operations",
        focus: "Global Partnerships",
        icon: <Globe className="w-5 h-5" />,
        imageUrl: "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=600",
    },
    {
        name: "Linh Nguyen",
        title: "Real-time Systems",
        focus: "Inventory Syncing",
        icon: <Zap className="w-5 h-5" />,
        imageUrl: "https://images.pexels.com/photos/2613260/pexels-photo-2613260.jpeg?auto=compress&cs=tinysrgb&w=600",
    },
];

const MeetOurTeam = () => {
    return (
        <div className="flex flex-col items-center justify-center py-14 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/30">
            <div className="text-center max-w-2xl mx-auto">
                <h2 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    Bridging Physical & Digital Commerce
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                    A team obsessed with creating win-win partnerships between brick-and-mortar 
                    businesses and digital entrepreneurs through technology.
                </p>
            </div>

            <div className="mt-20 w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8 max-w-screen-xl mx-auto">
                {teamMembers.map((member) => (
                    <div 
                        key={member.name} 
                        className="group text-center p-6 rounded-xl hover:bg-background hover:border hover:shadow-lg transition-all"
                    >
                        <div className="relative inline-block">
                            <Image
                                src={member.imageUrl}
                                alt={member.name}
                                className="h-24 w-24 rounded-full object-cover mx-auto bg-secondary border-4 border-background group-hover:border-primary transition-colors"
                                width={128}
                                height={128}
                            />
                            <div className="absolute bottom-0 right-0 bg-background p-2 rounded-full border">
                                {member.icon}
                            </div>
                        </div>
                        <h3 className="mt-6 text-xl font-semibold">{member.name}</h3>
                        <p className="text-primary mt-2">{member.title}</p>
                        <div className="mt-2 text-sm text-muted-foreground">
                            {member.focus}
                        </div>
                    </div>
                ))}
            </div>

            {/* Partnership Network */}
            <div className="mt-20 text-center max-w-3xl mx-auto">
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-background rounded-full border">
                    <Globe className="w-5 h-5" />
                    <span className="text-muted-foreground">
                        Supported by industry leaders in logistics, retail tech, and e-commerce
                    </span>
                </div>
            </div>
        </div>
    );
};

export default MeetOurTeam;