const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../../config/db');

const router = express.Router();
// Signup
router.post('/signup', async (req, res) => {
    const { full_name, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await pool.query(
            "INSERT INTO users (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING *",
            [full_name, email, hashedPassword]
        );

        // Create Wallet for new user
        await pool.query(
            "INSERT INTO wallets (user_id, currency, balance) VALUES ($1, 'USD', 0.00)",
            [newUser.rows[0].id]
        );

        // Give Welcome Bonus
        await pool.query(
            `
            INSERT INTO transactions (sender_id, receiver_id, wallet_id, currency, amount, type, status)
            VALUES (NULL, $1, (SELECT id FROM wallets WHERE user_id = $1), 'USD', 5.00, 'deposit', 'success')
            `,
            [newUser.rows[0].id]
        );

        // Update Wallet Balance
        await pool.query(
            `
            UPDATE wallets
            SET balance = balance + 5.00
            WHERE user_id = $1
            `,
            [newUser.rows[0].id]
        );

        res.status(201).json(newUser.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (user.rows.length === 0) return res.status(404).json({ error: "User not found" });

        const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
        if (!validPassword) return res.status(401).json({ error: "Invalid credentials" });

        const token = jwt.sign({ id: user.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

