/**
 * ==============================================================================
 * PLANSZOWY ZAKĄTEK - DATABASE MIGRATION ENGINE
 * ==============================================================================
 * Security Level: Bulletproof (Filar 2 - Migrations)
 * Description: Zero-dependency migrations coordinator. Handles tracking of applied
 *              migrations and executes pending migrations in proper sequence.
 * ==============================================================================
 */

import { MIGRATIONS } from "./migrations";

export async function runMigrations(
  dbRun: (sql: string, params?: any[]) => Promise<any>,
  dbAll: <T = any>(sql: string, params?: any[]) => Promise<T[]>
): Promise<void> {
  console.log("MigrationEngine: Checking database migrations state...");

  try {
    // 1. Create tracking table if it doesn't exist
    await dbRun(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        applied_at TEXT NOT NULL
      )
    `);

    // 2. Fetch already applied migrations
    const applied = await dbAll<{ name: string }>("SELECT name FROM _migrations");
    const appliedSet = new Set(applied.map(row => row.name));

    // 3. Filter and find pending migrations
    const pending = MIGRATIONS.filter(migration => !appliedSet.has(migration.name));

    if (pending.length === 0) {
      console.log("MigrationEngine: Database schema is completely up to date. No pending migrations.");
      return;
    }

    console.log(`MigrationEngine: Found ${pending.length} pending migration(s) to apply.`);

    // 4. Run each pending migration in order
    for (const migration of pending) {
      console.log(`MigrationEngine: Applying migration: "${migration.name}"...`);
      
      try {
        // Run migration inside an independent transaction context or with safe error boundaries
        await migration.up(dbRun, dbAll);

        // Record successful migration
        const nowStr = new Date().toISOString();
        await dbRun("INSERT INTO _migrations (name, applied_at) VALUES (?, ?)", [migration.name, nowStr]);
        console.log(`MigrationEngine: Migration successfully applied: "${migration.name}"`);
      } catch (err: any) {
        console.error(`MigrationEngine: CRITICAL FAILURE applying migration "${migration.name}":`, err.message);
        throw err; // Halt initialization of the application to prevent operating on a broken schema
      }
    }

    console.log("MigrationEngine: All pending migrations completed successfully.");
  } catch (error: any) {
    console.error("MigrationEngine: Migration process encountered an error:", error.message || error);
    throw error;
  }
}

/**
 * Helper to roll back a specific migration (DOWN) - highly useful for dev & maintenance
 */
export async function rollbackMigration(
  migrationName: string,
  dbRun: (sql: string, params?: any[]) => Promise<any>,
  dbAll: <T = any>(sql: string, params?: any[]) => Promise<T[]>
): Promise<void> {
  console.log(`MigrationEngine: Attempting rollback of migration: "${migrationName}"...`);
  
  const migration = MIGRATIONS.find(m => m.name === migrationName);
  if (!migration) {
    throw new Error(`MigrationEngine: Migration "${migrationName}" was not found in the source registry.`);
  }

  try {
    // Revert structural change
    await migration.down(dbRun, dbAll);

    // Delete migration from the tracking table
    await dbRun("DELETE FROM _migrations WHERE name = ?", [migrationName]);
    console.log(`MigrationEngine: Rollback successful: "${migrationName}" reverted.`);
  } catch (err: any) {
    console.error(`MigrationEngine: Failed to roll back migration "${migrationName}":`, err.message);
    throw err;
  }
}
