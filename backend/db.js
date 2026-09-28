const { Pool } = require('pg');
require('dotenv').config();

// Initiallize the PostgreSQL connection pool using environment variables 
const pool = new Pool({
user: process.env.DB_USER,
password: process.env.DB_PASSWORD,
host: process.env.DB_HOST,
port: process.env.DB_PORT,
database: process.env.DB_NAME,});

//Test the connection on startup
pool.connect((err, client, release) => { 
    if (err) {
        return console.error('Error acquiring client from pool:', err.stack);
    }
    console.log('Successfully connected to PostgreSQL database!');
    release(); //Return client to pool
});
// Export a helper function to execute queries across your application 
module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
};