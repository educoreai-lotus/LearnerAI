#!/usr/bin/env node

/**
 * Helper script to extract database connection details
 * from your existing Supabase configuration
 */

import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env') });

console.log('🔍 Checking your Supabase configuration...\n');

const supabaseUrl = process.env.SUPABASE_URL;

if (!supabaseUrl) {
  console.log('❌ SUPABASE_URL is not set in your .env file');
  console.log('\n📋 You need to add these to your backend/.env file:\n');
  console.log('# Supabase Database Configuration (for pg_dump backups)');
  console.log('SUPABASE_DB_HOST=db.your-project-ref.supabase.co');
  console.log('SUPABASE_DB_PORT=5432');
  console.log('SUPABASE_DB_USER=postgres');
  console.log('SUPABASE_DB_PASSWORD=your_database_password');
  console.log('SUPABASE_DB_NAME=postgres');
  console.log('\n💡 Get these from: Supabase Dashboard → Project Settings → Database');
  process.exit(1);
}

// Try to extract project reference from SUPABASE_URL
// Format: https://xxxxx.supabase.co
const urlMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);

if (urlMatch) {
  const projectRef = urlMatch[1];
  const dbHost = `db.${projectRef}.supabase.co`;
  
  console.log('✅ Found your Supabase project!');
  console.log(`   Project URL: ${supabaseUrl}`);
  console.log(`   Project Reference: ${projectRef}\n`);
  
  console.log('📋 Add these to your backend/.env file:\n');
  console.log('# Supabase Database Configuration (for pg_dump backups)');
  console.log(`SUPABASE_DB_HOST=${dbHost}`);
  console.log('SUPABASE_DB_PORT=5432');
  console.log('SUPABASE_DB_USER=postgres');
  console.log('SUPABASE_DB_PASSWORD=your_database_password  # ⚠️ Get this from Supabase Dashboard');
  console.log('SUPABASE_DB_NAME=postgres');
  console.log('\n💡 To get your database password:');
  console.log('   1. Go to Supabase Dashboard → Project Settings → Database');
  console.log('   2. Look for "Database password" section');
  console.log('   3. If you forgot it, click "Reset database password"');
  console.log('   4. Copy the password and replace "your_database_password" above');
} else {
  console.log('⚠️  Could not extract database host from SUPABASE_URL');
  console.log(`   Your SUPABASE_URL: ${supabaseUrl}\n`);
  console.log('📋 You need to manually add these to your backend/.env file:\n');
  console.log('# Supabase Database Configuration (for pg_dump backups)');
  console.log('SUPABASE_DB_HOST=db.your-project-ref.supabase.co');
  console.log('SUPABASE_DB_PORT=5432');
  console.log('SUPABASE_DB_USER=postgres');
  console.log('SUPABASE_DB_PASSWORD=your_database_password');
  console.log('SUPABASE_DB_NAME=postgres');
  console.log('\n💡 Get these from: Supabase Dashboard → Project Settings → Database → Connection string');
}

console.log('\n📚 For detailed instructions, see: GET_DB_CONNECTION.md\n');

