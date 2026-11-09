const mysql = require('mysql');

const db = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: '', // Enter your MySQL password
    database: 'ecommerce' // Replace with your database name
});

// Test database connection
db.getConnection((err, connection) => {

    if (err) {
        console.error('Database connection failed:', err);
        return;
    }

    console.log('Database connected successfully');

    connection.release();
});

module.exports = db;