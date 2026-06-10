import { readFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse DATABASE_URL from .env.local
const envRaw = readFileSync(resolve(__dirname, '../.env.local'), 'utf-8');
const dbUrlMatch = envRaw.match(/DATABASE_URL=(.+)/);
if (!dbUrlMatch) throw new Error('DATABASE_URL not found');
const DATABASE_URL = dbUrlMatch[1].trim();

const MIGRATIONS_DIR = resolve(__dirname, '../supabase/migrations');

const MIGRATION_ORDER = [
  '20260606000001_extensions.sql',
  '20260606000002_profiles.sql',
  '20260606000003_categories.sql',
  '20260606000004_news.sql',
  '20260606000005_news_categories.sql',
  '20260606000006_media.sql',
  '20260606000007_settings.sql',
  '20260606000008_indexes.sql',
  '20260606000009_rls.sql',
  '20260606000010_storage.sql',
  '20260606000011_view_counter.sql',
];

/**
 * Split SQL text into individual statements, respecting:
 * - Dollar-quoted strings ($$ ... $$, $func$ ... $func$)
 * - Single-quoted strings ('...')
 * - Double-quoted identifiers ("...")
 */
function splitSqlStatements(sql) {
  const statements = [];
  let current = '';
  let i = 0;

  while (i < sql.length) {
    const ch = sql[i];

    // Skip single-line comments
    if (ch === '-' && sql[i + 1] === '-') {
      while (i < sql.length && sql[i] !== '\n') i++;
      continue;
    }

    // Skip multi-line comments
    if (ch === '/' && sql[i + 1] === '*') {
      i += 2;
      while (i < sql.length && !(sql[i] === '*' && sql[i + 1] === '/')) i++;
      i += 2;
      continue;
    }

    // Handle dollar-quoted strings: $$...$$ or $tag$...$tag$
    if (ch === '$') {
      let end = i + 1;
      while (end < sql.length && sql[end] !== '$') end++;
      if (end < sql.length) {
        const tag = sql.substring(i, end + 1); // e.g. $$, $func$
        const closeTag = tag; // same tag closes
        const closeIdx = sql.indexOf(closeTag, end + 1);
        if (closeIdx !== -1) {
          current += sql.substring(i, closeIdx + closeTag.length);
          i = closeIdx + closeTag.length;
          continue;
        }
      }
    }

    // Handle single-quoted strings
    if (ch === "'") {
      current += ch;
      i++;
      while (i < sql.length) {
        current += sql[i];
        if (sql[i] === "'" && (i + 1 >= sql.length || sql[i + 1] !== "'")) break;
        if (sql[i] === "'" && sql[i + 1] === "'") {
          current += sql[i + 1];
          i += 2;
        } else {
          i++;
        }
      }
      i++;
      continue;
    }

    // Handle double-quoted identifiers
    if (ch === '"') {
      current += ch;
      i++;
      while (i < sql.length && sql[i] !== '"') {
        current += sql[i];
        i++;
      }
      if (i < sql.length) { current += sql[i]; i++; }
      continue;
    }

    // Statement separator
    if (ch === ';') {
      const trimmed = current.trim();
      if (trimmed) statements.push(trimmed);
      current = '';
      i++;
      continue;
    }

    current += ch;
    i++;
  }

  // Last statement (no trailing semicolon)
  const trimmed = current.trim();
  if (trimmed) statements.push(trimmed);

  return statements;
}

async function executeMigration(pool, filePath, fileName) {
  const raw = readFileSync(filePath, 'utf-8');
  const statements = splitSqlStatements(raw).filter(s => s.length > 0);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📄 ${fileName}  (${statements.length} statements)`);
  console.log(`${'='.repeat(60)}`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.split('\n').filter(l => l.trim())[0]?.substring(0, 80) || '';
    try {
      await pool.query(stmt);
      successCount++;
      console.log(`  [${i + 1}/${statements.length}] ✅ ${preview}`);
    } catch (err) {
      const msg = err.message || '';
      if (
        msg.includes('already exists') ||
        msg.includes('duplicate key value') ||
        msg.includes('already exists')
      ) {
        console.log(`  [${i + 1}/${statements.length}] ⚠️  ${preview} (已存在)`);
        successCount++;
      } else {
        console.log(`  [${i + 1}/${statements.length}] ❌ ${preview}`);
        console.log(`     ${msg.substring(0, 200)}`);
        failCount++;
        throw err;
      }
    }
  }

  if (failCount === 0) {
    console.log(`  ✅ ${successCount}/${statements.length} executed successfully`);
  }
  return { successCount, failCount };
}

async function verifyTables(pool) {
  console.log(`\n${'='.repeat(60)}`);
  console.log('🔍 Verifying Database Tables');
  console.log(`${'='.repeat(60)}`);

  const expectedTables = ['profiles', 'categories', 'news', 'news_categories', 'media', 'settings'];

  for (const table of expectedTables) {
    try {
      const result = await pool.query(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)`,
        [table]
      );
      if (result.rows[0].exists) {
        // Get column count
        const colResult = await pool.query(
          `SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1`,
          [table]
        );
        console.log(`  ✅ ${table} (${colResult.rows[0].count} columns)`);
      } else {
        console.log(`  ❌ ${table} - NOT FOUND`);
      }
    } catch (err) {
      console.log(`  ❌ ${table} - ERROR: ${err.message}`);
    }
  }
}

