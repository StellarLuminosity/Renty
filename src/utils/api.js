import axios from 'axios';

// Base URL for API calls - Landlord-to-Tenant Review System
const API_BASE_URL = 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token if available
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('rently_user') || '{}');
    if (user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear local storage and redirect to login
      localStorage.removeItem('rently_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints - connected to Node.js backend

export const authAPI = {
  // POST /api/login - User login
  login: async (credentials) => {
    try {
      const response = await api.post('/login', credentials);
      return { data: response.data };
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  },

  // POST /api/signup - Landlord signup (tenants cannot create accounts)
  signup: async (landlordData) => {
    try {
      const response = await api.post('/signup', landlordData);
      return { data: response.data };
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Signup failed');
    }
  },

  // GET /api/profile - Get current user profile  
  getProfile: async () => {
    try {
      const response = await api.get('/profile');
      return { data: response.data };
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get profile');
    }
  }
};

// Real API calls - no more mock data storage

export const tenantAPI = {
  // GET /api/tenants/search?name=:name - Search tenants (for landlords to review)
  searchTenants: async (name) => {
    try {
      const response = await api.get(`/tenants/search?name=${encodeURIComponent(name || '')}`);
      // Backend returns { data: [tenants] }, so we return { data: response.data } to be consistent
      return { data: response.data };
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to search tenants');
    }
  },

  // GET /api/tenants/:id - Get tenant profile by ID
  getTenantProfile: async (tenantId) => {
    try {
      const response = await api.get(`/tenants/${tenantId}`);
      return { data: response.data };
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get tenant profile');
    }
  },

  // POST /api/tenants - Create new tenant (when landlord reviews non-existent tenant)
  createTenant: async (tenantData) => {
    try {
      const response = await api.post('/tenants', tenantData);
      return { data: response.data };
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to create tenant');
    }
  }
};

// Keep userAPI for backward compatibility, but redirect to tenantAPI
export const userAPI = {
  searchUsers: async (name) => tenantAPI.searchTenants(name),
  getUserProfile: async (id) => tenantAPI.getTenantProfile(id)
};

export const reviewAPI = {
  // POST /api/reviews - Submit a review about a tenant (landlord only)
  submitReview: async (reviewData) => {
    try {
      // Handle both FormData (from AddTenant) and JSON (from LeaveReview)
      const isFormData = reviewData instanceof FormData;
      const headers = isFormData ? { 'Content-Type': 'multipart/form-data' } : { 'Content-Type': 'application/json' };
      
      const response = await api.post('/reviews', reviewData, { headers });
      return { data: response.data };
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to submit review');
    }
  }
};

export default api;
