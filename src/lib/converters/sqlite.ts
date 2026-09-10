import initSqlJs, { Database, SqlJsStatic } from "sql.js";
import Papa from "papaparse";

let sqlPromise: Promise<SqlJsStatic> | null = null;

export async function getSqlJs(): Promise<SqlJsStatic> {
  if (!sqlPromise) {
    sqlPromise = initSqlJs({
      locateFile: (file) => `/${file}`,
    }).catch((err) => {
      sqlPromise = null;
      throw err;
    });
  }
  return sqlPromise;
}

export interface TableColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: boolean;
  defaultValue: any;
  isPrimaryKey: boolean;
}

export interface TableSummary {
  name: string;
  rowCount: number;
  columns: TableColumnInfo[];
  ddl: string;
}

export interface DatabaseOverview {
  tables: TableSummary[];
  totalRows: number;
  pageSize: number;
  pageCount: number;
}

export interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
  executionTimeMs: number;
  statementExecuted?: string;
  error?: string;
}

// Instantiate database in memory
export async function createDatabase(bytes?: Uint8Array): Promise<Database> {
  const SQL = await getSqlJs();
  return new SQL.Database(bytes);
}

// Get overview of all user tables and schema
export function getDatabaseOverview(db: Database): DatabaseOverview {
  // Query all user tables (exclude internal sqlite_% tables)
  const tablesRes = db.exec(
    "SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name ASC;"
  );

  const tables: TableSummary[] = [];
  let totalRows = 0;

  if (tablesRes.length > 0 && tablesRes[0].values) {
    for (const row of tablesRes[0].values) {
      const tableName = String(row[0]);
      const ddl = String(row[1] || "");

      // Row count
      let rowCount = 0;
      try {
        const countRes = db.exec(`SELECT COUNT(*) FROM "${tableName}";`);
        if (countRes.length > 0 && countRes[0].values.length > 0) {
          rowCount = Number(countRes[0].values[0][0]) || 0;
        }
      } catch {
        rowCount = 0;
      }
      totalRows += rowCount;

      // Table columns via PRAGMA
      const columns: TableColumnInfo[] = [];
      try {
        const pragmaRes = db.exec(`PRAGMA table_info("${tableName}");`);
        if (pragmaRes.length > 0 && pragmaRes[0].values) {
          for (const col of pragmaRes[0].values) {
            columns.push({
              cid: Number(col[0]),
              name: String(col[1]),
              type: String(col[2] || "TEXT"),
              notnull: Number(col[3]) === 1,
              defaultValue: col[4],
              isPrimaryKey: Number(col[5]) > 0,
            });
          }
        }
      } catch (err) {
        console.error(`Failed to inspect columns for table ${tableName}:`, err);
      }

      tables.push({
        name: tableName,
        rowCount,
        columns,
        ddl,
      });
    }
  }

  // Page stats via PRAGMA
  let pageSize = 4096;
  let pageCount = 0;
  try {
    const ps = db.exec("PRAGMA page_size;");
    if (ps.length > 0 && ps[0].values.length > 0) {
      pageSize = Number(ps[0].values[0][0]);
    }
    const pc = db.exec("PRAGMA page_count;");
    if (pc.length > 0 && pc[0].values.length > 0) {
      pageCount = Number(pc[0].values[0][0]);
    }
  } catch {
    // Ignore PRAGMA errors
  }

  return {
    tables,
    totalRows,
    pageSize,
    pageCount,
  };
}

// Execute arbitrary SQL query
export function executeSql(db: Database, sqlQuery: string): QueryResult {
  const cleanSql = sqlQuery.trim();
  if (!cleanSql) {
    return {
      columns: [],
      rows: [],
      rowCount: 0,
      executionTimeMs: 0,
    };
  }

  const start = performance.now();
  try {
    const res = db.exec(cleanSql);
    const executionTimeMs = parseFloat((performance.now() - start).toFixed(2));

    if (res.length === 0) {
      // Statement executed (like INSERT, UPDATE, CREATE TABLE) but returned no rows
      return {
        columns: [],
        rows: [],
        rowCount: 0,
        executionTimeMs,
        statementExecuted: cleanSql,
      };
    }

    // Take the last result set if multiple statements were executed
    const lastResult = res[res.length - 1];
    return {
      columns: lastResult.columns || [],
      rows: lastResult.values || [],
      rowCount: (lastResult.values && lastResult.values.length) || 0,
      executionTimeMs,
      statementExecuted: cleanSql,
    };
  } catch (err: any) {
    const executionTimeMs = parseFloat((performance.now() - start).toFixed(2));
    return {
      columns: [],
      rows: [],
      rowCount: 0,
      executionTimeMs,
      error: err?.message || "SQL Execution Error",
    };
  }
}

// Fetch paginated table records for Data Grid
export function getTableData(
  db: Database,
  tableName: string,
  limit = 50,
  offset = 0,
  searchFilter = ""
): { columns: string[]; rows: any[][]; totalFilteredRows: number } {
  try {
    let whereClause = "";
    if (searchFilter.trim()) {
      // Get all columns to search across
      const pragma = db.exec(`PRAGMA table_info("${tableName}");`);
      if (pragma.length > 0 && pragma[0].values) {
        const colNames = pragma[0].values.map((c) => String(c[1]));
        const conditions = colNames.map(
          (col) => `CAST("${col}" AS TEXT) LIKE '%${searchFilter.replace(/'/g, "''")}%'`
        );
        whereClause = `WHERE ${conditions.join(" OR ")}`;
      }
    }

    const countRes = db.exec(`SELECT COUNT(*) FROM "${tableName}" ${whereClause};`);
    const totalFilteredRows =
      countRes.length > 0 && countRes[0].values.length > 0
        ? Number(countRes[0].values[0][0])
        : 0;

    const dataRes = db.exec(
      `SELECT * FROM "${tableName}" ${whereClause} LIMIT ${limit} OFFSET ${offset};`
    );

    if (dataRes.length === 0) {
      // Fetch column headers even if 0 rows returned
      const pragma = db.exec(`PRAGMA table_info("${tableName}");`);
      const columns =
        pragma.length > 0 && pragma[0].values
          ? pragma[0].values.map((c) => String(c[1]))
          : [];
      return { columns, rows: [], totalFilteredRows: 0 };
    }

    return {
      columns: dataRes[0].columns || [],
      rows: dataRes[0].values || [],
      totalFilteredRows,
    };
  } catch (err) {
    console.error(`Error fetching table data for ${tableName}:`, err);
    return { columns: [], rows: [], totalFilteredRows: 0 };
  }
}

