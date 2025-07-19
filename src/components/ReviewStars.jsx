import React from 'react';

const ReviewStars = ({ 
  rating = 0, 
  size = 'md', 
  interactive = false, 
  onRatingChange = null,
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const starSize = sizeClasses[size] || sizeClasses.md;

  const handleStarClick = (starRating) => {
    if (interactive && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  const renderStar = (starIndex) => {
    const starRating = starIndex + 1;
    const isFilled = starRating <= rating;
    const isHalfFilled = !isFilled && starRating - 0.5 <= rating;

    return (
      <button
        key={starIndex}
        type="button"
        onClick={() => handleStarClick(starRating)}
        disabled={!interactive}
        className={`${starSize} ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform duration-150 ${className}`}
        aria-label={`${starRating} star${starRating !== 1 ? 's' : ''}`}
      >
        <svg
          fill={isFilled || isHalfFilled ? "#fbbf24" : "#d1d5db"}
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          {isHalfFilled ? (
            <defs>
              <linearGradient id={`half-${starIndex}`}>
                <stop offset="50%" stopColor="#fbbf24" />
                <stop offset="50%" stopColor="#d1d5db" />
              </linearGradient>
            </defs>
          ) : null}
          <path
            fillRule="evenodd"
            d="M10 15.27L16.18 19l-1.64-7.03L20 7.24l-7.19-.61L10 0 7.19 6.63 0 7.24l5.46 4.73L3.82 19z"
            clipRule="evenodd"
            fill={isHalfFilled ? `url(#half-${starIndex})` : undefined}
          />
        </svg>
      </button>
    );
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {[0, 1, 2, 3, 4].map(renderStar)}
    </div>
  );
};

// Component for category-based rating input
export const CategoryRating = ({ 
  category, 
  rating, 
  onRatingChange, 
  required = false 
}) => {
  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm font-medium text-gray-700">
        {category} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="flex items-center space-x-2">
        <ReviewStars
          rating={rating}
          interactive={true}
          onRatingChange={onRatingChange}
          size="lg"
        />
        <span className="text-sm text-gray-600 min-w-[60px]">
          {rating > 0 ? `${rating}/5` : 'Not rated'}
        </span>
      </div>
    </div>
  );
};

// Component for displaying review ratings
export const ReviewRatingDisplay = ({ ratings, reviewerRole }) => {
  // Get category names based on reviewer role
  const getCategoryName = (key) => {
    const categoryNames = {
      // Tenant reviewing landlord
      responsiveness: 'Responsiveness to Repairs',
      respect_rights: 'Respect Tenant Rights',
      friendliness: 'Friendliness',
      property_condition: 'Property Condition',
      property_advertised: 'Property as Advertised',
      conflict_resolution: 'Conflict Resolution',
      
      // Landlord reviewing tenant
      payment_timeliness: 'On-time Rent Payments',
      lease_completion: 'Lease Completion',
      communication: 'Communication/Respect',
      no_legal_disputes: 'No Legal Disputes'
    };
    
    return categoryNames[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (!ratings) return null;

  return (
    <div className="space-y-3">
      {Object.entries(ratings).map(([category, rating]) => (
        <div key={category} className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 flex-1">
            {getCategoryName(category)}
          </span>
          <div className="flex items-center space-x-2">
            <ReviewStars rating={rating} size="sm" />
            <span className="text-sm text-gray-600 w-8">{rating}/5</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReviewStars;
