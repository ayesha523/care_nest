#!/usr/bin/env node

/**
 * Backend Debug Helper
 * Tests common messaging issues
 */

const http = require("http");

const testConversationId = "69cf60afe2a510f3718d8a2f";
const testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5Y2Y2MDM3NThjY2Y1NWMxYjM3ZDI2OCIsImVtYWlsIjoiZWxkZXJseS5kZW1vQGNhcmVuZXN0LmNvbSIsInJvbGUiOiJlbGRlcmx5IiwibmFtZSI6Ik1hcmdhcmV0IEpvaG5zb24ifQ.k_example";
const userId = "69cf603758ccf55c1b37d268";

const tests = [
  {
    name: "✅ Test 1: GET Messages (fetchConversationAndMessages)",
    method: "GET",
    url: `/api/messages/${testConversationId}`,
    headers: { "Authorization": `Bearer ${testToken}` },
  },
  {
    name: "✅ Test 2: POST Message (handleSendMessage)",
    method: "POST",
    url: `/api/messages/${testConversationId}`,
    headers: {
      "Authorization": `Bearer ${testToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: "Test message from debugging script"
    }),
  },
];

const runTest = (test) => {
  return new Promise((resolve) => {
    console.log(`\n${test.name}`);
    console.log(`  Method: ${test.method}`);
    console.log(`  URL: ${test.url}`);
    console.log(`  Headers: ${JSON.stringify(test.headers, null, 2)}`);
    if (test.body) {
      console.log(`  Body: ${test.body}`);
    }

    const options = {
      hostname: "localhost",
      port: 5000,
      path: test.url,
      method: test.method,
      headers: test.headers,
    };

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        console.log(`\n  Response Status: ${res.statusCode}`);
        try {
          const parsed = JSON.parse(data);
          console.log(`  Response Data:`, JSON.stringify(parsed, null, 2));
        } catch {
          console.log(`  Response Body: ${data}`);
        }
        resolve();
      });
    });

    req.on("error", (error) => {
      console.error(`  ❌ Error: ${error.message}`);
      resolve();
    });

    if (test.body) {
      req.write(test.body);
    }

    req.end();
  });
};

const runAllTests = async () => {
  console.log("🔍 Messaging API Debug Tests");
  console.log("=".repeat(70));
  console.log(`\nServer: http://localhost:5000`);
  console.log(`User ID: ${userId}`);
  console.log(`Conversation ID: ${testConversationId}`);

  for (const test of tests) {
    await runTest(test);
    await new Promise(r => setTimeout(r, 500)); // Delay between tests
  }

  console.log("\n" + "=".repeat(70));
  console.log("\n✅ Debug tests complete!");
  process.exit(0);
};

runAllTests().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
