import { CategoriesCard } from '@/features/catalog/components/category-hover-card'
import { StoreCarousel } from './store-carousel'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Suspense } from 'react'
import SpinningLoader from '@/components/spinning-loader'

export const StoreHero = async () => {
  return (
    <div className="w-full">

      {/* <div className="md:hidden px-4 py-2 bg-accent/50">
        <ScrollArea className='pb-2'>
          <div className='flex gap-2'>
            <Suspense fallback={<SpinningLoader />}>
              <CategoriesCard mobile={true} />
            </Suspense>
          </div>
        </ScrollArea>
      </div> */}

      <div className="container mx-auto flex flex-col md:flex-row gap-4 px-4 my-4">
        <div className="hidden md:block w-full md:w-[240px] h-[500px] bg-background rounded-lg border shadow-sm">
          <ScrollArea className="h-full p-2">
            <div className="space-y-1">
              <Suspense fallback={<SpinningLoader />}>
                <CategoriesCard />
              </Suspense>
            </div>
          </ScrollArea>
        </div>

        <div className="w-full md:w-[calc(100%-496px)] lg:w-[calc(100%-512px)] h-[300px] md:h-[500px] rounded-lg overflow-hidden shadow-sm">
          <StoreCarousel />
        </div>

        <div className="hidden md:flex flex-col gap-4 w-[240px]">
          <div className="h-[240px] bg-background rounded-lg border shadow-sm p-4">
            <h3 className="font-bold mb-2">Black Friday Deals</h3>
            <div className="text-sm text-muted-foreground">
              Up to 70% off selected items!
            </div>
          </div>
          <div className="h-[240px] bg-background rounded-lg border shadow-sm p-4">
            <h3 className="font-bold mb-2">Featured Store</h3>
            <div className="text-sm text-muted-foreground">
              Discover Ikazetores
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}