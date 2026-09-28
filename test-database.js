#!/usr/bin/env node

/**
 * Database Connection Verification Script
 * Tests the connection to PostgreSQL and queries the database
 */

const { Pool } = require('pg');
require('dotenv').config();

console.log('========================================');
console.log('MedFind Database Connection Test');
console.log('========================================\n');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'medfind',
});

async function testConnection() {
  try {
    console.log('🔄 Connecting to PostgreSQL...');
    const client = await pool.connect();
    console.log('✅ Connected successfully!\n');

    // Test 1: Get current timestamp
    console.log('Test 1: Database connectivity');
    const result1 = await client.query('SELECT NOW() as current_time');
    console.log('✅ Query successful');
    console.log(`   Current timestamp: ${result1.rows[0].current_time}\n`);

    // Test 2: Count medicines
    console.log('Test 2: Verify data in medicine table');
    const result2 = await client.query('SELECT COUNT(*) as count FROM medicine');
    console.log(`✅ Found ${result2.rows[0].count} medicines\n`);

    // Test 3: Count pharmacies
    console.log('Test 3: Verify data in pharmacy table');
    const result3 = await client.query('SELECT COUNT(*) as count FROM pharmacy');
    console.log(`✅ Found ${result3.rows[0].count} pharmacies\n`);

    // Test 4: Count inventory items
    console.log('Test 4: Verify data in inventory_item table');
    const result4 = await client.query('SELECT COUNT(*) as count FROM inventory_item');
    console.log(`✅ Found ${result4.rows[0].count} inventory items\n`);

    // Test 5: Sample data
    console.log('Test 5: Sample medicines available');
    const result5 = await client.query('SELECT id, name, strength FROM medicine LIMIT 3');
    result5.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.name} (${row.strength}) - ID: ${row.id}`);
    });
    console.log();

    // Test 6: Pharmacy locations
    console.log('Test 6: Sample pharmacies');
    const result6 = await client.query('SELECT id, name, city FROM pharmacy LIMIT 3');
    result6.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.name} (${row.city}) - ID: ${row.id}`);
    });
    console.log();

    client.release();

    console.log('========================================');
    console.log('✅ All tests passed!');
    console.log('========================================\n');
    console.log('Your backend is ready to use!');
    console.log('Run: npm start');
    console.log('Access: http://localhost:5000/api/test\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nTroubleshooting:');
    
    if (error.message.includes('password')) {
      console.error('- Check DB_PASSWORD in .env file');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('- Ensure PostgreSQL is running');
      console.error('- Check DB_HOST and DB_PORT in .env');
    } else if (error.message.includes('does not exist')) {
      console.error('- Run: npm run setup-db');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testConnection();
