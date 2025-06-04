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



/**
 * Executes multiple SQL queries (defined in 'callback') in a transaction.
 * If there are any errors in the transaction, it will be 'rolled back',
 * meaning none of the SQL queries save to the database, else, it will
 * be commited.
 * Prevents errors with INSERT queries where half of the queries insert
 * data but the other half causes an error, leading to half-half data in
 * the database.
 * @param {*} callback SQL queries to execute
 * @returns 
 */
export async function executeTransaction(callback)
{
    const conn = await pool.getConnection();

    try 
    {
        await conn.beginTransaction();
        const result = await callback(conn);
        await conn.commit();
        return result;
    } 
    catch (e) 
    {
        await conn.rollback();
        throw e;
    } 
    finally 
    {
        conn.release();
    }
}



export { pool };