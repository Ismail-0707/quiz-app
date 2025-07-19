// importing mysql2 package

const mysql=require('mysql2');

//creating connection with database

const connection = mysql.createConnection( {
  host : 'localhost',
  user : 'root',
  password : 'ismail@2006',
  database : 'student_portal'
});

//connect and show success or error

connection.connect((err) => {
  if(err)
  {
    console.log('❌ DB Connection Failed:', err);
  }
  else
  {
    console.log('✅ Connected to MySQL Database!');
  }
});

//exporting connection to use in other files

module.exports = connection;