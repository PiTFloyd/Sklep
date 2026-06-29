/**
 * ==============================================================================
 * PLANSZOWY ZAKĄTEK - DATABASE MIGRATIONS DEFINITIONS
 * ==============================================================================
 * Security Level: Bulletproof (Filar 2 - Migrations)
 * Description: Contains all the database structure migrations.
 *              Uses a static registration pattern to remain 100% compatible
 *              with Node.js bundling and TypeScript compilation in production.
 * ==============================================================================
 */

export interface Migration {
  name: string;
  up: (dbRun: (sql: string, params?: any[]) => Promise<any>, dbAll: <T = any>(sql: string, params?: any[]) => Promise<T[]>) => Promise<void>;
  down: (dbRun: (sql: string, params?: any[]) => Promise<any>, dbAll: <T = any>(sql: string, params?: any[]) => Promise<T[]>) => Promise<void>;
}

export const MIGRATIONS: Migration[] = [];
