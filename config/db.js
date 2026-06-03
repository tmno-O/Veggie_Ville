const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
require('dotenv').config();

const dbPromise = open({
  filename: path.join(__dirname, '../database.sqlite'),
  driver: sqlite3.Database
});

const pool = {
  query: async (sql, params) => {
    const db = await dbPromise;
    // Basic heuristic to differentiate between SELECT and INSERT/UPDATE/DELETE
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      const rows = await db.all(sql, params);
      return [rows, []];
    } else {
      const result = await db.run(sql, params);
      return [{ insertId: result.lastID, affectedRows: result.changes }, []];
    }
  },
  execute: async (sql, params) => {
    return pool.query(sql, params);
  },
  getConnection: async () => {
    const db = await dbPromise;
    return {
      query: pool.query,
      execute: pool.execute,
      beginTransaction: () => db.run('BEGIN TRANSACTION'),
      commit: () => db.run('COMMIT'),
      rollback: () => db.run('ROLLBACK'),
      release: () => {} // SQLite single connection doesn't need release
    };
  }
};

module.exports = pool;
