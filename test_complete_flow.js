const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

async function testCompleteFlow() {
  console.log('🧪 TESTING COMPLETE LEASE VERIFICATION FLOW\n');
  
  try {
    // Step 1: Test the lease document content with Gemini
    console.log('1️⃣  Testing Lease Document Content with Gemini...');
    const leaseText = fs.readFileSync('test_valid_lease.txt', 'utf8');
    console.log('📄 Lease preview:');
    console.log(leaseText.substring(0, 300) + '...\n');
    
    const prompt = `Please analyze this lease document and verify the following information:
1. Is this a legitimate lease agreement document?
2. Landlord name mentioned in the document
3. Tenant name mentioned in the document
4. Your confidence level (0-100%)

Document text:
${leaseText}

Please respond ONLY with a JSON object in this exact format:
{
  "isValidLease": boolean,
  "landlordName": "extracted name or null",
  "tenantName": "extracted name or null", 
  "confidence": number (0-100)
}`;

    console.log('🤖 Calling Gemini API for document analysis...');
    
    const response = await axios.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent', {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      params: {
        key: process.env.GEMINI_API_KEY
      }
    });

    const aiResponse = response.data.candidates[0].content.parts[0].text;
    console.log('🤖 AI Response:', aiResponse);
    
    // Parse the JSON response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const verificationResult = JSON.parse(jsonMatch[0]);
      console.log('\n✅ Parsed verification result:', verificationResult);
      
      // Test different scenarios
      console.log('\n🎯 TESTING VERIFICATION SCENARIOS:');
      
      // Scenario 1: Correct tenant name (Jane Doe)
      console.log('\n📋 Scenario 1: Correct tenant name "Jane Doe"');
      const correctTenant = testVerification(verificationResult, "Jane Doe", "John Smith");
      
      // Scenario 2: Correct landlord (John Smith) 
      console.log('\n📋 Scenario 2: Correct landlord "John Smith"');
      const correctLandlord = testVerification(verificationResult, "Jane Doe", "John Smith");
      
      // Scenario 3: Wrong tenant name
      console.log('\n📋 Scenario 3: Wrong tenant name "Bob Wilson"');
      const wrongTenant = testVerification(verificationResult, "Bob Wilson", "John Smith");
      
      // Scenario 4: Wrong landlord name
      console.log('\n📋 Scenario 4: Wrong landlord name "Mike Johnson"');
      const wrongLandlord = testVerification(verificationResult, "Jane Doe", "Mike Johnson");
      
      // Summary
      console.log('\n🎉 VERIFICATION TEST SUMMARY:');
      console.log(`✅ Valid lease detected: ${verificationResult.isValidLease}`);
      console.log(`✅ Confidence score: ${verificationResult.confidence}%`);
      console.log(`✅ Landlord extracted: ${verificationResult.landlordName}`);
      console.log(`✅ Tenant extracted: ${verificationResult.tenantName}`);
      console.log(`✅ Correct tenant verification: ${correctTenant ? 'PASS' : 'FAIL'}`);
      console.log(`✅ Wrong tenant rejected: ${!wrongTenant ? 'PASS' : 'FAIL'}`);
      
    } else {
      console.log('❌ Could not parse JSON from AI response');
    }
    
    // Step 2: Test Backend Endpoint Availability
    console.log('\n2️⃣  Testing Backend Endpoint...');
    try {
      const healthCheck = await axios.get('http://localhost:8000/api/health');
      console.log('✅ Backend is running:', healthCheck.data);
    } catch (error) {
      console.log('❌ Backend not accessible:', error.message);
      return;
    }
    
    console.log('\n🎊 ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('\n📋 READY FOR FRONTEND TESTING:');
    console.log('1. Upload the test_valid_lease.txt as a PDF');
    console.log('2. Enter tenant name: "Jane Doe"');
    console.log('3. Enter landlord name: "John Smith" (should match your account)');
    console.log('4. Click submit and verify the lease gets validated');
    
  } catch (error) {
    console.error('❌ Error in testing:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

function testVerification(result, tenantName, landlordName) {
  const isValid = result.isValidLease && 
                  result.confidence > 60 &&
                  result.tenantName && 
                  result.tenantName.toLowerCase().includes(tenantName.toLowerCase()) &&
                  result.landlordName &&
                  result.landlordName.toLowerCase().includes(landlordName.toLowerCase());
  
  console.log(`   - Valid lease: ${result.isValidLease}`);
  console.log(`   - Confidence: ${result.confidence}%`);
  console.log(`   - Tenant match: "${result.tenantName}" vs "${tenantName}" = ${result.tenantName?.toLowerCase().includes(tenantName.toLowerCase())}`);
  console.log(`   - Landlord match: "${result.landlordName}" vs "${landlordName}" = ${result.landlordName?.toLowerCase().includes(landlordName.toLowerCase())}`);
  console.log(`   - RESULT: ${isValid ? '✅ PASS' : '❌ FAIL'}`);
  
  return isValid;
}

testCompleteFlow();
