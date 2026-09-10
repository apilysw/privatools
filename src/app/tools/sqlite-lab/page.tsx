"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Database as DatabaseIcon,
  Play,
  Download,
  Copy,
  Check,
  Sparkles,
  Table,
  Code2,
  FileSpreadsheet,
  FileText,
  Search,
  Plus,
  Trash2,
  RefreshCw,
  UploadCloud,
  X,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Layers,
  Key,
} from "lucide-react";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { formatBytes } from "@/lib/converters/image";
import {
  createDatabase,
  getDatabaseOverview,
  getTableData,
  executeSql,
  exportTableToCsv,
  exportTableToJson,
  exportQueryResultToCsv,
  exportQueryResultToJson,
  exportDatabase,
  generateSampleDatabase,
  DatabaseOverview,
  QueryResult,
  TableSummary,
} from "@/lib/converters/sqlite";
import type { Database } from "sql.js";

type LabView = "tables" | "query" | "ddl";

export default function SqliteLabPage() {
  const [db, setDb] = useState<Database | null>(null);
  const [dbName, setDbName] = useState<string>("sample_ecommerce.db");
  const [dbSize, setDbSize] = useState<number>(0);
  const [overview, setOverview] = useState<DatabaseOverview | null>(null);
  const [activeView, setActiveView] = useState<LabView>("tables");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // --- TABLE EXPLORER STATE ---
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [tableSearchQuery, setTableSearchQuery] = useState<string>("");
  const [gridData, setGridData] = useState<{
    columns: string[];
    rows: any[][];
    totalFilteredRows: number;
  }>({ columns: [], rows: [], totalFilteredRows: 0 });
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [showSchemaDetails, setShowSchemaDetails] = useState<boolean>(false);

  // --- QUERY CONSOLE STATE ---
  const [sqlQuery, setSqlQuery] = useState<string>(
    `-- Sample Query: Customer orders and total spend
SELECT 
  c.id AS customer_id,
  c.name AS customer_name,
  c.country,
  COUNT(o.id) AS total_orders,
  ROUND(SUM(o.total_amount), 2) AS total_spent
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
GROUP BY c.id
ORDER BY total_spent DESC;`
  );
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Refresh database overview and schema
  const refreshOverview = (currentDb: Database) => {
    const ov = getDatabaseOverview(currentDb);
    setOverview(ov);
    if (ov.tables.length > 0) {
      // If no table is selected or previously selected table is gone, select the first
      if (!selectedTable || !ov.tables.some((t) => t.name === selectedTable)) {
        setSelectedTable(ov.tables[0].name);
      }
    } else {
      setSelectedTable("");
    }
  };

  // Load table grid data
  useEffect(() => {
    if (!db || !selectedTable) {
      setGridData({ columns: [], rows: [], totalFilteredRows: 0 });
      return;
    }
    const offset = (page - 1) * pageSize;
    const data = getTableData(db, selectedTable, pageSize, offset, tableSearchQuery);
    setGridData(data);
  }, [db, selectedTable, page, pageSize, tableSearchQuery]);

  // Reset page when switching tables or changing search
  useEffect(() => {
    setPage(1);
  }, [selectedTable, tableSearchQuery]);

  // Load sample database
  const handleLoadSampleDb = async () => {
    try {
      setIsLoading(true);
      const bytes = await generateSampleDatabase();
      if (db) db.close();

      const newDb = await createDatabase(bytes);
      setDb(newDb);
      setDbName("sample_ecommerce.db");
      setDbSize(bytes.byteLength);
      refreshOverview(newDb);
      setQueryResult(null);
    } catch (err) {
      console.error("Failed to load sample database:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Create new blank database
  const handleCreateBlankDb = async () => {
    try {
      setIsLoading(true);
      if (db) db.close();
      const newDb = await createDatabase();
      // Initialize an example table
      newDb.run("CREATE TABLE notes (id INTEGER PRIMARY KEY, title TEXT, content TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);");
      newDb.run("INSERT INTO notes (title, content) VALUES ('Welcome', 'Your new private SQLite database is ready!');");

      const bytes = exportDatabase(newDb);
      setDb(newDb);
      setDbName("new_database.db");
      setDbSize(bytes.byteLength);
      refreshOverview(newDb);
      setQueryResult(null);
    } catch (err) {
      console.error("Failed to create blank database:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Process uploaded SQLite file
  const handleFileUpload = async (file: File) => {
    try {
      setIsLoading(true);
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      if (db) db.close();
      const newDb = await createDatabase(bytes);

      setDb(newDb);
      setDbName(file.name);
      setDbSize(bytes.byteLength);
      refreshOverview(newDb);
      setQueryResult(null);
    } catch (err) {
      console.error("Failed to open SQLite database:", err);
      alert("Unable to parse SQLite database file. Ensure it is a valid .sqlite or .db file.");
    } finally {
      setIsLoading(false);
    }
  };

  // Execute SQL in console
  const handleRunQuery = () => {
    if (!db) return;
    const res = executeSql(db, sqlQuery);
    setQueryResult(res);
    // Refresh overview in case of DDL or INSERT/DELETE
    refreshOverview(db);
  };

  // Download binary SQLite DB file
  const handleDownloadDatabase = () => {
    if (!db) return;
    const bytes = exportDatabase(db);
    const blob = new Blob([bytes as any], { type: "application/x-sqlite3" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = dbName.endsWith(".db") || dbName.endsWith(".sqlite") ? dbName : `${dbName}.sqlite`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export selected table to CSV
  const handleExportTableCsv = () => {
    if (!db || !selectedTable) return;
    const csv = exportTableToCsv(db, selectedTable);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedTable}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export selected table to JSON
  const handleExportTableJson = () => {
    if (!db || !selectedTable) return;
    const json = exportTableToJson(db, selectedTable);
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedTable}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export query result to CSV
  const handleExportQueryCsv = () => {
    if (!queryResult || queryResult.rows.length === 0) return;
    const csv = exportQueryResultToCsv(queryResult);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `query_results_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export query result to JSON
  const handleExportQueryJson = () => {
    if (!queryResult || queryResult.rows.length === 0) return;
    const json = exportQueryResultToJson(queryResult);
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `query_results_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Active table metadata
  const currentTableSummary = overview?.tables.find((t) => t.name === selectedTable);
  const totalPages = Math.max(1, Math.ceil(gridData.totalFilteredRows / pageSize));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <ToolHeader
          title="SQLite Database Explorer & Exporter"
          description="Inspect schemas, run arbitrary SQL queries, browse data grids, and export tables to CSV or JSON using in-browser WebAssembly. Zero bytes leave your device."
          badge="Zero Egress"
        />

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleLoadSampleDb}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors shadow-sm disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Sample Database</span>
          </button>
          <button
            onClick={handleCreateBlankDb}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New DB</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* NO DATABASE STATE (DROPZONE) */}
      {/* ========================================================================= */}
      {!db ? (
        <div className="space-y-6">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-12 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-800 hover:border-emerald-500/50 bg-white dark:bg-zinc-900/60 cursor-pointer transition-all group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".sqlite,.db,.sqlite3,.db3,application/x-sqlite3,application/vnd.sqlite3"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <div className="p-4 mb-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-colors">
              <DatabaseIcon className="w-8 h-8" />
            </div>
            <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100 text-center">
              Drop your SQLite database file here or click to browse
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 text-center max-w-md">
              Supports .sqlite, .db, and .sqlite3 files • Executed 100% inside your browser WebAssembly runtime with zero network egress
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={handleLoadSampleDb}
              className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-500/40 cursor-pointer transition-all flex items-start gap-4 group"
            >
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Try E-Commerce Sample Database
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Load a pre-populated database with customers, products, and orders to test queries and table browsing.
                </p>
              </div>
            </div>

            <div
              onClick={handleCreateBlankDb}
              className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-500/40 cursor-pointer transition-all flex items-start gap-4 group"
            >
              <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 group-hover:scale-105 transition-transform">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Create Blank SQLite Database
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Start with a fresh database in memory, run CREATE TABLE and INSERT statements, then export as .sqlite.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ========================================================================= */}
          {/* DATABASE CONTROL & STATUS BAR */}
          {/* ========================================================================= */}
          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                <DatabaseIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={dbName}
                    onChange={(e) => setDbName(e.target.value)}
                    className="font-bold text-sm text-zinc-900 dark:text-zinc-100 bg-transparent border-b border-dashed border-zinc-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {formatBytes(dbSize || overview?.pageSize! * overview?.pageCount! || 0)} •{" "}
                  {overview?.tables.length || 0} user tables •{" "}
                  {overview?.totalRows || 0} total records
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleDownloadDatabase}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export .sqlite DB</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Change File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".sqlite,.db,.sqlite3,.db3"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              <button
                onClick={() => {
                  if (db) db.close();
                  setDb(null);
                  setOverview(null);
                  setSelectedTable("");
                }}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                title="Close Database"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
            <button
              onClick={() => setActiveView("tables")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeView === "tables"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <Table className="w-4 h-4 text-emerald-500" />
              <span>Table Explorer & Data Grid</span>
              {overview && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500 text-white font-mono">
                  {overview.tables.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveView("query")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeView === "query"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <Code2 className="w-4 h-4 text-emerald-500" />
              <span>SQL Query Console</span>
            </button>

            <button
              onClick={() => setActiveView("ddl")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeView === "ddl"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <Layers className="w-4 h-4 text-emerald-500" />
              <span>Database Schema DDL</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* VIEW 1: TABLE EXPLORER & DATA GRID */}
          {/* ========================================================================= */}
          {activeView === "tables" && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Tables Sidebar */}
              <div className="lg:col-span-1 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Tables ({overview?.tables.length || 0})
                  </span>
                </div>

                <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
                  {overview?.tables.map((t) => {
                    const isSelected = t.name === selectedTable;
                    return (
                      <button
                        key={t.name}
                        onClick={() => setSelectedTable(t.name)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors text-xs ${
                          isSelected
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20"
                            : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Table className="w-3.5 h-3.5 flex-shrink-0 text-zinc-400" />
                          <span className="truncate font-mono">{t.name}</span>
                        </div>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 flex-shrink-0">
                          {t.rowCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Table Data View */}
              <div className="lg:col-span-3 space-y-4">
                {currentTableSummary ? (
                  <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
                    {/* Table Title Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-mono text-base font-bold text-zinc-900 dark:text-zinc-100">
                            {currentTableSummary.name}
                          </h3>
                          <span className="text-[11px] text-zinc-400 font-mono">
                            ({currentTableSummary.rowCount} rows)
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500">
                          {currentTableSummary.columns.length} columns •{" "}
                          {currentTableSummary.columns.filter((c) => c.isPrimaryKey).length} primary key
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowSchemaDetails(!showSchemaDetails)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            showSchemaDetails
                              ? "bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                              : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50"
                          }`}
                        >
                          {showSchemaDetails ? "Hide Columns" : "View Columns"}
                        </button>

                        <button
                          onClick={handleExportTableCsv}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                          <span>CSV</span>
                        </button>

                        <button
                          onClick={handleExportTableJson}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-500" />
                          <span>JSON</span>
                        </button>
                      </div>
                    </div>

                    {/* Columns Breakdown (Toggled) */}
                    {showSchemaDetails && (
                      <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800/80 space-y-2 animate-in fade-in">
                        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                          Column Definitions
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {currentTableSummary.columns.map((col) => (
                            <div
                              key={col.name}
                              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs flex items-center gap-2 font-mono shadow-xs"
                            >
                              <span className="font-bold text-zinc-800 dark:text-zinc-200">
                                {col.name}
                              </span>
                              <span className="text-[10px] text-zinc-400 uppercase">
                                {col.type || "BLOB"}
                              </span>
                              {col.isPrimaryKey && (
                                <span className="text-[9px] px-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                                  PK
                                </span>
                              )}
                              {col.notnull && (
                                <span className="text-[9px] text-zinc-400">NN</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Search / Filter Bar */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={tableSearchQuery}
                          onChange={(e) => setTableSearchQuery(e.target.value)}
                          placeholder="Search records in table..."
                          className="w-full pl-9 pr-4 py-1.5 rounded-xl text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="text-xs text-zinc-500">
                        {gridData.totalFilteredRows} matching records
                      </div>
                    </div>

                    {/* Paginated Data Grid */}
                    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-x-auto">
                      <table className="w-full text-left text-xs divide-y divide-zinc-200 dark:divide-zinc-800">
                        <thead className="bg-zinc-50 dark:bg-zinc-950/80 font-mono text-zinc-600 dark:text-zinc-400">
                          <tr>
                            {gridData.columns.map((col) => (
                              <th key={col} className="px-3.5 py-2.5 font-semibold whitespace-nowrap">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-mono">
                          {gridData.rows.length === 0 ? (
                            <tr>
                              <td
                                colSpan={Math.max(1, gridData.columns.length)}
                                className="px-4 py-8 text-center text-zinc-400 text-xs"
                              >
                                No records found.
                              </td>
                            </tr>
                          ) : (
                            gridData.rows.map((row, rIdx) => (
                              <tr
                                key={rIdx}
                                className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                              >
                                {row.map((val, cIdx) => (
                                  <td
                                    key={cIdx}
                                    className="px-3.5 py-2 text-zinc-800 dark:text-zinc-200 max-w-xs truncate"
                                    title={val !== null ? String(val) : "NULL"}
                                  >
                                    {val === null ? (
                                      <span className="text-zinc-400 italic">NULL</span>
                                    ) : typeof val === "object" ? (
                                      JSON.stringify(val)
                                    ) : (
                                      String(val)
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-zinc-500">
                      <div className="flex items-center gap-2">
                        <span>Rows per page:</span>
                        <select
                          value={pageSize}
                          onChange={(e) => setPageSize(Number(e.target.value))}
                          className="px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                        >
                          <option value={10}>10</option>
                          <option value={15}>15</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-3">
                        <span>
                          Page {page} of {totalPages}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center text-zinc-400 text-xs border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                    Select a table from the sidebar to inspect records.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 2: SQL QUERY CONSOLE */}
          {/* ========================================================================= */}
          {activeView === "query" && (
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
              {/* Presets & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  SQL Query Editor
                </span>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-zinc-400 mr-1">Snippets:</span>
                  <button
                    onClick={() =>
                      setSqlQuery(
                        `SELECT * FROM ${overview?.tables[0]?.name || "customers"} LIMIT 20;`
                      )
                    }
                    className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200"
                  >
                    SELECT *
                  </button>
                  <button
                    onClick={() =>
                      setSqlQuery(
                        `SELECT country, COUNT(*) as total_customers, AVG(balance) as avg_balance FROM customers GROUP BY country;`
                      )
                    }
                    className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200"
                  >
                    GROUP BY
                  </button>
                  <button
                    onClick={() =>
                      setSqlQuery(
                        `SELECT p.name, p.category, SUM(o.quantity) as units_sold FROM products p JOIN orders o ON p.id = o.product_id GROUP BY p.id ORDER BY units_sold DESC;`
                      )
                    }
                    className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200"
                  >
                    JOIN
                  </button>
                  <button
                    onClick={() => setSqlQuery("PRAGMA database_list;")}
                    className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200"
                  >
                    PRAGMA
                  </button>
                </div>
              </div>

              {/* SQL Textarea */}
              <div className="relative">
                <textarea
                  rows={6}
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                      e.preventDefault();
                      handleRunQuery();
                    }
                  }}
                  placeholder="Enter SQL statement here (e.g. SELECT * FROM customers;)"
                  className="w-full p-4 rounded-xl text-xs font-mono border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed"
                />
              </div>

              {/* Run Query Button Bar */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-400">
                  Tip: Press <kbd className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono">Cmd+Enter</kbd> or <kbd className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono">Ctrl+Enter</kbd> to execute.
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSqlQuery("")}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleRunQuery}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Query</span>
                  </button>
                </div>
              </div>

              {/* Query Result Section */}
              {queryResult && (
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3 animate-in fade-in">
                  {/* Results Header / Error */}
                  {queryResult.error ? (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-start gap-3">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">SQL Execution Error</p>
                        <p className="font-mono mt-0.5">{queryResult.error}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                          Query Output
                        </span>
                        <span className="text-zinc-400 font-mono">
                          • {queryResult.rowCount} rows returned in {queryResult.executionTimeMs}ms
                        </span>
                      </div>

                      {queryResult.rows.length > 0 && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleExportQueryCsv}
                            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-emerald-500 transition-colors"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            <span>CSV</span>
                          </button>
                          <button
                            onClick={handleExportQueryJson}
                            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-emerald-500 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>JSON</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Results Table */}
                  {!queryResult.error && (
                    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-x-auto max-h-80">
                      <table className="w-full text-left text-xs divide-y divide-zinc-200 dark:divide-zinc-800">
                        <thead className="bg-zinc-50 dark:bg-zinc-950/80 font-mono text-zinc-600 dark:text-zinc-400 sticky top-0">
                          <tr>
                            {queryResult.columns.map((col) => (
                              <th key={col} className="px-3.5 py-2.5 font-semibold whitespace-nowrap">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-mono">
                          {queryResult.rows.length === 0 ? (
                            <tr>
                              <td
                                colSpan={Math.max(1, queryResult.columns.length)}
                                className="px-4 py-6 text-center text-zinc-400 text-xs"
                              >
                                Query executed successfully with 0 rows returned.
                              </td>
                            </tr>
                          ) : (
                            queryResult.rows.map((row, rIdx) => (
                              <tr
                                key={rIdx}
                                className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                              >
                                {row.map((val, cIdx) => (
                                  <td
                                    key={cIdx}
                                    className="px-3.5 py-2 text-zinc-800 dark:text-zinc-200 max-w-xs truncate"
                                  >
                                    {val === null ? (
                                      <span className="text-zinc-400 italic">NULL</span>
                                    ) : typeof val === "object" ? (
                                      JSON.stringify(val)
                                    ) : (
                                      String(val)
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 3: DATABASE SCHEMA & DDL */}
          {/* ========================================================================= */}
          {activeView === "ddl" && (
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Database Schema (CREATE TABLE Statements)
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Full SQLite DDL generated directly from sqlite_master
                  </p>
                </div>

                <button
                  onClick={() => {
                    const fullDdl = overview?.tables.map((t) => t.ddl + ";").join("\n\n") || "";
                    handleCopy(fullDdl, "all-ddl");
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  {copiedKey === "all-ddl" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Copied Schema</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy All DDL</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-4">
                {overview?.tables.map((t) => (
                  <div
                    key={t.name}
                    className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {t.name}
                      </span>
                      <button
                        onClick={() => handleCopy(t.ddl + ";", t.name)}
                        className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      >
                        {copiedKey === t.name ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <pre className="text-xs font-mono text-zinc-800 dark:text-zinc-200 overflow-x-auto whitespace-pre-wrap">
                      {t.ddl};
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Security Guarantee Note */}
      <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 flex-shrink-0 mt-0.5">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
            100% Client-Side WebAssembly SQLite Sandbox
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Privatools runs the official SQLite C-engine compiled directly into client WebAssembly. Databases are mounted purely inside browser memory (RAM). No database tables, queries, records, or files ever leave your machine or touch a remote server socket.
          </p>
        </div>
      </div>
    </div>
  );
}
