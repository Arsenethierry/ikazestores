import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"

export const StoreHeroSkeleton = () => {
    return (
      <div className="w-full">
        <div className="md:hidden px-4 py-2">
          <ScrollArea className="pb-2">
            <div className="flex gap-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-24 rounded-full" />
              ))}
            </div>
          </ScrollArea>
        </div>
        <div className="container mx-auto flex flex-col md:flex-row gap-4 px-4 my-4">
          <div className="hidden md:block w-full md:w-[240px] h-[500px]">
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
          <Skeleton className="w-full h-[300px] md:h-[500px] rounded-lg" />
        </div>
      </div>
    )
  }