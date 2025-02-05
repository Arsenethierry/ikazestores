import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SystemAdminSidebar } from "@/features/system-admin/app-sidebar";

export default async function SytemAdminLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <SidebarProvider>
            <SystemAdminSidebar />
            <SidebarInset>
                <header className='flex h-16 shrink-0 items-center gap-0 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b'>
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
