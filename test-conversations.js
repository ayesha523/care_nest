async function testConversationAPI() {
  try {
    // First, let's login with a demo account to get a token
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'companion@demo.com',
        password: 'Password123!'
      })
    });

    const loginData = await loginRes.json();
    console.log('Login response:', JSON.stringify(loginData, null, 2));
    
    if (!loginData.success) {
      console.log('Login failed:', loginData);
      return;
    }

    // Extract token from the nested structure
    const token = loginData.data?.token;
    if (!token) {
      console.log('No token in response. Full response:', loginData);
      return;
    }

    console.log('✅ Logged in successfully');
    console.log('Token:', token);

    // Now test the conversations endpoint
    const conversationsRes = await fetch('http://localhost:5000/api/messages/conversations/all', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('Response status:', conversationsRes.status);
    const conversationsData = await conversationsRes.json();
    console.log('✅ Conversations response:');
    console.log(JSON.stringify(conversationsData, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testConversationAPI();
