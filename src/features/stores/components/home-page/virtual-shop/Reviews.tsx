/* eslint-disable @typescript-eslint/no-unused-vars */
// components/ReviewsSection.tsx
'use client';

import React from 'react';
import { Star } from 'lucide-react';

// Types
interface Review {
  id: string;
  name: string;
  review: string;
  rating: number;
}

interface ReviewsSectionProps {
  title?: string;
  reviews?: Review[];
  className?: string;
  showRating?: boolean;
  maxRating?: number;
  backgroundColor?: string;
  textColor?: string;
  cardBackgroundColor?: string;
}

// Star Rating Component
const StarRating: React.FC<{ rating: number; maxRating: number; className?: string }> = ({ 
  rating, 
  maxRating, 
  className = "w-4 h-4" 
}) => {
  return (
    <div className="flex items-center justify-center space-x-1 mt-4">
      {[...Array(maxRating)].map((_, index) => (
        <Star
          key={index}
          className={`${className} ${
            index < rating 
              ? 'text-yellow-500 fill-current' 
              : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );
};

// Individual Review Card Component
const ReviewCard: React.FC<{ 
  review: Review; 
  showRating: boolean; 
  maxRating: number;
  cardBackgroundColor: string;
}> = ({ review, showRating, maxRating, cardBackgroundColor }) => {
  return (
    <div className={`${cardBackgroundColor} rounded-lg p-8 text-center md:w-1/3 transition-transform duration-300 hover:scale-105 hover:shadow-lg`}>
      <p className="font-bold uppercase text-black mb-4">{review.name}</p>
      <p className="text-xl font-light italic text-gray-700 leading-relaxed">
        {review.review}
      </p>
      {showRating && (
        <StarRating rating={review.rating} maxRating={maxRating} />
      )}
    </div>
  );
};

// Main Reviews Section Component
const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  reviews = [],
  className = "",
  showRating = true,
  maxRating = 5,
  backgroundColor = "bg-white",
  textColor = "text-black",
  cardBackgroundColor = "bg-gray-200"
}) => {
  // Default reviews data
  const defaultReviews: Review[] = [
    {
      id: '1',
      name: 'John Doe',
      review: 'This podcast is amazing! The storytelling and production quality are top-notch. I can\'t wait for the next episode!',
      rating: 5
    },
    {
      id: '2',
      name: 'Jane Smith',
      review: 'This podcast kept me on the edge of my seat. It\'s a must-listen for true crime enthusiasts!',
      rating: 5
    },
    {
      id: '3',
      name: 'Emily Johnson',
      review: 'I can\'t get enough of this podcast! The host\'s voice is so soothing, and the stories are gripping. Highly recommend!',
      rating: 5
    }
  ];

  const displayReviews = reviews.length > 0 ? reviews : defaultReviews;

  return (
    <section className={`${backgroundColor} px-4 py-5 md:py-5 ${className}`}>
      <div className="max-w-screen-xl mx-auto">
        <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:space-x-4 relative">
          {displayReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              showRating={showRating}
              maxRating={maxRating}
              cardBackgroundColor={cardBackgroundColor}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

// Alternative Layout Variations
export const ReviewsGrid: React.FC<ReviewsSectionProps & { columns?: 2 | 3 | 4 }> = ({
  columns = 3,
  ...props
}) => {
  const gridClass = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4'
  }[columns];

  return (
    <section className={`${props.backgroundColor || 'bg-white'} px-4 py-12 md:py-24 ${props.className || ''}`}>
      <div className="max-w-screen-xl mx-auto">
        <h2 className={`font-black ${props.textColor || 'text-black'} text-center text-3xl leading-none uppercase max-w-2xl mx-auto mb-12`}>
          {props.title || "What Listeners Are Saying"}
        </h2>
        
        <div className={`grid grid-cols-1 ${gridClass} gap-6`}>
          {(props.reviews && props.reviews.length > 0 ? props.reviews : [
            {
              id: '1',
              name: 'John Doe',
              review: 'This podcast is amazing! The storytelling and production quality are top-notch. I can\'t wait for the next episode!',
              rating: 5
            },
            {
              id: '2',
              name: 'Jane Smith',
              review: 'This podcast kept me on the edge of my seat. It\'s a must-listen for true crime enthusiasts!',
              rating: 5
            },
            {
              id: '3',
              name: 'Emily Johnson',
              review: 'I can\'t get enough of this podcast! The host\'s voice is so soothing, and the stories are gripping. Highly recommend!',
              rating: 5
            }
          ]).map((review) => (
            <div key={review.id} className={`${props.cardBackgroundColor || 'bg-gray-200'} rounded-lg p-6 text-center transition-transform duration-300 hover:scale-105 hover:shadow-lg`}>
              <p className="font-bold uppercase text-black mb-4">{review.name}</p>
              <p className="text-lg font-light italic text-gray-700 leading-relaxed mb-4">
                {review.review}
              </p>
              {(props.showRating !== false) && (
                <StarRating rating={review.rating} maxRating={props.maxRating || 5} />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Carousel Version for many reviews
export const ReviewsCarousel: React.FC<ReviewsSectionProps> = (props) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [itemsPerView, setItemsPerView] = React.useState(1);

  const displayReviews = props.reviews && props.reviews.length > 0 ? props.reviews : [
    {
      id: '1',
      name: 'John Doe',
      review: 'This podcast is amazing! The storytelling and production quality are top-notch. I can\'t wait for the next episode!',
      rating: 5
    },
    {
      id: '2',
      name: 'Jane Smith',
      review: 'This podcast kept me on the edge of my seat. It\'s a must-listen for true crime enthusiasts!',
      rating: 5
    },
    {
      id: '3',
      name: 'Emily Johnson',
      review: 'I can\'t get enough of this podcast! The host\'s voice is so soothing, and the stories are gripping. Highly recommend!',
      rating: 5
    },
    {
      id: '4',
      name: 'Mike Wilson',
      review: 'Outstanding content and excellent presentation. This has become my go-to podcast for entertainment.',
      rating: 4
    },
    {
      id: '5',
      name: 'Sarah Davis',
      review: 'Brilliant storytelling that keeps you hooked from start to finish. Absolutely love this podcast!',
      rating: 5
    }
  ];

  React.useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth >= 1024) setItemsPerView(3);
      else if (window.innerWidth >= 768) setItemsPerView(2);
      else setItemsPerView(1);
    };

    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, []);

  const maxIndex = Math.max(0, displayReviews.length - itemsPerView);

  const goToNext = () => {
    setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
  };

  const goToPrev = () => {
    setCurrentIndex(prev => (prev <= 0 ? maxIndex : prev - 1));
  };

  return (
    <section className={`${props.backgroundColor || 'bg-white'} px-4 py-12 md:py-24 ${props.className || ''}`}>
      <div className="max-w-screen-xl mx-auto">
        <h2 className={`font-black ${props.textColor || 'text-black'} text-center text-3xl leading-none uppercase max-w-2xl mx-auto mb-12`}>
          {props.title || "What Listeners Are Saying"}
        </h2>
        
        <div className="relative">
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)` }}
            >
              {displayReviews.map((review) => (
                <div key={review.id} className={`flex-shrink-0 px-2`} style={{ width: `${100 / itemsPerView}%` }}>
                  <div className={`${props.cardBackgroundColor || 'bg-gray-200'} rounded-lg p-6 text-center h-full transition-transform duration-300 hover:scale-105 hover:shadow-lg`}>
                    <p className="font-bold uppercase text-black mb-4">{review.name}</p>
                    <p className="text-lg font-light italic text-gray-700 leading-relaxed mb-4">
                      {review.review}
                    </p>
                    {(props.showRating !== false) && (
                      <StarRating rating={review.rating} maxRating={props.maxRating || 5} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {displayReviews.length > itemsPerView && (
            <>
              <button
                onClick={goToPrev}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow duration-300"
                aria-label="Previous reviews"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={goToNext}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow duration-300"
                aria-label="Next reviews"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <div className="flex justify-center mt-6 space-x-2">
                {[...Array(maxIndex + 1)].map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                      index === currentIndex ? 'bg-gray-800' : 'bg-gray-400'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;

