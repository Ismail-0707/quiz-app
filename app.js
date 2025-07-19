const express=require('express');         //creating server
const bodyParser=require('body-parser');  //to read data sent by html
const mysql=require('mysql2');           //connecting to database
const path=require('path');               //to handle file paths
const authRoutes = require('./routes/auth');

const app=express();                      //creating express app
const PORT=3000;                          //port to run the server

app.use(express.static('public'));        //Serve all static files (HTML, CSS, etc.) from 'public' folder

/*This line helps my Node.js server understand form data.
It takes the form input (like name and password), and makes it easy for me to use in JavaScript.*/

app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
app.use('/auth',authRoutes);

//setting mysql database connection

const db=mysql.createConnection(
  {
      host:'localhost',
      user:'root',
      password:'ismail@2006',
      database:'student_portal'
  }
);

//connect to mysql

db.connect((err) => {
  if(err) throw err;                      //if error occurs stop and shows error
  console.log('✅ Connected to MySQL Database');
}
);

//Route: Handle POST requests when form is submitted from /register

app.post('/auth/register',(req,res) => {
  const { fullname, email, password} = req.body;           //extract form data from request

    //SQL query to insert the data into 'users' table

    const sql='INSERT INTO users ( fullname, email, password) VALUES (?, ?, ?)' ;  

    //Execute the query and insert data into the database

    db.query(sql,[fullname, email, password], (err,result) => {
      if(err)
      {
        console.error("Error Inserting User \n",err.sqlMessage || err);                                   //shows error if something went wrong
        return res.send('❌ Registration failed.');
      }
      res.send('✅ Registered Successfully!');
    });
});

app.listen(PORT, () => {
  console.log("🚀 Server running at http://localhost:${PORT}");
});