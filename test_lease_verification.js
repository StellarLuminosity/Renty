const fs = require('fs');
const path = require('path');

// Test the lease verification logic directly
async function testLeaseVerification() {
  try {
    // Read our sample lease text
    const leaseText = fs.readFileSync('sample_lease.txt', 'utf8');
    console.log('📄 Lease text extracted:');
    console.log(leaseText.substring(0, 200) + '...\n');
    
    // Test the Gemini API call
    const axios = require('axios');
    
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

    console.log('🤖 Calling Gemini API...');
    
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
    
    // Try to parse JSON
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const verificationResult = JSON.parse(jsonMatch[0]);
      console.log('\n✅ Parsed verification result:', verificationResult);
      
      // Test verification logic
      const tenantNameToVerify = "Jane Doe";
      
      if (verificationResult.isValidLease && 
          verificationResult.confidence > 60 &&
          verificationResult.tenantName && 
          verificationResult.tenantName.toLowerCase().includes(tenantNameToVerify.toLowerCase())) {
        console.log('\n🎉 VERIFICATION PASSED!');
        console.log(`- Valid lease: ${verificationResult.isValidLease}`);
        console.log(`- Confidence: ${verificationResult.confidence}%`);
        console.log(`- Tenant match: ${verificationResult.tenantName} contains ${tenantNameToVerify}`);
      } else {
        console.log('\n❌ VERIFICATION FAILED:');
        console.log(`- Valid lease: ${verificationResult.isValidLease}`);
        console.log(`- Confidence: ${verificationResult.confidence}%`);
        console.log(`- Tenant name: ${verificationResult.tenantName}`);
        console.log(`- Looking for: ${tenantNameToVerify}`);
      }
      
    } else {
      console.log('❌ Could not parse JSON from AI response');
    }
    
  } catch (error) {
    console.error('❌ Error testing lease verification:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Load environment variables
require('dotenv').config();

testLeaseVerification();
