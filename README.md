# Tournament Management System - Fullstack

A professional tournament management system built with the MERN stack (MongoDB, Express, React, Node.js).

## Features
-   **Tournament Dashboard**: View and manage players, teams, matches, and groups.
-   **Match Calendar**: Track upcoming, live, and finished matches.
-   **Team Rosters**: Detailed lists of players for each team.
-   **Statistics**: Real-time updates for match scores and player performance.
-   **Admin Control**: Secure login and password reset via Gmail.

## Tech Stack
-   **Frontend**: React (Vite), Lucide-React for icons, CSS for styling.
-   **Backend**: Node.js, Express, Mongoose.
-   **Database**: MongoDB Atlas.
-   **Email**: Nodemailer with Gmail SMTP.

---

## Deployment Instructions

### 1. Backend (Railway)
1.  **Fork/Clone** the repository on GitHub.
2.  Log in to [Railway.app](https://railway.app/).
3.  Click **New Project** > **Deploy from GitHub repository**.
4.  Add the following **Environment Variables** in Railway:
    -   `MONGO_URI`: Your MongoDB Atlas connection string.
    -   `PORT`: 5000 (Railway will assign one automatically).
    -   `EMAIL_USERNAME`: Your Gmail address.
    -   `EMAIL_PASSWORD`: Your Gmail [App Password](https://myaccount.google.com/apppasswords).
    -   `NODE_ENV`: `production`
5.  Railway will automatically deploy the `backend` folder as the root if configured, or use the root with a `start` script.

### 2. Frontend (Vercel)
1.  Log in to [Vercel](https://vercel.com/).
2.  Click **Add New** > **Project** and select your GitHub repository.
3.  In **Environment Variables**, add:
    -   `VITE_API_URL`: The URL of your deployed Railway app (e.g., `https://your-app.up.railway.app`).
4.  Configure the build settings:
    -   **Build Command**: `npm run build`
    -   **Output Directory**: `dist`
5.  Click **Deploy**.

---

## Local Setup

### Backend
```bash
cd backend
npm install
# Create a .env file based on .env.example
npm run dev
```

### Frontend
```bash
npm install
# Create a .env file based on .env.example
npm run dev
```

## .env Files Examples

### Backend (.env)
```env
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
EMAIL_USERNAME=you@gmail.com
EMAIL_PASSWORD=yourpass
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
```
