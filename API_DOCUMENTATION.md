# CareNest API Documentation

## Base URL
```
http://localhost:5000
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## 📚 API Endpoints

### 🔐 Authentication Routes (`/api/auth`)

#### Register New User
```
POST /api/auth/register
```
**Body:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "Password@123",
  "role": "elderly" | "companion",
  "age": 75,
  "bio": "Looking for care companion"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "elderly"
    },
    "token": "jwt_token_here"
  }
}
```

#### Login
```
POST /api/auth/login
```
**Body:**
```json
{
  "email": "user@example.com",
  "password": "Password@123"
}
```

---

### 👥 Profile Routes (`/api/profile`)

#### Get User Profile
```
GET /api/profile/:userId
Headers: Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "user@example.com",
    "age": 75,
    "bio": "Looking for care companion",
    "profilePicture": "url",
    "rating": 4.8,
    "reviewCount": 12,
    "skills": ["reading", "cooking"],
    "location": {
      "address": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001"
    }
  }
}
```

#### Update Profile
```
PUT /api/profile/:userId
Headers: Authorization: Bearer <token>
```
**Body:** (Any of these fields can be updated)
```json
{
  "name": "John Doe",
  "bio": "New bio",
  "age": 76,
  "profilePicture": "url",
  "skills": ["reading", "cooking", "tech-help"],
  "interests": ["gardening", "music"],
  "hourlyRate": 25,
  "location": {
    "address": "456 Oak St",
    "city": "Boston",
    "state": "MA",
    "zipCode": "02101"
  }
}
```

#### Get All Companions
```
GET /api/profile/search/all
Headers: Authorization: Bearer <token>
```

#### Get User's Reviews
```
GET /api/profile/:userId/reviews
Headers: Authorization: Bearer <token>
```

#### Delete Account
```
DELETE /api/profile/:userId
Headers: Authorization: Bearer <token>
```

---

### 📅 Booking Routes (`/api/bookings`)

#### Create Booking Request
```
POST /api/bookings
Headers: Authorization: Bearer <token>
```
**Body:**
```json
{
  "companionId": "companion_id",
  "startDate": "2024-02-15T10:00:00",
  "endDate": "2024-02-15T14:00:00",
  "duration": 4,
  "services": ["reading", "tech-help"],
  "location": {
    "address": "123 Main St",
    "city": "New York"
  },
  "notes": "Need help with groceries"
}
```

#### Get Booking Details
```
GET /api/bookings/:bookingId
Headers: Authorization: Bearer <token>
```

#### Get User's Bookings
```
GET /api/bookings/user/:userId
Headers: Authorization: Bearer <token>
```

#### Accept Booking
```
PUT /api/bookings/:bookingId/accept
Headers: Authorization: Bearer <token>
```

#### Reject Booking
```
PUT /api/bookings/:bookingId/reject
Headers: Authorization: Bearer <token>
Body:
{
  "reason": "Not available on this date"
}
```

#### Cancel Booking
```
PUT /api/bookings/:bookingId/cancel
Headers: Authorization: Bearer <token>
Body:
{
  "reason": "Emergency came up"
}
```

#### Complete Booking
```
PUT /api/bookings/:bookingId/complete
Headers: Authorization: Bearer <token>
Body:
{
  "companionArrivalTime": "2024-02-15T10:05:00"
}
```

---

### ⭐ Review Routes (`/api/reviews`)

#### Submit Review
```
POST /api/reviews
Headers: Authorization: Bearer <token>
```
**Body:**
```json
{
  "companionId": "companion_id",
  "bookingId": "booking_id",
  "rating": 5,
  "comment": "Excellent service! Very caring and professional.",
  "categories": {
    "communication": 5,
    "reliability": 5,
    "skills": 4,
    "empathy": 5
  }
}
```

#### Get Companion's Reviews
```
GET /api/reviews/companion/:companionId
Headers: Authorization: Bearer <token>
```

#### Update Review
```
PUT /api/reviews/:reviewId
Headers: Authorization: Bearer <token>
Body:
{
  "rating": 4,
  "comment": "Updated comment"
}
```

#### Delete Review
```
DELETE /api/reviews/:reviewId
Headers: Authorization: Bearer <token>
```

---

### 💬 Message Routes (`/api/messages`)

#### Get All Conversations
```
GET /api/messages/conversations/all
Headers: Authorization: Bearer <token>
```

#### Start/Get Conversation with User
```
POST /api/messages/conversations
Headers: Authorization: Bearer <token>
Body:
{
  "recipientId": "other_user_id",
  "bookingId": "optional_booking_id"
}
```

