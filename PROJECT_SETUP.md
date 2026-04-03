# CareNest - Complete Setup & Installation Guide

## 🚀 Project Overview

CareNest is a comprehensive companion matching platform connecting elderly members with compassionate care companions. The application features real-time messaging, booking management, health tracking, safety verification, and an admin dashboard.

**Technology Stack:**
- **Frontend**: React 19.2 with React Router DOM 7.13
- **Backend**: Node.js with Express.js 4.22
- **Database**: MongoDB with Mongoose 8.23
- **Authentication**: JWT (jsonwebtoken 9.0.3)
- **Security**: bcryptjs 2.4.3 for password hashing

---

## 📋 Prerequisites

Before you begin, ensure you have installed:
- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v7.1 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Git** - [Download](https://git-scm.com/)
- **npm** (comes with Node.js)

---

## 🔧 Installation Steps

### Step 1: Clone or Extract the Project

```bash
# If cloning from Git
git clone <repository-url>
cd care_nest

# If already extracted
cd care_nest
```

### Step 2: Install Frontend Dependencies

```bash
npm install
```

This will install all required packages listed in `package.json`:
- react (19.2.4)
- react-router-dom (7.13.0)
- axios for HTTP requests

### Step 3: Install Backend Dependencies

```bash
cd server
npm install
```

Backend packages installed:
- express (4.22.1)
- mongoose (8.23.0)
- jsonwebtoken (9.0.3)
- bcryptjs (2.4.3)
- cors (2.8.5)
- dotenv (for environment variables)

### Step 4: Configure Environment Variables

Create a `.env` file in the `server` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/carenest
# OR for MongoDB Atlas:
MONGODB_ATLAS_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/carenest?retryWrites=true&w=majority

# JWT Secret (create a strong random string)
JWT_SECRET=your_super_secret_jwt_key_here_12345

# CORS Settings
CORS_ORIGIN=http://localhost:3000

# Email Configuration (Optional - for notifications)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Step 5: Start MongoDB

**Option A: Local MongoDB**
```bash
# Windows (if installed)
mongod

# macOS (with Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

**Option B: MongoDB Atlas (Cloud)**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get your connection string and update `MONGODB_ATLAS_URI` in `.env`

### Step 6: Start the Backend Server

```bash
cd server
npm start
# OR for development with auto-reload
npm run dev  # (if nodemon is installed)
```

Expected output:
```
Server running on port 5000
MongoDB connected successfully
```

### Step 7: Start the Frontend Application

In a new terminal (in the project root):

```bash
npm start
```

This will:
- Start the React development server
- Automatically open `http://localhost:3000` in your browser
- Enable hot reloading for code changes

---

## 📁 Project Structure

```
care_nest/
├── src/                          # Frontend (React)
│   ├── components/               # Reusable components
│   │   ├── Navbar.jsx
│   │   ├── AuthForm.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── ...
│   ├── pages/                    # Page components
│   │   ├── ElderlyDashboard.jsx
│   │   ├── CompanionDashboard.jsx
│   │   ├── SearchCompanions.jsx
│   │   ├── BookingPage.jsx
│   │   ├── ChatPage.jsx
│   │   ├── AdminPanel.jsx
│   │   └── ...
│   ├── context/                  # React Context
│   │   └── UserContext.jsx
│   ├── services/                 # API calls
│   │   ├── authService.js
│   │   └── marketplaceService.js
│   ├── styles/                   # CSS files
│   │   └── ... (11+ CSS files)
│   ├── App.js                    # Main App component
│   └── index.js                  # Entry point
│
├── server/                       # Backend (Express)
│   ├── models/                   # MongoDB schemas
│   │   ├── User.js               # User model
│   │   ├── Booking.js
│   │   ├── Review.js
│   │   ├── Message.js
│   │   ├── Conversation.js
│   │   ├── Notification.js
│   │   ├── Badge.js
│   │   ├── UserBadge.js
│   │   └── ... (11 total)
│   ├── routes/                   # API routes
│   │   ├── auth.js               # Authentication
│   │   ├── profile.js            # User profiles
│   │   ├── bookings.js           # Booking management
│   │   ├── reviews.js            # Review system
│   │   ├── messages.js           # Messaging
│   │   ├── search.js             # Search & recommendations
│   │   ├── notifications.js
│   │   ├── availability.js       # Availability scheduling
│   │   ├── trust-safety.js       # Safety features
│   │   ├── daily-checkin.js
│   │   ├── mood.js
│   │   ├── badges.js
│   │   ├── admin.js
│   │   └── marketplace.js
│   ├── middleware/               # Custom middleware
│   │   └── auth.js               # JWT verification
│   ├── config/                   # Configuration
│   │   └── db.js                 # Database connection
│   ├── server.js                 # Main server file
│   └── package.json
│
├── public/                       # Static files
├── build/                        # Production build (after npm run build)
├── package.json                  # Frontend dependencies
├── SETUP.md                      # This file
├── README.md                     # Project documentation
└── .env                          # Environment variables (create this)
```

---

## 🔐 User Roles & Access

### Elderly Member
- Sign up / Login
- Browse available companions
- Book companions for specific dates/times
- Message companions
- Track mood and daily health
- Write reviews
- Emergency contacts
- Daily check-ins
- View notifications

### Companion
- Sign up / Login
- Manage availability schedule
- View and accept booking requests
- Message elderly members
- Earn badges for achievements
- View ratings and reviews
- Manage profile

### Admin
- User management (verify, block)
- Monitor all bookings
- View platform statistics
- Review activity logs
- Manage platform policies

---

## 🧪 Testing the Application

### Create Test Accounts

1. **Elderly Account**
   - Go to http://localhost:3000
   - Click "Elderly Signup"
   - Enter test data:
     - Email: elderly@test.com
     - Password: Test@123456
     - Name: John Doe
     - Age: 75

2. **Companion Account**
   - Click "Companion Signup"
   - Enter test data:
     - Email: companion@test.com
     - Password: Test@123456
     - Name: Jane Smith
     - Skills: Reading, Cooking, Tech Help

3. **Admin Account** (manual database entry)
   ```bash
   # In MongoDB shell or via Compass
   db.users.insertOne({
     email: "admin@test.com",
     password: "hashed_password",
     role: "admin",
     name: "Admin User"
   })
   ```

### Test Key Features

- **Authentication**: Login with both accounts
- **Browsing**: Elderly account - browse companions
- **Booking**: Create a booking request
- **Messaging**: Send messages between elderly and companion
- **Reviews**: Leave reviews after bookings
- **Admin Panel**: Access /admin-panel as admin
- **Mood Tracking**: Log daily mood as elderly member
- **Emergency**: Test daily check-in feature

---

## 📚 API Endpoints Reference

### Authentication
```
POST   /api/auth/register        - Register new user
POST   /api/auth/login           - Login user
```

### User Profile
```
GET    /api/profile/:userId      - Get user profile
PUT    /api/profile/:userId      - Update profile
GET    /api/profile/search/all   - List all companions
```

### Bookings
```
POST   /api/bookings             - Create booking
GET    /api/bookings/:bookingId  - Get booking details
GET    /api/bookings/user/:userId - Get user bookings
PUT    /api/bookings/:id/accept  - Accept booking
PUT    /api/bookings/:id/reject  - Reject booking
PUT    /api/bookings/:id/cancel  - Cancel booking
```

### Reviews
```
POST   /api/reviews              - Submit review
GET    /api/reviews/companion/:id - Get reviews
```

### Messages
```
GET    /api/messages/conversations/all - All conversations
POST   /api/messages/conversations    - Start conversation
GET    /api/messages/:conversationId  - Get messages
POST   /api/messages/:conversationId  - Send message
```

### Additional Endpoints
- `/api/search/*` - Companion search & recommendations
- `/api/notifications/*` - Notification management
- `/api/availability/*` - Availability scheduling
- `/api/mood/*` - Mood tracking
- `/api/daily-checkin/*` - Health check-ins
- `/api/badges/*` - Achievement badges
- `/api/admin/*` - Admin operations

---

## 📊 Database Models

### User Schema
Fields: email, password, name, role, age, profilePicture, bio, skills[], interests[], location{}, rating, reviews[], badges[], isBlocked, blockedUsers[], etc.

### Booking Schema
Fields: elderId, companionId, startDate, endDate, duration, status, services[], totalCost, paymentStatus, etc.

### Message & Conversation
Track message history with read receipts and conversation threads.

### Notifications
9 notification types: booking_request, booking_confirmed, new_message, review_received, etc.

### Mood & Check-in
Daily mood tracking and health check-ins with mood distribution analytics.

### Badges & Achievements
Automatic badge awarding based on:
- Total volunteer hours
- 5-star ratings
- Number of completed bookings
- Identity verification
- Quick response rate

---

## 🐛 Troubleshooting

### "Cannot connect to MongoDB"
- ✅ Ensure MongoDB is running: `mongod` (local) or verify Atlas connection string
- ✅ Check `MONGODB_URI` in `.env` file
- ✅ Verify MongoDB is accessible on port 27017 (local)

### "CORS error" when calling API
- ✅ Ensure backend is running on port 5000
- ✅ Check `CORS_ORIGIN` in `.env` matches frontend URL
- ✅ Verify API calls use correct base URL: `http://localhost:5000`

### "Module not found" error
- ✅ Run `npm install` in both root and `server` directories
- ✅ Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### "Port already in use"
- ✅ Frontend default: 3000 (change with: `PORT=3001 npm start`)
- ✅ Backend default: 5000 (change in `.env`)
- ✅ Kill processes: `lsof -i :3000` / `lsof -i :5000`

### "JWT errors" or "Unauthorized"
- ✅ Ensure token is stored in localStorage after login
- ✅ Check JWT_SECRET in backend `.env`
- ✅ Verify token comes in Authorization header: `Bearer <token>`

---

## 🚀 Deployment

### Build for Production

```bash
# Frontend build
npm run build

# This creates an optimized `build/` folder ready for deployment
```

### Deploy to Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create Heroku app
heroku create your-carenest-app

# Set environment variables
heroku config:set MONGODB_URI="your_atlas_uri"
heroku config:set JWT_SECRET="your_secret"

# Deploy
git push heroku main
```

### Deploy to Vercel (Frontend only)

```bash
npm install -g vercel
vercel
```

---

## 📖 Additional Resources

- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [JWT Introduction](https://jwt.io/)

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/new-feature`
2. Commit changes: `git commit -am 'Add new feature'`
3. Push to branch: `git push origin feature/new-feature`
4. Submit a pull request

---

## 📞 Support

For issues or questions:
1. Check the [Troubleshooting](#-troubleshooting) section
2. Review API responses for error messages
3. Check browser console (F12) for JavaScript errors
4. Check terminal for server errors

---

## 📜 License

This project is part of an academic assignment for demonstrating full-stack MERN development capabilities.

---

**Last Updated**: $(date)
**Version**: 1.0.0
**Status**: ✅ Production Ready