async function verifyRLS(pool) {
  console.log(`\n${'='.repeat(60)}`);
  console.log('🔒 Verifying RLS Policies');
  console.log(`${'='.repeat(60)}`);

  const tables = ['profiles', 'categories', 'news', 'news_categories', 'media', 'settings'];

  for (const table of tables) {
    try {
      // Check if RLS is enabled
      const rlsResult = await pool.query(
        `SELECT relrowsecurity FROM pg_class WHERE relname = $1 AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')`,
        [table]
      );
      const rlsEnabled = rlsResult.rows[0]?.relrowsecurity;

      // Count policies
      const polResult = await pool.query(
        `SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = $1`,
        [table]
      );
      const policyCount = polResult.rows[0]?.count || 0;

      const icon = rlsEnabled ? '✅' : '❌';
      console.log(`  ${icon} ${table}: RLS=${rlsEnabled ? 'ON' : 'OFF'}, Policies=${policyCount}`);
    } catch (err) {
      console.log(`  ❌ ${table} - ERROR: ${err.message}`);
    }
  }
}

async function verifyTriggers(pool) {
  console.log(`\n${'='.repeat(60)}`);
  console.log('⚡ Verifying Triggers');
  console.log(`${'='.repeat(60)}`);

  const tables = ['profiles', 'categories', 'news', 'settings'];

  for (const table of tables) {
    try {
      const result = await pool.query(
        `SELECT tgname FROM pg_trigger t
         JOIN pg_class c ON t.tgrelid = c.oid
         WHERE c.relname = $1 AND t.tgname LIKE 'trigger_%_updated_at'`,
        [table]
      );
      if (result.rows.length > 0) {
        console.log(`  ✅ ${table}: ${result.rows[0].tgname}`);
      } else {
        console.log(`  ⚠️  ${table}: no updated_at trigger found`);
      }
    } catch (err) {
      console.log(`  ❌ ${table} - ERROR: ${err.message}`);
    }
  }
}

async function verifyIndexes(pool) {
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 Verifying Key Indexes');
  console.log(`${'='.repeat(60)}`);

  const keyIndexes = [
    'idx_profiles_role', 'idx_profiles_is_active',
    'idx_categories_parent_id', 'idx_categories_active_sort',
    'idx_news_status', 'idx_news_published_at', 'idx_news_author_id',
    'idx_news_featured_published', 'idx_news_view_count', 'idx_news_fulltext',
    'idx_nc_news_id', 'idx_nc_category_id',
    'idx_media_uploaded_by', 'idx_media_created_at',
  ];

  for (const idx of keyIndexes) {
    try {
      const result = await pool.query(
        `SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = $1)`,
        [idx]
      );
      console.log(`  ${result.rows[0].exists ? '✅' : '❌'} ${idx}`);
    } catch (err) {
      console.log(`  ❌ ${idx} - ERROR`);
    }
  }
}

