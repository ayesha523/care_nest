# 🎯 CareNest Demo Accounts for Testing

## Quick Demo Accounts Reference

### 👵 ELDERLY USERS (For Testing as Care Seeker)

#### Account 1: Margaret Johnson
- **Email:** `elderly.demo@carenest.com`
- **Password:** `PasswordElderly@1`
- **Role:** Elderly User
- **Age:** 72
- **Location:** San Francisco, CA
- **Interests:** Reading, Gardening, Cooking, Movies
- **Bio:** Retired teacher, love reading and gardening

#### Account 2: Robert Williams
- **Email:** `elderly2.demo@carenest.com`
- **Password:** `PasswordElderly@2`
- **Role:** Elderly User
- **Age:** 68
- **Location:** New York, NY
- **Interests:** Chess, Technology, Walking, Music
- **Bio:** Former engineer, enjoy chess and technology

#### Account 3: Susan Anderson
- **Email:** `elderly3.demo@carenest.com`
- **Password:** `PasswordElderly@3`
- **Role:** Elderly User
- **Age:** 75
- **Location:** Los Angeles, CA
- **Interests:** Crafts, Family, Cooking, Gardening
- **Bio:** Love spending time with family and crafts

---

### 🧑‍⚕️ COMPANION USERS (For Testing as Care Provider)

#### Account 1: Emily Chen
- **Email:** `companion.demo@carenest.com`
- **Password:** `PasswordCompanion@1`
- **Role:** Companion
- **Age:** 28
- **Hourly Rate:** $25/hour
- **Location:** San Francisco, CA
- **Rating:** 4.8⭐ (24 reviews)
- **Specializations:** Companionship, Mobility Assistance, Medication Reminders
- **Skills:** Patient Care, Communication, First Aid, Cooking
- **Bio:** Passionate caregiver with 5 years experience in elderly care
- **Availability:** Weekdays 9AM-5PM, Weekends Flexible

#### Account 2: Michael Rodriguez
- **Email:** `companion2.demo@carenest.com`
- **Password:** `PasswordCompanion@2`
- **Role:** Companion
- **Age:** 32
- **Hourly Rate:** $30/hour
- **Location:** New York, NY
- **Rating:** 4.9⭐ (31 reviews)
- **Specializations:** Dementia Care, Meal Prep, Housekeeping
- **Skills:** Dementia Care, Nutrition, Patience, Organization
- **Bio:** Certified caregiver specializing in dementia care
- **Availability:** Flexible hours, available for long-term care

#### Account 3: Jessica Thompson
- **Email:** `companion3.demo@carenest.com`
- **Password:** `PasswordCompanion@3`
- **Role:** Companion
- **Age:** 26
- **Hourly Rate:** $20/hour
- **Location:** Los Angeles, CA
- **Rating:** 4.7⭐ (18 reviews)
- **Specializations:** Companionship, Transportation
- **Skills:** Active Listening, Organization, Driving, Tech Support
- **Bio:** Young, energetic companion for activities and companionship
- **Availability:** Afternoons and weekends preferred

---

## 📋 How to Use Demo Accounts

### Option 1: Automatic Setup (Recommended)

```bash
# Make sure MongoDB is running and .env is configured
# Then run the seed script:
node seed-demo-accounts.js

# Expected output:
# ✅ Created 👵 ELDERLY: Margaret Johnson
# ✅ Created 👵 ELDERLY: Robert Williams
# ✅ Created 👵 ELDERLY: Susan Anderson
# ✅ Created 🧑‍⚕️ COMPANION: Emily Chen
# ✅ Created 🧑‍⚕️ COMPANION: Michael Rodriguez
# ✅ Created 🧑‍⚕️ COMPANION: Jessica Thompson
```

### Option 2: Manual Entry in Browser

1. Go to `http://localhost:3000`
2. Click "Elderly Sign Up"
3. Enter any of the elderly demo credentials above
4. For companion testing, click "Companion Sign Up"
5. Enter any of the companion demo credentials above

### Option 3: Manual MongoDB Insert

```javascript
// Open MongoDB Compass or MongoDB CLI
// Use CareNest database
// Add new documents to users collection with the schema below
```

---

## 🧪 Testing Workflows

### Workflow 1: Browsing Companions (As Elderly User)
1. Login as Margaret Johnson (elderly.demo@carenest.com)
2. Go to "Search Companions" or Dashboard
3. View available companions
4. Click on Emily Chen profile
5. Check availability and rate
6. Click "Book Now" to test booking

### Workflow 2: Creating a Job Posting (As Elderly User)
1. Login as Robert Williams (elderly2.demo@carenest.com)
2. Go to "Job Postings" from Navbar
3. Click "+ Create New Job Posting"
4. Fill in details:
   - Job Title: "Companion for Weekly Outings"
   - Care Type: "Companionship"
   - Hours/Week: 5
   - Hourly Rate: $25
   - Start Date: Pick a future date
5. Click "Create Job"
6. See job listed in your postings

