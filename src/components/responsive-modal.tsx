import { useMedia } from 'react-use';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Drawer, DrawerContent, DrawerTitle } from "./ui/drawer";

interface ResponsiveModalProps {
    children: React.ReactNode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const ResponsiveModal = ({
    children,
    onOpenChange,
    open
}: ResponsiveModalProps) => {

    const isDesktop = useMedia('(min-width: 1024px)');

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="w-full max-w-max p-0 border-0 overflow-y-auto hide-scrollbar max-h-[85vh]">
                    <DialogHeader className='hidden'>
                        <DialogTitle></DialogTitle>
                        <DialogDescription>
                        </DialogDescription>
                    </DialogHeader>
                    {children}
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent>
                <DrawerTitle></DrawerTitle>
                <div className="overflow-y-auto hide-scrollbar max-h-[85vh]">
                    {children}
                </div>
            </DrawerContent>
        </Drawer>
    )
}