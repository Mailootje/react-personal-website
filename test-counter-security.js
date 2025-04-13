import crypto from 'crypto';
import fetch from 'node-fetch';

// Test cases
async function runTests() {
  // Base URL for the API
  const baseUrl = 'http://localhost:5000';
  const endpoint = '/api/counters/conversions/total_images/increment';
  
  console.log('Testing Counter API Security:');
  console.log('============================');
  
  // Test 1: Without any security headers (should fail)
  console.log('\nTest 1: No security headers');
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count: 1 })
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', data);
    console.log('Result:', response.ok ? 'PASSED (but should have failed)' : 'FAILED (as expected)');
  } catch (error) {
    console.log('Error:', error.message);
    console.log('Result: ERROR');
  }
  
  // Test 2: With incorrect API key (should fail)
  console.log('\nTest 2: Incorrect API key');
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-API-Key': 'invalid-api-key'
      },
      body: JSON.stringify({ count: 1 })
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', data);
    console.log('Result:', response.ok ? 'PASSED (but should have failed)' : 'FAILED (as expected)');
  } catch (error) {
    console.log('Error:', error.message);
    console.log('Result: ERROR');
  }
  
  // Test 3: With valid API key (should pass)
  console.log('\nTest 3: Valid API key');
  try {
    // Generate the same token as the server and client will use
    const date = new Date();
    const dailyTokenBase = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    const apiKey = crypto
      .createHash('sha256')
      .update(`counter-security-${dailyTokenBase}`)
      .digest('hex')
      .substring(0, 16);
    
    console.log('Generated API Key:', apiKey);
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({ count: 1 })
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', data);
    console.log('Result:', response.ok ? 'PASSED (as expected)' : 'FAILED (but should have passed)');
  } catch (error) {
    console.log('Error:', error.message);
    console.log('Result: ERROR');
  }
  
  // Test 4: With valid origin (should pass)
  console.log('\nTest 4: Valid Origin');
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Origin': baseUrl,
        'Host': 'localhost:5000'
      },
      body: JSON.stringify({ count: 1 })
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', data);
    console.log('Result:', response.ok ? 'PASSED (as expected)' : 'FAILED (but should have passed)');
  } catch (error) {
    console.log('Error:', error.message);
    console.log('Result: ERROR');
  }
  
  // Test 5: With extremely large count (should be capped)
  console.log('\nTest 5: Large count value (expecting cap at 100)');
  try {
    // Generate valid API key
    const date = new Date();
    const dailyTokenBase = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    const apiKey = crypto
      .createHash('sha256')
      .update(`counter-security-${dailyTokenBase}`)
      .digest('hex')
      .substring(0, 16);
    
    // First, get the current counter value
    const getResponse = await fetch(`${baseUrl}/api/counters/conversions/total_images`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const beforeData = await getResponse.json();
    const countBefore = beforeData.count;
    console.log(`Current counter value before increment: ${countBefore}`);
    
    // Now try to increment by a large amount
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({ count: 9999 }) // Very large number
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', data);
    
    // Calculate the actual increment
    const actualIncrement = data.count - countBefore;
    console.log(`Count before: ${countBefore}, Count after: ${data.count}`);
    console.log(`Count should be capped at 100. Actual increment: ${actualIncrement}`);
    console.log('Result:', actualIncrement <= 100 ? 'PASSED (properly capped)' : 'FAILED (not capped)');
  } catch (error) {
    console.log('Error:', error.message);
    console.log('Result: ERROR');
  }
  
  console.log('\nTests complete!');
}

runTests().catch(error => {
  console.error('Test suite error:', error);
});