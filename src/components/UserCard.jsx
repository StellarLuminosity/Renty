import React from 'react';
import { Link } from 'react-router-dom';
import ReviewStars from './ReviewStars';

const UserCard = ({ user }) => {
  return (
    <div className="card hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center space-x-4">
        {/* Profile Picture */}
        <div className="flex-shrink-0">
          {user.profile_picture ? (
            <img
              src={user.profile_picture}
              alt={`${user.name} profile`}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-600 font-semibold text-xl">
                {user.name?.charAt(0)?.toUpperCase() || (user.role === 'tenant' ? 'T' : 'L')}
              </span>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {user.name || `User ${user.id}`}
              </h3>
              
              <div className="flex items-center space-x-2 mb-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.role === 'landlord' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {user.role === 'landlord' ? '🏠 Landlord' : '🏠 Tenant'}
                </span>
              </div>

              {/* Rating */}
              <div className="flex items-center space-x-2">
                <ReviewStars rating={parseFloat(user.average_rating || 0)} size="sm" />
                <span className="text-sm text-gray-600">
                  {parseFloat(user.average_rating || 0).toFixed(1)} rating
                </span>
              </div>
            </div>

            {/* View Profile Button */}
            <Link
              to={`/profile/${user.id}`}
              className="btn-primary"
            >
              View Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Additional Info (if available) */}
      {user.review_count && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {user.review_count} review{user.review_count !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserCard;
