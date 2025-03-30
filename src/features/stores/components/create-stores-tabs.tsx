import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CurrentUserType } from '@/lib/types';
import { VirtualStoreForm } from './vitual-store-form ';
import { PhysicalStoreForm } from './physical-store-form';

export const CreateStoresTabs = ({
    currentUser,
    isPhysicalStoreOwner
}: {
    currentUser: CurrentUserType,
    isPhysicalStoreOwner: boolean
}) => {
    return (
        <div className='max-w-5xl w-full mx-auto'>
            <Tabs defaultValue='virtualStore'>
                <TabsList className="relative h-auto w-full gap-0.5 bg-transparent p-0 before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-border">
                    <TabsTrigger
                        value="virtualStore"
                        className="w-full overflow-hidden rounded-b-none border-x border-t border-border bg-muted py-2 data-[state=active]:z-10 data-[state=active]:shadow-none"
                    >
                        Create Virtual Store
                    </TabsTrigger>
                    <TabsTrigger
                        value="physicalStore"
                        disabled={!isPhysicalStoreOwner}
                        className="w-full overflow-hidden rounded-b-none border-x border-t border-border bg-muted py-2 data-[state=active]:z-10 data-[state=active]:shadow-none"
                    >
                        Create Physical Store (only real store)
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="virtualStore">
                    {currentUser && <VirtualStoreForm currentUser={currentUser} />}
                </TabsContent>
                <TabsContent value="physicalStore">
                    {currentUser && <PhysicalStoreForm currentUser={currentUser} />}
                </TabsContent>
            </Tabs>
        </div>
    );
}