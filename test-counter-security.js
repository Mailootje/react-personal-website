import fetch from 'node-fetch';
import crypto from 'crypto';

// Test cases
async function runTests() {
  // Base URL for the API
  const baseUrl = 'http://localhost:5000';
  const tokenEndpoint = '/api/counters/token';
  const incrementEndpoint = '/api/counters/conversions/total_images/increment';
  
  console.log('Testing Token-Based Counter API Security:');
  console.log('=======================================');
  
  // Generate an API key for backwards compatibility tests
  const date = new Date();
  const dailyTokenBase = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  const apiKey = crypto
    .createHash('sha256')
    .update(`counter-security-${dailyTokenBase}`)
    .digest('hex')
    .substring(0, 16);
  
  console.log('Generated API Key for legacy tests:', apiKey);

  // Test 1: Get a token and use it correctly (should pass)
  console.log('\nTest 1: Valid token request & usage');
  try {
    // Step 1: Get a token
    const tokenResponse = await fetch(`${baseUrl}${tokenEndpoint}`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Referer': baseUrl, // Simulate a request from our app
        'User-Agent': 'node-fetch'
      }
    });
    
    if (!tokenResponse.ok) {
      throw new Error(`Failed to get token: ${tokenResponse.status}`);
    }
    
    const tokenData = await tokenResponse.json();
    console.log(`Received token: ${tokenData.token.substring(0, 10)}...`);
    
    // Step 2: Use the token to increment the counter
    const response = await fetch(`${baseUrl}${incrementEndpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        count: 5,
        token: tokenData.token
      })
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', data);
    console.log('Result:', response.ok ? 'PASSED (as expected)' : 'FAILED (should have passed)');
  } catch (error) {
    console.log('Error:', error.message);
    console.log('Result: ERROR');
  }
  
  // Test 2: Try without a token (should fail)
  console.log('\nTest 2: No token provided');
  try {
    const response = await fetch(`${baseUrl}${incrementEndpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count: 5 })
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', data);
    console.log('Result:', !response.ok ? 'PASSED (failed as expected)' : 'FAILED (should have failed)');
  } catch (error) {
    console.log('Error:', error.message);
    console.log('Result: ERROR');
  }
  
  // Test 3: Try with an invalid token (should fail)
  console.log('\nTest 3: Invalid token');
  try {
    const response = await fetch(`${baseUrl}${incrementEndpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        count: 5,
        token: 'invalid-token-that-does-not-exist'
      })
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', data);
    console.log('Result:', !response.ok ? 'PASSED (failed as expected)' : 'FAILED (should have failed)');
  } catch (error) {
    console.log('Error:', error.message);
    console.log('Result: ERROR');
  }
  
  // Test 4: Token reuse (should fail on second use)
  console.log('\nTest 4: Token reuse');
  try {
    // Step 1: Get a token
    const tokenResponse = await fetch(`${baseUrl}${tokenEndpoint}`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Referer': baseUrl, // Simulate a request from our app
        'User-Agent': 'node-fetch'
      }
    });
    
    if (!tokenResponse.ok) {
      throw new Error(`Failed to get token: ${tokenResponse.status}`);
    }
    
    const tokenData = await tokenResponse.json();
    console.log(`Received token: ${tokenData.token.substring(0, 10)}...`);
    
    // Step 2: Use the token first time (should succeed)
    const firstResponse = await fetch(`${baseUrl}${incrementEndpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        count: 5,
        token: tokenData.token
      })
    });
    
    console.log(`First usage status: ${firstResponse.status}`);
    
    // Step 3: Try to reuse the same token (should fail)
    const secondResponse = await fetch(`${baseUrl}${incrementEndpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        count: 5,
        token: tokenData.token
      })
    });
    
    const secondData = await secondResponse.json();
    console.log(`Second usage status: ${secondResponse.status}`);
    console.log('Response:', secondData);
    console.log('Result:', !secondResponse.ok ? 'PASSED (failed as expected)' : 'FAILED (should have failed)');
  } catch (error) {
    console.log('Error:', error.message);
    console.log('Result: ERROR');
  }
  
  // Test 5: Using legacy API key (for backwards compatibility)
  console.log('\nTest 5: Legacy API key');
  try {
    const response = await fetch(`${baseUrl}${incrementEndpoint}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'User-Agent': 'node-fetch'
      },
      body: JSON.stringify({ count: 5 })
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', data);
    console.log('Result:', response.ok ? 'PASSED (as expected)' : 'FAILED (should have passed)');
  } catch (error) {
    console.log('Error:', error.message);
    console.log('Result: ERROR');
  }
  
  // Test 6: With extremely large count (should be capped)
  console.log('\nTest 6: Large count value (expecting cap at 100)');
  try {
    // First, get the current counter value
    const getResponse = await fetch(`${baseUrl}/api/counters/conversions/total_images`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const beforeData = await getResponse.json();
    const countBefore = beforeData.count;
    console.log(`Current counter value before increment: ${countBefore}`);
    
    // Get a new token for this test
    const tokenResponse = await fetch(`${baseUrl}${tokenEndpoint}`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Referer': baseUrl, // Simulate a request from our app
        'User-Agent': 'node-fetch'
      }
    });
    
    if (!tokenResponse.ok) {
      throw new Error(`Failed to get token: ${tokenResponse.status}`);
    }
    
    const tokenData = await tokenResponse.json();
    
    // Now try to increment by a large amount
    const response = await fetch(`${baseUrl}${incrementEndpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        count: 9999, // Very large number
        token: tokenData.token
      })
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', data);
    
    // Get the updated counter value
    const getAfterResponse = await fetch(`${baseUrl}/api/counters/conversions/total_images`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const afterData = await getAfterResponse.json();
    const countAfter = afterData.count;
    
    // Calculate the actual increment
    const actualIncrement = countAfter - countBefore;
    console.log(`Count before: ${countBefore}, Count after: ${countAfter}`);
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