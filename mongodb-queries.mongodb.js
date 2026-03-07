/* MongoDB Playground for CareNest Database */

// Select the database
use('carenest');

// ===== VIEW ALL USERS =====
db.users.find({});

// ===== VIEW ELDERLY USERS ONLY =====
db.users.find({ role: 'elderly' });

// ===== VIEW COMPANION USERS ONLY =====
db.users.find({ role: 'companion' });

// ===== VIEW ALL JOB REQUESTS =====
db.jobrequests.find({});

// ===== VIEW OPEN JOB REQUESTS =====
db.jobrequests.find({ status: 'open' });

// ===== CREATE A NEW USER =====
// db.users.insertOne({
//   name: "Test User",
//   email: "test@example.com",
//   password: "$2a$10$hashedpassword", // This should be hashed
//   role: "elderly",
//   createdAt: new Date(),
//   updatedAt: new Date()
// });

// ===== UPDATE A USER =====
// db.users.updateOne(
//   { email: "test@example.com" },
//   { $set: { name: "Updated Name" } }
// );

// ===== DELETE A USER =====
// db.users.deleteOne({ email: "test@example.com" });

// ===== COUNT USERS BY ROLE =====
db.users.aggregate([
  { $group: { _id: "$role", count: { $sum: 1 } } }
]);

// ===== FIND USER BY EMAIL =====
db.users.findOne({ email: "localjwt1772893390@carenest.com" });

// ===== GET JOB REQUESTS WITH ELDERLY INFO =====
db.jobrequests.aggregate([
  {
    $lookup: {
      from: "users",
      localField: "elderlyId",
      foreignField: "_id",
      as: "elderlyInfo"
    }
  },
  {
    $lookup: {
      from: "users",
      localField: "companionId",
      foreignField: "_id",
      as: "companionInfo"
    }
  }
]);

// ===== DATABASE STATISTICS =====
db.stats();
