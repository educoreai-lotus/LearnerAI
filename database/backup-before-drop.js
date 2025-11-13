/**
 * Backup Database Before Dropping Tables
 * 
 * This script creates a full backup of the database before dropping all tables.
 * Run this BEFORE running the drop-all-tables migration.
 * 
 * Usage:
 *   node database/backup-before-drop.js
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables manually (without dotenv dependency)
async function loadEnvFile() {
  const envPaths = [
    join(__dirname, '../backend/.env'),
    join(__dirname, '../../backend/.env'),
    join(process.cwd(), 'backend/.env'),
    join(process.cwd(), '.env')
  ];

  for (const envPath of envPaths) {
    if (existsSync(envPath)) {
      const envContent = await readFile(envPath, 'utf8');
      const lines = envContent.split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
            process.env[key.trim()] = value.trim();
          }
        }
      }
      console.log(`✅ Loaded .env from: ${envPath}`);
      return;
    }
  }
  
  throw new Error('No .env file found in expected locations');
}

async function getDbConnection() {
  // Try separate environment variables first (like existing backup script)
  const DB_HOST = process.env.SUPABASE_DB_HOST;
  const DB_PORT = process.env.SUPABASE_DB_PORT || '5432';
  const DB_USER = process.env.SUPABASE_DB_USER || 'postgres';
  const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;
  const DB_NAME = process.env.SUPABASE_DB_NAME || 'postgres';

  // If separate variables exist, use them
  if (DB_HOST && DB_PASSWORD) {
    return {
      host: DB_HOST,
      port: parseInt(DB_PORT),
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME
    };
  }

  // Otherwise, try to parse SUPABASE_URL
  const supabaseUrl = process.env.SUPABASE_URL;
  
  if (!supabaseUrl) {
    throw new Error('SUPABASE_DB_HOST and SUPABASE_DB_PASSWORD not found, and SUPABASE_URL not found in environment variables.\n' +
                   'Please set either:\n' +
                   '  - SUPABASE_DB_HOST, SUPABASE_DB_PORT, SUPABASE_DB_USER, SUPABASE_DB_PASSWORD, SUPABASE_DB_NAME\n' +
                   '  - OR SUPABASE_URL (postgresql://user:password@host:port/database)');
  }

  // Extract connection details from SUPABASE_URL
  // Format: postgresql://postgres:[password]@[host]:[port]/postgres
  const urlMatch = supabaseUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  
  if (!urlMatch) {
    throw new Error('Invalid SUPABASE_URL format. Expected: postgresql://user:password@host:port/database\n' +
                   'Or use separate variables: SUPABASE_DB_HOST, SUPABASE_DB_PASSWORD, etc.');
  }

  const [, user, password, host, port, database] = urlMatch;
  
  return {
    host,
    port: parseInt(port),
    user,
    password,
    database
  };
}

async function createBackup() {
  try {
    console.log('🔄 Starting database backup...\n');

    const dbConfig = await getDbConnection();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                     new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    const backupDir = join(__dirname, 'backups');
    const backupFile = join(backupDir, `backup_before_drop_${timestamp}.sql`);

    // Create backup directory if it doesn't exist
    if (!existsSync(backupDir)) {
      await mkdir(backupDir, { recursive: true });
      console.log(`📁 Created backup directory: ${backupDir}`);
    }

    // Build pg_dump command
    const pgDumpCmd = [
      'pg_dump',
      `--host=${dbConfig.host}`,
      `--port=${dbConfig.port}`,
      `--username=${dbConfig.user}`,
      `--dbname=${dbConfig.database}`,
      '--no-owner',
      '--no-acl',
      '--clean', // Include DROP statements
      '--if-exists', // Use IF EXISTS for DROP statements
      '--schema=public', // Only backup public schema
      '--verbose'
    ].join(' ');

    // Set PGPASSWORD environment variable
    const env = {
      ...process.env,
      PGPASSWORD: dbConfig.password
    };

    console.log(`📦 Creating backup: ${backupFile}`);
    console.log(`🔗 Connecting to: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}\n`);

    // Execute pg_dump
    const { stdout, stderr } = await execAsync(pgDumpCmd, {
      env,
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });

    // Write backup to file
    await writeFile(backupFile, stdout, 'utf8');

    if (stderr) {
      console.log('⚠️  Warnings:', stderr);
    }

    console.log(`✅ Backup created successfully!`);
    console.log(`📄 File: ${backupFile}`);
    console.log(`📊 Size: ${(stdout.length / 1024).toFixed(2)} KB\n`);

    // Also create a summary file
    const summaryFile = join(backupDir, `backup_summary_${timestamp}.txt`);
    const summary = `
Database Backup Summary
======================
Timestamp: ${new Date().toISOString()}
Database: ${dbConfig.database}
Host: ${dbConfig.host}:${dbConfig.port}
Backup File: ${backupFile}
Size: ${(stdout.length / 1024).toFixed(2)} KB

This backup was created before dropping all tables.
To restore, use: psql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} < ${backupFile}
    `.trim();

    await writeFile(summaryFile, summary, 'utf8');
    console.log(`📝 Summary saved: ${summaryFile}\n`);

    return backupFile;

  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    
    if (error.message.includes('pg_dump')) {
      console.error('\n💡 Make sure pg_dump is installed and in your PATH.');
      console.error('   On Windows: Install PostgreSQL client tools');
      console.error('   On Mac: brew install postgresql');
      console.error('   On Linux: sudo apt-get install postgresql-client\n');
    }
    
    throw error;
  }
}

// Run backup
(async () => {
  try {
    await loadEnvFile();
    await createBackup();
    console.log('✨ Backup completed successfully!');
    console.log('⚠️  You can now safely run the drop-all-tables migration.\n');
    process.exit(0);
  } catch (error) {
    console.error('💥 Backup failed:', error.message);
    process.exit(1);
  }
})();

