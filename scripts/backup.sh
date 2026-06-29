#!/usr/bin/env bash

# ==============================================================================
# PLANSZOWY ZAKĄTEK - SQLITE AUTOMATIC BACKUP SYSTEM
# ==============================================================================
# Security Level: Bulletproof (Filar 3)
# Description: Performs safe online backup of db.sqlite, compresses it into .tar.gz,
#              and cleans up backups older than 30 days to save disk space.
# ==============================================================================

set -euo pipefail

# Configuration
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_PATH="${APP_DIR}/db.sqlite"
BACKUP_DIR="${APP_DIR}/backups"
RETENTION_DAYS=30
DATE_TAG=$(date +"%Y%m%d_%H%M%S")
TEMP_SQLITE_BACKUP="${BACKUP_DIR}/temp_db_${DATE_TAG}.sqlite"
FINAL_TAR_GZ="${BACKUP_DIR}/db_backup_${DATE_TAG}.tar.gz"

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

echo "[$(date +"%Y-%m-%d %H:%M:%S")] Starting automated database backup..."

# 1. Verify that database file exists
if [ ! -f "${DB_PATH}" ]; then
    echo "ERROR: Database file not found at ${DB_PATH}!" >&2
    exit 1
fi

# 2. Perform safe, online backup using sqlite3 CLI if available
# This prevents backing up inconsistent states if a write transaction is currently active.
if command -v sqlite3 >/dev/null 2>&1; then
    echo "Using sqlite3 online backup utility for live, non-blocking snapshot..."
    sqlite3 "${DB_PATH}" ".backup '${TEMP_SQLITE_BACKUP}'"
else
    echo "WARNING: sqlite3 CLI utility not found! Falling back to safe copy..."
    # Ensure WAL checkpoint or copy WAL files alongside
    cp "${DB_PATH}" "${TEMP_SQLITE_BACKUP}"
fi

# 3. Compress the backup to save disk space
echo "Compressing backup into .tar.gz format..."
tar -czf "${FINAL_TAR_GZ}" -C "${BACKUP_DIR}" "$(basename "${TEMP_SQLITE_BACKUP}")"

# Remove the temporary uncompressed backup file
rm -f "${TEMP_SQLITE_BACKUP}"

echo "Backup created successfully: ${FINAL_TAR_GZ}"

# 4. Clean up backups older than 30 days
echo "Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "db_backup_*.tar.gz" -type f -mtime +"${RETENTION_DAYS}" -print -delete

echo "[$(date +"%Y-%m-%d %H:%M:%S")] Database backup and maintenance completed successfully."
