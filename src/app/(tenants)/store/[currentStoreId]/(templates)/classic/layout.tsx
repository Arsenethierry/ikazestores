import { getVirtualStoreById } from "@/lib/actions/virtual-store.action";
import { notFound } from "next/navigation";

export default async function ClassicLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ currentStoreId: string }>;
}) {
    const { currentStoreId } = await params;
    const store = await getVirtualStoreById(currentStoreId);

    if (!store) notFound();

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950">
            <header className="bg-slate-900 text-white py-4">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold">{store.storeName}</h1>
                        <nav className="flex gap-6">
                            <a href={`/store/${currentStoreId}/classic`} className="hover:text-primary">
                                Home
                            </a>
                            <a href={`/store/${currentStoreId}/classic/products`} className="hover:text-primary">
                                Products
                            </a>
                        </nav>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 min-h-screen">
                {children}
            </main>

            <footer className="bg-slate-100 dark:bg-slate-900 py-8 mt-16">
                <div className="container mx-auto px-4 text-center">
                    <p>© {new Date().getFullYear()} {store.storeName}. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}