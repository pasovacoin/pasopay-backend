const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('../config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
    res.send('Payment App Backend Running');
});

// Import and use routes
const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallet');
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

