/**
 * Simple MongoDB Connection Test
 * Tests the connection string with basic error handling
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = "mongodb+srv://miodragmtasic:D8eX6doz7Nxep9lA@cluster0.hzod4on.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function testConnection() {
  console.log('🔌 Testing MongoDB Atlas connection...');
  
  let client;
  
  try {
    // Create client with additional options to handle SSL issues
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      tls: true,
      tlsInsecure: false
    });
    
    console.log('⏳ Connecting...');
    await client.connect();
    
    console.log('✅ Connected successfully!');
    
    // Test basic database operations
    const db = client.db('renty');
    const adminDb = client.db().admin();
    
    // List databases to verify permissions
    const databases = await adminDb.listDatabases();
    console.log('📁 Available databases:', databases.databases.map(db => db.name).join(', '));
    
    // Test creating a simple collection
    console.log('🧪 Testing collection operations...');
    const testCollection = db.collection('connection_test');
    
    // Insert a test document
    const testDoc = { 
      message: 'Connection test successful!', 
      timestamp: new Date() 
    };
    const insertResult = await testCollection.insertOne(testDoc);
    console.log('✅ Test document inserted with ID:', insertResult.insertedId);
    
    // Read it back
    const retrievedDoc = await testCollection.findOne({ _id: insertResult.insertedId });
    console.log('✅ Test document retrieved:', retrievedDoc.message);
    
    // Clean up test document
    await testCollection.deleteOne({ _id: insertResult.insertedId });
    console.log('🧹 Test document cleaned up');
    
    console.log('\n🎉 All tests passed! MongoDB connection is working perfectly.');
    
  } catch (error) {
    console.error('\n❌ Connection test failed:');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    
    if (error.message.includes('SSL') || error.message.includes('TLS')) {
      console.log('\n🔧 SSL/TLS Error detected. This might be due to:');
      console.log('   - Network firewall blocking MongoDB Atlas');
      console.log('   - Corporate network restrictions');
      console.log('   - Node.js version compatibility');
      console.log('   - MongoDB Atlas IP whitelist settings');
    }
    
    if (error.message.includes('authentication')) {
      console.log('\n🔧 Authentication Error detected. Check:');
      console.log('   - Username and password in connection string');
      console.log('   - Database user permissions in MongoDB Atlas');
    }
    
    console.log('\n💡 Troubleshooting suggestions:');
    console.log('   1. Check MongoDB Atlas network access (IP whitelist)');
    console.log('   2. Verify database user credentials');
    console.log('   3. Try from a different network');
    console.log('   4. Check Node.js version compatibility');
    
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Connection closed');
    }
  }
}

// Alternative connection test with different SSL options
async function testWithDifferentSSLOptions() {
  console.log('\n🔄 Trying alternative connection options...');
  
  const alternativeOptions = [
    {
      name: 'Standard TLS',
      options: { tls: true, tlsAllowInvalidCertificates: false }
    },
    {
      name: 'Allow invalid certificates (dev only)',
      options: { tls: true, tlsAllowInvalidCertificates: true }
    },
    {
      name: 'No SSL verification (dev only)', 
      options: { ssl: false }
    }
  ];
  
  for (const config of alternativeOptions) {
    try {
      console.log(`\n🧪 Testing with ${config.name}...`);
      
      const client = new MongoClient(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        ...config.options
      });
      
      await client.connect();
      await client.db().admin().ping();
      
      console.log(`✅ ${config.name} - Connection successful!`);
      await client.close();
      return true;
      
    } catch (error) {
      console.log(`❌ ${config.name} - Failed:`, error.message.split('\n')[0]);
    }
  }
  
  return false;
}

// Run tests
async function runAllTests() {
  await testConnection();
  
  // If main test failed, try alternatives
  console.log('\n' + '='.repeat(50));
  const alternativeSuccess = await testWithDifferentSSLOptions();
  
  if (alternativeSuccess) {
    console.log('\n✅ Found working connection method!');
  } else {
    console.log('\n❌ All connection attempts failed.');
    console.log('Please check your network settings and MongoDB Atlas configuration.');
  }
}

runAllTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
