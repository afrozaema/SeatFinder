import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database, Lock, Eye, EyeOff, LogOut, Table2, Search,
  Activity, Settings, BookOpen, RefreshCw,
  AlertCircle, CheckCircle2, Users, Pencil, Trash2,
  X, Save, Play, ChevronLeft, LayoutGrid, Code2, FileText, Plus
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

type TableName = 'students' | 'teachers' | 'search_logs' | 'activity_logs' | 'site_settings' | 'incidents' | 'keep_alive_log' | 'user_roles';

type Tab = 'database' | 'sql';

const ALL_TABLES: { name: TableName; label: string; icon: any; editable: boolean }[] = [
  { name: 'students',      label: 'students',      icon: BookOpen,   editable: true  },
  { name: 'teachers',      label: 'teachers',      icon: Users,      editable: true  },
  { name: 'search_logs',   label: 'search_logs',   icon: Search,     editable: false },
  { name: 'activity_logs', label: 'activity_logs', icon: Activity,   editable: false },
  { name: 'site_settings', label: 'site_settings', icon: Settings,   editable: true  },
  { name: 'incidents',     label: 'incidents',     icon: AlertCircle,editable: true  },
  { name: 'keep_alive_log',label: 'keep_alive_log',icon: Database,   editable: false },
  { name: 'user_roles',    label: 'user_roles',    icon: FileText,   editable: false },
];

const PAGE_SIZE = 25;

