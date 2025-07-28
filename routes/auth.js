// routes/auth.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // uses your db.js connection
const bcrypt = require('bcrypt'); // Import bcrypt
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Nodemailer transporter setup (ensure app password is correct and secure)
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'mahammadismail0707@gmail.com',
        pass: 'nrkroloveaulqlqf' // Use an app-specific password if 2FA is on
    }
});

// ===== REGISTER ROUTE =====
router.post('/register', async (req, res) => {
    const { fullname, email, password } = req.body;

    try {
        // Hash the password using bcrypt
        const hashedPassword = await bcrypt.hash(password, 10); // 10 is salt rounds

        const sql = 'INSERT INTO users (fullname, email, password) VALUES (?, ?, ?)';

        db.query(sql, [fullname, email, hashedPassword], (err, result) => {
            if (err) {
                console.error('❌ Error inserting user:', err);
                // More specific error handling for duplicate emails, etc.
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).send('Registration failed: Email already exists.');
                }
                return res.status(500).send('Registration failed due to server error.');
            }

            console.log('✅ User registered:', result);
            // Redirect or send JSON for frontend to handle
            res.send(`
                <!DOCTYPE html>
                <html>
                  <head>
                    <title>Registration Success</title>
                    <style>
                      body {
                        font-family: Arial, sans-serif;
                        text-align: center;
                        margin-top: 100px;
                        background-color: #f4f4f4;
                      }
                      .button {
                        padding: 10px 20px;
                        font-size: 16px;
                        background-color: #007bff;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        text-decoration: none;
                        display: inline-block;
                        transition: background-color 0.3s;
                        margin-top: 20px;
                      }
                      .button:hover {
                        background-color: #0056b3;
                      }
                    </style>
                  </head>
                  <body>
                    <h2 style="color: green;">✅ Registration successful!</h2>
                    <p>You can now log in to your account.</p>
                    <a href="/login.html" class="button">Go to Login</a>
                  </body>
                </html>
            `);
        });
    } catch (err) {
        console.error('❌ Bcrypt hashing error:', err);
        res.status(500).send('Error processing registration.');
    }
});

// ===== LOGIN ROUTE =====
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], async (err, results) => {
        if (err) {
            console.error('Login DB error:', err);
            return res.status(500).json({ success: false, message: 'Server error during login.' });
        }
        if (results.length === 0) {
            return res.status(401).json({ success: false, message: 'Email not found' });
        }

        const user = results[0];
        // Compare the provided password with the hashed password from the database
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({ success: false, message: 'Incorrect password' });
        }

        // FIX: Set the session variable BEFORE sending the response
        req.session.email = user.email;  // Store the user's email in the session
        req.session.fullname = user.fullname;           //store the user name

        // Optional: Store more user details if needed for other parts of the app
        // req.session.userId = user.id;
        // req.session.fullname = user.fullname;

        // Save the session to ensure changes are persisted before responding
        req.session.save((saveErr) => {
            if (saveErr) {
                console.error('❌ Error saving session after login:', saveErr);
                return res.status(500).json({ success: false, message: 'Login failed due to session error.' });
            }
            // Send success response with a redirect hint for the frontend
            res.json({ success: true, message: 'Login successful!', redirect: '/welcome.html' });
        });
    });
});

// ===== FORGOT PASSWORD ROUTE =====
router.post('/forgot-password', (req, res) => {
    const { email } = req.body;

    const token = crypto.randomBytes(32).toString('hex');
    const expiration = new Date(Date.now() + 900000); // 15 min from now

    const sql = 'UPDATE users SET reset_token = ?, reset_token_expiration = ? WHERE email = ?';
    db.query(sql, [token, expiration, email], (err, result) => {
        if (err) {
            console.error('❌ Error saving token:', err);
            return res.status(500).send('Server error. Try again.');
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('❌ Email not found!'); // Use 404 for not found
        }

        const resetLink = `http://localhost:3000/reset-password.html?token=${token}&email=${encodeURIComponent(email)}`;

        const mailOptions = {
            from: 'mahammadismail0707@gmail.com',
            to: email,
            subject: 'Password Reset',
            html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 15 minutes.</p>`
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error('❌ Email sending error:', err);
                return res.status(500).send('Failed to send email.');
            }
            res.redirect('/email-sent.html');
        });
    });
});

// ===== GET Reset Password Form (when user clicks email link) =====
router.get('/reset-password', (req, res) => {
    const { token } = req.query;

    // Use `NOW()` for MySQL's current timestamp comparison
    const sql = 'SELECT * FROM users WHERE reset_token = ? AND reset_token_expiration > NOW()';
    db.query(sql, [token], (err, results) => {
        if (err) {
            console.error('DB error fetching reset token:', err);
            return res.status(500).send('Server error validating token.');
        }
        if (results.length === 0) {
            return res.status(400).send('❌ Invalid or expired reset token.');
        }

        // If token is valid, render the password reset form (or redirect to it)
        res.sendFile(path.join(__dirname, '../public/reset-password.html'));
    });
});

// ===== POST Reset Password (after user submits new password) =====
router.post('/reset-password', async (req, res) => {
    const { email, token, newPassword } = req.body;

    const sql = `
        SELECT * FROM users
        WHERE email = ? AND reset_token = ? AND reset_token_expiration > NOW()
    `;

    db.query(sql, [email, token], async (err, results) => {
        if (err) {
            console.error('❌ DB error during reset password verification:', err);
            return res.status(500).send('Server error.');
        }

        if (results.length === 0) {
            return res.status(400).send('❌ Invalid or expired token');
        }

        try {
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            const updateSql = `
                UPDATE users
                SET password = ?, reset_token = NULL, reset_token_expiration = NULL
                WHERE email = ? AND reset_token = ?
            `;

            db.query(updateSql, [hashedPassword, email, token], (err) => {
                if (err) {
                    console.error('❌ Update error during password reset:', err);
                    return res.status(500).send('Error resetting password.');
                }
                res.send('✅ Password Updated successfully!');
            });
        } catch (hashErr) {
            console.error('❌ Hashing error during password reset:', hashErr);
            res.status(500).send('Failed to process password.');
        }
    });
});

// ===== LOGOUT ROUTE =====
router.get('/logout', (req, res) => {
    // Destroy the session
    req.session.destroy(err => {
        if (err) {
            console.error('❌ Logout error:', err);
            return res.status(500).send('Logout failed');
        }
        // Clear the session cookie
        res.clearCookie('connect.sid'); // 'connect.sid' is the default session cookie name
        res.redirect('/login.html');    // Redirect to login page after successful logout
    });
});


module.exports = router;