"use client";

import React from 'react';
import { Loader, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu } from '@radix-ui/react-dropdown-menu';
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { useCurrentUser } from '../queries/use-get-current-user';
import { useLogout } from '../mutations/use-logout';

export const UserButton = () => {
    const { data: user, isPending } = useCurrentUser();

    const { mutate: logout } = useLogout();

    if (isPending) {
        return (
            <div className='size-10 rounded-full flex items-center justify-center bg-neutral-200 border border-neutral-300'>
                <Loader className='size-4 animate-spin text-muted-foreground' />
            </div>
        )
    }

    if (!user) return null;

    const { name, email } = user;

    const avatarFallback = name
        ? name.charAt(0).toUpperCase()
        : email.charAt(0).toUpperCase() ?? "U";

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger>
                <Avatar className='size-10 hover:opacity-75 transition border border-neutral-300'>
                    <AvatarFallback className='bg-neutral-200 font-medium text-neutral-500 flex items-center justify-center'>
                        {avatarFallback}
                    </AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' side="bottom" className='w-60' sideOffset={10}>
                <div className='flex flex-col items-center justify-center gap-2 px-2.5 py-2'>
                    <Avatar className='size-[52px] border border-neutral-300'>
                        <AvatarFallback className='bg-neutral-200 font-medium text-neutral-500 flex items-center justify-center'>
                            {avatarFallback}
                        </AvatarFallback>
                    </Avatar>
                    <div className='flex flex-col items-center justify-center'>
                        <p className='text-sm font-medium text-neutral-900'>
                            {name || "User"}
                        </p>
                        <p className='text-xs text-neutral-500'>{email}</p>
                    </div>
                </div>
                <Separator />
                <DropdownMenuItem
                    onClick={() => logout()}
                    className='h-10 flex items-center justify-center text-amber-700 font-medium cursor-pointer'
                >
                    <LogOut className='size-4 mr-2' />
                    Logout
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}