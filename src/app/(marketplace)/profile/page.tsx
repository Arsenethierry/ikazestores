import { GoogleUserSetup } from '@/features/auth/components/google-user-setup';
import { ProfilePage } from '@/features/auth/components/profile-page';
import { getUserData } from '@/lib/actions/auth.action';
import { UserRole } from '@/lib/constants';
import { getAuthState } from '@/lib/user-permission';
import { redirect } from 'next/navigation';
import React from 'react';

async function page() {
    const {
        user,
        isPhysicalStoreOwner,
        isVirtualStoreOwner,
        isSystemAdmin,
        isSystemAgent
    } = await getAuthState();

    if (!user) redirect('/sign-in');

    const hasPhysicalSellerPending = user?.labels?.includes(UserRole.PHYSICAL_SELLER_PENDING);
    const userData = await getUserData(user.$id);

    if (!userData) {
        return (
            <div>
                <GoogleUserSetup user={user} />
            </div>
        );
    }

    return (
        <div>
            <ProfilePage
                userData={userData}
                isVirtualStoreOwner={isVirtualStoreOwner}
                isPhysicalStoreOwner={isPhysicalStoreOwner}
                isSystemAdmin={isSystemAdmin}
                isSystemAgent={isSystemAgent}
                hasPhysicalSellerPending={hasPhysicalSellerPending}
            />
        </div>
    );
}

export default page;