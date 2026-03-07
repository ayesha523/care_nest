# CareNest - Setup Guide for New PC

Follow these steps to run CareNest on a new computer.

## Prerequisites

**Only Node.js is required!** No database installation needed.

1. **Node.js** (v16 or higher)
   - Download from: https://nodejs.org/
   - Verify: `node --version` and `npm --version`

That's it! The project uses a cloud database, so you don't need to install MongoDB.

## Step-by-Step Setup

### 1. Copy Project Files
Copy the entire `carenest` folder to your new PC.

### 2. Install Dependencies
Open PowerShell in the project directory and run:
```powershell
npm install
```

This installs all required packages (React, Express, MongoDB driver, JWT, etc.)

### 3. Environment Variables (Already Configured)
The `.env` file is already included with cloud database connection. No changes needed!

If the `.env` file is missing, create it:

**Create a file named `.env` in the root directory with:**
```env
MONGO_URI=mongodb+srv://tashrik_halim:404ilovesuki@carenest.hlkwku3.mongodb.net/carenest
JWT_SECRET=dev_local_secret_change_me
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### 4. Start the Application

**Option A: Run Both Servers Together (Recommended)**
```powershell
npm run dev
```

This starts:
- Backend server on http://localhost:5000
- React dev server on http://localhost:3000

**Option B: Run Servers Separately**

Terminal 1 (Backend):
```powershell
npm run server
```

Terminal 2 (Frontend):
```powershell
npm start
```

### 6. Access the Application

Open your browser and go to:
```
http://localhost:3000
```

**Important:** Do NOT open the HTML files directly! Always use `http://localhost:3000`

## Troubleshooting

### "Authentication request failed" Error

**Cause:** Backend server is not running or database connection failed.

**Solution:**
1. Check if backend is running: `Get-NetTCPConnection -LocalPort 5000`
2. Check your internet connection (needed for cloud database)
3. Check backend logs in terminal for connection errors

### Port 5000 Already in Use

**Solution:**
```powershell
# Find process using port 5000
Get-NetTCPConnection -LocalPort 5000 | Select-Object OwningProcess

# Kill the process (replace XXXX with the process ID)
Stop-Process -Id XXXX -Force

# Or use:
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Where-Object { $_.OwningProcess -gt 0 } | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force }
```

### Database Connection Failed

**Check internet connection:**
The project uses MongoDB Atlas (cloud database), so you need an active internet connection.

**If you see connection timeout errors:**
1. Check your firewall settings
2. Make sure your PC can access cloud services
3. Try restarting the server: `npm run dev`

### Dependencies Not Installing

**Solution:**
```powershell
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json

# Reinstall
npm install
```

### React App Shows Blank Page

**Cause:** You might be opening the build files directly instead of using the dev server.

**Solution:**
- Make sure `npm run dev` or `npm start` is running
- Access via `http://localhost:3000` NOT `file:///...`

## Testing the Setup

Once both servers are running, test the authentication:

1. Go to `http://localhost:3000`
2. Click "Sign Up" for Elderly or Companion
3. Fill in the form with:
   - Name: Test User
   - Email: test@test.com
   - Password: Test123! (must have uppercase, lowercase, number, special char)
   - Confirm password
4. Click Sign Up

If successful, you'll be redirected to the dashboard.

## Default Users

The database starts empty. You need to create new accounts through the signup pages.

## Quick Start Commands

```powershell
# Full setup from scratch
npm install
npm run dev

# Then open browser to  (2 Steps!)

```powershell
# 1. Install dependencies
npm install

# 2. Start the app
npm run dev

# Then open browser to http://localhost:3000
```

**That's it!** No database installation, no complex setup. Just install and run! ├── components/        # Reusable UI components
│   ├── pages/            # Page components
│   ├── services/         # API services
│   └── context/          # Global state management
├── server/                # Express backend
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API endpoints
│   ├── middleware/       # Auth middleware
│   └── config/           # Database config
├── public/               # Static files
├── .env                  # Environment variables
└── package.json         # Dependencies
```

## Need Help?

Check the terminal output for error messages. Common issues are:
- MongoDB not running
- Backend server not started
- Accessing wrong URL (use localhost:3000)
- Missing .env file
