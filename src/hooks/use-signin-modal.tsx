import { useQueryState, parseAsBoolean } from "nuqs";
export const useSignInModal = () => {
    const [isOpen, setIsOpen] = useQueryState(
        "sign-in",
        parseAsBoolean.withDefault(false).withOptions({ clearOnDefault: true })
    );

    const openSignInModal = () => setIsOpen(true);
    const closeSignInModal = () => setIsOpen(false);

    return {
        isOpen,
        openSignInModal,
        closeSignInModal,
        setIsOpen
    }
}