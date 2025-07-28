const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const path = require('path');
const session = require('express-session');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const PORT = 3000;

// Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'ismail@2006',
    database: 'student_portal'
});
db.connect(err => {
    if (err) {
        console.error('❌ Database connection failed:', err);
        return;
    }
    console.log('✅ Connected to MySQL Database');
});

// CORS
app.use(cors({
    origin: 'http://localhost:5500', // frontend origin
    credentials: true // allow session cookie from browser
}));

// Body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session
app.use(session({
    secret: 'mkLgsdfh98#$ghghw98yhsdd',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 day
        secure: false,
        httpOnly: true
    }
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

// Login Route (move to /auth if needed)
app.post('/auth/login', (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';

    db.query(sql, [email, password], (err, result) => {
        if (err) {
            console.error('Login error:', err);
            return res.status(500).json({ success: false });
        }

        if (result.length > 0) {
            req.session.email = result[0].email;

            req.session.save(() => {
                console.log("🔐 User logged in, session email:", req.session.email);
                return res.json({ success: true });
            });
        } else {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    });
});

// Scores Route
app.get('/myscores', (req, res) => {
    console.log("Session email:", req.session.email); // should log the correct email

    const email = req.session.email;
    if (!email) {
        return res.status(401).json([]);
    }

    const sql = 'SELECT category, score, total, taken_at FROM results WHERE email = ? ORDER BY taken_at DESC';
    db.query(sql, [email], (err, results) => {
        if (err) {
            console.error('Error fetching scores:', err);
            return res.status(500).json([]);
        }
        res.json(results);
    });
});


app.get('/api/user-info', (req, res) => {
  if (req.session && req.session.email) {
    res.json({ fullname: req.session.fullname }); // or send fullname if you store it
  } else {
    res.status(401).json({ message: 'Not logged in' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