### Workflow 3: Taking Care Assessment Quiz (As Elderly User)
1. Login as Susan Anderson (elderly3.demo@carenest.com)
2. Go to "Care Assessment" from Navbar
3. Answer 6 assessment questions:
   - Independence level
   - Health conditions
   - Activities needing help
   - Living arrangement
   - Monthly budget
   - Care timeline
4. Click "Next" through all questions
5. View personalized recommendations
6. Get suggested hourly rate and care type

### Workflow 4: Viewing Profile as Companion
1. Login as Emily Chen (companion.demo@carenest.com)
2. Go to "Dashboard"
3. View your profile with rating and reviews
4. Check "Manage Availability"
5. Update your available hours
6. View companion-specific features

### Workflow 5: Messaging Between Users
1. Login as Margaret Johnson (elderly.demo@carenest.com)
2. Search for Emily Chen companion
3. Click "Chat" or "Message"
4. Send test messages
5. Verify notifications in navbar

### Workflow 6: Leaving a Review
1. Login as Robert Williams (elderly2.demo@carenest.com)
2. Go to "Review a Companion"
3. Select Michael Rodriguez
4. Leave a 5-star review
5. Add text feedback
6. Submit review

### Workflow 7: Booking System
1. Login as Susan Anderson (elderly3.demo@carenest.com)
2. Go to "Search Companions"
3. Click any companion
4. Click "Book Now"
5. Fill booking details:
   - Start/End Date
   - Time
   - Services needed
   - Special notes
6. Submit booking
7. Companion receives notification

---

## 🔐 Password Requirements for New Accounts

When creating NEW accounts, passwords must have:
- ✅ At least 8 characters
- ✅ At least 1 uppercase letter (A-Z)
- ✅ At least 1 lowercase letter (a-z)
- ✅ At least 1 number (0-9)
- ✅ At least 1 special character (!@#$%^&*)

Example valid passwords:
- `PasswordCompanion@1` ✅
- `TestPass#456` ✅
- `MyCard!2024` ✅
- `password123` ❌ (no uppercase)
- `PASSWORD@123` ❌ (no lowercase)
- `Pass@99` ❌ (too short)

---

## 📱 Mobile Testing

All demo accounts work on mobile devices. Test at:
```
Phone/Tablet Size: 375px - 768px width
Landscape: 768px - 1024px width
Desktop: 1024px+
```

---

## 🐛 Troubleshooting Demo Accounts

### "Seed Script Failed - MongoDB Connection Error"
**Solution:**
1. Verify MongoDB is running:
   ```bash
   # Windows: Start MongoDB service
   # or use MongoDB Atlas connection (check .env)
   ```
2. Check `.env` has valid `MONGO_URI`
3. For Atlas: Ensure IP whitelist includes your machine
4. Try manual creation in MongoDB Compass instead

### "Login Failed - Account Not Found"
**Solution:**
1. Verify exact email spelling (case-sensitive in MongoDB)
2. Check account was created: Open MongoDB Compass
3. Look in `carenest.users` collection
4. If missing, manually insert using schema below

### "Password Incorrect"
**Solution:**
1. Copy password exactly from this document
2. Passwords are case-sensitive
3. Check for trailing spaces
4. If stuck, reset password in MongoDB:
   ```javascript
   // Update user password in MongoDB CLI or Compass
   db.users.updateOne(
     { email: "elderly.demo@carenest.com" },
     { $set: { password: "hashed_password_here" } }
   )
   ```

---

## 📊 Demo Data Includes

Each account comes pre-configured with:
- ✅ Complete profile information
- ✅ Location data
- ✅ Skills/specializations
- ✅ Interests and hobbies
- ✅ Profile pictures (placeholder)
- ✅ Ratings and reviews (companions)
- ✅ Availability (companions)
- ✅ Verification status

---

## 🎯 Features to Test with Demo Accounts

### Test as Elderly User:
- [ ] Browse and filter companions
- [ ] View detailed companion profiles
- [ ] Send messages to companions
- [ ] Create job postings
- [ ] Apply to view job applicants
- [ ] Take care assessment quiz
- [ ] Book companions
- [ ] Leave reviews
- [ ] Manage emergency contacts
- [ ] Track mood and health
- [ ] Set up daily check-ins

### Test as Companion User:
- [ ] View profile
- [ ] Update availability
- [ ] Receive booking notifications
- [ ] Accept/reject jobs
- [ ] Message elderly users
- [ ] View ratings and reviews
- [ ] See job applications
- [ ] Update skills and specialization
- [ ] Check notifications
- [ ] Manage dashboard

---

## 📞 Need Help?

If demo accounts aren't working:
1. Check MongoDB is running
2. Verify `.env` file has correct `MONGO_URI`
3. Clear browser cache and localStorage
4. Try incognito/private browsing
5. Check browser console for errors
6. Reset by deleting users collection and re-running seed script

---

**Generated:** April 3, 2026  
**Status:** ✅ Ready for Testing  
**Test Duration:** ~1-2 hours for full workflow

