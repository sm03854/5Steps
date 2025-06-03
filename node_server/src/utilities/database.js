import mysql from "mysql2/promise";



const DB_HOST = "mysql";
const DB_USER = "root";
const DB_NAME = "five_steps_db";
const DB_PASSWORD = "password";
const DB_PORT = process.env.DB_PORT;



// Creating a connection pool instead of holding one main connection
// prevents the database from timing out when the connection isn't
// being used for a long time.
const pool = mysql.createPool
({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: DB_PORT,
    connectionLimit: 10000,
    waitForConnections: true,
    enableKeepAlive: true, // reduces idle disconnect issues
    keepAliveInitialDelay: 10000 // 10 seconds
});



export { pool };