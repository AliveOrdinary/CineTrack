#!/usr/bin/env tsx

/**
 * Backup Recovery Testing Script
 * Tests backup monitoring and recovery procedures
 */

import { config } from 'dotenv';
import { DatabaseBackupManager, BackupMonitor, RecoveryProcedures } from '../lib/database-backup';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const PROJECT_ID = 'nlwyweawqapblohdnzkk';

async function testDatabaseConnectivity() {
  console.log('🔗 Testing Database Connectivity...');

  const manager = new DatabaseBackupManager(SUPABASE_URL, SUPABASE_KEY, PROJECT_ID);
  const result = await manager.testDatabaseConnectivity();

  if (result.success) {
    console.log(`✅ Database connection successful (${result.latency}ms)`);
  } else {
    console.log(`❌ Database connection failed: ${result.error}`);
  }

  return result.success;
}

async function testCriticalTables() {
  console.log('\n📋 Testing Critical Tables...');

  const manager = new DatabaseBackupManager(SUPABASE_URL, SUPABASE_KEY, PROJECT_ID);
  const result = await manager.validateCriticalTables();

  if (result.valid) {
    console.log('✅ All critical tables exist');
  } else {
    console.log(`❌ Missing tables: ${result.missingTables.join(', ')}`);
    if (result.error) {
      console.log(`Error: ${result.error}`);
    }
  }

  return result.valid;
}

async function generateBackupReport() {
  console.log('\n📊 Generating Backup Report...');

  const manager = new DatabaseBackupManager(SUPABASE_URL, SUPABASE_KEY, PROJECT_ID);
  const report = await manager.generateBackupReport();

  console.log(BackupMonitor.formatReport(report));

  return report;
}

async function testPointInTimeRecovery() {
  console.log('\n⏰ Testing Point-in-Time Recovery Status...');

  const manager = new DatabaseBackupManager(SUPABASE_URL, SUPABASE_KEY, PROJECT_ID);
  const pitrEnabled = await manager.checkPointInTimeRecovery();

  if (pitrEnabled) {
    console.log('✅ Point-in-Time Recovery is available');
  } else {
    console.log('❌ Point-in-Time Recovery is not available');
  }

  return pitrEnabled;
}

function displayRecoveryProcedures() {
  console.log('\n🚨 Recovery Procedures:');
  console.log('======================');

  const instructions = RecoveryProcedures.getRecoveryInstructions();
  instructions.forEach(instruction => {
    console.log(instruction);
  });

  console.log('\n📞 Emergency Contacts:');
  const contacts = RecoveryProcedures.getEmergencyContacts();
  contacts.forEach(contact => {
    console.log(`${contact.role}: ${contact.contact}`);
  });

  console.log('\n✅ Testing Checklist:');
  const checklist = RecoveryProcedures.getTestingChecklist();
  checklist.forEach(item => {
    console.log(item);
  });
}

async function runBackupTests() {
  console.log('🗄️ CineTrack Backup Recovery Test Suite');
  console.log('========================================\n');

  const results = {
    connectivity: false,
    tables: false,
    pitr: false,
    report: null as any,
  };

  try {
    // Test database connectivity
    results.connectivity = await testDatabaseConnectivity();

    // Test critical tables
    results.tables = await testCriticalTables();

    // Test PITR availability
    results.pitr = await testPointInTimeRecovery();

    // Generate backup report
    results.report = await generateBackupReport();

    // Display recovery procedures
    displayRecoveryProcedures();

    // Summary
    console.log('\n📋 Test Summary:');
    console.log('================');
    console.log(`Database Connectivity: ${results.connectivity ? '✅' : '❌'}`);
    console.log(`Critical Tables: ${results.tables ? '✅' : '❌'}`);
    console.log(`Point-in-Time Recovery: ${results.pitr ? '✅' : '❌'}`);
    console.log(`Backup Health Score: ${results.report?.healthScore || 0}/100`);

    const overallHealth =
      (results.connectivity ? 25 : 0) +
      (results.tables ? 25 : 0) +
      (results.pitr ? 25 : 0) +
      (results.report?.healthScore || 0) * 0.25;

    console.log(`\n🎯 Overall Backup Health: ${Math.round(overallHealth)}/100`);

    if (overallHealth >= 90) {
      console.log('🟢 Backup system is healthy');
    } else if (overallHealth >= 70) {
      console.log('🟡 Backup system needs attention');
    } else {
      console.log('🔴 Backup system requires immediate action');
    }
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  runBackupTests().catch(console.error);
}

export { runBackupTests };