#### Get Messages in Conversation
```
GET /api/messages/:conversationId
Headers: Authorization: Bearer <token>
```

#### Send Message
```
POST /api/messages/:conversationId
Headers: Authorization: Bearer <token>
Body:
{
  "content": "Hello! How are you?"
}
```

#### Mark Message as Read
```
PUT /api/messages/:messageId/read
Headers: Authorization: Bearer <token>
```

#### Delete Message (Soft Delete)
```
DELETE /api/messages/:messageId
Headers: Authorization: Bearer <token>
```

---

### 🔍 Search Routes (`/api/search`)

#### Search Companions with Filters
```
GET /api/search/companions?location=NewYork&minRating=4&maxRate=30&skills=cooking&volunteersOnly=true
Headers: Authorization: Bearer <token>
```

**Query Parameters:**
- `location`: City/location
- `minRating`: Minimum rating (1-5)
- `maxRate`: Maximum hourly rate
- `skills`: Comma-separated list of skills
- `volunteersOnly`: true/false

#### Get Companion Availability
```
GET /api/search/companion/:companionId/availability?startDate=2024-02-15&endDate=2024-02-22
Headers: Authorization: Bearer <token>
```

#### Get AI Recommendations
```
GET /api/search/recommendations
Headers: Authorization: Bearer <token>
```

---

### 🔔 Notification Routes (`/api/notifications`)

#### Get Notifications
```
GET /api/notifications?limit=20&skip=0
Headers: Authorization: Bearer <token>
```

#### Get Single Notification
```
GET /api/notifications/:notificationId
Headers: Authorization: Bearer <token>
```

#### Mark as Read
```
PUT /api/notifications/:notificationId/read
Headers: Authorization: Bearer <token>
```

#### Mark All as Read
```
PUT /api/notifications/read-all
Headers: Authorization: Bearer <token>
```

#### Delete Notification
```
DELETE /api/notifications/:notificationId
Headers: Authorization: Bearer <token>
```

---

### 📆 Availability Routes (`/api/availability`)

#### Add Availability Slot
```
POST /api/availability
Headers: Authorization: Bearer <token>
Body:
{
  "dayOfWeek": 3,
  "startTime": "09:00",
  "endTime": "17:00",
  "isRecurring": true,
  "specificDate": null
}
```

**Note:** `dayOfWeek`: 0 = Sunday, 6 = Saturday

#### Get Companion Availability
```
GET /api/availability/companion/:companionId
Headers: Authorization: Bearer <token>
```

#### Get Own Availability (Companion)
```
GET /api/availability/me/all
Headers: Authorization: Bearer <token>
```

#### Update Availability
```
PUT /api/availability/:availabilityId
Headers: Authorization: Bearer <token>
Body:
{
  "startTime": "09:00",
  "endTime": "18:00"
}
```

#### Delete Availability
```
DELETE /api/availability/:availabilityId
Headers: Authorization: Bearer <token>
```

---

### 🛡️ Trust & Safety Routes (`/api/trust-safety`)

#### Block User
```
POST /api/trust-safety/block-user/:userId
Headers: Authorization: Bearer <token>
```

#### Unblock User
```
POST /api/trust-safety/unblock-user/:userId
Headers: Authorization: Bearer <token>
```

#### Get Blocked Users
```
GET /api/trust-safety/blocked-users/all
Headers: Authorization: Bearer <token>
```

#### Verify Identity
```
POST /api/trust-safety/verify-identity
Headers: Authorization: Bearer <token>
Body:
{
  "verificationDocument": "file_url"
}
```

#### Check User Status
```
GET /api/trust-safety/user-status/:userId
Headers: Authorization: Bearer <token>
```

---

### ✅ Daily Check-in Routes (`/api/daily-checkin`)

#### Create Check-in
```
POST /api/daily-checkin
Headers: Authorization: Bearer <token>
Body:
{
  "status": "good" | "okay" | "needs_help" | "emergency",
  "notes": "Feeling better today"
}
```

#### Get All Check-ins
```
GET /api/daily-checkin/me/all
Headers: Authorization: Bearer <token>
```

#### Get Today's Check-in Status
```
GET /api/daily-checkin/today/status
Headers: Authorization: Bearer <token>
```

---

### 😊 Mood Routes (`/api/mood`)

#### Log Mood
```
POST /api/mood
Headers: Authorization: Bearer <token>
Body:
{
  "mood": "happy" | "neutral" | "sad",
  "moodScore": 4,
  "notes": "Had a great day!",
  "activities": ["walking", "visited_friend"]
}
```

