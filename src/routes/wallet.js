const express = require('express');
const pool = require('../../config/db');

const router = express.Router();

// Transaction History
router.get('/transactions/:user_id', async (req, res) => {
    const { user_id } = req.params;
    try {
        const transactions = await pool.query(
            `
            SELECT t.id, t.sender_id, t.receiver_id, t.amount, t.currency, t.type, t.status, t.created_at
            FROM transactions t
            WHERE t.sender_id = $1 OR t.receiver_id = $1
            ORDER BY t.created_at DESC
            `,
            [user_id]
        );

        res.json(transactions.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Withdraw Money
router.post('/withdraw', async (req, res) => {
    const { user_id, amount, currency } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const userWallet = await client.query(
            "SELECT * FROM wallets WHERE user_id = $1 AND currency = $2",
            [user_id, currency]
        );

        if (userWallet.rows.length === 0) {
            throw new Error('Wallet not found');
        }

        if (userWallet.rows[0].balance < amount) {
            throw new Error('Insufficient balance for withdrawal');
        }

        await client.query(
            "UPDATE wallets SET balance = balance - $1 WHERE id = $2",
            [amount, userWallet.rows[0].id]
        );

        await client.query(
            "INSERT INTO transactions (sender_id, receiver_id, wallet_id, currency, amount, type, status) VALUES ($1, NULL, $2, $3, $4, 'withdraw', 'success')",
            [user_id, userWallet.rows[0].id, currency, amount]
        );

        await client.query('COMMIT');
        res.json({ message: "Withdrawal successful" });

    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});
router.get('/transactions/sent/:user_id', async (req, res) => {
    const { user_id } = req.params;
    try {
        const sentTransactions = await pool.query(
            `
            SELECT t.id, t.sender_id, t.receiver_id, t.amount, t.currency, t.type, t.status, t.created_at
            FROM transactions t
            WHERE t.sender_id = $1
            ORDER BY t.created_at DESC
            `,
            [user_id]
        );

        // 🔥 Add formatting here
        const formatted = sentTransactions.rows.map(txn => ({
            ...txn,
            sign: "-",
            display_amount: `-${Number(txn.amount).toFixed(2)}`
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/transactions/received/:user_id', async (req, res) => {
    const { user_id } = req.params;
    try {
        const receivedTransactions = await pool.query(
            `
            SELECT t.id, t.sender_id, t.receiver_id, t.amount, t.currency, t.type, t.status, t.created_at
            FROM transactions t
            WHERE t.receiver_id = $1
            ORDER BY t.created_at DESC
            `,
            [user_id]
        );

        // 🔥 Add formatting here
        const formatted = receivedTransactions.rows.map(txn => ({
            ...txn,
            sign: "+",
            display_amount: `+${Number(txn.amount).toFixed(2)}`
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

