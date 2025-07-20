const { MongoClient } = require('mongodb');
require('dotenv').config();

async function inspectDatabase() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/rental_reviews');
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('📊 DATABASE INSPECTION:');
    console.log('=======================');
    
    const tenants = await db.collection('tenants').find({}).toArray();
    console.log(`📋 Total tenants: ${tenants.length}`);
    
    if (tenants.length > 0) {
      console.log('\n🎯 Tenant ratings breakdown:');
      const ratingGroups = {
        '0 stars': 0,
        '1-2 stars': 0,
        '3-4 stars': 0,
        '5 stars': 0,
        'No rating': 0
      };
      
      tenants.forEach(tenant => {
        const rating = tenant.average_rating || 0;
        if (rating === 0 || !tenant.average_rating) {
          ratingGroups['No rating']++;
        } else if (rating <= 2) {
          ratingGroups['1-2 stars']++;
        } else if (rating <= 4) {
          ratingGroups['3-4 stars']++;
        } else {
          ratingGroups['5 stars']++;
        }
      });
      
      Object.entries(ratingGroups).forEach(([range, count]) => {
        if (count > 0) console.log(`   ${range}: ${count} tenants`);
      });
      
      console.log('\n👥 Sample tenants:');
      tenants.slice(0, 5).forEach((tenant, i) => {
        console.log(`   ${i+1}. ${tenant.name} - Rating: ${tenant.average_rating || 'No rating'}`);
      });
    }
    
    const landlords = await db.collection('landlords').find({}).toArray();
    console.log(`\n🏠 Total landlords: ${landlords.length}`);
    
    const reviews = await db.collection('reviews').find({}).toArray();
    console.log(`📝 Total reviews: ${reviews.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

inspectDatabase();
