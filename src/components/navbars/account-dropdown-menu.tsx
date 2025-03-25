import { CircleUser, LayoutDashboard, ShoppingBag, User } from "lucide-react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import Link from "next/link";
import LogoutButton from "@/features/auth/components/logout-button";
import { AuthStatus } from "@/lib/types";

export const AccountDropdown = ({ isAuthenticated, isPhysicalStoreOwner, isVirtualStoreOwner }: AuthStatus) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant={'ghost'} className='text-white font-medium cursor-pointer hidden md:inline-flex'>
                <CircleUser className='h-4 m-auto' />
                <span className='ml-2'>Account</span>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <>
                    {isAuthenticated ? <>
                        <DropdownMenuItem>
                            <User />
                            <span>Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <DropdownMenuItem className='cursor-pointer w-full'>
                                <Link href={'/my-orders'} className='w-full font-medium cursor-pointer inline-flex'>
                                    <ShoppingBag className='h-4 my-auto mr-2' />
                                    <span>My Orders</span>
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuItem>
                        {(isPhysicalStoreOwner || isVirtualStoreOwner) && (
                            <DropdownMenuItem className='cursor-pointer w-full'>
                                <Link href={'/admin'} className='w-full font-medium cursor-pointer inline-flex'>
                                    <LayoutDashboard className='h-4 my-auto' />
                                    <span>Dashboard</span>
                                </Link>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                            <LogoutButton />
                        </DropdownMenuItem>
                    </> : <>
                        <DropdownMenuItem className='cursor-pointer w-full'>
                            <Link href={'/sign-in'} className='w-full font-medium cursor-pointer inline-flex'>
                                <CircleUser className='h-4 my-auto' />
                                <span>Log In</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className='cursor-pointer w-full'>
                            <Link href={'/sign-up'} className='w-full font-medium cursor-pointer inline-flex justify-items-start'>
                                <CircleUser className='h-4 my-auto' />
                                <span>Create account</span>
                            </Link>
                        </DropdownMenuItem>
                    </>}
                </>
            </DropdownMenuGroup>
        </DropdownMenuContent>
    </DropdownMenu>
);