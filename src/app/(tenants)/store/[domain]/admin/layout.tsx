import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/features/stores/components/sidebar/admin-sidebar";
import { checkDomain } from "@/lib/domain-utils";
import { headers } from "next/headers";

export default async function AdminLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const headersList = await headers();
    const hostname = headersList.get('x-forwarded-host');

    const { isSubdomain } = checkDomain(hostname!)

    console.log("$$$$$$$", hostname);
    return (
        <SidebarProvider>
            <AdminSidebar isSubdomain={isSubdomain} />
            <SidebarInset>
                <header className='sticky top-0 bg-muted z-20 flex h-16 shrink-0 items-center gap-0 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b'>
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className='-ml-1' />
                    </div>
                </header>
                <div className="main-container py-5">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
