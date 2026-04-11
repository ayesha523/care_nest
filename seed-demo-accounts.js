/**
 * Demo Account Seeder for CareNest
 * Creates test accounts for development and demo purposes
 * 
 * Usage: node seed-demo-accounts.js
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const dns = require("dns");

// Load environment variables
dotenv.config();

// Get DNS servers for Atlas fallback
const getDnsServers = () => {
  return (process.env.MONGO_DNS_SERVERS || "8.8.8.8,1.1.1.1")
    .split(",")
    .map((server) => server.trim())
    .filter(Boolean);
};

const isAtlasSrvDnsError = (error) => {
  return (
    error &&
    /querySrv\s+ECONNREFUSED/i.test(error.message || "")
  );
};

// Connect to MongoDB with retry logic
const connectDatabase = async () => {
  try {
    const options = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };

    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/carenest";
    
    let conn;
    try {
      conn = await mongoose.connect(mongoUri, options);
    } catch (error) {
      // Atlas SRV lookups can fail on some Windows DNS stacks; retry with public DNS.
      if (mongoUri.startsWith("mongodb+srv://") && isAtlasSrvDnsError(error)) {
        const dnsServers = getDnsServers();
        console.log("⚠️  Retrying with alternate DNS servers...");
        dns.setServers(dnsServers);
        conn = await mongoose.connect(mongoUri, options);
      } else {
        throw error;
      }
    }

    console.log("✅ Connected to MongoDB");
    return conn;
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

const User = require("./server/models/User");

/**
 * Demo Account Credentials
 */
const demoAccounts = [
  // ELDERLY USERS
  {
    name: "Margaret Johnson",
    email: "elderly.demo@carenest.com",
    password: "PasswordElderly@1",
    role: "elderly",
    age: 72,
    bio: "Retired teacher, love reading and gardening",
    location: {
      address: "123 Oak Street",
      city: "San Francisco",
      state: "CA",
      zipCode: "94105"
    },
    interests: ["reading", "gardening", "cooking", "movies"],
    verified: true,
    profilePicture: "https://via.placeholder.com/150?text=Margaret"
  },
  {
    name: "Robert Williams",
    email: "elderly2.demo@carenest.com",
    password: "PasswordElderly@2",
    role: "elderly",
    age: 68,
    bio: "Former engineer, enjoy chess and technology",
    location: {
      address: "456 Pine Avenue",
      city: "New York",
      state: "NY",
      zipCode: "10001"
    },
    interests: ["chess", "technology", "walking", "music"],
    verified: true,
    profilePicture: "https://via.placeholder.com/150?text=Robert"
  },
  {
    name: "Susan Anderson",
    email: "elderly3.demo@carenest.com",
    password: "PasswordElderly@3",
    role: "elderly",
    age: 75,
    bio: "Love spending time with family and crafts",
    location: {
      address: "789 Elm Road",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90001"
    },
    interests: ["crafts", "family", "cooking", "gardening"],
    verified: true,
    profilePicture: "https://via.placeholder.com/150?text=Susan"
  },

  // COMPANION USERS
  {
    name: "Emily Chen",
    email: "companion.demo@carenest.com",
    password: "PasswordCompanion@1",
    role: "companion",
    age: 28,
    bio: "Passionate caregiver with 5 years experience in elderly care",
    university: "UC Berkeley",
    hourlyRate: 25,
    specializations: ["companionship", "mobility-assistance", "medication-reminders"],
    skills: ["patient-care", "communication", "first-aid", "cooking"],
    location: {
      address: "321 Maple Lane",
      city: "San Francisco",
      state: "CA",
      zipCode: "94105"
    },
    interests: ["helping others", "reading", "yoga", "travel"],
    verified: true,
    rating: 4.8,
    reviewCount: 24,
    profilePicture: "https://via.placeholder.com/150?text=Emily",
    availability: "Weekdays: 9AM-5PM, Weekends: flexible"
  },
  {
    name: "Michael Rodriguez",
    email: "companion2.demo@carenest.com",
    password: "PasswordCompanion@2",
    role: "companion",
    age: 32,
    bio: "Certified caregiver specializing in dementia care",
    university: "NYU School of Nursing",
    hourlyRate: 30,
    specializations: ["dementia-care", "meal-prep", "housekeeping"],
    skills: ["dementia-care", "nutrition", "patience", "organization"],
    location: {
      address: "654 Cedar Street",
      city: "New York",
      state: "NY",
      zipCode: "10001"
    },
    interests: ["caring for seniors", "cooking", "music", "volunteering"],
    verified: true,
    rating: 4.9,
    reviewCount: 31,
    profilePicture: "https://via.placeholder.com/150?text=Michael",
    availability: "Flexible hours, available for long-term care"
  },
  {
    name: "Jessica Thompson",
    email: "companion3.demo@carenest.com",
    password: "PasswordCompanion@3",
    role: "companion",
    age: 26,
    bio: "Young, energetic companion for activities and companionship",
    university: "UCLA",
    hourlyRate: 20,
    specializations: ["companionship", "transportation"],
    skills: ["active-listening", "organization", "driving", "tech-support"],
    location: {
      address: "987 Birch Drive",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90001"
    },
    interests: ["helping seniors", "hiking", "technology", "photography"],
    verified: true,
    rating: 4.7,
    reviewCount: 18,
    profilePicture: "https://via.placeholder.com/150?text=Jessica",
    availability: "Afternoons and weekends preferred"
  }
];

