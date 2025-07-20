import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { tenantAPI } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import ReviewStars, { ReviewRatingDisplay } from '../components/ReviewStars';

const Profile = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProfile = useCallback(async () => {
    if (!id) {
      setError('Tenant ID is required');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await tenantAPI.getTenantProfile(id);
      
      // Handle the nested API response structure
      const tenantData = response.data.data || response.data || response;
      
      setProfile(tenantData);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load tenant profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Redirect if trying to view own profile
  useEffect(() => {
    loadProfile();
  }, [id, loadProfile]);

  const calculateAverageRating = (reviews) => {
    if (!reviews || reviews.length === 0) return 0;
    
    const totalRating = reviews.reduce((sum, review) => {
      // Use the overall rating field, fallback to detailed ratings calculation
      if (review.rating) {
        return sum + review.rating;
      }
      // Fallback to detailed ratings calculation if overall rating not available
      const ratings = Object.values(review.ratings || {});
      if (ratings.length > 0) {
        const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        return sum + avgRating;
      }
      return sum;
    }, 0);
    
    return totalRating / reviews.length;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Reviews are now created through the AddTenant flow
  // This page only displays tenant profiles with landlord reviews

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <svg className="animate-spin h-8 w-8 text-primary-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading profile</h3>
              <p className="text-sm text-red-700 mt-2">{error}</p>
              <div className="mt-4">
                <button
                  onClick={loadProfile}
                  className="btn-secondary text-sm"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tenant not found</h3>
          <p className="text-gray-600 mb-4">The tenant profile you're looking for doesn't exist.</p>
          <Link to="/dashboard" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const averageRating = profile ? profile.average_rating : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Navigation */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-primary-600 hover:text-primary-500 text-sm font-medium"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      {/* Profile Header */}
      <div className="card mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center space-x-6">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              {profile.profile_picture ? (
                <img
                  src={profile.profile_picture}
                  alt={`${profile.name} profile`}
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 font-bold text-2xl">
                    {profile.name?.charAt(0)?.toUpperCase() || (profile.role === 'tenant' ? 'T' : 'L')}
                  </span>
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {profile.name || `Tenant ${profile._id}`}
              </h1>
              
              <div className="flex items-center space-x-4 mb-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  profile.role === 'landlord' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {profile.role === 'landlord' ? '🏠 Landlord' : '🏠 Tenant'}
                </span>
              </div>

              {/* Average Rating */}
              <div className="flex items-center space-x-3">
                <ReviewStars rating={averageRating} size="lg" />
                <div>
                  <span className="text-xl font-semibold text-gray-900">
                    {averageRating.toFixed(1)}
                  </span>
                  <span className="text-gray-600 ml-1">
                    ({(profile.reviews_received || profile.reviews || []).length} landlord review{(profile.reviews_received || profile.reviews || []).length !== 1 ? 's' : ''})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Info about tenant profile */}
          <div className="mt-6 md:mt-0">
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
              <p className="text-sm text-gray-600">
                <strong>Tenant Profile:</strong> Reviews from landlords who have rented to this tenant.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Landlord Reviews ({(profile.reviews_received || profile.reviews || []).length})
          </h2>
          {currentUser && currentUser.role === 'landlord' && (
            <button
              onClick={() => navigate(`/leave-review/${profile._id}`)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Leave Review
            </button>
          )}
        </div>

        {(profile.reviews_received || profile.reviews) && (profile.reviews_received || profile.reviews).length > 0 ? (
          <div className="space-y-6">
            {(profile.reviews_received || profile.reviews).map((review) => (
              <div key={review._id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-600 font-semibold text-sm">
                        {review.reviewer_name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {review.reviewer_name}
                      </h3>
                      <p className="text-sm text-gray-600 capitalize">
                        {review.reviewer_role}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    {formatDate(review.created_at || review.date_created)}
                  </div>
                </div>

                {/* Rating Categories */}
                {review.ratings && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Ratings:</h4>
                    <ReviewRatingDisplay 
                      ratings={review.ratings} 
                      reviewerRole={review.reviewer_role} 
                    />
                  </div>
                )}

                {/* Comment */}
                {review.comment && (
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Comment:</h4>
                    <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                  </div>
                )}

                {/* Proof Files */}
                {review.proof_files && review.proof_files.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Evidence/Proof Files ({review.proof_files.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {review.proof_files.map((file, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                          {/* File preview */}
                          <div className="mb-2">
                            {file.type.startsWith('image/') && (
                              <div className="w-full h-20 bg-gray-200 rounded flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                            {file.type.startsWith('video/') && (
                              <div className="w-full h-20 bg-gray-200 rounded flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                            {file.type === 'application/pdf' && (
                              <div className="w-full h-20 bg-red-50 rounded flex items-center justify-center">
                                <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                          
                          {/* File info */}
                          <div className="text-xs text-gray-600">
                            <p className="truncate font-medium" title={file.name}>{file.name}</p>
                            <div className="flex justify-between items-center mt-1">
                              <span>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                              <span className="text-blue-600 hover:text-blue-800 cursor-pointer" title="View file">
                                📎 View
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
            <p className="text-gray-600 mb-4">
              {profile.name || 'This user'} hasn't received any reviews yet.
            </p>
            
            <div className="mt-4">
              <Link
                to="/dashboard"
                className="btn-secondary"
              >
                Search for other tenants
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
