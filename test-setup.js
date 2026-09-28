#!/usr/bin/env node

/**
 * MedFind Database & Backend Verification Test Script
 * Tests database connection, tables, and API endpoints
 */

const { Client } = require('pg');
const http = require('http');
require('dotenv').config();

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║     MedFind Backend - Verification Test Script            ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

const config = {
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'medfind',
};

const SERVER_URL = `http://localhost:${process.env.PORT || 5000}`;

let testsPassed = 0;
let testsFailed = 0;

// Helper function to print test results
function logTest(name, passed, message = '') {
  const icon = passed ? '✅' : '❌';
  const status = passed ? 'PASS' : 'FAIL';
  console.log(`${icon} [${status}] ${name}`);
  if (message) console.log(`    └─ ${message}`);
  if (passed) testsPassed++;
  else testsFailed++;
}

// Test 1: Check environment variables
async function testEnvironmentVariables() {
  console.log('\n📋 TEST 1: Environment Configuration');
  console.log('─'.repeat(60));

  const requiredVars = ['DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_PORT', 'DB_NAME'];
  let allPresent = true;

  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      const displayValue = varName === 'DB_PASSWORD' ? '***' : value;
      logTest(`${varName} is set`, true, `Value: ${displayValue}`);
    } else {
      logTest(`${varName} is set`, false, 'Environment variable not found');
      allPresent = false;
    }
  });

  return allPresent;
}

// Test 2: Test PostgreSQL Connection
async function testDatabaseConnection() {
  console.log('\n🔗 TEST 2: PostgreSQL Connection');
  console.log('─'.repeat(60));

  const client = new Client(config);

  try {
    console.log(`Connecting to: ${config.host}:${config.port}/${config.database}`);
    await client.connect();
    logTest('Database connection', true, `Connected as user '${config.user}'`);

    // Test query
    const result = await client.query('SELECT NOW() as current_time');
    logTest('Query execution', true, `Server time: ${result.rows[0].current_time}`);

    await client.end();
    return true;
  } catch (err) {
    logTest('Database connection', false, err.message);
    return false;
  }
}