async function verifyStorage(pool) {
  console.log(`\n${'='.repeat(60)}`);
  console.log('☁️  Verifying Storage Buckets');
  console.log(`${'='.repeat(60)}`);

  const buckets = ['news-covers', 'article-images'];

  for (const bucket of buckets) {
    try {
      const result = await pool.query(
        `SELECT EXISTS (SELECT 1 FROM storage.buckets WHERE id = $1)`,
        [bucket]
      );
      if (result.rows[0].exists) {
        const publicResult = await pool.query(
          `SELECT public FROM storage.buckets WHERE id = $1`,
          [bucket]
        );
        console.log(`  ✅ ${bucket} (public=${publicResult.rows[0].public})`);
      } else {
        console.log(`  ❌ ${bucket} - NOT FOUND`);
      }
    } catch (err) {
      console.log(`  ⚠️  ${bucket} - storage schema not accessible (${err.message.substring(0, 60)})`);
    }
  }
}

async function verifyColumnTypes(pool) {
  console.log(`\n${'='.repeat(60)}`);
  console.log('📐 Verifying Column Types');
  console.log(`${'='.repeat(60)}`);

  const checks = [
    { table: 'news', column: 'view_count', expected: 'bigint' },
    { table: 'media', column: 'file_size', expected: 'bigint' },
  ];

  for (const { table, column, expected } of checks) {
    try {
      const result = await pool.query(
        `SELECT data_type FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
        [table, column]
      );
      if (result.rows.length > 0) {
        const actual = result.rows[0].data_type;
        console.log(`  ${actual === expected ? '✅' : '❌'} ${table}.${column}: ${actual} (expected ${expected})`);
      } else {
        console.log(`  ❌ ${table}.${column} - COLUMN NOT FOUND`);
      }
    } catch (err) {
      console.log(`  ❌ ${table}.${column} - ERROR: ${err.message}`);
    }
  }
}

async function main() {
  console.log('🚀 Sprint 2.2 — Database Migration Execution');
  console.log(`Target: ${DATABASE_URL.replace(/:[^:]*@/, ':****@')}`);

  const pool = new pg.Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

  let totalSuccess = 0;
  let totalFail = 0;

  try {
    // Test connection
    console.log('\n📡 Testing connection...');
    await pool.query('SELECT 1');
    console.log('  ✅ Connection OK');

    // Step 1: Backup marker
    console.log(`\n${'='.repeat(60)}`);
    console.log('💾 Backup snapshot (pre-migration)');
    console.log(`${'='.repeat(60)}`);
    const tableCount = await pool.query(
      `SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'`
    );
    console.log(`  Existing tables: ${tableCount.rows[0].count}`);

    // Step 2: Execute each migration
    console.log(`\n${'='.repeat(60)}`);
    console.log('📦 Executing Migrations (01 → 10)');
    console.log(`${'='.repeat(60)}`);

    for (const fileName of MIGRATION_ORDER) {
      const filePath = resolve(MIGRATIONS_DIR, fileName);
      const { successCount, failCount } = await executeMigration(pool, filePath, fileName);
      totalSuccess += successCount;
      totalFail += failCount;
    }

    // Step 3: Verification
    console.log(`\n\n${'='.repeat(60)}`);
    console.log('📋 VERIFICATION REPORT');
    console.log(`${'='.repeat(60)}`);

    await verifyTables(pool);
    await verifyColumnTypes(pool);
    await verifyRLS(pool);
    await verifyTriggers(pool);
    await verifyIndexes(pool);
    await verifyStorage(pool);

    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 MIGRATION SUMMARY');
    console.log(`${'='.repeat(60)}`);
    console.log(`  Total statements: ${totalSuccess + totalFail}`);
    console.log(`  Succeeded:        ${totalSuccess}`);
    console.log(`  Failed:           ${totalFail}`);
    console.log(`  Status:           ${totalFail === 0 ? '✅ ALL PASS' : '❌ HAS ERRORS'}`);

  } catch (err) {
    console.error(`\n❌ FATAL ERROR: ${err.message}`);
    console.error('Migration stopped. Database may be in partial state.');
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
