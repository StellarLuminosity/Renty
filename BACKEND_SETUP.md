# Renty Backend Setup Guide

This guide will help you set up the MongoDB-powered Node.js backend for the Renty tenant review platform.

## 🎯 Overview

The backend provides these key features:
- **MongoDB Atlas Integration** - Document-based storage optimized for tenant reviews
- **JWT Authentication** - Secure email-based login for landlords
- **File Upload Support** - Handle proof files and lease agreements
- **RESTful API** - Endpoints matching the existing frontend expectations
- **Data Migration** - Import existing mock data into MongoDB

## 📋 Prerequisites

- Node.js 16+ installed
- MongoDB Atlas account (already configured with provided connection string)
- Git

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Copy the backend package.json to the correct location
cp backend_package.json package-backend.json

# Install backend dependencies
npm install --prefix . express cors bcrypt jsonwebtoken multer mongodb dotenv nodemon
```

### 2. Environment Setup

```bash
# Create environment file from template
cp .env.template .env

# The .env file already contains your MongoDB connection string
# You may want to change the JWT_SECRET for production
```

### 3. Database Migration

```bash
# Test MongoDB connection
node mongodb_migration.js test

# Run the full migration (creates collections and imports sample data)
node mongodb_migration.js migrate
```

### 4. Start the Backend Server

```bash
# Development mode with auto-reload
npm run dev --prefix .

# Or production mode
npm start --prefix .
```

The server will start on `http://localhost:8000`

## 🔌 API Endpoints

The backend provides these endpoints that match your frontend expectations:

### Authentication
- `POST /api/login` - Landlord login with email/password
- `POST /api/signup` - Register new landlord account

### Tenant Management
- `GET /api/tenants/search?name=<query>` - Search tenants by name
- `GET /api/tenants/:id` - Get tenant profile with reviews
- `POST /api/tenants` - Create new tenant

### Reviews
- `POST /api/reviews` - Submit review with ratings and proof files

### Utility
- `GET /api/health` - Server health check

## 📊 Database Schema

Your MongoDB database will have these collections:

### `landlords`
```javascript
{
  _id: ObjectId,
  name: "John Doe",
  email: "john.doe@email.com",
  phone_number: "+1-555-0123",
  password_hash: "bcrypt_hashed_password",
  role: "landlord",
  profile_picture: null,
  created_at: Date,
  updated_at: Date
}
```

### `tenants`
```javascript
{
  _id: ObjectId,
  name: "Alice Wilson",
  email: "alice@email.com",
  phone_number: "+1-555-0101",
  role: "tenant", 
  profile_picture: null,
  average_rating: 4.5,
  total_reviews: 2,
  created_at: Date,
  updated_at: Date
}
```

### `reviews`
```javascript
{
  _id: ObjectId,
  tenant_id: ObjectId,
  reviewer_id: ObjectId,
  rating: 5,
  comment: "Excellent tenant!",
  property_address: "123 Main St",
  rental_period: "Jan 2023 - Dec 2023",
  reviewer_name: "John Doe",
  reviewer_role: "landlord",
  date_created: Date,
  ratings: {
    rent_payments: 5,
    lease_completion: 5,
    communication: 5,
    property_care: 5,
    legal_disputes: 5
  },
  proof_files: [
    {
      name: "property_before.jpg",
      type: "image/jpeg", 
      size: 2048000,
      url: "mock_upload_url",
      uploaded_date: Date
    }
  ],
  lease_agreement: null,
  created_at: Date,
  updated_at: Date
}
```

## 🔧 Frontend Integration

### Update API Base URL

In your `src/utils/api.js`, update the base URL:

```javascript
const API_BASE_URL = 'http://localhost:8000/api';
```

### Replace Mock Functions

Replace these mock API functions with real HTTP calls:

```javascript
// Before (mock)
const mockLogin = (credentials) => { /* mock response */ };

// After (real API)
const login = async (credentials) => {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  return response.json();
};
```

## 📁 File Structure

After setup, your backend files will be organized as:

```
renty/
├── backend_server.js          # Main Express server
├── mongodb_schema.js          # Database schema definitions
├── mongodb_migration.js       # Migration script
├── .env                      # Environment variables
├── backend_package.json      # Backend dependencies
└── BACKEND_SETUP.md          # This guide
```

## 🧪 Testing the Backend

### 1. Test Database Connection
```bash
node mongodb_migration.js test
```

### 2. Test API Endpoints
```bash
# Health check
curl http://localhost:8000/api/health

# Register a test landlord
curl -X POST http://localhost:8000/api/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","phone_number":"+1-555-0199","password":"password123"}'

# Login with test landlord
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 3. Search Tenants
```bash
# Get JWT token from login response, then:
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:8000/api/tenants/search?name=Alice"
```

## 🔒 Security Features

- **Password Hashing**: Uses bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **CORS Protection**: Configured for frontend origin
- **Input Validation**: MongoDB schema validation
- **File Upload Limits**: 10MB per file, 20 files max

## 📈 Next Steps

1. **Start Backend**: Run the migration and start the server
2. **Update Frontend**: Replace mock API calls with real endpoints
3. **Test Integration**: Verify all user flows work with real data
4. **File Storage**: Consider upgrading to cloud storage (AWS S3, Cloudinary)
5. **Deployment**: Deploy to production when ready

## ❓ Troubleshooting

### Connection Issues
- Verify MongoDB URI in `.env`
- Check network connectivity
- Ensure MongoDB Atlas whitelist includes your IP

### Migration Errors
- Run `node mongodb_migration.js cleanup` to reset
- Check MongoDB permissions
- Verify database name in connection string

### API Errors
- Check server logs for details
- Verify JWT token format
- Ensure proper Content-Type headers

## 🎉 Success!

Once everything is set up, your Renty application will be running with:
- ✅ Real MongoDB data storage
- ✅ Secure JWT authentication
- ✅ File upload capabilities
- ✅ Production-ready API endpoints

The frontend will seamlessly work with the real backend, preserving all existing functionality while gaining persistent data storage.
