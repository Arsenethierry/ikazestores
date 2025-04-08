import React from 'react'
import { StoreCarousel } from './store-carousel'
import { SidebarProvider } from '@/components/ui/sidebar'
import CategoriesSidebar from './sidebar/Categories-sidebar'

function StoreHero() {
  return (
    <div className="w-full">

    <div className="container mx-auto flex justify-center items-center h-96 gap-4 rounded-lg my-4">
        <div className="w-1/5 h-full bg-gray-300 rounded-lg">
            <CategoriesSidebar />
        </div>
        <div className="w-3/5 h-full bg-gray-300 rounded-lg"><StoreCarousel /></div>
        <div className="w-1/5 h-full rounded-lg">
            <div className="w-full h-1/2 rounded-lg bg-gray-300"></div>
            <div className="w-full h-1/2 rounded-lg bg-gray-300 mt-4"></div>
        </div>
    </div>
    </div>
  )
}

export default StoreHero