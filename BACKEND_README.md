# CareNest - MongoDB Backend Integration

## Setup Instructions

### 1. Install Backend Dependencies
```bash
npm install
```

This installs both frontend and backend dependencies.

### 2. Configure MongoDB Atlas Connection

Edit the `.env` file in the root directory and add your MongoDB Atlas connection string:

```
MONGO_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/carenest?retryWrites=true&w=majority
```

### 3. Start the Application

**Option A: Run frontend and backend separately**
```bash
# Terminal 1 - Start backend server
npm run server

# Terminal 2 - Start React frontend
npm start
```

**Option B: Run both concurrently**
```bash
npm run dev
```

### 4. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health check: http://localhost:5000/api/health

### 5. Test the Flow

1. Open http://localhost:3000
2. Sign up as "Elderly" user
3. Sign up as "Companion" user (in incognito/different browser)
4. Elderly dashboard: Browse and hire companions
5. Companion dashboard: View and accept job requests

### API Endpoints

**Authentication**
- POST /api/auth/signup - Register new user
- POST /api/auth/login - Login user

**Marketplace**
- GET /api/marketplace/companions - Get all companions
- GET /api/marketplace/companions/:id - Get companion by ID
- GET /api/marketplace/requests - Get job requests
- POST /api/marketplace/requests - Create job request
- POST /api/marketplace/requests/:id/accept - Accept job request

### Environment Variables

Create a `.env` file based on `.env.example`:

```
MONGO_URI=<your-mongodb-atlas-uri>
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### Troubleshooting

**MongoDB Connection Issues**
- Verify your Atlas connection string is correct
- Check IP whitelist in Atlas (Network Access)
- Ensure database user credentials are correct

**Port Already in Use**
- Change PORT in `.env` file
- Kill process using port: `netstat -ano | findstr :5000`

**CORS Errors**
- Verify CLIENT_URL in `.env` matches your frontend URL
- Check browser console for specific CORS errors