/**
 * Seed Demo Accounts
 */
async function seedDemoAccounts() {
  try {
    // Connect to database first
    await connectDatabase();

    console.log("\n🌱 Starting demo account seeding...\n");

    // Check if demo accounts already exist
    const existingCount = await User.countDocuments({
      email: { $in: demoAccounts.map(acc => acc.email) }
    });

    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing demo accounts. Skipping creation to avoid duplicates.`);
      console.log("   To reset, delete these accounts in MongoDB Compass or run:\n");
      console.log(`   db.users.deleteMany({ email: { $in: [${demoAccounts.map(acc => `"${acc.email}"`).join(', ')}] } })\n`);
      await mongoose.connection.close();
      return;
    }

    // Create accounts
    for (const account of demoAccounts) {
      // ✅ DON'T hash here - let User model pre-save middleware do it
      // Just pass the plain password and the schema will hash it
      const user = await User.create({
        ...account
        // password stays as plain text - will be hashed by pre-save hook
      });

      const accountType = account.role === "elderly" ? "👵 ELDERLY" : "🧑‍⚕️ COMPANION";
      console.log(`✅ Created ${accountType}: ${account.name}`);
      console.log(`   Email: ${account.email}`);
      console.log(`   Password: ${account.password}`);
      console.log(`   ID: ${user._id}\n`);
    }

    console.log("🎉 All demo accounts created successfully!\n");
    console.log("📋 DEMO ACCOUNTS SUMMARY\n");
    console.log("═".repeat(70));

    // Print summary
    const elderlyAccounts = demoAccounts.filter(acc => acc.role === "elderly");
    const companionAccounts = demoAccounts.filter(acc => acc.role === "companion");

    console.log("\n👵 ELDERLY USERS (3):\n");
    elderlyAccounts.forEach(acc => {
      console.log(`  📧 ${acc.email}`);
      console.log(`  🔑 ${acc.password}`);
      console.log(`  👤 ${acc.name}\n`);
    });

    console.log("\n🧑‍⚕️  COMPANION USERS (3):\n");
    companionAccounts.forEach(acc => {
      console.log(`  📧 ${acc.email}`);
      console.log(`  🔑 ${acc.password}`);
      console.log(`  👤 ${acc.name} - $${acc.hourlyRate}/hr\n`);
    });

    console.log("═".repeat(70));
    console.log("\n✨ Demo accounts are ready to use!");
    console.log("   Go to: http://localhost:3000");
    console.log("   Login with any email/password combination above\n");

  } catch (error) {
    console.error("❌ Error seeding demo accounts:", error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("📊 Database connection closed\n");
  }
}

// Run seeder
seedDemoAccounts();
