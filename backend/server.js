const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Global query timeout to avoid "buffering timed out after 10000ms" crashes
mongoose.set('bufferCommands', false);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/admins', require('./routes/adminRoutes'));
app.use('/players', require('./routes/playerRoutes'));
app.use('/teams', require('./routes/teamRoutes'));
app.use('/groups', require('./routes/groupRoutes'));
app.use('/matches', require('./routes/matchRoutes'));
app.use('/statistics', require('./routes/statisticRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));

app.get('/', (req, res) => {
    res.send('API is running...');
});
const path = require('path');

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));

    app.use((req, res) => {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
}

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: err.message || 'Server Error',
        message: 'A backend error occurred. If this is a database timeout, ensure MongoDB is running.'
    });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server due to database connection error');
        process.exit(1);
    }
};

startServer();
