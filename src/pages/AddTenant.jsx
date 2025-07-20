import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { tenantAPI, reviewAPI } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { CategoryRating } from '../components/ReviewStars';

// Rating categories for landlord reviewing tenant
const ratingCategories = {
  rent_payments: 'On-time rent payments',
  lease_completion: 'Lease completion/duration',
  communication: 'Communication & respect',
  property_care: 'Property care & condition',
  legal_disputes: 'Legal disputes/issues'
};

const AddTenant = () => {
  const [searchParams] = useSearchParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Tenant information
  const [tenantData, setTenantData] = useState({
    name: searchParams.get('name') || '',
    phone: '',
    email: ''
  });
  
  // Review information
  const [ratings, setRatings] = useState({
    rent_payments: 5,
    lease_completion: 5,
    communication: 5,
    property_care: 5,
    legal_disputes: 5
  });
  
  const [reviewData, setReviewData] = useState({
    comment: '',
    property_address: '',
    rental_period: '',
    lease_agreement: null,
    proof_files: [] // Array of files for evidence/proof
  });
  
  const [proofPreviews, setProofPreviews] = useState([]); // For file previews

  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Redirect if not authenticated or not a landlord
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    if (currentUser.role !== 'landlord') {
      navigate('/dashboard');
      return;
    }
  }, [currentUser, navigate]);

  const handleTenantDataChange = (field, value) => {
    setTenantData(prev => ({ ...prev, [field]: value }));
    // Clear any existing errors for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleReviewDataChange = (field, value) => {
    setReviewData(prev => ({ ...prev, [field]: value }));
    // Clear any existing errors for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleRatingChange = (category, rating) => {
    setRatings(prev => ({ ...prev, [category]: rating }));
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({ 
          ...prev, 
          lease_agreement: 'Please upload a valid image file (JPG, PNG) or PDF document.' 
        }));
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ 
          ...prev, 
          lease_agreement: 'File size must be less than 5MB.' 
        }));
        return;
      }
      
      setReviewData(prev => ({ ...prev, lease_agreement: file }));
      setErrors(prev => ({ ...prev, lease_agreement: '' }));
      
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

  const handleProofFileUpload = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    
    // Validate file types (images, videos, PDFs)
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm',
      'application/pdf'
    ];
    
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      setErrors(prev => ({
        ...prev,
        proof_files: 'Please upload valid files (images, videos, or PDF documents only).'
      }));
      return;
    }
    
    // Validate total file size (max 50MB total)
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > 50 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        proof_files: 'Total file size must be less than 50MB.'
      }));
      return;
    }
    
    // Validate individual file size (max 10MB per file)
    const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setErrors(prev => ({
        ...prev,
        proof_files: 'Each file must be less than 10MB.'
      }));
      return;
    }
    
    // Add files to existing proof_files array
    setReviewData(prev => ({
      ...prev,
      proof_files: [...prev.proof_files, ...files]
    }));
    
    // Create previews for new files
    const newPreviews = files.map(file => ({
      file,
      type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'document',
      url: file.type.startsWith('image/') || file.type.startsWith('video/') 
        ? URL.createObjectURL(file) 
        : null,
      name: file.name,
      size: file.size
    }));
    
    setProofPreviews(prev => [...prev, ...newPreviews]);
    setErrors(prev => ({ ...prev, proof_files: '' }));
  };
  
  const removeProofFile = (index) => {
    // Remove from proof_files array
    setReviewData(prev => ({
      ...prev,
      proof_files: prev.proof_files.filter((_, i) => i !== index)
    }));
    
    // Remove from previews and revoke URL
    setProofPreviews(prev => {
      const newPreviews = prev.filter((_, i) => i !== index);
      if (prev[index]?.url) {
        URL.revokeObjectURL(prev[index].url);
      }
      return newPreviews;
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate tenant data
    if (!tenantData.name?.trim()) {
      newErrors.name = 'Tenant name is required';
    }
    
    if (!tenantData.phone?.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s\-()]+$/.test(tenantData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (!tenantData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tenantData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Validate review data
    if (!reviewData.comment?.trim()) {
      newErrors.comment = 'Review comment is required';
    } else if (reviewData.comment.trim().length < 10) {
      newErrors.comment = 'Review comment must be at least 10 characters';
    }
    
    if (!reviewData.property_address?.trim()) {
      newErrors.property_address = 'Property address is required';
    }
    
    if (!reviewData.rental_period?.trim()) {
      newErrors.rental_period = 'Rental period is required';
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
      // Step 1: Create the tenant
      const tenantResponse = await tenantAPI.createTenant(tenantData);
      const newTenant = tenantResponse.data.data; // Fix: access nested data
      
      // Step 2: Submit the review for the newly created tenant
      const reviewFormData = new FormData();
      
      // Calculate overall rating as average of detailed ratings
      const ratingValues = Object.values(ratings).filter(rating => !isNaN(rating) && rating > 0);
      const overallRating = ratingValues.length > 0 
        ? Math.round(ratingValues.reduce((sum, rating) => sum + rating, 0) / ratingValues.length)
        : 5;
      
      // Add review data
      reviewFormData.append('tenant_id', newTenant._id);
      reviewFormData.append('rating', overallRating); // Add overall rating
      reviewFormData.append('comment', reviewData.comment);
      reviewFormData.append('property_address', reviewData.property_address);
      reviewFormData.append('rental_period', reviewData.rental_period);
      
      // Add detailed ratings (flat format expected by backend)
      Object.keys(ratings).forEach(category => {
        reviewFormData.append(category, ratings[category]);
      });
      
      // Add lease agreement if provided
      if (reviewData.lease_agreement) {
        reviewFormData.append('lease_agreement', reviewData.lease_agreement);
      }
      
      // Add proof files if provided
      if (reviewData.proof_files.length > 0) {
        reviewData.proof_files.forEach((file) => {
          reviewFormData.append('proof_files', file);
        });
      }
      
      await reviewAPI.submitReview(reviewFormData);
      
      // Navigate to the tenant's profile page
      navigate(`/profile/${newTenant._id}`, {
        state: { message: 'Tenant added and review submitted successfully!' }
      });
      
    } catch (error) {
      console.error('Error adding tenant and review:', error);
      setErrors({ submit: 'Failed to add tenant and review. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentUser || currentUser.role !== 'landlord') {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Add New Tenant</h1>
        </div>
        <p className="text-gray-600">
          Add a new tenant to the system and leave your first review for them.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Tenant Information Section */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Tenant Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                value={tenantData.name}
                onChange={(e) => handleTenantDataChange('name', e.target.value)}
                className={`input-field ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Enter tenant's full name"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                value={tenantData.phone}
                onChange={(e) => handleTenantDataChange('phone', e.target.value)}
                className={`input-field ${errors.phone ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Enter phone number"
              />
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                value={tenantData.email}
                onChange={(e) => handleTenantDataChange('email', e.target.value)}
                className={`input-field ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Enter email address"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>
          </div>
        </div>

        {/* Review Section */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Leave a Review</h2>

          {/* Property & Rental Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label htmlFor="property_address" className="block text-sm font-medium text-gray-700 mb-2">
                Property Address *
              </label>
              <input
                type="text"
                id="property_address"
                value={reviewData.property_address}
                onChange={(e) => handleReviewDataChange('property_address', e.target.value)}
                className={`input-field ${errors.property_address ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="123 Main St, Apt 2B, City, State"
              />
              {errors.property_address && <p className="mt-1 text-sm text-red-600">{errors.property_address}</p>}
            </div>

            <div>
              <label htmlFor="rental_period" className="block text-sm font-medium text-gray-700 mb-2">
                Rental Period *
              </label>
              <input
                type="text"
                id="rental_period"
                value={reviewData.rental_period}
                onChange={(e) => handleReviewDataChange('rental_period', e.target.value)}
                className={`input-field ${errors.rental_period ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Jan 2023 - Dec 2023"
              />
              {errors.rental_period && <p className="mt-1 text-sm text-red-600">{errors.rental_period}</p>}
            </div>
          </div>

          {/* Ratings */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Rate this tenant</h3>
            <div className="space-y-6">
              {Object.entries(ratingCategories).map(([key, label]) => (
                <CategoryRating
                  key={key}
                  category={label}
                  rating={ratings[key]}
                  onRatingChange={(rating) => handleRatingChange(key, rating)}
                />
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="mb-8">
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
              Review Comment *
            </label>
            <textarea
              id="comment"
              rows={4}
              value={reviewData.comment}
              onChange={(e) => handleReviewDataChange('comment', e.target.value)}
              className={`input-field ${errors.comment ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="Share your experience with this tenant..."
            />
            {errors.comment && <p className="mt-1 text-sm text-red-600">{errors.comment}</p>}
            <p className="mt-1 text-sm text-gray-500">
              {reviewData.comment.length}/500 characters
            </p>
          </div>

          {/* Lease Agreement Upload */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lease Agreement (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="lease-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500">
                    <span>Upload a file</span>
                    <input
                      id="lease-upload"
                      type="file"
                      className="sr-only"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleFileUpload}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, PDF up to 5MB</p>
              </div>
              
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-4">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div className="bg-primary-600 h-2 rounded-full transition-all" style={{width: `${uploadProgress}%`}}></div>
                  </div>
                </div>
              )}
              
              {reviewData.lease_agreement && (
                <div className="mt-4 text-sm text-gray-600">
                  ✓ File uploaded: {reviewData.lease_agreement.name}
                </div>
              )}
            </div>
            {errors.lease_agreement && <p className="mt-1 text-sm text-red-600">{errors.lease_agreement}</p>}
          </div>

          {/* Proof Files Upload */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Evidence/Proof Files (Optional)
              <span className="text-gray-500 text-sm ml-2">Images, videos, court documents, etc.</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h36v-4a2 2 0 00-2-2H8a2 2 0 00-2 2v4zM6 20v16a2 2 0 002 2h32a2 2 0 002-2V20H6z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="proof-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500">
                    <span>Upload proof files</span>
                    <input
                      id="proof-upload"
                      type="file"
                      className="sr-only"
                      multiple
                      accept="image/*,video/*,.pdf"
                      onChange={handleProofFileUpload}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">Images, videos, or PDF documents. Max 10MB per file, 50MB total.</p>
              </div>
            </div>
            
            {/* Display uploaded proof files */}
            {proofPreviews.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Files ({proofPreviews.length})</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {proofPreviews.map((preview, index) => (
                    <div key={index} className="relative border border-gray-200 rounded-lg p-3">
                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => removeProofFile(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                      
                      {/* File preview */}
                      <div className="mb-2">
                        {preview.type === 'image' && (
                          <img
                            src={preview.url}
                            alt={preview.name}
                            className="w-full h-24 object-cover rounded"
                          />
                        )}
                        {preview.type === 'video' && (
                          <video
                            src={preview.url}
                            className="w-full h-24 object-cover rounded"
                            controls
                          />
                        )}
                        {preview.type === 'document' && (
                          <div className="w-full h-24 bg-gray-100 rounded flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      {/* File info */}
                      <div className="text-xs text-gray-600">
                        <p className="truncate" title={preview.name}>{preview.name}</p>
                        <p>{(preview.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {errors.proof_files && <p className="mt-1 text-sm text-red-600">{errors.proof_files}</p>}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`btn-primary ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={submitting}
            >
              {submitting ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding Tenant...
                </div>
              ) : (
                'Add Tenant & Submit Review'
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              <p className="ml-3 text-sm text-red-800">{errors.submit}</p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default AddTenant;