// Export full table to CSV string
export function exportTableToCsv(db: Database, tableName: string): string {
  const res = db.exec(`SELECT * FROM "${tableName}";`);
  if (res.length === 0) return "";
  const columns = res[0].columns;
  const rows = res[0].values;
  return Papa.unparse({
    fields: columns,
    data: rows,
  });
}

// Export full table to JSON string
export function exportTableToJson(db: Database, tableName: string): string {
  const res = db.exec(`SELECT * FROM "${tableName}";`);
  if (res.length === 0) return "[]";
  const columns = res[0].columns;
  const rows = res[0].values;

  const objects = rows.map((row) => {
    const obj: Record<string, any> = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });

  return JSON.stringify(objects, null, 2);
}

// Export query result to CSV string
export function exportQueryResultToCsv(queryResult: QueryResult): string {
  return Papa.unparse({
    fields: queryResult.columns,
    data: queryResult.rows,
  });
}

// Export query result to JSON string
export function exportQueryResultToJson(queryResult: QueryResult): string {
  const objects = queryResult.rows.map((row) => {
    const obj: Record<string, any> = {};
    queryResult.columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });
  return JSON.stringify(objects, null, 2);
}

// Export entire database as binary Uint8Array
export function exportDatabase(db: Database): Uint8Array {
  return db.export();
}

// Generate realistic e-commerce sample database in memory
export async function generateSampleDatabase(): Promise<Uint8Array> {
  const SQL = await getSqlJs();
  const db = new SQL.Database();

  // Create Customers Table
  db.run(`
    CREATE TABLE customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      country TEXT NOT NULL,
      balance REAL DEFAULT 0.0,
      created_at TEXT NOT NULL
    );
  `);

  // Insert Customers
  db.run(`
    INSERT INTO customers (name, email, country, balance, created_at) VALUES
    ('Alice Martin', 'alice@example.com', 'United States', 450.50, '2025-01-15 10:20:00'),
    ('Bernardo Silva', 'bernardo@example.pt', 'Portugal', 120.00, '2025-01-18 14:45:00'),
    ('Chiara Rossi', 'chiara@example.it', 'Italy', 890.75, '2025-02-01 09:12:00'),
    ('David Kim', 'david.kim@example.kr', 'South Korea', 340.00, '2025-02-10 16:30:00'),
    ('Elena Rostova', 'elena@example.de', 'Germany', 1550.25, '2025-02-14 11:05:00'),
    ('Fiona Gallagher', 'fiona@example.uk', 'United Kingdom', 75.00, '2025-03-01 18:22:00'),
    ('Gareth Vance', 'gareth@privatools.local', 'United Kingdom', 2400.00, '2025-03-05 08:00:00'),
    ('Hassan Al-Mansoor', 'hassan@example.ae', 'United Arab Emirates', 5600.00, '2025-03-08 13:15:00');
  `);

  // Create Products Table
  db.run(`
    CREATE TABLE products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL
    );
  `);

  // Insert Products
  db.run(`
    INSERT INTO products (sku, name, category, price, stock) VALUES
    ('HW-001', 'Hardware Security Key (FIDO2/U2F)', 'Security', 55.00, 140),
    ('SW-002', 'Privatools Encrypted Drive 1TB', 'Storage', 129.99, 85),
    ('NW-003', 'Hardware Firewall Router 2.5GbE', 'Networking', 249.00, 32),
    ('AC-004', 'Faraday Bag for Laptop & Phone', 'Accessories', 39.50, 210),
    ('HW-005', 'Air-Gapped Cold Storage Card', 'Security', 89.00, 95),
    ('SW-006', 'Zero-Knowledge Backup License', 'Software', 49.00, 500);
  `);

  // Create Orders Table
  db.run(`
    CREATE TABLE orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT NOT NULL,
      order_date TEXT NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `);

  // Insert Orders
  db.run(`
    INSERT INTO orders (customer_id, product_id, quantity, total_amount, status, order_date) VALUES
    (1, 1, 2, 110.00, 'completed', '2025-03-01 11:20:00'),
    (1, 4, 1, 39.50, 'completed', '2025-03-01 11:25:00'),
    (2, 2, 1, 129.99, 'shipped', '2025-03-02 14:10:00'),
    (3, 3, 1, 249.00, 'completed', '2025-03-03 09:40:00'),
    (4, 5, 2, 178.00, 'processing', '2025-03-04 16:55:00'),
    (5, 1, 4, 220.00, 'completed', '2025-03-05 10:15:00'),
    (7, 3, 2, 498.00, 'completed', '2025-03-06 12:00:00'),
    (7, 2, 3, 389.97, 'completed', '2025-03-06 12:05:00'),
    (8, 6, 10, 490.00, 'completed', '2025-03-07 15:30:00');
  `);

  const bytes = db.export();
  db.close();
  return bytes;
}
