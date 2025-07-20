#!/usr/bin/env node

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rental_reviews';
const DATABASE_NAME = process.env.DATABASE_NAME || 'renty';

async function deleteZeroReviewTenants() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    const db = client.db(DATABASE_NAME);
    
    console.log('📋 Finding tenants with 0 total_reviews...');
    
    // Find tenants with total_reviews = 0 or null/undefined
    const tenantsToDelete = await db.collection('tenants').find({
      $or: [
        { total_reviews: { $lte: 0 } },
        { total_reviews: { $exists: false } },
        { total_reviews: null }
      ]
    }).toArray();
    
    console.log(`\n📊 Found ${tenantsToDelete.length} tenants with 0 total_reviews:`);
    
    if (tenantsToDelete.length === 0) {
      console.log('✅ No tenants with 0 total_reviews found. Database is clean!');
      return;
    }
    
    // Display tenants to be deleted
    tenantsToDelete.forEach((tenant, index) => {
      console.log(`${index + 1}. ${tenant.name} (${tenant.email}) - Total Reviews: ${tenant.total_reviews || '0'}`);
    });
    
    console.log(`\n🗑️  Deleting ${tenantsToDelete.length} tenants with 0 total_reviews...`);
    
    // Delete tenants with 0 total_reviews
    const deleteResult = await db.collection('tenants').deleteMany({
      $or: [
        { total_reviews: { $lte: 0 } },
        { total_reviews: { $exists: false } },
        { total_reviews: null }
      ]
    });
    
    console.log(`✅ Successfully deleted ${deleteResult.deletedCount} tenants with 0 total_reviews!`);
    
    // Show remaining tenant count
    const remainingCount = await db.collection('tenants').countDocuments();
    console.log(`📈 Remaining tenants in database: ${remainingCount}`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed.');
  }
}

// Run the cleanup
if (require.main === module) {
  deleteZeroReviewTenants()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = deleteZeroReviewTenants;
