# 🎯 CareNest Demo Login Credentials (Quick Reference)

## 👵 ELDERLY USERS - Click "Elderly Login" to Test

| Name | Email | Password | Location | Purpose |
|------|-------|----------|----------|---------|
| **Margaret Johnson** | elderly.demo@carenest.com | PasswordElderly@1 | San Francisco, CA | Test job posting creation |
| **Robert Williams** | elderly2.demo@carenest.com | PasswordElderly@2 | New York, NY | Test care assessment quiz |
| **Susan Anderson** | elderly3.demo@carenest.com | PasswordElderly@3 | Los Angeles, CA | Test booking companions |

---

## 🧑‍⚕️ COMPANION USERS - Click "Companion Login" to Test

| Name | Email | Password | Rate | Rating | Purpose |
|------|-------|----------|------|--------|---------|
| **Emily Chen** | companion.demo@carenest.com | PasswordCompanion@1 | $25/hr | 4.8⭐ | Companionship specialist |
| **Michael Rodriguez** | companion2.demo@carenest.com | PasswordCompanion@2 | $30/hr | 4.9⭐ | Dementia care specialist |
| **Jessica Thompson** | companion3.demo@carenest.com | PasswordCompanion@3 | $20/hr | 4.7⭐ | Activity & transport |

---

## 🚀 Quick Start (3 Steps)

### Step 1: Start the Server
```bash
# Terminal 1: Start backend
cd c:\Users\Tashrik Halim\OneDrive\Desktop\project\care_nest
node server/server.js

# Expected: "🚀 CareNest server running on port 5000"
```

### Step 2: Start React App
```bash
# Terminal 2: Start frontend
cd c:\Users\Tashrik Halim\OneDrive\Desktop\project\care_nest
npm start

# Expected: Opens http://localhost:3000 in browser
```

### Step 3: Login with Demo Account
```
Go to http://localhost:3000
Click "Elderly Login" or "Companion Login"
Enter email and password from table above
Click Sign In
```

---

## 🧪 What to Test

### ✅ Elderly Users Can:
- Browse available companions
- Search by specialization, location, rate
- View detailed companion profiles with ratings
- Send messages to companions
- **POST JOB LISTINGS** (new feature!)
- **TAKE CARE ASSESSMENT QUIZ** (new feature!)
- Book companions for specific dates/times
- Leave reviews and ratings
- Emergency contact management
- Mood tracking
- Daily health check-ins

### ✅ Companion Users Can:
- View profile with ratings and reviews
- Manage availability and schedule
- Browse job postings from elderly users (new feature!)
- Accept/reject job applications
- Receive and respond to messages
- Update skills and specializations
- See booking requests and notifications
- Manage dashboard

---

## 💡 Testing Scenarios

### Scenario 1: Browse Companions (5 min)
1. Login as Margaret Johnson (elderly.demo@carenest.com : DemoPassword@123)
2. Click "Search Companions"
3. Filter by location or rate
4. Click Emily Chen's profile
5. Click "View Details" or "Message"

### Scenario 2: Create Job Posting (5 min)
1. Login as Robert Williams (elderly2.demo@carenest.com : DemoPassword@456)
2. From Navbar, click "💼 Job Postings"
3. Click "+ Create New Job Posting"
4. Fill the form:
   - Job Title: "Help with Gardening"
   - Care Type: "Companionship"
   - Hours/Week: 5
   - Hourly Rate: 20
   - Start Date: Pick future date
5. Click "Create Job"

### Scenario 3: Care Assessment Quiz (3 min)
1. Login as Susan Anderson (elderly3.demo@carenest.com : DemoPassword@789)
2. From Navbar, click "📋 Care Assessment"
3. Answer 6 questions about care needs
4. Get personalized recommendations
5. See cost estimates

### Scenario 4: View Companion Profile (3 min)
1. Login as Michael Rodriguez (companion2.demo@carenest.com : DemoPassword@456)
2. Go to Dashboard
3. See your profile with 4.9⭐ rating (31 reviews)
4. View "Manage Availability"
5. Check your specializations

