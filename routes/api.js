// routes/api.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // uses your db.js connection

// Middleware to ensure user is authenticated for certain API routes
function ensureAuthenticated(req, res, next) {
    // Check if req.session exists and contains the user's email
    if (req.session && req.session.email) {
        next(); // User is logged in, proceed to the next handler
    } else {
        // User is not logged in or session is invalid/expired
        console.warn('⚠️ Unauthorized API access: User not logged in.');
        res.status(401).json({ success: false, message: 'Unauthorized: Please log in to access this resource.' });
    }
}

// Fetch 25 random questions for a given category
router.get('/questions/:category', (req, res) => {
    const category = req.params.category.toLowerCase();

    const query = `
        SELECT
          question, optionA, optionB, optionC, optionD, correctOption
        FROM questions
        WHERE category = ?
        ORDER BY RAND()
        LIMIT 25
    `;

    db.query(query, [category], (err, results) => {
        if (err) {
            console.error('❌ Error fetching questions:', err);
            return res.status(500).json({ success: false, message: 'Failed to load questions' });
        }

        // Backend correctly formats options into an array
        const formatted = results.map(q => ({
            question: q.question,
            options: [q.optionA, q.optionB, q.optionC, q.optionD], // This is correct for backend to send
            answer: q.correctOption // Assuming correctOption from DB is the answer
        }));

        res.json(formatted); // Frontend expects an array of question objects
    });
});

// Route to save user quiz scores
// Apply the ensureAuthenticated middleware to protect this route
router.post('/save-score', ensureAuthenticated, (req, res) => {
    // Now, req.session.email is guaranteed to exist due to ensureAuthenticated middleware
    const email = req.session.email; // Safely get the user's email from the session

    const { category, score, total } = req.body; // Get data from the request body

    // Basic validation for incoming data
    if (!category || score == null || total == null) {
        console.warn('❌ Missing data for saving score:', { category, score, total });
        return res.status(400).json({ success: false, message: 'Missing data for saving score.' });
    }

    const query = `
        INSERT INTO results (email, category, score, total)
        VALUES (?, ?, ?, ?)
    `;

    db.query(query, [email, category, score, total], (err, result) => {
        if (err) {
            console.error("❌ DB Error saving result:", err);
            // You might want to add more specific error handling here, e.g., for foreign key constraints
            // if (err.code === 'ER_NO_REFERENCED_ROW_2') { ... }
            return res.status(500).json({ success: false, message: 'Database error saving score.' });
        }

        console.log(`✅ Score saved for ${email} in category ${category}: ${score}/${total}`);
        res.json({ success: true, message: 'Score saved successfully!' });
    });
});

module.exports = router;