// MongoDB Playground - CareNest Database
// Connect to: mongodb://127.0.0.1:27017/carenest

// Switch to carenest database
use('carenest');

// ===== VIEW ALL USERS =====
db.users.find().limit(10);

// ===== COUNT USERS BY ROLE =====
db.users.aggregate([
  { 
    $group: { 
      _id: "$role", 
      count: { $sum: 1 },
      users: { $push: { name: "$name", email: "$email" } }
    } 
  }
]);

// ===== VIEW JOB REQUESTS =====
db.jobrequests.find();

// ===== VIEW COMPANIONS WITH THEIR DETAILS =====
db.users.find({ 
  role: "companion" 
}, {
  name: 1,
  email: 1,
  specializations: 1,
  hourlyRate: 1,
  bio: 1,
  rating: 1
});

// ===== FIND SPECIFIC USER BY EMAIL =====
db.users.findOne({ 
  email: "localjwt1772893390@carenest.com" 
});

// ===== GET JOB REQUESTS WITH USER DETAILS =====
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
  },
  {
    $project: {
      status: 1,
      hoursPerWeek: 1,
      hourlyRate: 1,
      startDate: 1,
      "elderlyName": { $arrayElemAt: ["$elderlyInfo.name", 0] },
      "companionName": { $arrayElemAt: ["$companionInfo.name", 0] }
    }
  }
]);

// ===== DATABASE STATS =====
db.stats();

// ===== COUNT DOCUMENTS =====
print("Total Users: " + db.users.countDocuments());
print("Total Requests: " + db.jobrequests.countDocuments());
