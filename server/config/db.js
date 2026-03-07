const mongoose = require("mongoose");
const dns = require("dns");

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

const connectDB = async () => {
  try {
    // Increased timeout for initial connection
    const options = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };

    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/carenest";
    
    console.log('🔄 Connecting to MongoDB...');
    let conn;

    try {
      conn = await mongoose.connect(mongoUri, options);
    } catch (error) {
      // Atlas SRV lookups can fail on some Windows DNS stacks; retry with public DNS.
      if (mongoUri.startsWith("mongodb+srv://") && isAtlasSrvDnsError(error)) {
        const dnsServers = getDnsServers();
        console.warn("⚠️ Atlas SRV lookup failed with system DNS. Retrying with:", dnsServers.join(", "));
        dns.setServers(dnsServers);
        conn = await mongoose.connect(mongoUri, options);
      } else {
        throw error;
      }
    }

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`✅ Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error("💡 Make sure MongoDB is running on port 27017");
    console.error("💡 Start MongoDB using: mongod");
    process.exit(1);
  }
};

module.exports = connectDB;
