import { getAuthState } from "@/lib/user-permission";
import { redirect } from "next/navigation";

export default async function SystemAdminPage() {
    const {
        isSystemAdmin,
        user
    } = await getAuthState();
    
    if (!isSystemAdmin || !user) {
        redirect('/admin');
    }
    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold">System Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">
                Welcome to the system administration panel
            </p>
            {/* Add your system admin specific content here */}
        </div>
    );
}