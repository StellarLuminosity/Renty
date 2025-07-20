/**
 * Node.js Express Backend for Renty
 * MongoDB integration with API endpoints matching frontend expectations
 */

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// MongoDB Configuration
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://miodragmtasic:D8eX6doz7Nxep9lA@cluster0.hzod4on.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const DATABASE_NAME = process.env.DATABASE_NAME || "renty";
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secure-jwt-secret-key";

let db = null;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload configuration (for now storing as base64, will need cloud storage later)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 20 // Max 20 files
  }
});

// MongoDB connection
async function connectToMongo() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DATABASE_NAME);
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    return false;
  }
}

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Helper function to calculate average rating
function calculateAverageRating(ratings) {
  if (!ratings || Object.keys(ratings).length === 0) return 5;
  
  const values = Object.values(ratings).filter(rating => !isNaN(rating) && rating > 0);
  if (values.length === 0) return 5;
  
  const sum = values.reduce((acc, rating) => acc + rating, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

// Helper function to process uploaded files
function processUploadedFiles(files) {
  if (!files || files.length === 0) return [];
  
  return files.map(file => ({
    name: file.originalname,
    type: file.mimetype,
    size: file.size,
    url: `mock_upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${file.originalname.split('.').pop()}`,
    uploaded_date: new Date()
  }));
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Auth endpoints
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find landlord by email
    const landlord = await db.collection('landlords').findOne({ email });
    
    if (!landlord) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, landlord.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: landlord._id,
        email: landlord.email,
        role: landlord.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data (excluding password)
    const { password_hash, ...userWithoutPassword } = landlord;
    
    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, phone_number, password } = req.body;
    
    if (!name || !email || !phone_number || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if landlord already exists
    const existingLandlord = await db.collection('landlords').findOne({ email });
    
    if (existingLandlord) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create new landlord
    const newLandlord = {
      name,
      email,
      phone_number,
      password_hash,
      role: 'landlord',
      profile_picture: null,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await db.collection('landlords').insertOne(newLandlord);

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: result.insertedId,
        email: email,
        role: 'landlord' 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data (excluding password)
    const { password_hash: _, ...userWithoutPassword } = newLandlord;
    userWithoutPassword._id = result.insertedId;
    
    res.status(201).json({
      message: 'Signup successful',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Tenant endpoints
app.get('/api/tenants/search', authenticateToken, async (req, res) => {
  try {
    const { name } = req.query;
    
    let query = {};
    
    // If name is provided, search by name (case insensitive)
    // If no name provided, return all tenants
    if (name && name.trim()) {
      query = { name: { $regex: name.trim(), $options: 'i' } };
    }

    const tenants = await db.collection('tenants').find(query).toArray();

    res.json({ data: tenants });

  } catch (error) {
    console.error('Tenant search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/tenants/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid tenant ID' });
    }

    // Get tenant details
    const tenant = await db.collection('tenants').findOne({ _id: new ObjectId(id) });
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Get all reviews for this tenant with landlord details
    const reviews = await db.collection('reviews').find({ 
      tenant_id: new ObjectId(id) 
    }).sort({ date_created: -1 }).toArray();

    // Add reviews to tenant object
    tenant.reviews_received = reviews;

    // --- Hackathon Feature: Abstracted credit score & randomized per tenant ---
    // Use a deterministic pseudo-random approach so the result is consistent per tenant
    function hashString(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
      }
      return Math.abs(hash);
    }
    const uniqueKey = tenant.email || tenant.name || tenant._id?.toString() || Math.random().toString();
    const hash = hashString(uniqueKey);
    const creditScoreOptions = ['Good', 'Mediocre', 'Bad'];
    const creditScoreLabel = creditScoreOptions[hash % creditScoreOptions.length];
    const bankruptcyReport = (hash % 2) === 0;
    tenant.creditScoreLabel = creditScoreLabel;
    tenant.bankruptcyReport = bankruptcyReport;

    /*
    // Example: How you would fetch this from an external API in production
    // (Requires partnership/recognition with a credit bureau or financial org)
    // const externalApiResponse = await fetchCreditScoreAndBankruptcy(tenant);
    // tenant.creditScoreLabel = externalApiResponse.ratingLabel; // e.g. 'Good', 'Mediocre', 'Bad'
    // tenant.bankruptcyReport = externalApiResponse.bankruptcyReport;
    */

    /*
    // Example: How you would fetch this from an external API in production
    // (Requires partnership/recognition with a credit bureau or financial org)
    // const externalApiResponse = await fetchCreditScoreAndBankruptcy(tenant);
    // tenant.creditScoreLabel = externalApiResponse.ratingLabel; // e.g. 'Good', 'Mediocre', 'Bad'
    // tenant.bankruptcyReport = externalApiResponse.bankruptcyReport;
    */

    res.json({ data: tenant });

  } catch (error) {
    console.error('Get tenant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/tenants', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone_number } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Tenant name is required' });
    }

    // Create new tenant
    const newTenant = {
      name,
      email: email || null,
      phone_number: phone_number || null,
      role: 'tenant',
      profile_picture: null,
      average_rating: 0,
      total_reviews: 0,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await db.collection('tenants').insertOne(newTenant);
    newTenant._id = result.insertedId;

    res.status(201).json({
      message: 'Tenant created successfully',
      data: newTenant
    });

  } catch (error) {
    console.error('Create tenant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Review endpoints
app.post('/api/reviews', authenticateToken, upload.array('proof_files'), async (req, res) => {
  try {
    const {
      tenant_id,
      rating,
      comment,
      property_address,
      rental_period,
      // Detailed ratings
      rent_payments,
      lease_completion,
      communication,
      property_care,
      legal_disputes
    } = req.body;

    if (!tenant_id || !rating) {
      return res.status(400).json({ error: 'Tenant ID and rating are required' });
    }

    if (!ObjectId.isValid(tenant_id)) {
      return res.status(400).json({ error: 'Invalid tenant ID' });
    }

    // Get reviewer (landlord) details
    const reviewer = await db.collection('landlords').findOne({ _id: new ObjectId(req.user.id) });
    
    if (!reviewer) {
      return res.status(404).json({ error: 'Reviewer not found' });
    }

    // Process uploaded files
    const proof_files = processUploadedFiles(req.files);

    // Build detailed ratings object
    const ratings = {};
    if (rent_payments) ratings.rent_payments = parseInt(rent_payments);
    if (lease_completion) ratings.lease_completion = parseInt(lease_completion);
    if (communication) ratings.communication = parseInt(communication);
    if (property_care) ratings.property_care = parseInt(property_care);
    if (legal_disputes) ratings.legal_disputes = parseInt(legal_disputes);

    // Create new review
    const newReview = {
      tenant_id: new ObjectId(tenant_id),
      reviewer_id: new ObjectId(req.user.id),
      rating: parseInt(rating),
      comment: comment || null,
      property_address: property_address || null,
      rental_period: rental_period || null,
      reviewer_name: reviewer.name,
      reviewer_role: 'landlord',
      date_created: new Date(),
      ratings,
      proof_files,
      lease_agreement: null, // Handle separately if needed
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await db.collection('reviews').insertOne(newReview);

    // Update tenant's average rating and review count
    const tenantReviews = await db.collection('reviews').find({ 
      tenant_id: new ObjectId(tenant_id) 
    }).toArray();

    const totalRating = tenantReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = Math.round((totalRating / tenantReviews.length) * 10) / 10;

    await db.collection('tenants').updateOne(
      { _id: new ObjectId(tenant_id) },
      { 
        $set: { 
          average_rating: averageRating,
          total_reviews: tenantReviews.length,
          updated_at: new Date()
        }
      }
    );

    newReview._id = result.insertedId;

    res.status(201).json({
      message: 'Review submitted successfully',
      data: newReview
    });

  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Start server
async function startServer() {
  const mongoConnected = await connectToMongo();
  
  if (!mongoConnected) {
    console.error('❌ Cannot start server without database connection');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Renty backend server running on http://localhost:${PORT}`);
    console.log(`📋 API endpoints:`);
    console.log(`   POST /api/login`);
    console.log(`   POST /api/signup`);
    console.log(`   GET  /api/tenants/search?name=<name>`);
    console.log(`   GET  /api/tenants/:id`);
    console.log(`   POST /api/tenants`);
    console.log(`   POST /api/reviews`);
    console.log(`   GET  /api/health`);
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});

startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});