// ─── Helper: cell renderer ───────────────────────────────────────────────────
function CellValue({ col, val }: { col: string; val: any }) {
  if (val === null || val === undefined)
    return <span className="text-gray-400 italic text-xs">null</span>;
  if (typeof val === 'boolean')
    return (
      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${val ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {String(val)}
      </span>
    );
  if (col.endsWith('_at') || col === 'pinged_at')
    return <span className="text-gray-500 text-xs">{new Date(val).toLocaleString()}</span>;
  if (col === 'id' || col.endsWith('_id'))
    return <span className="text-gray-400 text-xs font-mono">{String(val).substring(0, 8)}…</span>;
  const str = String(val);
  return <span className="text-gray-800 text-sm">{str.length > 60 ? str.substring(0, 60) + '…' : str}</span>;
}

// ─── Edit Modal ──────────────────────────────────────────────────────────────
function EditModal({
  row, tableName, onClose, onSaved
}: {
  row: any; tableName: TableName; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState<Record<string, any>>({ ...row });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const readonlyCols = ['id', 'created_at', 'updated_at'];

  const handleSave = async () => {
    setSaving(true);
    setError('');
    const updates: Record<string, any> = {};
    Object.keys(form).forEach(k => {
      if (!readonlyCols.includes(k)) updates[k] = form[k];
    });
    const { error: err } = await (supabase.from(tableName) as any).update(updates).eq('id', row.id);
    if (err) { setError(err.message); setSaving(false); return; }
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Edit Row</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {Object.keys(form).map(col => (
            <div key={col}>
              <label className="block text-xs font-medium text-gray-500 mb-1">{col}</label>
              {readonlyCols.includes(col) ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-400 font-mono">
                  {String(form[col] ?? '')}
                </div>
              ) : (
                <input
                  value={form[col] ?? ''}
                  onChange={e => setForm(f => ({ ...f, [col]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          ))}
          {error && <p className="text-red-500 text-xs">{error}</p>}
        </div>
        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5 transition-colors">
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Delete Confirm ──────────────────────────────────────────────────────────
function DeleteConfirm({ onConfirm, onCancel, loading }: { onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="font-semibold text-gray-800">Delete Row?</h3>
        </div>
        <p className="text-gray-500 text-sm mb-5">This action cannot be undone. The row will be permanently deleted.</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
          <button onClick={onConfirm} disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5 transition-colors">
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── SQL Editor ──────────────────────────────────────────────────────────────
function SqlEditor() {
  const [sql, setSql] = useState('SELECT * FROM students LIMIT 10;');
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
  const [cols, setCols] = useState<string[]>([]);

  const SAFE_QUERIES = ['select'];

  const runQuery = async () => {
    setRunning(true);
    setError('');
    setResults(null);
    setCols([]);

    const trimmed = sql.trim().toLowerCase();
    if (!SAFE_QUERIES.some(k => trimmed.startsWith(k))) {
      setError('Only SELECT queries are allowed for safety.');
      setRunning(false);
      return;
    }

    // Parse table name from simple SELECT
    const match = sql.match(/from\s+(\w+)/i);
    if (!match) { setError('Could not determine table name from query.'); setRunning(false); return; }
    const table = match[1] as TableName;
    const limitMatch = sql.match(/limit\s+(\d+)/i);
    const limit = limitMatch ? parseInt(limitMatch[1]) : 100;

    const { data, error: err } = await (supabase.from(table) as any).select('*').limit(limit);
    if (err) { setError(err.message); setRunning(false); return; }
    setResults(data ?? []);
    setCols(data && data.length > 0 ? Object.keys(data[0]) : []);
    setRunning(false);
  };

  const SNIPPETS = [
    { label: 'All students', sql: 'SELECT * FROM students LIMIT 50;' },
    { label: 'All teachers', sql: 'SELECT * FROM teachers LIMIT 50;' },
    { label: 'Search logs', sql: 'SELECT * FROM search_logs ORDER BY created_at DESC LIMIT 25;' },
    { label: 'Activity logs', sql: 'SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 25;' },
    { label: 'Incidents', sql: 'SELECT * FROM incidents LIMIT 25;' },
    { label: 'Site settings', sql: 'SELECT * FROM site_settings;' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">SQL Editor</h2>
        <p className="text-sm text-gray-500">Run SELECT queries against your database tables.</p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Snippets sidebar */}
        <div className="w-52 shrink-0 border-r border-gray-200 bg-gray-50 p-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Quick queries</p>
          <div className="space-y-1">
            {SNIPPETS.map(s => (
              <button key={s.label} onClick={() => setSql(s.sql)}
                className="w-full text-left px-2.5 py-2 rounded-lg text-sm text-gray-600 hover:bg-white hover:shadow-sm hover:text-gray-900 transition-all">
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Editor + results */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Text area */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <textarea
              value={sql}
              onChange={e => setSql(e.target.value)}
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-gray-50"
              placeholder="SELECT * FROM students LIMIT 10;"
            />
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                ⚠ Only SELECT queries allowed
              </p>
              <button onClick={runQuery} disabled={running}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors shadow-sm">
                {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Run Query
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-auto bg-white">
            {error && (
              <div className="m-4 flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            {results !== null && !error && (
              results.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                  <Table2 className="w-8 h-8 mb-2" />
                  <p className="text-sm">No rows returned</p>
                </div>
              ) : (
                <div>
                  <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
                    <p className="text-xs text-gray-500">{results.length} row{results.length !== 1 ? 's' : ''} returned</p>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {cols.map(c => (
                          <th key={c} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {results.map((row, i) => (
                        <tr key={i} className="hover:bg-blue-50/40 transition-colors">
                          {cols.map(c => (
                            <td key={c} className="px-4 py-2.5 whitespace-nowrap">
                              <CellValue col={c} val={row[c]} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
            {results === null && !error && (
              <div className="flex flex-col items-center justify-center h-40 text-gray-300">
                <Code2 className="w-8 h-8 mb-2" />
                <p className="text-sm">Run a query to see results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function DatabaseViewer() {
  const { user, isAdmin, loading, adminLoading, signIn, signOut } = useAuth();

  // Login
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loginErr, setLoginErr] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Navigation
  const [tab, setTab]                     = useState<Tab>('database');
  const [selectedTable, setSelectedTable] = useState<TableName | null>(null);

  // Table data
  const [tableCounts, setTableCounts] = useState<Record<string, number>>({});
  const [tableData, setTableData]     = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [searchQ, setSearchQ]         = useState('');
  const [page, setPage]               = useState(0);

  // Edit / delete
  const [editRow, setEditRow]         = useState<any | null>(null);
  const [deleteRow, setDeleteRow]     = useState<any | null>(null);
  const [deleting, setDeleting]       = useState(false);

  const isAuthenticated = !loading && !adminLoading && !!user && isAdmin;

  // Fetch counts
  const fetchCounts = useCallback(async () => {
    const counts: Record<string, number> = {};
    await Promise.all(
      ALL_TABLES.map(async t => {
        const { count } = await (supabase.from(t.name) as any).select('*', { count: 'exact', head: true });
        counts[t.name] = count ?? 0;
      })
    );
    setTableCounts(counts);
  }, []);

  useEffect(() => { if (isAuthenticated) fetchCounts(); }, [isAuthenticated, fetchCounts]);

  // Fetch table data
  const fetchTableData = useCallback(async (name: TableName) => {
    setDataLoading(true);
    setPage(0);
    const { data } = await (supabase.from(name) as any).select('*').order('created_at', { ascending: false }).limit(500);
    setTableData(data ?? []);
    setDataLoading(false);
  }, []);

  useEffect(() => {
    if (selectedTable && isAuthenticated) fetchTableData(selectedTable);
  }, [selectedTable, isAuthenticated, fetchTableData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginErr('');
    const { error } = await signIn(email, password);
    if (error) setLoginErr(error.message || 'Invalid credentials');
    setLoginLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteRow || !selectedTable) return;
    setDeleting(true);
    await (supabase.from(selectedTable) as any).delete().eq('id', deleteRow.id);
    setDeleting(false);
    setDeleteRow(null);
    fetchTableData(selectedTable);
    fetchCounts();
  };

  const filteredData = tableData.filter(r =>
    !searchQ || Object.values(r).some(v => String(v ?? '').toLowerCase().includes(searchQ.toLowerCase()))
  );
  const paginatedData = filteredData.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const columns = paginatedData.length > 0 ? Object.keys(paginatedData[0]) : [];
  const currentTableMeta = ALL_TABLES.find(t => t.name === selectedTable);

  // ── Login screen ────────────────────────────────────────────────────────────
  if (loading || adminLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <RefreshCw className="w-6 h-6 text-blue-500" />
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-4 shadow-lg shadow-blue-200">
              <Database className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Database Viewer</h1>
            <p className="text-gray-500 text-sm mt-1">Sign in with your admin account</p>
          </div>

          <form onSubmit={handleLogin} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="admin@example.com"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {loginErr && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 text-red-600 text-xs bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {loginErr}
                </motion.div>
              )}
            </AnimatePresence>

            <button type="submit" disabled={loginLoading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors shadow-sm">
              {loginLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {loginLoading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // ── Main layout ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ── Sidebar ── */}
      <aside className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Database className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm">JU Database</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <button onClick={() => { setTab('database'); setSelectedTable(null); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${tab === 'database' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}>
            <LayoutGrid className="w-4 h-4" /> Database
          </button>
          <button onClick={() => { setTab('sql'); setSelectedTable(null); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${tab === 'sql' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}>
            <Code2 className="w-4 h-4" /> SQL editor
          </button>
        </nav>

        {/* User */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-2 px-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 truncate flex-1">{user?.email}</p>
          </div>
          <button onClick={() => signOut()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* ── Content ── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {tab === 'sql' ? (
          <SqlEditor />
        ) : !selectedTable ? (
          /* ── Table grid overview ── */
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Database</h1>
                  <p className="text-gray-500 text-sm mt-1">View and manage the data stored in your app.</p>
                </div>
                <button onClick={fetchCounts}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ALL_TABLES.map((t, i) => {
                  const Icon = t.icon;
                  return (
                    <motion.button
                      key={t.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => setSelectedTable(t.name)}
                      className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-2xl hover:border-blue-300 hover:shadow-sm transition-all text-left group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-blue-50 flex items-center justify-center transition-colors shrink-0">
                        <Icon className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{t.name}</p>
                        <p className="text-gray-400 text-xs mt-0.5">
                          {tableCounts[t.name] !== undefined ? `${tableCounts[t.name]} row${tableCounts[t.name] !== 1 ? 's' : ''}` : '…'}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* ── Table data view ── */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center gap-3">
              <button onClick={() => setSelectedTable(null)}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Overview
              </button>
              <span className="text-gray-300">/</span>
              <div className="flex items-center gap-2">
                {currentTableMeta && <currentTableMeta.icon className="w-4 h-4 text-gray-500" />}
                <h2 className="font-semibold text-gray-800 text-sm">{selectedTable}</h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                  {filteredData.length} rows
                </span>
              </div>

              <div className="flex-1" />

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input value={searchQ} onChange={e => { setSearchQ(e.target.value); setPage(0); }}
                  placeholder="Search…"
                  className="bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48" />
              </div>

              <button onClick={() => fetchTableData(selectedTable!)}
                className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-all">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto bg-white">
              {dataLoading ? (
                <div className="flex items-center justify-center h-48">
                  <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                </div>
              ) : paginatedData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                  <Table2 className="w-8 h-8 mb-2" />
                  <p className="text-sm">No rows found</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 w-10">#</th>
                      {columns.map(c => (
                        <th key={c} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{c}</th>
                      ))}
                      {currentTableMeta?.editable && (
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 sticky right-0 bg-gray-50">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedData.map((row, i) => (
                      <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.008 }}
                        className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-4 py-3 text-xs text-gray-400">{page * PAGE_SIZE + i + 1}</td>
                        {columns.map(c => (
                          <td key={c} className="px-4 py-3 whitespace-nowrap">
                            <CellValue col={c} val={row[c]} />
                          </td>
                        ))}
                        {currentTableMeta?.editable && (
                          <td className="px-4 py-3 text-right sticky right-0 bg-white group-hover:bg-blue-50/30 transition-colors">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setEditRow(row)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-100 transition-all">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setDeleteRow(row)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-100 transition-all">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-3 border-t border-gray-200 bg-white flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredData.length)} of {filteredData.length} rows
                </p>
                <div className="flex gap-1.5">
                  <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-all">Prev</button>
                  <span className="px-3 py-1.5 text-xs text-gray-400">{page + 1}/{totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-all">Next</button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      {editRow && selectedTable && (
        <EditModal row={editRow} tableName={selectedTable}
          onClose={() => setEditRow(null)}
          onSaved={() => { fetchTableData(selectedTable); fetchCounts(); }} />
      )}
      {deleteRow && (
        <DeleteConfirm loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteRow(null)} />
      )}
    </div>
  );
}
