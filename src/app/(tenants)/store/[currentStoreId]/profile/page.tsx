import { GoogleUserSetup } from '@/features/auth/components/google-user-setup';
import { ProfilePage } from '@/features/auth/components/profile-page';
import { getUserData } from '@/lib/actions/auth.action';
import { UserRole } from '@/lib/constants';
import { MAIN_DOMAIN } from '@/lib/env-config';
import { getAuthState } from '@/lib/user-permission';
import { redirect } from 'next/navigation';
import React from 'react';

async function page({
    params,
}: {
    params: Promise<{ currentStoreId: string }>;
}) {
    // const { currentStoreId } = await params;
    const {
        user,
        isPhysicalStoreOwner,
        isVirtualStoreOwner,
        isSystemAdmin,
        isSystemAgent,
        // canAccessStore
    } = await getAuthState();

    if (!user) redirect('/sign-in');

    // const canAccess = typeof canAccessStore === 'function'
    //     ? await canAccessStore(currentStoreId)
    //     : Boolean(canAccessStore);

    // if (isPhysicalStoreOwner || (isVirtualStoreOwner && !canAccess)) {
    //    redirect(`${MAIN_DOMAIN}/profile`);
    // }

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
                user={user}
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