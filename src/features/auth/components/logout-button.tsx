"use client";

import { Loader, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SpinningLoader from '@/components/spinning-loader';
import { useCurrentUser } from '../queries/use-get-current-user';
import { useLogout } from '../mutations/use-logout';

function LogoutButton() {
    const { data: user, isLoading } = useCurrentUser();
    const { mutate: logout, isPending } = useLogout();

    if (isLoading) return <SpinningLoader />;
    if (!user) return null;

    return (
        <Button
            onClick={() => logout()}
            disabled={isPending}
            variant={'destructive'}
            className='w-full flex justify-evenly'>
            {isPending ? (
                <>
                    <Loader size={20} className="animate-spin" /> loading...
                </>
            ) : <>
                <LogOut />
                Log out
            </>}
        </Button>
    )
}

export default LogoutButton;