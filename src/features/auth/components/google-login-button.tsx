import { GoogleLogo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import React from 'react';

type Props = {
    disabled: boolean,
    handler: () => void
}
export const GoogleLogInButton = ({ disabled, handler }: Props) => {

    return (
        <div>
            <Button
                variant={'outline'}
                className="w-full h-11 sm:h-12 gap-2 text-sm sm:text-base"
                disabled={disabled}
                onClick={handler}
            >
                <GoogleLogo />
                Continue with Google
            </Button>
        </div>
    );
}