// Test 3: Verify database tables
async function testDatabaseTables() {
  console.log('\n📊 TEST 3: Database Schema');
  console.log('─'.repeat(60));

  const client = new Client(config);

  try {
    await client.connect();

    const expectedTables = ['medicine', 'pharmacy', 'inventory_item', 'reservation'];
    let allTablesExist = true;

    for (const table of expectedTables) {
      const result = await client.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`,
        [table]
      );

      const exists = result.rows[0].exists;
      if (exists) {
        // Get row count
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = countResult.rows[0].count;
        logTest(`Table: ${table}`, true, `${count} records`);
      } else {
        logTest(`Table: ${table}`, false, 'Table not found');
        allTablesExist = false;
      }
    }

    await client.end();
    return allTablesExist;
  } catch (err) {
    logTest('Schema verification', false, err.message);
    return false;
  }
}

// Test 4: Test sample data
async function testSampleData() {
  console.log('\n📦 TEST 4: Sample Data Integrity');
  console.log('─'.repeat(60));

  const client = new Client(config);

  try {
    await client.connect();

    // Check medicines
    const medicines = await client.query('SELECT COUNT(*) as count FROM medicine');
    logTest('Sample medicines', medicines.rows[0].count > 0, 
      `${medicines.rows[0].count} medicines in database`);

    // Check pharmacies
    const pharmacies = await client.query('SELECT COUNT(*) as count FROM pharmacy');
    logTest('Sample pharmacies', pharmacies.rows[0].count > 0, 
      `${pharmacies.rows[0].count} pharmacies in database`);

    // Check inventory
    const inventory = await client.query('SELECT COUNT(*) as count FROM inventory_item');
    logTest('Sample inventory', inventory.rows[0].count > 0, 
      `${inventory.rows[0].count} inventory items in database`);

    await client.end();
    return true;
  } catch (err) {
    logTest('Sample data', false, err.message);
    return false;
  }
}

// Test 5: Test API endpoint
async function testAPIEndpoint() {
  console.log('\n🌐 TEST 5: API Endpoint');
  console.log('─'.repeat(60));

  return new Promise((resolve) => {
    console.log(`Testing endpoint: ${SERVER_URL}/api/test`);

    const options = {
      hostname: 'localhost',
      port: process.env.PORT || 5000,
      path: '/api/test',
      method: 'GET',
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          logTest('API Response', res.statusCode === 200, 
            `Status: ${res.statusCode} - ${response.message}`);
          resolve(res.statusCode === 200);
        } catch (err) {
          logTest('API Response', false, `Invalid JSON response: ${data}`);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        logTest('API Server', false, 'Server not running on port 5000');
      } else {
        logTest('API Request', false, err.message);
      }
      resolve(false);
    });

    req.on('timeout', () => {
      logTest('API Request', false, 'Request timeout');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// Test 6: Test database queries
async function testDatabaseQueries() {
  console.log('\n🔍 TEST 6: Database Queries');
  console.log('─'.repeat(60));

  const client = new Client(config);

  try {
    await client.connect();

    // Test 1: Get medicine with inventory
    const medicineQuery = `
      SELECT m.id, m.name, COUNT(i.id) as locations
      FROM medicine m
      LEFT JOIN inventory_item i ON m.id = i.medicine_id
      GROUP BY m.id, m.name
      LIMIT 1
    `;
    const medicineResult = await client.query(medicineQuery);
    logTest('Join query (Medicine + Inventory)', medicineResult.rows.length > 0,
      medicineResult.rows.length > 0 ? `Found: ${medicineResult.rows[0].name}` : 'No data');

    // Test 2: Get pharmacy with inventory count
    const pharmacyQuery = `
      SELECT p.id, p.name, COUNT(i.id) as medicine_count
      FROM pharmacy p
      LEFT JOIN inventory_item i ON p.id = i.pharmacy_id
      GROUP BY p.id, p.name
      LIMIT 1
    `;
    const pharmacyResult = await client.query(pharmacyQuery);
    logTest('Pharmacy inventory count', pharmacyResult.rows.length > 0,
      pharmacyResult.rows.length > 0 ? `${pharmacyResult.rows[0].medicine_count} medicines at ${pharmacyResult.rows[0].name}` : 'No data');

    // Test 3: Filter by status
    const statusQuery = `
      SELECT COUNT(*) as count FROM inventory_item 
      WHERE status = 'AVAILABLE'
    `;
    const statusResult = await client.query(statusQuery);
    logTest('Status filter query', true,
      `${statusResult.rows[0].count} items available`);

    await client.end();
    return true;
  } catch (err) {
    logTest('Database queries', false, err.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('Starting verification tests...\n');

  const env = await testEnvironmentVariables();
  const connection = await testDatabaseConnection();

  if (!connection) {
    console.log('\n⚠️  Cannot proceed with schema tests - no database connection');
  } else {
    await testDatabaseTables();
    await testSampleData();
    await testDatabaseQueries();
  }

  await testAPIEndpoint();

  // Print summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    TEST SUMMARY                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📊 Total:  ${testsPassed + testsFailed}\n`);

  if (testsFailed === 0) {
    console.log('🎉 All tests passed! Your backend is ready to use.\n');
    console.log('Start the server with: npm start');
  } else {
    console.log('⚠️  Some tests failed. Review the output above for details.\n');
    console.log('Common issues:');
    console.log('1. PostgreSQL not running - Start PostgreSQL service');
    console.log('2. Wrong password in .env - Update DB_PASSWORD');
    console.log('3. Database not created - Run: npm run setup-db');
    console.log('4. Server not running - Run: npm start (in another terminal)\n');
  }

  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