### Scenario 5: Send Message (3 min)
1. Login as any elderly account
2. Search for any companion
3. Click "Message" button
4. Type and send test message
5. Check notification badge in Navbar

### Scenario 6: Book a Companion (5 min)
1. Login as Margaret Johnson
2. Search for Emily Chen
3. Click "Book Now"
4. Fill booking form:
   - Start Date & Time
   - Hours needed
   - Services
5. Submit booking

---

## 🔐 Password Rules

All demo passwords follow these rules:
- ✅ 8+ characters
- ✅ Uppercase letter (D, P)
- ✅ Lowercase letters (emo, assword)
- ✅ Number (123, 456, 789)
- ✅ Special character (@)

**Format:** `DemoPassword@###`

---

## 📊 Database Schema for Demo Accounts

```javascript
// Elderly User Structure
{
  name: "Margaret Johnson",
  email: "elderly.demo@carenest.com",
  password: "bcrypt_hashed",
  role: "elderly",
  age: 72,
  bio: "...",
  location: {
    address: "123 Oak Street",
    city: "San Francisco",
    state: "CA",
    zipCode: "94105"
  },
  interests: ["reading", "gardening", "cooking", "movies"],
  verified: true
}

// Companion User Structure
{
  name: "Emily Chen",
  email: "companion.demo@carenest.com",
  password: "bcrypt_hashed",
  role: "companion",
  age: 28,
  hourlyRate: 25,
  specializations: ["companionship", "mobility-assistance", "medication-reminders"],
  skills: ["patient-care", "communication", "first-aid", "cooking"],
  rating: 4.8,
  reviewCount: 24,
  verified: true,
  availability: "Weekdays: 9AM-5PM, Weekends: flexible"
}
```

---

## 🛠️ Troubleshooting

### Error: "Account not found"
**Fix:** Check exact email spelling (case-sensitive)

### Error: "Invalid password"
**Fix:** Ensure no extra spaces, password is case-sensitive

### Error: "Cannot connect to database"
**Fix:** 
1. Verify MongoDB is running
2. Check `.env` has correct MONGO_URI
3. For Atlas: Ensure your IP is whitelisted

### Navbar doesn't show new features
**Fix:** 
1. Clear browser cache
2. Try incognito/private mode
3. Hard refresh (Ctrl+Shift+R)

---

## 📝 Features Overview

### NEW Features (Just Added)
- 💼 **Job Postings**: Create, manage care job requests
- 📋 **Care Assessment**: Interactive quiz for care needs

### Existing Features
- 🔍 Search & Filter companions
- 💬 Real-time messaging
- ⭐ Reviews & ratings
- 📅 Booking system
- 🏥 Health check-ins
- 😊 Mood tracker
- 🚨 Emergency contacts
- 📱 Mobile responsive
- 🔐 Secure authentication

---

## 🎯 Login URLs

```
Elderly Login:    http://localhost:3000/elderly-login
Companion Login:  http://localhost:3000/companion-login
Home Page:        http://localhost:3000/
```

---

## ⏱️ Estimated Testing Time

```
Basic Navigation:        5 minutes
Browse Companions:       5 minutes
Create Job Posting:      5 minutes
Care Assessment Quiz:    3 minutes
Messaging Features:      5 minutes
Booking Systems:         5 minutes
Emergency Contacts:      3 minutes
Total Full Workflow:     ~30 minutes
```

---

## 📞 Support

**Facing issues?** Check:
1. MongoDB is running
2. `.env` file is configured
3. Browser console for error messages
4. Clear cache and try again
5. Check `DEMO_ACCOUNTS.md` for detailed troubleshooting

---

**Status:** ✅ Ready to Test  
**Last Updated:** April 3, 2026  
**Available Accounts:** 6 (3 Elderly, 3 Companions)
