import axios from 'axios';

// Base URL for API calls - will be connected to Django REST backend later
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

// API endpoints - placeholder implementations that will be connected to Django backend

export const authAPI = {
  // POST /api/login - User login
  login: async (credentials) => {
    try {
      // TODO: Replace with actual API call to Django backend
      // const response = await api.post('/api/login', credentials);
      
      // Mock response for development
      console.log('Mock login with credentials:', credentials);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful login response
      const response = {
        data: {
          user: {
            id: Date.now(), // Mock user ID
            phone_number: credentials.phone_number,
            name: 'John Doe', // Default name for existing users
            role: 'tenant', // Default role - will be fetched from backend
            profile_picture: null,
            token: 'mock_jwt_token_' + Date.now()
          },
          message: 'Login successful'
        }
      };
      
      return response;
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  },

  // POST /api/signup - User signup
  signup: async (userData) => {
    try {
      // TODO: Replace with actual API call to Django backend
      // const response = await api.post('/api/signup', userData);
      
      // Mock response for development
      console.log('Mock signup with user data:', userData);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock successful signup response
      const response = {
        data: {
          user: {
            id: Date.now(), // Mock user ID
            phone_number: userData.phone_number,
            name: userData.name,
            role: userData.role,
            profile_picture: userData.profile_picture || null,
            token: 'mock_jwt_token_' + Date.now()
          },
          message: 'Account created successfully'
        }
      };
      
      return response;
    } catch (error) {
      console.error('Signup API error:', error);
      throw error;
    }
  },

  // GET /api/profile - Get current user profile
  getProfile: async () => {
    try {
      // Placeholder response
      const user = JSON.parse(localStorage.getItem('rently_user') || '{}');
      const response = {
        data: {
          ...user,
          name: `User ${user.id}`,
          average_rating: (Math.random() * 5).toFixed(1),
          reviews_received: [],
          reviews_submitted: []
        }
      };
      
      return response;
      // Actual implementation:
      // return api.get('/profile');
    } catch (error) {
      console.error('Get profile API error:', error);
      throw error;
    }
  }
};

export const userAPI = {
  // GET /api/search?name= - Search users by name
  searchUsers: async (name) => {
    try {
      // Placeholder response with mock data
      const mockUsers = [
        { id: 1, name: 'John Smith', role: 'landlord', average_rating: 4.5, profile_picture: null },
        { id: 2, name: 'Jane Doe', role: 'tenant', average_rating: 4.2, profile_picture: null },
        { id: 3, name: 'Mike Johnson', role: 'landlord', average_rating: 3.8, profile_picture: null },
        { id: 4, name: 'Sarah Wilson', role: 'tenant', average_rating: 4.9, profile_picture: null }
      ];
      
      const filteredUsers = name 
        ? mockUsers.filter(user => user.name.toLowerCase().includes(name.toLowerCase()))
        : mockUsers;
      
      const response = { data: { results: filteredUsers } };
      return response;
      
      // Actual implementation:
      // return api.get(`/search?name=${encodeURIComponent(name)}`);
    } catch (error) {
      console.error('Search users API error:', error);
      throw error;
    }
  },

  // GET /api/profile/:id - Get user profile by ID
  getUserProfile: async (userId) => {
    try {
      // Placeholder response with mock data
      const mockProfiles = {
        1: {
          id: 1,
          name: 'John Smith',
          role: 'landlord',
          average_rating: 4.5,
          profile_picture: null,
          reviews: [
            {
              id: 1,
              reviewer_name: 'Alice Brown',
              reviewer_role: 'tenant',
              ratings: {
                responsiveness: 5,
                respect_rights: 4,
                friendliness: 5,
                property_condition: 4,
                property_advertised: 4,
                conflict_resolution: 5
              },
              comment: 'Great landlord, very responsive and professional.',
              created_at: '2024-01-15'
            }
          ]
        },
        2: {
          id: 2,
          name: 'Jane Doe',
          role: 'tenant',
          average_rating: 4.2,
          profile_picture: null,
          reviews: [
            {
              id: 2,
              reviewer_name: 'Bob Wilson',
              reviewer_role: 'landlord',
              ratings: {
                payment_timeliness: 5,
                lease_completion: 4,
                communication: 4,
                property_condition: 4,
                no_legal_disputes: 5
              },
              comment: 'Reliable tenant, always paid rent on time.',
              created_at: '2024-01-10'
            }
          ]
        }
      };
      
      const profile = mockProfiles[userId] || {
        id: userId,
        name: `User ${userId}`,
        role: Math.random() > 0.5 ? 'landlord' : 'tenant',
        average_rating: (Math.random() * 5).toFixed(1),
        profile_picture: null,
        reviews: []
      };
      
      const response = { data: profile };
      return response;
      
      // Actual implementation:
      // return api.get(`/profile/${userId}`);
    } catch (error) {
      console.error('Get user profile API error:', error);
      throw error;
    }
  }
};

export const reviewAPI = {
  // POST /api/review - Submit a review
  submitReview: async (reviewData) => {
    try {
      // Placeholder implementation
      console.log('Submitting review:', reviewData);
      
      const response = {
        data: {
          id: Math.floor(Math.random() * 1000),
          ...reviewData,
          created_at: new Date().toISOString()
        }
      };
      
      return response;
      
      // Actual implementation:
      // const formData = new FormData();
      // Object.keys(reviewData).forEach(key => {
      //   if (key === 'lease_agreement' && reviewData[key]) {
      //     formData.append(key, reviewData[key]);
      //   } else {
      //     formData.append(key, JSON.stringify(reviewData[key]));
      //   }
      // });
      // return api.post('/review', formData, {
      //   headers: { 'Content-Type': 'multipart/form-data' }
      // });
    } catch (error) {
      console.error('Submit review API error:', error);
      throw error;
    }
  }
};

export default api;
