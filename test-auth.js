const http = require('http');

function testSignup(userData) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(userData);
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/signup',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        console.log(`\n📊 Status Code: ${res.statusCode}`);
        console.log(`📊 Headers:`, res.headers);
        console.log(`📊 Body:`, body);
        
        try {
          const json = JSON.parse(body);
          if (res.statusCode === 201) {
            console.log(`✅ Signup successful for ${json.data.user.email}`);
            resolve(json);
          } else {
            console.log(`❌ Signup failed: ${json.message}`);
            resolve(json);
          }
        } catch (e) {
          console.log(`❌ Failed to parse response:`, e.message);
          resolve({ success: false, error: body });
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Request error:`, error.message);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

function testLogin(credentials) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(credentials);
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        console.log(`\n📊 Status Code: ${res.statusCode}`);
        console.log(`📊 Body:`, body);
        
        try {
          const json = JSON.parse(body);
          if (res.statusCode === 200) {
            console.log(`✅ Login successful for ${json.data.user.email}`);
            resolve(json);
          } else {
            console.log(`❌ Login failed: ${json.message}`);
            resolve(json);
          }
        } catch (e) {
          console.log(`❌ Failed to parse response:`, e.message);
          resolve({ success: false, error: body });
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Request error:`, error.message);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing CareNest Authentication API\n');
  console.log('=' .repeat(60));
  
  // Test 1: Companion Signup
  console.log('\n🧪 TEST 1: Companion Signup');
  console.log('-'.repeat(60));
  await testSignup({
    name: 'Demo Companion',
    email: 'companion@demo.com',
    password: 'Password123!',
    role: 'companion'
  });
  
  // Small delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 2: Elderly Signup
  console.log('\n🧪 TEST 2: Elderly Signup');
  console.log('-'.repeat(60));
  await testSignup({
    name: 'Demo Elderly',
    email: 'elderly@demo.com',
    password: 'Password123!',
    role: 'elderly'
  });
  
  // Small delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 3: Companion Login
  console.log('\n🧪 TEST 3: Companion Login');
  console.log('-'.repeat(60));
  await testLogin({
    email: 'companion@demo.com',
    password: 'Password123!',
    role: 'companion'
  });
  
  // Small delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 4: Elderly Login
  console.log('\n🧪 TEST 4: Elderly Login');
  console.log('-'.repeat(60));
  await testLogin({
    email: 'elderly@demo.com',
    password: 'Password123!',
    role: 'elderly'
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ All tests completed');
}

runTests().catch(console.error);
