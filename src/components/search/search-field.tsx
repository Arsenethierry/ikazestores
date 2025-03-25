"use client";

import { Input } from "../ui/input";

export const SearchField = ({ mobile }: { mobile?: boolean }) => {
    return <Input
        placeholder='search products...'
        className={`${mobile ? 'hidden' : 'bg-white max-w-lg mr-5'}`}
    />
}