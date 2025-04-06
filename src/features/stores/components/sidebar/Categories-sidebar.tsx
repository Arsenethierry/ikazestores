import React from 'react'

function CategoriesSidebar() {
    const categories = [
        { name: "Electronics", subcategories: ["Screens", "Computers", "Phones", "etc"] },
        { name: "Fashion", subcategories: ["Clothing", "Shoes", "Accessories"] },
        { name: "Home & Garden", subcategories: ["Furniture", "Decor", "Gardening"] },
        { name: "Health & Beauty", subcategories: ["Skincare", "Makeup", "Wellness"] },
        { name: "Sports & Outdoors", subcategories: ["Fitness", "Camping", "Cycling"] },
        { name: "Toys & Hobbies", subcategories: ["Kids Toys", "Collectibles", "Games"] },
        { name: "Automotive", subcategories: ["Parts", "Accessories", "Tools"] },
        { name: "Books", subcategories: ["Fiction", "Non-Fiction", "Comics"] },
        { name: "others..."},
       ]
  return (
    <div className="h-fit w-full">
        <div className="p-2 w-full bg-blue-600 rounded-t-lg">
            <h3 className="text-2xl font-bold text-center text-white">Categories</h3>
        </div>
        <ul>
            {categories.map((category, index) => (
                <li key={index} className="px-2 py-1 flex justify-between hover:bg-gray-100 cursor-pointer transition-all duration-200">
                    <span className="text-md ">{category.name}</span>
                    {category.subcategories?<span className="text-lg font-semibold">&gt;</span>:''}
                </li>
            ))}
           
        </ul>
    </div>
  )
}

export default CategoriesSidebar