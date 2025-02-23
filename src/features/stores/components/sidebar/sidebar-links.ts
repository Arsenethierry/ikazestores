import {
    BookOpen,
    Bot,
    Settings2,
    SquareTerminal,
} from "lucide-react"

export const sidebarLinks = {
    systemAdmin: [
        {
            title: "Manage Stores",
            url: "#",
            icon: SquareTerminal,
            isActive: true,
            items: [
                {
                    title: "All stores",
                    url: "/admin/stores",
                },
                {
                    title: "Starred",
                    url: "#",
                },
                {
                    title: "Settings",
                    url: "#",
                },
            ],
        },
        {
            title: "Models",
            url: "#",
            icon: Bot,
            items: [
                {
                    title: "Genesis",
                    url: "#",
                },
                {
                    title: "Explorer",
                    url: "#",
                },
                {
                    title: "Quantum",
                    url: "#",
                },
            ],
        },
        {
            title: "Documentation",
            url: "#",
            icon: BookOpen,
            items: [
                {
                    title: "Introduction",
                    url: "#",
                },
                {
                    title: "Get Started",
                    url: "#",
                },
                {
                    title: "Tutorials",
                    url: "#",
                },
                {
                    title: "Changelog",
                    url: "#",
                },
            ],
        },
        {
            title: "Settings",
            url: "#",
            icon: Settings2,
            items: [
                {
                    title: "General",
                    url: "#",
                },
                {
                    title: "Team",
                    url: "#",
                },
                {
                    title: "Billing",
                    url: "#",
                },
                {
                    title: "Limits",
                    url: "#",
                },
            ],
        },
    ],

    virtualStoreAdmin: [
        {
            title: "Order Management",
            url: "#",
            icon: SquareTerminal,
            isActive: true,
            items: [
                {
                    title: "All stores",
                    url: "/admin/stores",
                },
            ],
        },
        {
            title: "Product Management",
            url: "#",
            icon: Bot,
            items: [
                {
                    title: "Categories",
                    url: "#",
                },
                {
                    title: "Products",
                    url: "#",
                },
                {
                    title: "Flash Sales",
                    url: "#",
                },
            ],
        },
        {
            title: "Promo Codes",
            url: "#",
            icon: BookOpen,
            items: [
                {
                    title: "Introduction",
                    url: "#",
                },
                {
                    title: "Get Started",
                    url: "#",
                },
                {
                    title: "Tutorials",
                    url: "#",
                },
                {
                    title: "Changelog",
                    url: "#",
                },
            ],
        },
        {
            title: "Settings",
            url: "#",
            icon: Settings2,
            items: [
                {
                    title: "General",
                    url: "#",
                },
                {
                    title: "Team",
                    url: "#",
                },
                {
                    title: "Billing",
                    url: "#",
                },
                {
                    title: "Limits",
                    url: "#",
                },
            ],
        },
    ],
}