#!/usr/bin/env node

/**
 * Database Initialization Script for MedFind
 * Usage: node setup-database.js
 * 
 * This script will:
 * 1. Create the 'medfind' database (if it doesn't exist)
 * 2. Create all necessary tables
 * 3. Insert sample data
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const config = {
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
};

const DB_NAME = process.env.DB_NAME || 'medfind';

async function setupDatabase() {
  let client = new Client(config);

  try {
    console.log('Connecting to PostgreSQL...');
    await client.connect();
    console.log('✓ Connected successfully');

    // Check if database exists
    const result = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [DB_NAME]
    );

    if (result.rows.length === 0) {
      console.log(`Creating database '${DB_NAME}'...`);
      await client.query(`CREATE DATABASE ${DB_NAME};`);
      console.log(`✓ Database '${DB_NAME}' created`);
    } else {
      console.log(`✓ Database '${DB_NAME}' already exists`);
    }

    await client.end();

    // Connect to the medfind database
    config.database = DB_NAME;
    client = new Client(config);
    await client.connect();
    console.log(`Connected to '${DB_NAME}' database`);

    // Read and execute the initialization script
    const sqlPath = path.join(__dirname, 'init-db.sql');
    if (!fs.existsSync(sqlPath)) {
      console.error('ERROR: init-db.sql not found!');
      process.exit(1);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Drop existing types if they exist (for re-running the script)
    try {
      await client.query('DROP TYPE IF EXISTS availability_status CASCADE;');
      await client.query('DROP TYPE IF EXISTS reservation_status CASCADE;');
    } catch (err) {
      // Types might not exist yet, that's ok
    }

    // Execute the SQL script
    console.log('Creating tables and inserting sample data...');
    await client.query(sql);
    console.log('✓ Database schema created successfully');

    // Verify tables
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    console.log('\n✓ Tables created:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Show record counts
    console.log('\n✓ Sample data inserted:');
    const tableNames = ['medicine', 'pharmacy', 'inventory_item', 'reservation'];
    for (const table of tableNames) {
      const count = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`  - ${table}: ${count.rows[0].count} records`);
    }

    console.log('\n✅ Database setup completed successfully!');
    console.log(`\nYou can now start the server with: node server.js`);

  } catch (error) {
    console.error('❌ Error during database setup:');
    console.error(error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.error('\nTroubleshooting:');
      console.error('1. Verify your PostgreSQL password in .env file');
      console.error('2. Ensure PostgreSQL is running');
      console.error('3. Check that your username/password are correct');
    } else if (error.message.includes('connect ECONNREFUSED')) {
      console.error('\nTroubleshooting:');
      console.error('1. Ensure PostgreSQL service is running');
      console.error('2. Verify host and port in .env (default: localhost:5432)');
    }
    
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
    }
  }
}

// Run the setup
console.log('========================================');
console.log('MedFind Database Setup');
console.log('========================================\n');

setupDatabase().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
