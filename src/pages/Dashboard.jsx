import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { tenantAPI } from '../utils/api';
import useAuth from '../hooks/useAuth';
import UserCard from '../components/UserCard';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  
  // Credit system
  const [credits, setCredits] = useState(1);
  
  // Filtering system
  const [filters, setFilters] = useState({ area: '', minRating: '' });
  const [filteredTenants, setFilteredTenants] = useState([]);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  
  // Outreach modal
  const [showOutreachModal, setShowOutreachModal] = useState(false);
  const [outreachForm, setOutreachForm] = useState({
    propertyAddress: '',
    propertyType: 'apartment',
    monthlyRent: '',
    moveInDate: '',
    bedrooms: '1',
    amenities: '',
    contactPhone: '',
    additionalInfo: ''
  });

  useEffect(() => {
    // Load initial tenants on component mount - only if user is authenticated
    if (user?.token) {
      loadTenants();
    }
    
    // Initialize credits from localStorage
    const savedCredits = localStorage.getItem('user_credits');
    setCredits(savedCredits ? parseInt(savedCredits) : 1);
    
    // If no saved credits, set initial credit
    if (!savedCredits) {
      localStorage.setItem('user_credits', '1');
    }
  }, [user?.token]);
  
  const applyFilters = useCallback(() => {
    let filtered = [...tenants];
    let hasFilters = false;
    
    // Area filter - shows all tenants but marks as having active filter for UI purposes
    if (filters.area.trim()) {
      hasFilters = true;
      // Don't actually filter by area - show all tenants
    }
    
    // Filter by minimum rating
    if (filters.minRating) {
      const minRating = parseFloat(filters.minRating);
      filtered = filtered.filter(tenant => {
        const rating = tenant.average_rating || tenant.rating || 0;
        return rating >= minRating;
      });
      hasFilters = true;
    }
    
    setFilteredTenants(filtered);
    setHasActiveFilters(hasFilters);
  }, [tenants, filters]);
  
  // Apply filters whenever tenants or filters change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const loadTenants = async (query = '') => {
    setLoading(true);
    setError('');
    
    try {
      const response = await tenantAPI.searchTenants(query);
      setTenants(response.data.data || []);
      setHasSearched(true);
      
    } catch (err) {
      console.error('Error loading tenants:', err);
      setError(err.message || 'Failed to load tenants');
      setTenants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    await loadTenants(searchQuery);
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // If search is cleared, load all tenants
    if (value.trim() === '') {
      loadTenants();
    }
  };
  
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const clearFilters = () => {
    setFilters({ area: '', minRating: '' });
  };
  
  const handleOutreach = () => {
    if (credits < 1) {
      alert('No credits available! Leave a review to earn a credit.');
      return;
    }
    setShowOutreachModal(true);
  };
  
  const sendOutreach = () => {
    // Deduct credit
    const newCredits = 0;
    setCredits(newCredits);
    localStorage.setItem('user_credits', newCredits.toString());
    
    // Simulate sending email
    const emailContent = `
Subject: Premium ${outreachForm.propertyType.charAt(0).toUpperCase() + outreachForm.propertyType.slice(1)} Available - ${outreachForm.propertyAddress}

Dear Prospective Tenant,

I hope this message finds you well. Based on your excellent rental history and positive reviews, I would like to personally invite you to consider an exceptional housing opportunity.

🏠 PROPERTY DETAILS:
• Address: ${outreachForm.propertyAddress}
• Property Type: ${outreachForm.propertyType.charAt(0).toUpperCase() + outreachForm.propertyType.slice(1)}
• Bedrooms: ${outreachForm.bedrooms}
• Monthly Rent: $${outreachForm.monthlyRent}
• Available: ${outreachForm.moveInDate || 'Immediately'}

✨ KEY AMENITIES:
${outreachForm.amenities || '• Well-maintained property\n• Responsive landlord\n• Great location'}

📞 NEXT STEPS:
I would love to discuss this opportunity with you further. Your strong tenant reviews indicate you would be an excellent fit for this property.

${outreachForm.additionalInfo ? `\n💬 ADDITIONAL INFORMATION:\n${outreachForm.additionalInfo}\n` : ''}
Please contact me to schedule a viewing or discuss any questions:
📧 Email: ${user?.email || 'landlord@example.com'}
📱 Phone: ${outreachForm.contactPhone || '[Phone Number]'}

I look forward to hearing from you!

Best regards,
${user?.name || 'Professional Landlord'}

---
This message was sent through RentEZ based on your positive tenant reviews.
    `;
    
    console.log('Sending outreach to miodragmtasic@gmail.com:');
    console.log(`Recipients: ${filteredTenants.length} tenants`);
    console.log(emailContent);
    
    // Close modal and reset form
    setShowOutreachModal(false);
    setOutreachForm({
      propertyAddress: '',
      propertyType: 'apartment',
      monthlyRent: '',
      moveInDate: '',
      bedrooms: '1',
      amenities: '',
      contactPhone: '',
      additionalInfo: ''
    });
    
    alert(`Outreach sent to ${filteredTenants.length} tenants! Check console for email content.`);
  };
  
  const displayTenants = hasActiveFilters ? filteredTenants : tenants;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Header Section */}
      <div className="text-center mb-8">
        <div className="relative">
          <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">
            Find & Review
            <span className="text-primary-600"> Tenants</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Search our comprehensive database to review tenant rental history,
            <br />or help build the community by adding new tenant reviews.
          </p>
          
          {/* Credits Display */}
          <div className="mt-6">
            <div className="inline-flex items-center bg-primary-100 text-primary-800 px-4 py-2 rounded-full font-medium">
              <span className="text-lg font-bold mr-2">{credits}</span>
              <span>Credit{credits !== 1 ? 's' : ''} Available</span>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Search Section */}
      <div className="mb-10">
        <form onSubmit={handleSearch} className="max-w-4xl mx-auto">
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="flex items-stretch">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none z-10">
                    <svg
                      className="h-6 w-6 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <input
                    id="search"
                    name="search"
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    placeholder="Enter tenant name to search our database..."
                    className="w-full pl-16 pr-6 py-6 text-xl border-0 focus:outline-none focus:ring-0 bg-transparent placeholder-gray-400 font-medium"
                  />
                </div>
                <div className="flex-shrink-0">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`h-full px-8 bg-primary-600 hover:bg-primary-700 text-white font-bold text-lg transition-all duration-200 ${
                      loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'
                    }`}
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Searching...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span>Search Database</span>
                        <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Filter Section */}
            <div className="mt-6 bg-white rounded-lg shadow-md border border-gray-200 p-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Area
                  </label>
                  <input
                    type="text"
                    value={filters.area}
                    onChange={(e) => handleFilterChange('area', e.target.value)}
                    placeholder="e.g., Brooklyn, Manhattan, Queens"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex-1 min-w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Rating
                  </label>
                  <select
                    value={filters.minRating}
                    onChange={(e) => handleFilterChange('minRating', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Any Rating</option>
                    <option value="1">1+ Stars</option>
                    <option value="2">2+ Stars</option>
                    <option value="3">3+ Stars</option>
                    <option value="4">4+ Stars</option>
                    <option value="5">5 Stars</option>
                  </select>
                </div>
                {hasActiveFilters && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Clear Filters
                    </button>
                    <button
                      type="button"
                      onClick={handleOutreach}
                      disabled={credits < 1}
                      className={`px-6 py-2 rounded-md font-medium transition-colors ${credits >= 1 
                        ? 'bg-primary-600 hover:bg-primary-700 text-white' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Outreach to {filteredTenants.length} Tenants
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Search Enhancement Features */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Real-time search</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Comprehensive database</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Verified reviews</span>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      <div>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <svg className="animate-spin h-8 w-8 text-primary-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm text-gray-600">Loading tenants...</p>
            </div>
          </div>
        ) : displayTenants.length > 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm max-h-[44rem] overflow-y-auto">
            {/* Results Header */}
            <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    {hasActiveFilters ? 'Filtered Results' : searchQuery.trim() ? `Search Results` : 'All Tenants'}
                  </h2>
                  {searchQuery.trim() && (
                    <p className="text-sm text-gray-600">
                      Showing results for <span className="font-medium text-gray-900">"{searchQuery}"</span>
                    </p>
                  )}
                  {hasActiveFilters && (
                    <p className="text-sm text-gray-600">
                      Filtered by: {filters.area && `Area: ${filters.area}`} {filters.area && filters.minRating && ' | '} {filters.minRating && `Min Rating: ${filters.minRating}+ stars`}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="bg-white px-4 py-2 rounded-full border border-gray-300 shadow-sm">
                    <span className="text-lg font-bold text-gray-900">
                      {displayTenants.length}
                    </span>
                    <span className="text-sm text-gray-600 ml-1">
                      tenant{displayTenants.length !== 1 ? 's' : ''} {hasActiveFilters ? 'filtered' : 'found'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Cards Grid */}
            <div className="p-6">
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {displayTenants.map((tenant) => (
                  <UserCard key={tenant._id} user={tenant} />
                ))}
              </div>
            </div>
          </div>
        ) : hasSearched && searchQuery.trim() ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
            <div className="max-w-md mx-auto">
              <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Results Found</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                No tenants match <span className="font-semibold text-gray-900">"{searchQuery}"</span>.
                <br />Would you like to add them as a new tenant?
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    // Navigate to add new tenant (review flow with tenant creation)
                    navigate(`/add-tenant?name=${encodeURIComponent(searchQuery)}`);
                  }}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-sm hover:shadow-md flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add New Tenant
                </button>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    loadTenants();
                  }}
                  className="bg-white hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-medium border border-gray-300 transition-colors duration-200 shadow-sm hover:shadow-md"
                >
                  Clear Search
                </button>
              </div>
            </div>
          </div>
        ) : hasSearched ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tenants available</h3>
            <p className="text-gray-600 mb-4">
              No tenants have been added to the system yet. Start by searching for a tenant name or add your first tenant review.
            </p>
          </div>
        ) : null}
      </div>

      {/* Tips Section */}
      {!loading && tenants.length === 0 && !hasSearched && (
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                How to use Renty - Landlord Review System
              </h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• Use the search bar to find users by name</p>
                <p>• Click "View Profile" to see detailed reviews and ratings</p>
                <p>• Leave reviews for landlords or tenants you've worked with</p>
                <p>• Check your own profile to see reviews you've received</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Outreach Modal */}
      {showOutreachModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-2">📧 Professional Outreach Template</h3>
            <p className="text-sm text-gray-600 mb-6">
              Create a professional marketing email to send to {filteredTenants.length} qualified tenants (uses 1 credit)
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Address *
                </label>
                <input
                  type="text"
                  value={outreachForm.propertyAddress}
                  onChange={(e) => setOutreachForm(prev => ({ ...prev, propertyAddress: e.target.value }))}
                  placeholder="123 Main Street, Brooklyn, NY 11201"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Type *
                </label>
                <select
                  value={outreachForm.propertyType}
                  onChange={(e) => setOutreachForm(prev => ({ ...prev, propertyType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="apartment">Apartment</option>
                  <option value="condo">Condo</option>
                  <option value="house">House</option>
                  <option value="studio">Studio</option>
                  <option value="townhouse">Townhouse</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bedrooms *
                </label>
                <select
                  value={outreachForm.bedrooms}
                  onChange={(e) => setOutreachForm(prev => ({ ...prev, bedrooms: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="Studio">Studio</option>
                  <option value="1">1 Bedroom</option>
                  <option value="2">2 Bedrooms</option>
                  <option value="3">3 Bedrooms</option>
                  <option value="4+">4+ Bedrooms</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Rent *
                </label>
                <input
                  type="number"
                  value={outreachForm.monthlyRent}
                  onChange={(e) => setOutreachForm(prev => ({ ...prev, monthlyRent: e.target.value }))}
                  placeholder="2500"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Move-in Date
                </label>
                <input
                  type="text"
                  value={outreachForm.moveInDate}
                  onChange={(e) => setOutreachForm(prev => ({ ...prev, moveInDate: e.target.value }))}
                  placeholder="January 1st, 2025"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Phone Number
                </label>
                <input
                  type="tel"
                  value={outreachForm.contactPhone}
                  onChange={(e) => setOutreachForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                  placeholder="(555) 123-4567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key Amenities
                </label>
                <textarea
                  value={outreachForm.amenities}
                  onChange={(e) => setOutreachForm(prev => ({ ...prev, amenities: e.target.value }))}
                  placeholder="• In-unit laundry\n• Parking space included\n• Pet-friendly\n• Near subway"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Information (Optional)
                </label>
                <textarea
                  value={outreachForm.additionalInfo}
                  onChange={(e) => setOutreachForm(prev => ({ ...prev, additionalInfo: e.target.value }))}
                  placeholder="Special offers, application requirements, or other details..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowOutreachModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={sendOutreach}
                disabled={!outreachForm.propertyAddress.trim() || !outreachForm.monthlyRent.trim()}
                className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                📨 Send Professional Outreach - Use 1 Credit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
