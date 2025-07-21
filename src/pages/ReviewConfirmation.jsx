import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ReviewRatingDisplay } from '../components/ReviewStars';
import { useAuth } from '../hooks/useAuth';

const ReviewConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  // Get review data from navigation state
  const { review, targetUser, creditEarned } = location.state || {};
  
  // Debug logging
  console.log('=== REVIEW CONFIRMATION DEBUG ===');
  console.log('Review object:', review);
  console.log('Review.rating:', review?.rating);
  console.log('Review.ratings:', review?.ratings);
  console.log('TargetUser:', targetUser);

  // Redirect if no review data
  React.useEffect(() => {
    if (!review || !targetUser) {
      navigate('/dashboard');
    }
  }, [review, targetUser, navigate]);

  if (!review || !targetUser) {
    return null;
  }

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Just now';
    }
  };

  const calculateAverageRating = (ratings) => {
    if (!ratings || typeof ratings !== 'object') return 0;
    const values = Object.values(ratings).filter(val => typeof val === 'number' && val > 0);
    if (values.length === 0) return 0;
    return values.reduce((sum, rating) => sum + rating, 0) / values.length;
  };

  // Use the overall rating if available, otherwise calculate from detailed ratings
  const calculatedRating = calculateAverageRating(review.ratings);
  const reviewRating = review ? (parseInt(review.rating) || parseFloat(review.rating) || 0) : 0;
  const averageRating = reviewRating || calculatedRating || 0;
  
  console.log('Raw review.rating:', review?.rating);
  console.log('Parsed review rating:', reviewRating);
  console.log('Calculated rating from ratings object:', calculatedRating);
  console.log('Final average rating used:', averageRating);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Submitted!</h1>
        <p className="text-gray-600">
          Thank you for sharing your experience. Your review has been successfully submitted.
        </p>
        
        {/* Credit Earned Notification */}
        {creditEarned && (
          <div className="mt-4 inline-flex items-center bg-primary-100 text-primary-800 px-4 py-2 rounded-full font-medium">
            <span className="text-sm">🎉 You earned 1 credit for leaving this review!</span>
          </div>
        )}
      </div>

      {/* Review Summary */}
      <div className="card mb-8">
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Review Summary</h2>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>
              <strong>For:</strong> {targetUser.name || targetUser.full_name || targetUser.first_name || `User ${targetUser.id || targetUser._id}`} ({targetUser.role || 'tenant'})
            </span>
            <span>•</span>
            <span>
              <strong>Submitted:</strong> {formatDate(review.created_at)}
            </span>
          </div>
        </div>

        {/* Overall Rating */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Overall Rating: {averageRating.toFixed(1)}/5
          </h3>
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`h-6 w-6 ${
                  star <= averageRating ? 'text-yellow-400' : 'text-gray-300'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 15.27L16.18 19l-1.64-7.03L20 7.24l-7.19-.61L10 0 7.19 6.63 0 7.24l5.46 4.73L3.82 19z"
                  clipRule="evenodd"
                />
              </svg>
            ))}
          </div>
        </div>

        {/* Detailed Ratings */}
        {review.ratings && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Category Ratings</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <ReviewRatingDisplay 
                ratings={review.ratings} 
                reviewerRole={currentUser?.role} 
              />
            </div>
          </div>
        )}

        {/* Comment */}
        {review.comment && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Your Comment</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 leading-relaxed">{review.comment}</p>
            </div>
          </div>
        )}

        {/* Lease Agreement */}
        {review.lease_agreement && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Lease Agreement</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm">Lease agreement uploaded successfully</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Important Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 mb-2">What happens next?</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Your review is now visible on {targetUser.name || `User ${targetUser.id}`}'s profile</p>
              <p>• The reviewed user will be notified of your review</p>
              <p>• You can view all your submitted reviews on your profile page</p>
              <p>• Reviews help build trust in the Rently community</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          to={`/profile/${targetUser.id}`}
          className="btn-primary text-center"
        >
          Return to Profile
        </Link>
        
        <Link
          to="/dashboard"
          className="btn-secondary text-center"
        >
          Back to Dashboard
        </Link>
        
        <Link
          to="/your-profile"
          className="btn-secondary text-center"
        >
          View Your Profile
        </Link>
      </div>

      {/* Share Section */}
      <div className="mt-8 text-center">
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Help others make informed decisions</h3>
          <p className="text-gray-600 mb-4">
            Encourage others to leave reviews to build a more trustworthy rental community.
          </p>
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'Renty Review',
                    text: `I just left a review on Rently for ${targetUser.name || 'a user'}. Check out their profile!`,
                    url: window.location.origin + `/profile/${targetUser.id}`
                  });
                } else {
                  // Fallback: copy to clipboard
                  navigator.clipboard.writeText(window.location.origin + `/profile/${targetUser.id}`);
                  alert('Profile link copied to clipboard!');
                }
              }}
              className="text-primary-600 hover:text-primary-500 text-sm font-medium"
            >
              Share Profile
            </button>
            
            <span className="text-gray-300">•</span>
            
            <Link
              to="/dashboard"
              className="text-primary-600 hover:text-primary-500 text-sm font-medium"
            >
              Find More Users
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewConfirmation;
