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
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { AuthenticationClient } = require('auth0');

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

// File upload configuration with disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Save to uploads directory
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp_random_originalname
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '_' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 20 // Max 20 files
  },
  fileFilter: (req, file, cb) => {
    // Accept images, PDFs, and text documents
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and text documents are allowed'), false);
    }
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
    filename: file.filename, // Actual saved filename
    url: `/api/files/${file.filename}`, // URL to retrieve the file
    uploaded_date: new Date()
  }));
}

// Auth0 Configuration for SMS verification
const auth0Domain = process.env.AUTH0_DOMAIN;
const auth0ClientId = process.env.AUTH0_CLIENT_ID;
const auth0ClientSecret = process.env.AUTH0_CLIENT_SECRET;

// Mock SMS store for development (use Redis/DB in production)
const mockSmsStore = new Map();

// Function to send SMS verification code via Auth0 API
async function sendSmsVerification(phoneNumber) {
  try {
    const response = await axios.post(`https://${auth0Domain}/passwordless/start`, {
      client_id: auth0ClientId,
      client_secret: auth0ClientSecret,
      connection: 'sms',
      phone_number: phoneNumber,
      send: 'code'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('SMS send error:', error.response?.data || error.message);
    throw error;
  }
}

// Function to verify SMS code via Auth0 API
async function verifySmsCode(phoneNumber, verificationCode) {
  try {
    const response = await axios.post(`https://${auth0Domain}/oauth/token`, {
      grant_type: 'http://auth0.com/oauth/grant-type/passwordless/otp',
      client_id: auth0ClientId,
      client_secret: auth0ClientSecret,
      username: phoneNumber,
      otp: verificationCode,
      realm: 'sms',
      scope: 'openid'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('SMS verification error:', error.response?.data || error.message);
    throw error;
  }
}

// Routes

// SMS verification routes
app.post('/api/send-sms-verification', async (req, res) => {
  try {
    const { phone_number } = req.body;
    console.log('📱 SMS verification request for phone:', phone_number);
    
    // Basic phone number validation
    if (!phone_number || !phone_number.match(/^\+?[1-9]\d{1,14}$/)) {
      return res.status(400).json({ 
        error: 'Invalid phone number format' 
      });
    }
    
    // Format phone number with +1 if not present
    const formattedPhone = phone_number.startsWith('+') ? phone_number : `+1${phone_number}`;
    console.log('📱 Formatted phone:', formattedPhone);
    
    // Send real SMS via Auth0
    await sendSmsVerification(formattedPhone);
    
    res.json({ 
      success: true, 
      message: 'SMS verification code sent successfully to ' + formattedPhone
    });
    
  } catch (error) {
    console.error('❌ Error sending SMS verification:', error.response?.data || error.message);
    
    // Handle specific Auth0 errors
    if (error.response?.status === 403 && error.response?.data?.error === 'unauthorized_client') {
      return res.status(400).json({ 
        error: 'SMS service not configured. Please enable Passwordless OTP grant type in Auth0 dashboard.',
        auth0_error: 'Grant type not allowed'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to send SMS verification code', 
      details: error.response?.data || error.message 
    });
  }
});

app.post('/api/verify-sms-code', async (req, res) => {
  try {
    const { phone_number, verification_code } = req.body;
    console.log('🔍 SMS verification attempt for phone:', phone_number, 'code:', verification_code);
    
    // Basic validation
    if (!phone_number || !verification_code) {
      return res.status(400).json({ 
        error: 'Phone number and verification code are required' 
      });
    }
    
    // Format phone number with +1 if not present
    const formattedPhone = phone_number.startsWith('+') ? phone_number : `+1${phone_number}`;
    console.log('🔍 Verifying formatted phone:', formattedPhone);
    
    // Verify SMS code via Auth0
    const result = await verifySmsCode(formattedPhone, verification_code);
    console.log('✅ SMS verification successful for:', formattedPhone);
    
    res.json({ 
      success: true, 
      message: 'Phone number verified successfully',
      result: result
    });
    
  } catch (error) {
    console.error('❌ Error verifying SMS code:', error);
    
    // Handle specific Auth0 errors
    if (error.response?.status === 403) {
      return res.status(400).json({ 
        error: 'Invalid verification code. Please try again.' 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to verify SMS code', 
      details: error.response?.data || error.message 
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// File serving endpoint
app.get('/api/files/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  // Send file with proper content type
  res.sendFile(filePath);
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
  console.log('🔍 === REVIEW SUBMISSION DEBUG START ===');
  console.log('📄 Request Body:', req.body);
  console.log('📁 Files:', req.files?.length || 0);
  console.log('👤 User:', req.user);
  
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
    
    console.log('🏠 Extracted data:');
    console.log('  - Tenant ID:', tenant_id);
    console.log('  - Rating:', rating);
    console.log('  - Property:', property_address);
    console.log('  - Period:', rental_period);

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

    console.log('✅ Review submitted successfully!');
    console.log('🏁 === REVIEW SUBMISSION DEBUG END (SUCCESS) ===');
    
    res.status(201).json({
      message: 'Review submitted successfully',
      data: newReview
    });

  } catch (error) {
    console.error('🚫 REVIEW SUBMISSION ERROR:', error.message);
    console.error('📜 Error Stack:', error.stack);
    console.error('📝 Error Details:', error);
    console.log('🏁 === REVIEW SUBMISSION DEBUG END (ERROR) ===');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Lease Document Verification Endpoint
app.post('/api/verify-lease', authenticateToken, upload.single('lease_document'), async (req, res) => {
  try {
    const { tenant_name } = req.body;
    const landlord = await db.collection('landlords').findOne({ _id: new ObjectId(req.user.id) });
    
    if (!landlord) {
      return res.status(404).json({ error: 'Landlord not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Lease document is required' });
    }

    if (!tenant_name) {
      return res.status(400).json({ error: 'Tenant name is required' });
    }

    // Extract text from document
    let documentText = '';
    const filePath = req.file.path; // File path on disk
    const fileType = req.file.mimetype;

    try {
      // Read file from disk
      const fileBuffer = fs.readFileSync(filePath);
      
      if (fileType === 'application/pdf') {
        const pdfData = await pdfParse(fileBuffer);
        documentText = pdfData.text;
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileType === 'application/msword') {
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        documentText = result.value;
      } else {
        return res.status(400).json({ 
          error: 'Unsupported file format. Please upload PDF or Word documents only.',
          verification: {
            is_valid: false,
            landlord_match: false,
            tenant_match: false,
            confidence_score: 0,
            error_message: 'Invalid file format'
          }
        });
      }
    } catch (parseError) {
      console.error('Document parsing error:', parseError);
      return res.status(400).json({ 
        error: 'Failed to parse document. Please ensure the document is not corrupted.',
        verification: {
          is_valid: false,
          landlord_match: false,
          tenant_match: false,
          confidence_score: 0,
          error_message: 'Document parsing failed'
        }
      });
    }

    // Call Gemini API for verification
    const prompt = `
You are a lease document verification assistant. Please analyze this document and provide a JSON response with the following structure:
{
  "is_lease_document": boolean,
  "landlord_name_match": boolean,
  "tenant_name_match": boolean,
  "confidence_score": number (0-100),
  "extracted_landlord_name": "string or null",
  "extracted_tenant_name": "string or null",
  "document_type": "string"
}

Document to analyze:
${documentText}

Expected landlord name: "${landlord.name}"
Expected tenant name: "${tenant_name}"

Please verify:
1. Is this a legitimate lease/rental agreement document?
2. Does the landlord name in the document match "${landlord.name}"? (Allow for minor variations)
3. Does the tenant name in the document match "${tenant_name}"? (Allow for minor variations)
4. What is your confidence score (0-100) that this is a valid lease with correct names?

Return ONLY the JSON response, no additional text.`;

    const geminiResponse = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': process.env.GEMINI_API_KEY
        }
      }
    );

    let verification;
    try {
      const responseText = geminiResponse.data.candidates[0].content.parts[0].text;
      // Clean the response to extract JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        verification = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in response');
      }
    } catch (parseError) {
      console.error('Gemini response parsing error:', parseError);
      return res.status(500).json({ 
        error: 'Failed to process document verification.',
        verification: {
          is_valid: false,
          landlord_match: false,
          tenant_match: false,
          confidence_score: 0,
          error_message: 'AI processing failed'
        }
      });
    }

    // Determine if verification passed
    const isValid = verification.is_lease_document && 
                   verification.landlord_name_match && 
                   verification.tenant_name_match && 
                   verification.confidence_score > 60;

    // Clean up temporary file (we don't store lease documents)
    try {
      fs.unlinkSync(filePath);
    } catch (cleanupError) {
      console.warn('Could not delete temporary lease file:', cleanupError.message);
    }
    
    res.status(200).json({
      message: isValid ? 'Lease document verified successfully' : 'Lease document verification failed',
      verification: {
        is_valid: isValid,
        landlord_match: verification.landlord_name_match,
        tenant_match: verification.tenant_name_match,
        confidence_score: verification.confidence_score,
        extracted_landlord: verification.extracted_landlord_name,
        extracted_tenant: verification.extracted_tenant_name,
        document_type: verification.document_type
      }
    });

  } catch (error) {
    console.error('Lease verification error:', error);
    if (error.response) {
      console.error('Gemini API error:', error.response.data);
    }
    
    // Clean up file even if there's an error
    try {
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
    } catch (cleanupError) {
      console.warn('Could not delete temporary lease file after error:', cleanupError.message);
    }
    
    res.status(500).json({ 
      error: 'Internal server error during lease verification',
      verification: {
        is_valid: false,
        landlord_match: false,
        tenant_match: false,
        confidence_score: 0,
        error_message: 'Server error'
      }
    });
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
    console.log(`   POST /api/verify-lease`);
    console.log(`   GET  /api/files/:filename`);
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


