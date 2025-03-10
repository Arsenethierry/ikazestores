export const ProductListSkeleton = () => {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {[...Array(10)].map((_, index) => (
          <div
            key={index}
            className="animate-pulse bg-white rounded-xl shadow p-4"
          >
            {/* Image Placeholder */}
            <div className="h-48 bg-gray-200 rounded-lg"></div>
  
            {/* Discount Label */}
            <div className="w-12 h-5 bg-gray-300 rounded mt-2"></div>
  
            {/* Title */}
            <div className="h-4 bg-gray-300 rounded w-3/4 mt-3"></div>
  
            {/* Rating */}
            <div className="flex space-x-1 mt-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-4 h-4 bg-gray-300 rounded-full"></div>
              ))}
            </div>
  
            {/* Price */}
            <div className="h-5 bg-gray-300 rounded w-1/2 mt-2"></div>
          </div>
        ))}
      </div>
    );
  }
  