import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userAPI, reviewAPI } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { CategoryRating } from '../components/ReviewStars';

// Rating categories based on reviewer role
const ratingCategories = {
  // Tenant reviewing landlord
  tenant: {
    responsiveness: 'Responsiveness to repair requests',
    respect_rights: 'Respect tenant rights',
    friendliness: 'Friendliness',
    property_condition: 'Property condition',
    property_advertised: 'Property as advertised',
    conflict_resolution: 'Conflict resolution'
  },
  // Landlord reviewing tenant
  landlord: {
    rent_payments: 'On-time rent payments',
    lease_completion: 'Lease completion',
    communication: 'Communication/respect',
    property_care: 'Before vs after condition of place',
    legal_disputes: 'No legal disputes filed'
  }
};

const LeaveReview = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [targetUser, setTargetUser] = useState(null);
  const [ratings, setRatings] = useState({});
  const [comment, setComment] = useState('');
  const [leaseAgreement, setLeaseAgreement] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const loadTargetUser = useCallback(async () => {
    try {
      const response = await userAPI.getUserProfile(id);
      const user = response.data;
      
      // Validate that user can leave review for this target
      if (currentUser.id === user.id) {
        navigate('/dashboard');
        return;
      }
      
      if (currentUser.role === user.role) {
        navigate(`/profile/${id}`);
        return;
      }
      
      setTargetUser(user);
    } catch (error) {
      console.error('Error loading target user:', error);
      navigate('/dashboard');
    }
  }, [id, currentUser, navigate]);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    if (!id) {
      navigate('/dashboard');
      return;
    }

    loadTargetUser();
  }, [id, currentUser, navigate, loadTargetUser]);

  useEffect(() => {
    // Initialize ratings when target user is loaded
    if (targetUser && currentUser) {
      const categories = ratingCategories[currentUser.role];
      const initialRatings = {};
      Object.keys(categories).forEach(key => {
        initialRatings[key] = 0;
      });
      setRatings(initialRatings);
    }
  }, [targetUser, currentUser]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({ 
          ...prev, 
          leaseAgreement: 'Please upload a PDF or image file (JPG, PNG)' 
        }));
        return;
      }
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ 
          ...prev, 
          leaseAgreement: 'File size must be less than 10MB' 
        }));
        return;
      }
      
      setLeaseAgreement(file);
      setErrors(prev => ({ ...prev, leaseAgreement: '' }));
      
      // Simulate upload progress
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 100);
    }
  };

  const handleRatingChange = (category, rating) => {
    setRatings(prev => ({
      ...prev,
      [category]: rating
    }));
    
    // Clear rating errors when user provides rating
    if (errors[category]) {
      setErrors(prev => ({ ...prev, [category]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Check required ratings
    const categories = ratingCategories[currentUser.role];
    Object.keys(categories).forEach(category => {
      if (!ratings[category] || ratings[category] === 0) {
        newErrors[category] = `Please rate ${categories[category].toLowerCase()}`;
      }
    });
    
    // Check comment length
    if (comment.trim().length > 500) {
      newErrors.comment = 'Comment must be 500 characters or less';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      const reviewData = {
        target_user_id: parseInt(id),
        ratings: ratings,
        comment: comment.trim() || null,
        lease_agreement: leaseAgreement
      };
      
      const response = await reviewAPI.submitReview(reviewData);
      
      // Navigate to confirmation page with review data
      navigate('/review-confirmation', {
        state: {
          review: response.data,
          targetUser: targetUser
        }
      });
      
    } catch (error) {
      console.error('Error submitting review:', error);
      setErrors({ submit: 'Failed to submit review. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const clearFile = () => {
    setLeaseAgreement(null);
    setUploadProgress(0);
    // Reset file input
    const fileInput = document.getElementById('lease-agreement');
    if (fileInput) fileInput.value = '';
  };

  if (!targetUser || !currentUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <svg className="animate-spin h-8 w-8 text-primary-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  const categories = ratingCategories[currentUser.role];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(`/profile/${id}`)}
          className="flex items-center text-primary-600 hover:text-primary-500 text-sm font-medium mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Profile
        </button>
        
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Leave a Review</h1>
          <p className="text-gray-600">
            Share your experience with{' '}
            <span className="font-semibold">{targetUser.name || `User ${targetUser.id}`}</span>
            {' '}({targetUser.role})
          </p>
        </div>
      </div>

      {/* Review Form */}
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Lease Agreement Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Lease Agreement (Optional)
            </label>
            
            {leaseAgreement ? (
              <div className="border border-gray-300 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-900">
                      {leaseAgreement.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={clearFile}
                    className="text-sm text-red-600 hover:text-red-500"
                  >
                    Remove
                  </button>
                </div>
                
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
                
                {uploadProgress === 100 && (
                  <div className="flex items-center text-green-600 text-sm">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    File ready
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="lease-agreement"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                    >
                      <span>Upload lease agreement</span>
                      <input
                        id="lease-agreement"
                        name="lease-agreement"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF, PNG, JPG up to 10MB</p>
                </div>
              </div>
            )}
            
            {errors.leaseAgreement && (
              <p className="mt-1 text-sm text-red-600">{errors.leaseAgreement}</p>
            )}
          </div>

          {/* Rating Categories */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-6">
              Rate your experience <span className="text-red-500">*</span>
            </h3>
            
            <div className="space-y-6">
              {Object.entries(categories).map(([key, label]) => (
                <div key={key}>
                  <CategoryRating
                    category={label}
                    rating={ratings[key] || 0}
                    onRatingChange={(rating) => handleRatingChange(key, rating)}
                    required={true}
                  />
                  {errors[key] && (
                    <p className="mt-1 text-sm text-red-600">{errors[key]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
              Additional Comments (Optional)
            </label>
            <textarea
              id="comment"
              name="comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share any additional details about your experience..."
              className={`input-field ${errors.comment ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.comment ? (
                <p className="text-sm text-red-600">{errors.comment}</p>
              ) : (
                <p className="text-sm text-gray-500">
                  {comment.length}/500 characters
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(`/profile/${id}`)}
              className="btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={submitting}
              className={`btn-primary ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {submitting ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting Review...
                </div>
              ) : (
                'Submit Review'
              )}
            </button>
          </div>

          {/* General Error Message */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default LeaveReview;
