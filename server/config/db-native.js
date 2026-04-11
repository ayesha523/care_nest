/**
 * MongoDB Native Driver Connection
 * Uses the native MongoDB driver instead of Mongoose for better SRV support
 */

const { MongoClient, ServerApiVersion } = require("mongodb");

let client;
let db;

const connectDB = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI ||
      "mongodb+srv://tashrik_halim:404ilovesuki@carenest.hlkwku3.mongodb.net/?appName=CareNest";

    const options = {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      maxPoolSize: 10,
      minPoolSize: 5,
    };

    console.log("🔄 Connecting to MongoDB Atlas...");
    client = new MongoClient(mongoUri, options);

    // Test the connection
    await client.connect();
    await client.db("admin").command({ ping: 1 });

    db = client.db("carenest");

    console.log("✅ MongoDB Atlas Connected Successfully");
    console.log(`✅ Database: carenest`);

    return db;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error("💡 Check your internet connection and credentials");
    process.exit(1);
  }
};

const getDB = () => {
  if (!db) {
    throw new Error("Database not initialized. Call connectDB first.");
  }
  return db;
};

const closeDB = async () => {
  if (client) {
    await client.close();
  }
};

module.exports = { connectDB, getDB, closeDB };
