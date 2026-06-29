/**
 * ==============================================================================
 * PLANSZOWY ZAKĄTEK - STANDALONE DATABASE INITIALIZATION SCRIPT
 * ==============================================================================
 * Description: This script can be executed once on the server or in development
 *              to safely create the SQLite database, apply all migrations,
 *              and build the empty table structure.
 * Usage: npm run db:init OR npx tsx src/db/initDb.ts
 * ==============================================================================
 */

import path from "path";
import sqlite3 from "sqlite3";
import { runMigrations } from "./migrationEngine";

const DB_FILE = path.join(process.cwd(), "db.sqlite");

console.log(`Starting Database Schema Initialization on: ${DB_FILE}`);

const db = new sqlite3.Database(DB_FILE, async (err) => {
  if (err) {
    console.error("Failed to open SQLite database during setup:", err.message);
    process.exit(1);
  }

  console.log("Connected to SQLite Database. Configuring database modes...");

  try {
    // 1. Configure SQLite Performance Tuning & Integrity PRAGMAs
    await new Promise<void>((resolve, reject) => {
      db.run("PRAGMA journal_mode = WAL;", (err) => {
        if (err) reject(err);
        else {
          console.log("SQLite: Enabled WAL (Write-Ahead Logging) mode.");
          resolve();
        }
      });
    });

    await runPragma("PRAGMA synchronous = NORMAL;");
    await runPragma("PRAGMA busy_timeout = 5000;");
    await runPragma("PRAGMA foreign_keys = ON;");

    // Helper query functions inside connection scope
    const dbRun = (sql: string, params: any[] = []): Promise<{ id: number; changes: number }> => {
      return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, changes: this.changes });
        });
      });
    };

    const dbAll = <T = any>(sql: string, params: any[] = []): Promise<T[]> => {
      return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows as T[]);
        });
      });
    };

    // 2. Create Users Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT,
        firstName TEXT,
        lastName TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        city TEXT,
        zipCode TEXT,
        cart TEXT DEFAULT '[]',
        deliveryType TEXT DEFAULT ''
      )
    `);

    // Helper to add missing columns gracefully to existing databases
    const addColumnSafe = async (tableName: string, columnName: string, type: string) => {
      try {
        await dbRun(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${type}`);
      } catch (e) {
        // column probably already exists, which is fine
      }
    };

    await addColumnSafe("Users", "firstName", "TEXT");
    await addColumnSafe("Users", "lastName", "TEXT");
    await addColumnSafe("Users", "email", "TEXT");
    await addColumnSafe("Users", "phone", "TEXT");
    await addColumnSafe("Users", "address", "TEXT");
    await addColumnSafe("Users", "city", "TEXT");
    await addColumnSafe("Users", "zipCode", "TEXT");
    await addColumnSafe("Users", "cart", "TEXT DEFAULT '[]'");
    await addColumnSafe("Users", "deliveryType", "TEXT DEFAULT ''");

    // 4. Create Products Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS Products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        price REAL,
        category TEXT,
        image TEXT,
        description TEXT,
        min_players INTEGER,
        max_players INTEGER,
        play_time INTEGER,
        stock INTEGER DEFAULT 10
      )
    `);

    await addColumnSafe("Products", "stock", "INTEGER DEFAULT 10");

    // 5. Create Orders Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS Orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_first_name TEXT,
        customer_last_name TEXT,
        customer_email TEXT,
        address TEXT,
        city TEXT,
        zip_code TEXT,
        phone TEXT,
        total_amount REAL,
        status TEXT,
        created_at TEXT,
        items TEXT,
        username TEXT
      )
    `);

    await addColumnSafe("Orders", "customer_first_name", "TEXT");
    await addColumnSafe("Orders", "customer_last_name", "TEXT");
    await addColumnSafe("Orders", "username", "TEXT");

    // 6. Run Database Migrations
    await runMigrations(dbRun, dbAll);

    console.log("Database schema and structure initialization completed successfully!");
    
    // Close connection cleanly
    db.close((closeErr) => {
      if (closeErr) {
        console.error("Error closing database connection:", closeErr.message);
        process.exit(1);
      } else {
        console.log("Database connection closed.");
        process.exit(0);
      }
    });

  } catch (error) {
    console.error("Error setting up database schema:", error);
    process.exit(1);
  }
});

function runPragma(sql: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
