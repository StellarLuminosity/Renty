/**
 * MongoDB Migration Script for Renty
 * Sets up collections, validation rules, indexes, and migrates sample data
 */

import { MongoClient } from 'mongodb';
import { MONGODB_URI, DATABASE_NAME, collections, sampleData, sampleReviews } from './mongodb_schema.js';

class RentyMigration {
  constructor() {
    this.client = null;
    this.db = null;
  }

  /**
   * Connect to MongoDB
   */
  async connect() {
    try {
      console.log('🔌 Connecting to MongoDB...');
      this.client = new MongoClient(MONGODB_URI);
      await this.client.connect();
      this.db = this.client.db(DATABASE_NAME);
      console.log('✅ Connected to MongoDB successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error.message);
      return false;
    }
  }

  /**
   * Close MongoDB connection
   */
  async close() {
    if (this.client) {
      await this.client.close();
      console.log('🔌 Disconnected from MongoDB');
    }
  }

  /**
   * Create collections with validation rules
   */
  async createCollections() {
    console.log('📦 Creating collections with validation...');
    
    for (const [collectionName, schema] of Object.entries(collections)) {
      try {
        // Drop collection if it exists
        const existingCollections = await this.db.listCollections({ name: collectionName }).toArray();
        if (existingCollections.length > 0) {
          await this.db.collection(collectionName).drop();
          console.log(`  🗑️  Dropped existing collection: ${collectionName}`);
        }

        // Create collection with validation
        await this.db.createCollection(collectionName, schema);
        console.log(`  ✅ Created collection: ${collectionName}`);
      } catch (error) {
        console.error(`  ❌ Failed to create collection ${collectionName}:`, error.message);
      }
    }
  }

  /**
   * Create indexes for performance
   */
  async createIndexes() {
    console.log('🔍 Creating indexes...');
    
    for (const [collectionName, schema] of Object.entries(collections)) {
      if (schema.indexes && schema.indexes.length > 0) {
        try {
          const collection = this.db.collection(collectionName);
          for (const index of schema.indexes) {
            await collection.createIndex(index.index || index, index.options || {});
          }
          console.log(`  ✅ Created ${schema.indexes.length} indexes for ${collectionName}`);
        } catch (error) {
          console.error(`  ❌ Failed to create indexes for ${collectionName}:`, error.message);
        }
      }
    }
  }

  /**
   * Insert sample landlords and return ID mapping
   */
  async insertLandlords() {
    console.log('👤 Inserting sample landlords...');
    
    const collection = this.db.collection('landlords');
    const result = await collection.insertMany(sampleData.landlords);
    
    // Create mapping of email to ObjectId for reviews
    const emailToIdMap = {};
    sampleData.landlords.forEach((landlord, index) => {
      const insertedId = result.insertedIds[index];
      emailToIdMap[landlord.email] = insertedId;
    });
    
    console.log(`  ✅ Inserted ${result.insertedCount} landlords`);
    return emailToIdMap;
  }

  /**
   * Insert sample tenants and return ID mapping
   */
  async insertTenants() {
    console.log('🏠 Inserting sample tenants...');
    
    const collection = this.db.collection('tenants');
    const result = await collection.insertMany(sampleData.tenants);
    
    // Create mapping of name to ObjectId for reviews
    const nameToIdMap = {};
    sampleData.tenants.forEach((tenant, index) => {
      const insertedId = result.insertedIds[index];
      nameToIdMap[tenant.name] = insertedId;
    });
    
    console.log(`  ✅ Inserted ${result.insertedCount} tenants`);
    return nameToIdMap;
  }

  /**
   * Insert sample reviews with proper ObjectId references
   */
  async insertReviews(landlordEmailToId, tenantNameToId) {
    console.log('📝 Inserting sample reviews...');
    
    // Map reviews to tenants and landlords
    const reviewsWithIds = [];
    
    // Alice Wilson reviews (2 reviews)
    const aliceId = tenantNameToId['Alice Wilson'];
    reviewsWithIds.push({
      ...sampleReviews[0],
      tenant_id: aliceId,
      reviewer_id: landlordEmailToId['john.doe@email.com']
    });
    reviewsWithIds.push({
      ...sampleReviews[1], 
      tenant_id: aliceId,
      reviewer_id: landlordEmailToId['jane.smith@email.com']
    });

    // Bob Thompson reviews (3 reviews)
    const bobId = tenantNameToId['Bob Thompson'];
    reviewsWithIds.push({
      ...sampleReviews[2],
      tenant_id: bobId,
      reviewer_id: landlordEmailToId['john.doe@email.com']
    });
    reviewsWithIds.push({
      ...sampleReviews[3],
      tenant_id: bobId,
      reviewer_id: landlordEmailToId['mike.johnson@email.com']
    });
    reviewsWithIds.push({
      ...sampleReviews[4],
      tenant_id: bobId,
      reviewer_id: landlordEmailToId['jane.smith@email.com']
    });

    // Carol Davis review (1 review)
    const carolId = tenantNameToId['Carol Davis'];
    reviewsWithIds.push({
      ...sampleReviews[5],
      tenant_id: carolId,
      reviewer_id: landlordEmailToId['john.doe@email.com']
    });

    const collection = this.db.collection('reviews');
    const result = await collection.insertMany(reviewsWithIds);
    
    console.log(`  ✅ Inserted ${result.insertedCount} reviews`);
    return result;
  }

  /**
   * Update tenant average ratings based on reviews
   */
  async updateTenantRatings() {
    console.log('📊 Updating tenant average ratings...');
    
    const pipeline = [
      {
        $group: {
          _id: "$tenant_id",
          average_rating: { $avg: "$rating" },
          total_reviews: { $sum: 1 }
        }
      }
    ];
    
    const reviewStats = await this.db.collection('reviews').aggregate(pipeline).toArray();
    
    for (const stats of reviewStats) {
      await this.db.collection('tenants').updateOne(
        { _id: stats._id },
        { 
          $set: { 
            average_rating: Math.round(stats.average_rating * 10) / 10, // Round to 1 decimal
            total_reviews: stats.total_reviews,
            updated_at: new Date()
          }
        }
      );
    }
    
    console.log(`  ✅ Updated ratings for ${reviewStats.length} tenants`);
  }

  /**
   * Run the complete migration
   */
  async migrate() {
    console.log('🚀 Starting Renty MongoDB Migration...\n');
    
    try {
      // Connect to database
      const connected = await this.connect();
      if (!connected) {
        throw new Error('Failed to connect to database');
      }

      // Create collections and indexes
      await this.createCollections();
      await this.createIndexes();
      
      // Insert data
      const landlordIds = await this.insertLandlords();
      const tenantIds = await this.insertTenants();
      await this.insertReviews(landlordIds, tenantIds);
      await this.updateTenantRatings();
      
      console.log('\n🎉 Migration completed successfully!');
      console.log('\n📊 Database Summary:');
      console.log(`   - Landlords: ${await this.db.collection('landlords').countDocuments()}`);
      console.log(`   - Tenants: ${await this.db.collection('tenants').countDocuments()}`);
      console.log(`   - Reviews: ${await this.db.collection('reviews').countDocuments()}`);
      
      // Display some sample queries
      console.log('\n🔍 Sample Queries:');
      
      // Find tenant with reviews
      const tenantWithReviews = await this.db.collection('tenants').findOne(
        { name: 'Alice Wilson' }
      );
      console.log(`   - Alice Wilson average rating: ${tenantWithReviews.average_rating} (${tenantWithReviews.total_reviews} reviews)`);
      
      // Count reviews by rating
      const ratingCounts = await this.db.collection('reviews').aggregate([
        { $group: { _id: "$rating", count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]).toArray();
      
      console.log('   - Reviews by rating:');
      ratingCounts.forEach(item => {
        console.log(`     ${item._id} stars: ${item.count} reviews`);
      });

    } catch (error) {
      console.error('\n❌ Migration failed:', error.message);
      process.exit(1);
    } finally {
      await this.close();
    }
  }

  /**
   * Utility method to test database connection
   */
  async testConnection() {
    console.log('🧪 Testing MongoDB connection...');
    
    try {
      const connected = await this.connect();
      if (!connected) {
        return false;
      }
      
      // Test basic operations
      await this.db.admin().ping();
      console.log('✅ Connection test successful');
      
      // List existing databases
      const databases = await this.db.admin().listDatabases();
      console.log('📁 Available databases:', databases.databases.map(db => db.name).join(', '));
      
      return true;
      
    } catch (error) {
      console.error('❌ Connection test failed:', error.message);
      return false;
    } finally {
      await this.close();
    }
  }

  /**
   * Clean up - remove all Renty data
   */
  async cleanup() {
    console.log('🧹 Cleaning up Renty data...');
    
    try {
      const connected = await this.connect();
      if (!connected) {
        throw new Error('Failed to connect to database');
      }

      // Drop all collections
      const collectionNames = ['landlords', 'tenants', 'reviews'];
      for (const collectionName of collectionNames) {
        try {
          await this.db.collection(collectionName).drop();
          console.log(`  🗑️  Dropped collection: ${collectionName}`);
        } catch (error) {
          if (error.codeName !== 'NamespaceNotFound') {
            console.error(`  ❌ Failed to drop ${collectionName}:`, error.message);
          }
        }
      }
      
      console.log('✅ Cleanup completed');
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
    } finally {
      await this.close();
    }
  }
}

// CLI handling
const args = process.argv.slice(2);
const command = args[0] || 'migrate';

const migration = new RentyMigration();

switch (command) {
  case 'test':
    migration.testConnection();
    break;
  case 'cleanup':
    migration.cleanup();
    break;
  case 'migrate':
  default:
    migration.migrate();
    break;
}

export default RentyMigration;
