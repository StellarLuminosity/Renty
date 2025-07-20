import React from 'react';
import { Link } from 'react-router-dom';
import ReviewStars from './ReviewStars';

const UserCard = ({ user }) => {
  const rating = parseFloat(user.average_rating || 0);
  // Check for various review count field names that might be used
  const reviewCount = user.review_count || 
                      user.total_reviews || 
                      (user.reviews_received && user.reviews_received.length) ||
                      (user.reviews && user.reviews.length) ||
                      0;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-200">
      <div className="flex flex-col h-full">
        {/* Profile Section */}
        <div className="flex items-start space-x-4 mb-5">
          <div className="flex-shrink-0">
            {user.profile_picture ? (
              <img
                src={user.profile_picture}
                alt={`${user.name} profile`}
                className="h-16 w-16 rounded-full object-cover ring-2 ring-gray-100"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center ring-2 ring-gray-100">
                <span className="text-primary-600 font-bold text-xl">
                  {user.name?.charAt(0)?.toUpperCase() || (user.role === 'tenant' ? 'T' : 'L')}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gray-900 mb-3 truncate">
              {user.name || `User ${user.id}`}
            </h3>
            
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              user.role === 'landlord' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {user.role === 'landlord' ? '🏠 Landlord' : '🏠 Tenant'}
            </span>
          </div>
        </div>

        {/* Rating & Reviews Section */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <ReviewStars rating={rating} size="md" />
            <div className="flex items-baseline space-x-1">
              <span className="text-lg font-bold text-gray-900">
                {rating.toFixed(1)}
              </span>
              <span className="text-gray-500 text-sm">
                out of 5
              </span>
            </div>
          </div>
          
          <p className="text-gray-600 text-sm">
            {reviewCount > 0 
              ? `Based on ${reviewCount} review${reviewCount !== 1 ? 's' : ''}` 
              : 'No reviews yet'
            }
          </p>
        </div>

        {/* Action Button */}
        <div className="mt-auto">
          <Link
            to={`/profile/${user._id}`}
            className="block w-full bg-primary-600 hover:bg-primary-700 text-white text-center py-3 px-4 rounded-lg font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserCard;