/**
 * Atlas Connection Test with Multiple Approaches
 * This script tries different methods to connect to MongoDB Atlas
 */

const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

const atlasUri = process.env.MONGO_URI || "mongodb+srv://tashrik_halim:404ilovesuki@carenest.hlkwku3.mongodb.net/?appName=CareNest";

console.log('🔄 Attempting MongoDB Atlas Connection...');
console.log('📍 Connection String:', atlasUri);
console.log('');

const dnsServers = (process.env.MONGO_DNS_SERVERS || '8.8.8.8,1.1.1.1')
  .split(',')
  .map((server) => server.trim())
  .filter(Boolean);

const isSrvDnsRefused = (error) => {
  return /querySrv\s+ECONNREFUSED/i.test(error?.message || '');
};

// Method 1: Standard Mongoose Connection
const connectWithMongoose = async () => {
  try {
    console.log('Method 1: Trying Mongoose Connection...');
    
    const options = {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 75000,
      family: 4, // Force IPv4
      dbName: 'carenest',
    };

    const conn = await mongoose.connect(atlasUri, options);
    
    console.log('✅ SUCCESS! Connected via Mongoose');
    console.log(`✅ Host: ${conn.connection.host}`);
    console.log(`✅ Database: ${conn.connection.name}`);
    
    await mongoose.connection.close();
    return true;
  } catch (error) {
    if (atlasUri.startsWith('mongodb+srv://') && isSrvDnsRefused(error)) {
      try {
        console.log('⚠️ Mongoose SRV lookup refused. Retrying with public DNS:', dnsServers.join(', '));
        dns.setServers(dnsServers);

        const conn = await mongoose.connect(atlasUri, {
          serverSelectionTimeoutMS: 30000,
          socketTimeoutMS: 75000,
          family: 4,
          dbName: 'carenest',
        });

        console.log('✅ SUCCESS! Connected via Mongoose (DNS fallback)');
        console.log(`✅ Host: ${conn.connection.host}`);
        console.log(`✅ Database: ${conn.connection.name}`);

        await mongoose.connection.close();
        return true;
      } catch (retryError) {
        console.log('❌ Mongoose Retry Failed:', retryError.message);
        return false;
      }
    }

    console.log('❌ Mongoose Failed:', error.message);
    return false;
  }
};

// Method 2: Native MongoDB Driver
const connectWithNativeDriver = async () => {
  try {
    console.log('\nMethod 2: Trying Native MongoDB Driver...');
    
    const { MongoClient, ServerApiVersion } = require('mongodb');
    
    const client = new MongoClient(atlasUri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      serverSelectionTimeoutMS: 30000,
      family: 4, // Force IPv4
    });

    await client.connect();
    await client.db('carenest').command({ ping: 1 });
    
    console.log('✅ SUCCESS! Connected via Native Driver');
    console.log('✅ Ping successful to carenest database');
    
    await client.close();
    return true;
  } catch (error) {
    if (atlasUri.startsWith('mongodb+srv://') && isSrvDnsRefused(error)) {
      try {
        console.log('⚠️ Native Driver SRV lookup refused. Retrying with public DNS:', dnsServers.join(', '));
        dns.setServers(dnsServers);

        const { MongoClient, ServerApiVersion } = require('mongodb');
        const client = new MongoClient(atlasUri, {
          serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
          },
          serverSelectionTimeoutMS: 30000,
          family: 4,
        });

        await client.connect();
        await client.db('carenest').command({ ping: 1 });

        console.log('✅ SUCCESS! Connected via Native Driver (DNS fallback)');
        console.log('✅ Ping successful to carenest database');

        await client.close();
        return true;
      } catch (retryError) {
        console.log('❌ Native Driver Retry Failed:', retryError.message);
        return false;
      }
    }

    console.log('❌ Native Driver Failed:', error.message);
    return false;
  }
};

// Run all methods
const testConnection = async () => {
  console.log('═'.repeat(60));
  console.log('  MONGODB ATLAS CONNECTION TEST');
  console.log('═'.repeat(60));
  console.log('');

  const method1Success = await connectWithMongoose();
  const method2Success = await connectWithNativeDriver();

  console.log('');
  console.log('═'.repeat(60));
  console.log('  RESULTS:');
  console.log('═'.repeat(60));
  console.log(`  Mongoose:        ${method1Success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`  Native Driver:   ${method2Success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log('═'.repeat(60));

  if (!method1Success && !method2Success) {
    console.log('');
    console.log('⚠️  TROUBLESHOOTING REQUIRED:');
    console.log('');
    console.log('1. Check MongoDB Atlas Network Access:');
    console.log('   - Go to https://cloud.mongodb.com');
    console.log('   - Click "Network Access" in left menu');
    console.log('   - Ensure 0.0.0.0/0 is whitelisted (or your IP)');
    console.log('');
    console.log('2. Check Firewall/Antivirus:');
    console.log('   - Windows Defender might block Node.js DNS queries');
    console.log('   - Try temporarily disabling firewall');
    console.log('');
    console.log('3. Use Local MongoDB Instead:');
    console.log('   - Change .env to: MONGO_URI=mongodb://127.0.0.1:27017/carenest');
    console.log('   - This is more reliable for development');
    console.log('');
  } else {
    console.log('');
    console.log('✅ Your project is ready to use MongoDB Atlas!');
    console.log('');
  }

  process.exit(method1Success || method2Success ? 0 : 1);
};

testConnection();
