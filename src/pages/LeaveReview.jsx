import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tenantAPI, reviewAPI } from '../utils/api';
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
  const [proofFiles, setProofFiles] = useState([]); // Array of files for evidence/proof
  const [proofPreviews, setProofPreviews] = useState([]); // For file previews
  const [uploadProgress, setUploadProgress] = useState(0);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  // Lease verification state
  const [leaseVerification, setLeaseVerification] = useState(null);
  const [verifyingLease, setVerifyingLease] = useState(false);
  const [leaseVerificationError, setLeaseVerificationError] = useState('');
  
  // Drag and drop state
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProofDragOver, setIsProofDragOver] = useState(false);

  const loadTargetUser = useCallback(async () => {
    try {
      const response = await tenantAPI.getTenantProfile(id);
      const user = response.data.data || response.data;
      console.log('Target user loaded:', user);
      
      // Validate that user can leave review for this target
      if (currentUser._id === user._id) {
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
  
  // Cleanup URLs when component unmounts
  useEffect(() => {
    return () => {
      proofPreviews.forEach(preview => {
        if (preview.url) {
          URL.revokeObjectURL(preview.url);
        }
      });
    };
  }, [proofPreviews]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type - only PDF and Word docs for lease verification
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({ 
          ...prev, 
          leaseAgreement: 'Please upload a PDF or Word document only for lease verification.' 
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
      setLeaseVerificationError('');
      setLeaseVerification(null);
      
      // Auto-verify the lease document if target user is available
      const userName = targetUser?.name || targetUser?.full_name || targetUser?.first_name;
      if (targetUser && userName && userName.trim()) {
        console.log('🔍 Auto-verifying lease for user:', userName);
        await verifyLeaseDocument(file, userName);
      } else {
        console.log('⚠️ Target user not loaded yet or name missing, verification will happen on submit');
        console.log('Target user data:', targetUser);
      }
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      // Create a synthetic event to reuse handleFileChange logic
      const syntheticEvent = {
        target: {
          files: [file]
        }
      };
      handleFileChange(syntheticEvent);
    }
  };

  // Proof files drag and drop handlers
  const handleProofDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsProofDragOver(true);
  };

  const handleProofDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsProofDragOver(false);
  };

  const handleProofDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsProofDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      // Create a synthetic event to reuse handleProofFileUpload logic
      const syntheticEvent = {
        target: {
          files: files
        }
      };
      handleProofFileUpload(syntheticEvent);
    }
  };

  // Lease verification function
  const verifyLeaseDocument = async (file, tenantName) => {
    console.log('🔍 === LEASE VERIFICATION DEBUG START ===');
    console.log('📁 File:', file?.name, file?.type, file?.size);
    console.log('👤 Tenant Name:', tenantName);
    
    if (!file || !tenantName) {
      console.log('❌ Missing file or tenant name, aborting verification');
      return;
    }
    
    setVerifyingLease(true);
    setLeaseVerificationError('');
    
    const formData = new FormData();
    formData.append('lease_document', file);
    formData.append('tenant_name', tenantName);
    
    try {
      const user = JSON.parse(localStorage.getItem('rently_user') || '{}');
      const token = user.token;
      console.log('🔑 Auth User:', user?.name || 'NO USER');
      console.log('🔑 Auth Token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
      
      console.log('📤 Making API request to:', 'http://localhost:8000/api/verify-lease');
      const response = await fetch('http://localhost:8000/api/verify-lease', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      console.log('📥 Response Status:', response.status, response.statusText);
      console.log('📥 Response Headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('📥 Response Data:', data);
      
      if (response.ok) {
        console.log('✅ API SUCCESS!');
        console.log('🧐 Verification Details:', data.verification);
        setLeaseVerification(data.verification);
        if (!data.verification.is_valid) {
          console.log('❌ Verification FAILED - Reason Analysis:');
          console.log('  - Landlord Match:', data.verification.landlord_match);
          console.log('  - Tenant Match:', data.verification.tenant_match);
          console.log('  - Confidence Score:', data.verification.confidence_score);
          console.log('  - Reasons:', data.verification.reasons);
          
          // Set specific error messages based on what failed
          if (!data.verification.landlord_match) {
            setLeaseVerificationError('Landlord name does not match your account name');
          } else if (!data.verification.tenant_match) {
            setLeaseVerificationError(`Tenant name does not match ${tenantName}`);
          } else if (data.verification.confidence_score <= 60) {
            setLeaseVerificationError('Document does not appear to be a valid lease agreement or image quality is too poor');
          } else {
            setLeaseVerificationError('Lease document verification failed');
          }
        } else {
          console.log('✅ Verification SUCCESS! All checks passed.');
        }
      } else {
        console.log('❌ API ERROR:', response.status, response.statusText);
        console.log('❌ Error Details:', data);
        setLeaseVerificationError(data.error || 'Failed to verify lease document');
      }
    } catch (error) {
      console.error('🚫 NETWORK/PARSE ERROR:', error);
      console.error('Error Details:', error.message, error.stack);
      setLeaseVerificationError('Failed to connect to verification service');
    } finally {
      setVerifyingLease(false);
      console.log('🏁 === LEASE VERIFICATION DEBUG END ===');
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
    setProofFiles(prev => [...prev, ...files]);
    
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
    setProofFiles(prev => prev.filter((_, i) => i !== index));
    
    // Remove from previews and revoke URL
    setProofPreviews(prev => {
      const newPreviews = prev.filter((_, i) => i !== index);
      if (prev[index]?.url) {
        URL.revokeObjectURL(prev[index].url);
      }
      return newPreviews;
    });
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
    
    // Validate lease document verification
    if (!leaseAgreement) {
      newErrors.leaseAgreement = 'Lease document is required for verification';
    } else if (!leaseVerification || !leaseVerification.is_valid) {
      newErrors.leaseAgreement = leaseVerificationError || 'Lease document must be verified before submission';
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
      // Calculate overall rating from detailed ratings
      const ratingValues = Object.values(ratings).filter(r => !isNaN(r) && r > 0);
      const overallRating = ratingValues.length > 0 ? 
        Math.round(ratingValues.reduce((sum, r) => sum + r, 0) / ratingValues.length) : 5;
      
      // Send as FormData to match backend expectations
      const reviewFormData = new FormData();
      
      // Add review data
      reviewFormData.append('tenant_id', id);
      reviewFormData.append('rating', overallRating); // Overall rating (required by backend)
      reviewFormData.append('comment', comment.trim() || '');
      reviewFormData.append('property_address', ''); // Required by backend
      reviewFormData.append('rental_period', '');   // Required by backend
      
      // Add detailed ratings (flat format expected by backend)
      Object.keys(ratings).forEach(category => {
        reviewFormData.append(category, ratings[category]);
      });
      
      // Add proof files if any
      if (proofFiles.length > 0) {
        proofFiles.forEach((file) => {
          reviewFormData.append('proof_files', file);
        });
      }
      

      
      const response = await reviewAPI.submitReview(reviewFormData);
      
      // Increment credits after successful review submission
      const currentCredits = parseInt(localStorage.getItem('user_credits') || '0');
      const newCredits = currentCredits + 1;
      localStorage.setItem('user_credits', newCredits.toString());
      
      // Navigate to confirmation page with review data
      navigate('/review-confirmation', {
        state: {
          review: response.data,
          targetUser: targetUser,
          creditEarned: true
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
            <span className="font-semibold">
              {targetUser.name || targetUser.full_name || targetUser.first_name || `User ${targetUser._id || targetUser.id || 'Unknown'}`}
            </span>
            {' '}({targetUser.role || 'User'})
          </p>
        </div>
      </div>

      {/* Review Form */}
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Lease Agreement Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Lease Agreement <span className="text-red-500">*</span>
              <span className="text-sm text-gray-500 ml-2">(Required for review verification)</span>
            </label>
            
            {leaseAgreement ? (
              <div className="border border-gray-300 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-2">
                  ✓ File uploaded: {leaseAgreement.name}
                </div>
                
                {/* Verification Status */}
                {verifyingLease && (
                  <div className="flex items-center space-x-2 text-sm text-blue-600">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Verifying lease document...</span>
                  </div>
                )}
                
                {!verifyingLease && leaseVerification && (
                  <div className={`p-3 rounded-md text-sm ${
                    leaseVerification.is_valid 
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {leaseVerification.is_valid ? (
                      <div className="flex items-center space-x-2">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>✅ Lease document verified successfully!</span>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span>❌ Verification Failed</span>
                        </div>
                        <div className="text-xs space-y-1">
                          {!leaseVerification.landlord_match && (
                            <div>• Landlord name does not match your account</div>
                          )}
                          {!leaseVerification.tenant_match && (
                            <div>• Tenant name does not match {targetUser.name}</div>
                          )}
                          {leaseVerification.confidence_score <= 60 && (
                            <div>• Document does not appear to be a valid lease agreement</div>
                          )}
                          <div className="mt-2 font-medium">Confidence Score: {leaseVerification.confidence_score}%</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={clearFile}
                  className="mt-2 text-sm text-red-600 hover:text-red-500"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div 
                className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${
                  isDragOver 
                    ? 'border-primary-400 bg-primary-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
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
                        accept=".pdf,.docx,.doc"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF or Word documents up to 10MB</p>
                </div>
              </div>
            )}
            
            {/* Show specific verification error message */}
            {leaseVerificationError && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
                {leaseVerificationError}
              </div>
            )}
            {errors.leaseAgreement && (
              <p className="mt-1 text-sm text-red-600">{errors.leaseAgreement}</p>
            )}
          </div>

          {/* Evidence/Proof Files */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Evidence/Proof Files (Optional)
              <span className="text-gray-500 text-xs ml-1">
                Images, videos, court documents, etc.
              </span>
            </label>
            
            {/* Upload Area */}
            <div 
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${
                isProofDragOver 
                  ? 'border-primary-400 bg-primary-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleProofDragOver}
              onDragLeave={handleProofDragLeave}
              onDrop={handleProofDrop}
            >
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
                    htmlFor="proof-files"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                  >
                    <span>Upload proof files</span>
                    <input
                      id="proof-files"
                      name="proof-files"
                      type="file"
                      multiple
                      accept="image/*,video/*,.pdf"
                      onChange={handleProofFileUpload}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  Images, videos, or PDF documents. Max 10MB per file, 50MB total.
                </p>
              </div>
            </div>
            
            {/* File Previews Grid */}
            {proofPreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {proofPreviews.map((preview, index) => (
                  <div key={index} className="relative border rounded-lg p-3 bg-gray-50">
                    <div className="aspect-square flex items-center justify-center mb-2 bg-white rounded border">
                      {preview.type === 'image' ? (
                        <img
                          src={preview.url}
                          alt={preview.name}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : preview.type === 'video' ? (
                        <video
                          src={preview.url}
                          className="w-full h-full object-cover rounded"
                          controls={false}
                          muted
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-red-600">
                          <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-xs">PDF</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-center">
                      <p className="text-xs font-medium text-gray-900 truncate" title={preview.name}>
                        {preview.name.length > 15 ? `${preview.name.substring(0, 12)}...` : preview.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(preview.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => removeProofFile(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                      title="Remove file"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {errors.proof_files && (
              <p className="mt-2 text-sm text-red-600">{errors.proof_files}</p>
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
              disabled={submitting || verifyingLease || (leaseVerification && !leaseVerification.is_valid)}
              className={`btn-primary ${(submitting || verifyingLease || (leaseVerification && !leaseVerification.is_valid)) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {submitting ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying Lease & Submitting Review...
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