#### Get Mood Logs
```
GET /api/mood/me/all?days=30
Headers: Authorization: Bearer <token>
```

**Response includes:**
- List of mood logs
- Average mood score
- Mood distribution statistics
- Most active days

#### Update Mood Log
```
PUT /api/mood/:moodLogId
Headers: Authorization: Bearer <token>
Body:
{
  "moodScore": 5,
  "notes": "Feeling even better!"
}
```

#### Delete Mood Log
```
DELETE /api/mood/:moodLogId
Headers: Authorization: Bearer <token>
```

---

### 🏆 Badge Routes (`/api/badges`)

#### Get All Badges
```
GET /api/badges
Headers: Authorization: Bearer <token>
```

#### Get User Badges
```
GET /api/badges/user/:userId
Headers: Authorization: Bearer <token>
```

#### Check and Award Badges
```
POST /api/badges/check-and-award/:userId
Headers: Authorization: Bearer <token>
```

*Automatically awards based on:*
- Total volunteer hours (volunteer_hours)
- 5-star ratings (5_stars)
- 10 completed bookings (10_bookings)
- Identity verified (verified_identity)
- Quick response rate (responds_quickly)

---

### 🔐 Admin Routes (`/api/admin`)

#### Get All Users
```
GET /api/admin/users?limit=50&skip=0
Headers: Authorization: Bearer <token>
Query: role=elderly|companion|all, blocked=true|false
```

#### Verify User Identity
```
PUT /api/admin/users/:userId/verify
Headers: Authorization: Bearer <token>
Body:
{
  "verified": true
}
```

#### Block User
```
PUT /api/admin/users/:userId/block
Headers: Authorization: Bearer <token>
Body:
{
  "block": true,
  "reason": "Violation of terms"
}
```

#### Unblock User
```
PUT /api/admin/users/:userId/unblock
Headers: Authorization: Bearer <token>
Body:
{
  "block": false
}
```

#### Get All Bookings
```
GET /api/admin/bookings?limit=50&skip=0
Headers: Authorization: Bearer <token>
```

#### Get Platform Statistics
```
GET /api/admin/stats
Headers: Authorization: Bearer <token>
```

**Returns:**
- Total users count
- Elderly members count
- Companions count
- Total bookings
- Total revenue
- Average rating

#### Get Activity Logs
```
GET /api/admin/logs?limit=100&skip=0
Headers: Authorization: Bearer <token>
```

---

## 🔄 WebSocket Events (Real-time Chat)

*Currently using polling (2-second intervals). Future: WebSocket implementation*

### Message Format
```json
{
  "event": "new_message",
  "data": {
    "conversationId": "conv_id",
    "senderId": "user_id",
    "content": "Hello!",
    "timestamp": "2024-02-15T10:30:00Z"
  }
}
```

---

## ⚠️ Error Responses

### Standard Error Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "Specific error details"
}
```

### Common Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad request
- **401**: Unauthorized (invalid/missing token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not found
- **500**: Server error

### Example Error Response
```json
{
  "success": false,
  "message": "User not found",
  "statusCode": 404
}
```

---

## 🔑 Authentication Headers

All protected endpoints require:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Tokens are valid for 7 days and should be stored in localStorage on the frontend.

---

## 📝 Data Validation

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (!@#$%^&*)

### Booking Duration
- Minimum: 1 hour
- Maximum: 8 hours per day
- Must be within companion's available hours

### Rating Limits
- Scale: 1-5 stars
- Category ratings: 1-5
- Average calculated from all reviews

---

## 🧪 Example Requests with cURL

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password@123"
  }'
```

### Get Profile
```bash
curl -X GET http://localhost:5000/api/profile/user_id \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Booking
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "companionId": "companion_id",
    "startDate": "2024-02-15T10:00:00",
    "endDate": "2024-02-15T14:00:00",
    "duration": 4
  }'
```

---

## 📖 API Testing Tools

Recommended tools for testing APIs:
- **Postman**: https://www.postman.com/
- **Insomnia**: https://insomnia.rest/
- **Thunder Client**: VS Code Extension
- **REST Client**: VS Code Extension

---

## 🚀 Rate Limiting

Currently: No rate limiting (implement for production)

Recommended limits:
- Login: 5 attempts per 15 minutes
- API calls: 100 per minute per user

---

**Last Updated**: 2024
**Version**: 1.0
**Status**: Complete API Documentation
