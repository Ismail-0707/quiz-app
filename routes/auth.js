// Import the express module
const express = require('express');

// Create a router object from express (used to define routes separately)
const router = express.Router();

// Import the database connection from db.js
const db = require('../db');


// This POST route will be triggered when the form submits to /auth/register
router.post('/register', (req, res) => {
  // Get the values sent from the form (name, email, password)
  const { fullname, email, password } = req.body;

  // SQL query to insert the user details into the "users" table
  const sql = 'INSERT INTO users (fullname, email, password) VALUES (?, ?, ?)';

  // Run the SQL query with provided values
  db.query(sql, [fullname, email, password], (err, result) => {
    if (err) {
      // If there's any error while inserting (like duplicate email, connection issue), show this message
      console.error('❌ Error inserting user:', err);
      res.send('Registration failed.');
    } else {
      // If successfully inserted into database
      console.log('✅ User registered:', result);
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


    }
  });
});

//post route for login

router.post('/login',(req,res) => {
  const {email, password } = req.body;
  console.log('📥 Login attempt:', email, password);
  //checking if user email and password exists
  const sql='SELECT * FROM users WHERE email = ?' ;
  db.query(sql,[email],(err,results) => {
    if(err)
    {
      console.error('❌ Login query error:', err);
      return res.send('Login failed due to server error');
    }

    if(results.length == 0)
    {
      //user found
      res.send('Email not found!');
    }
    const user = results[0];
    
    if(user.password !== password)
    {
      return res.send('Invalid Password!');
    }

    res.send(`✅ Login successful! Welcome, ${user.fullname}`);

  });
});

// Export this router so that app.js can use it
module.exports = router;
