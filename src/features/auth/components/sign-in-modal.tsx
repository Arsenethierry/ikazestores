"use client";

import { ResponsiveModal } from "@/components/responsive-modal";
import { SignInCard } from "./sign-in-card";
import { useSignInModal } from "@/hooks/use-signin-modal";

export const SignInModal = () => {
    const { isOpen, setIsOpen } = useSignInModal();
    // const { data: user } = useCurrentUser();

    // useEffect(() => {
    //     if(!user) {
    //         setIsOpen(true);
    //     }
    // }, [user, setIsOpen])

    return (
        <ResponsiveModal open={isOpen} onOpenChange={setIsOpen}>
            <SignInCard isModal={true} />
        </ResponsiveModal>
    )
}