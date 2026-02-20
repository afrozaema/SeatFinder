import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database, Lock, Eye, EyeOff, LogOut, Table2, Search,
  RefreshCw, AlertCircle, CheckCircle2, Users,
  Pencil, Trash2, X, Save, Play, ChevronRight,
  ChevronDown, Plus, Download, Copy, Filter,
  BookOpen, Activity, Settings, FileText, Code2,
  Info, List, SlidersHorizontal, ArrowUpDown,
  CheckSquare, Square, MoreHorizontal, EyeOff as Hide
} from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────────────────

type TableName = 'students' | 'teachers' | 'search_logs' | 'activity_logs' |
  'site_settings' | 'incidents' | 'keep_alive_log' | 'user_roles';

const ALL_TABLES: { name: TableName; icon: any; editable: boolean; color: string }[] = [
  { name: 'students',       icon: BookOpen,     editable: true,  color: '#3b82f6' },
  { name: 'teachers',       icon: Users,        editable: true,  color: '#10b981' },
  { name: 'incidents',      icon: AlertCircle,  editable: true,  color: '#ef4444' },
  { name: 'site_settings',  icon: Settings,     editable: true,  color: '#8b5cf6' },
  { name: 'search_logs',    icon: Search,       editable: false, color: '#f59e0b' },
  { name: 'activity_logs',  icon: Activity,     editable: false, color: '#ec4899' },
  { name: 'keep_alive_log', icon: Database,     editable: false, color: '#06b6d4' },
  { name: 'user_roles',     icon: FileText,     editable: false, color: '#6366f1' },
];

const PAGE_SIZE = 50;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatVal(val: any, col: string): string {
  if (val === null || val === undefined) return 'NULL';
  if (col.endsWith('_at') || col === 'pinged_at') return new Date(val).toLocaleString();
  return String(val);
}

function CellChip({ val, col }: { val: any; col: string }) {
  if (val === null || val === undefined)
    return <span className="px-1.5 py-0.5 rounded text-[11px] bg-gray-100 text-gray-400 italic font-mono">NULL</span>;
  if (typeof val === 'boolean')
    return <span className={`px-1.5 py-0.5 rounded-full text-[11px] font-semibold ${val ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>{String(val)}</span>;
  if (col === 'id' || col.endsWith('_id'))
    return <span className="font-mono text-[11px] text-blue-500">{String(val).substring(0, 8)}…</span>;
  if (col.endsWith('_at') || col === 'pinged_at')
    return <span className="text-[12px] text-gray-500">{new Date(val).toLocaleString()}</span>;
  const str = String(val);
  return <span className="text-[13px] text-gray-800">{str.length > 55 ? str.substring(0, 55) + '…' : str}</span>;
}

// ─── Insert / Edit Modal ──────────────────────────────────────────────────────
function RowModal({
  row, tableName, columns, onClose, onSaved, mode
}: {
  row?: any; tableName: TableName; columns: string[]; onClose: () => void; onSaved: () => void; mode: 'insert' | 'edit';
}) {
  const skipCols = ['id', 'created_at', 'updated_at'];
  const editableCols = columns.filter(c => !skipCols.includes(c));
  const [form, setForm] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    editableCols.forEach(c => { init[c] = row?.[c] ?? ''; });
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true); setError('');
    let err: any;
    if (mode === 'edit') {
      ({ error: err } = await (supabase.from(tableName) as any).update(form).eq('id', row.id));
    } else {
      ({ error: err } = await (supabase.from(tableName) as any).insert([form]));
    }
    if (err) { setError(err.message); setSaving(false); return; }
    onSaved(); onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-gray-50 rounded-t-xl">
          <div className="flex items-center gap-2">
            {mode === 'edit' ? <Pencil className="w-4 h-4 text-blue-500" /> : <Plus className="w-4 h-4 text-emerald-500" />}
            <span className="font-semibold text-gray-800 text-sm">{mode === 'edit' ? 'Edit Row' : 'Insert Row'} — <code className="text-blue-600">{tableName}</code></span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"><X className="w-4 h-4" /></button>
        </div>

        {/* Read-only fields (edit mode) */}
        {mode === 'edit' && (
          <div className="px-5 pt-4 pb-2 border-b border-dashed border-gray-200 bg-gray-50/50">
            <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-2">Read-only</p>
            {skipCols.filter(c => columns.includes(c)).map(c => (
              <div key={c} className="flex items-center gap-3 mb-1.5">
                <span className="text-[11px] font-mono text-gray-400 w-24 shrink-0">{c}</span>
                <span className="text-[12px] text-gray-500 font-mono truncate">{String(row?.[c] ?? '')}</span>
              </div>
            ))}
          </div>
        )}

        {/* Editable fields */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {editableCols.map(col => (
            <div key={col}>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1 font-mono">{col}</label>
              <input value={form[col] ?? ''} onChange={e => setForm(f => ({ ...f, [col]: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono" />
            </div>
          ))}
          {error && <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2"><AlertCircle className="w-3.5 h-3.5" />{error}</div>}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-200 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className={`px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-1.5 transition-colors disabled:opacity-50 ${mode === 'edit' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {mode === 'edit' ? 'Save Changes' : 'Insert Row'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Delete Confirm ──────────────────────────────────────────────────────────
function DeleteConfirm({ count, onConfirm, onCancel, loading }: { count: number; onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5 border border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0"><Trash2 className="w-4.5 h-4.5 text-red-600" /></div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Delete {count > 1 ? `${count} rows` : 'row'}?</h3>
            <p className="text-gray-500 text-xs mt-0.5">This action cannot be undone.</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
          <button onClick={onConfirm} disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5 transition-colors">
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
  const [sql, setSql] = useState('SELECT * FROM students\nLIMIT 50;');
  const [results, setResults] = useState<any[] | null>(null);
  const [cols, setCols] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
  const [execTime, setExecTime] = useState<number | null>(null);

  const SNIPPETS = [
    { label: 'SELECT students',     sql: 'SELECT * FROM students\nORDER BY created_at DESC\nLIMIT 50;' },
    { label: 'SELECT teachers',     sql: 'SELECT * FROM teachers\nORDER BY created_at DESC\nLIMIT 50;' },
    { label: 'SELECT search_logs',  sql: 'SELECT * FROM search_logs\nORDER BY created_at DESC\nLIMIT 25;' },
    { label: 'SELECT activity_logs',sql: 'SELECT * FROM activity_logs\nORDER BY created_at DESC\nLIMIT 25;' },
    { label: 'SELECT incidents',    sql: 'SELECT * FROM incidents\nLIMIT 25;' },
    { label: 'SELECT site_settings',sql: 'SELECT * FROM site_settings;' },
    { label: 'SELECT keep_alive_log',sql: 'SELECT * FROM keep_alive_log\nORDER BY pinged_at DESC\nLIMIT 20;' },
    { label: 'SELECT user_roles',   sql: 'SELECT * FROM user_roles;' },
    { label: 'Count students by unit',sql: 'SELECT unit, COUNT(*) as count\nFROM students\nGROUP BY unit\nORDER BY count DESC;' },
    { label: 'Search logs today',   sql: `SELECT * FROM search_logs\nWHERE created_at >= CURRENT_DATE\nORDER BY created_at DESC;` },
  ];

  const runQuery = async () => {
    setRunning(true); setError(''); setResults(null); setCols([]);
    const t0 = performance.now();
    const trimmed = sql.trim().toLowerCase();
    if (!trimmed.startsWith('select')) {
      setError('⛔ Only SELECT queries are permitted for safety.');
      setRunning(false); return;
    }
    const match = sql.match(/from\s+(\w+)/i);
    if (!match) { setError('Could not determine table name.'); setRunning(false); return; }
    const table = match[1] as TableName;
    const limitMatch = sql.match(/limit\s+(\d+)/i);
    const limit = limitMatch ? parseInt(limitMatch[1]) : 100;
    const { data, error: err } = await (supabase.from(table) as any).select('*').limit(limit);
    const t1 = performance.now();
    setExecTime(Math.round(t1 - t0));
    if (err) { setError(err.message); setRunning(false); return; }
    setResults(data ?? []);
    setCols(data && data.length > 0 ? Object.keys(data[0]) : []);
    setRunning(false);
  };

  const exportCSV = () => {
    if (!results || results.length === 0) return;
    const header = cols.join(',');
    const rows = results.map(r => cols.map(c => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'query_result.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Snippet sidebar */}
      <div className="w-48 shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="px-3 py-3 border-b border-gray-200">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Saved Queries</p>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {SNIPPETS.map((s, i) => (
            <button key={i} onClick={() => setSql(s.sql)}
              className="w-full text-left px-3 py-2 text-[12px] text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm transition-all flex items-center gap-1.5">
              <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />{s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Editor pane */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="bg-gray-800 px-4 py-2 flex items-center gap-2 border-b border-gray-700">
          <div className="flex-1 flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[11px] text-gray-400 font-mono">SQL Query</span>
          </div>
          <button onClick={runQuery} disabled={running}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[12px] font-semibold transition-colors disabled:opacity-50">
            {running ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Run (F5)
          </button>
          {results && results.length > 0 && (
            <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-[12px] transition-colors">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          )}
        </div>

        {/* Text area */}
        <div className="relative border-b border-gray-200">
          <textarea value={sql} onChange={e => setSql(e.target.value)}
            onKeyDown={e => { if (e.key === 'F5' || (e.ctrlKey && e.key === 'Enter')) { e.preventDefault(); runQuery(); } }}
            rows={6}
            className="w-full px-4 py-3 text-[13px] font-mono text-gray-100 bg-gray-900 focus:outline-none resize-none leading-relaxed"
            placeholder="SELECT * FROM students LIMIT 10;"
            spellCheck={false}
          />
          <div className="absolute bottom-2 right-3 text-[10px] text-gray-600 font-mono">Ctrl+Enter to run</div>
        </div>

        {/* Status bar */}
        <div className="px-4 py-1.5 bg-gray-100 border-b border-gray-200 flex items-center gap-4 text-[11px]">
          {results !== null && !error && (
            <>
              <span className="text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Query OK</span>
              <span className="text-gray-500">{results.length} row{results.length !== 1 ? 's' : ''} returned</span>
              {execTime !== null && <span className="text-gray-400">{execTime}ms</span>}
            </>
          )}
          {error && <span className="text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</span>}
          {results === null && !error && <span className="text-gray-400">Ready</span>}
        </div>

        {/* Results table */}
        <div className="flex-1 overflow-auto bg-white">
          {results && results.length > 0 && !error ? (
            <table className="w-full text-[12px] border-collapse">
              <thead className="sticky top-0 z-10">
                <tr>
                  {cols.map(c => (
                    <th key={c} className="px-3 py-2 text-left font-semibold text-gray-500 bg-gray-50 border-b border-r border-gray-200 whitespace-nowrap text-[11px] font-mono">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((row, i) => (
                  <tr key={i} className={`border-b border-gray-100 hover:bg-blue-50/40 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                    {cols.map(c => (
                      <td key={c} className="px-3 py-1.5 border-r border-gray-100 whitespace-nowrap">
                        <CellChip col={c} val={row[c]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : results !== null && results.length === 0 && !error ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <Table2 className="w-8 h-8 mb-2" />
              <p className="text-sm">Empty set (0 rows)</p>
            </div>
          ) : !error ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-300">
              <Play className="w-8 h-8 mb-2" />
              <p className="text-sm">Run a query to see results</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── Table Data View ──────────────────────────────────────────────────────────
function TableDataView({
  tableName, editable, onCountChange
}: {
  tableName: TableName; editable: boolean; onCountChange: (n: number) => void;
}) {
  const [data, setData]             = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [searchQ, setSearchQ]       = useState('');
  const [page, setPage]             = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortCol, setSortCol]       = useState<string | null>(null);
  const [sortDir, setSortDir]       = useState<'asc' | 'desc'>('asc');
  const [editRow, setEditRow]       = useState<any | null>(null);
  const [insertOpen, setInsertOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting]     = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await (supabase.from(tableName) as any)
      .select('*').order('created_at', { ascending: false }).limit(500);
    setData(rows ?? []);
    onCountChange((rows ?? []).length);
    setLoading(false);
  }, [tableName, onCountChange]);

  useEffect(() => { fetchData(); setPage(0); setSearchQ(''); setSelectedIds(new Set()); }, [tableName]);

  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  const filtered = data.filter(r =>
    !searchQ || Object.values(r).some(v => String(v ?? '').toLowerCase().includes(searchQ.toLowerCase()))
  );

  const sorted = sortCol
    ? [...filtered].sort((a, b) => {
        const av = a[sortCol] ?? ''; const bv = b[sortCol] ?? '';
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      })
    : filtered;

  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);

  const toggleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const toggleAll = () => {
    if (selectedIds.size === paged.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(paged.map(r => r.id)));
  };

  const handleDelete = async () => {
    setDeleting(true);
    const ids = editRow ? [editRow.id] : Array.from(selectedIds);
    for (const id of ids) {
      await (supabase.from(tableName) as any).delete().eq('id', id);
    }
    setDeleting(false);
    setDeleteConfirm(false);
    setEditRow(null);
    setSelectedIds(new Set());
    fetchData();
  };

  const exportCSV = () => {
    if (!data.length) return;
    const rows = editable ? data : sorted;
    const header = columns.join(',');
    const body = rows.map(r => columns.map(c => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(','));
    const csv = [header, ...body].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${tableName}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-2 flex-wrap">
        {editable && (
          <>
            <button onClick={() => setInsertOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold transition-colors shadow-sm">
              <Plus className="w-3.5 h-3.5" /> Insert Row
            </button>
            {selectedIds.size > 0 && (
              <button onClick={() => setDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[12px] font-semibold transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Delete ({selectedIds.size})
              </button>
            )}
          </>
        )}

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input value={searchQ} onChange={e => { setSearchQ(e.target.value); setPage(0); }}
            placeholder="Search rows…"
            className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-[12px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-44" />
        </div>

        <div className="flex-1" />

        <span className="text-[12px] text-gray-400">{sorted.length} rows</span>

        <button onClick={fetchData} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition-all">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
        <button onClick={exportCSV} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition-all" title="Export CSV">
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
          </div>
        ) : paged.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <Table2 className="w-8 h-8 mb-2" />
            <p className="text-sm">Empty set (0 rows)</p>
          </div>
        ) : (
          <table className="w-full text-[12px] border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                {editable && (
                  <th className="w-8 px-2 py-2.5 border-r border-gray-200">
                    <button onClick={toggleAll} className="text-gray-400 hover:text-gray-700">
                      {selectedIds.size === paged.length && paged.length > 0
                        ? <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
                        : <Square className="w-3.5 h-3.5" />}
                    </button>
                  </th>
                )}
                <th className="px-2 py-2.5 text-center text-[10px] text-gray-400 font-semibold border-r border-gray-200 w-10">#</th>
                {columns.map(c => (
                  <th key={c} onClick={() => toggleSort(c)}
                    className="px-3 py-2.5 text-left text-[11px] font-bold text-gray-600 border-r border-gray-200 whitespace-nowrap cursor-pointer hover:bg-gray-200 transition-colors select-none group">
                    <div className="flex items-center gap-1">
                      <span className="font-mono">{c}</span>
                      <ArrowUpDown className={`w-3 h-3 transition-opacity ${sortCol === c ? 'text-blue-500 opacity-100' : 'text-gray-300 opacity-0 group-hover:opacity-100'}`} />
                    </div>
                  </th>
                ))}
                {editable && (
                  <th className="px-2 py-2.5 text-center text-[10px] text-gray-400 font-semibold w-20 sticky right-0 bg-gray-100 border-l border-gray-200">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {paged.map((row, i) => {
                const isSelected = selectedIds.has(row.id);
                return (
                  <tr key={i} className={`border-b border-gray-100 transition-colors group
                    ${isSelected ? 'bg-blue-50' : i % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/50 hover:bg-gray-100/60'}`}>
                    {editable && (
                      <td className="px-2 py-1.5 border-r border-gray-100 text-center">
                        <button onClick={() => toggleSelect(row.id)} className="text-gray-300 hover:text-blue-500">
                          {isSelected ? <CheckSquare className="w-3.5 h-3.5 text-blue-500" /> : <Square className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    )}
                    <td className="px-2 py-1.5 text-center text-[11px] text-gray-400 border-r border-gray-100 font-mono">
                      {page * PAGE_SIZE + i + 1}
                    </td>
                    {columns.map(c => (
                      <td key={c} className="px-3 py-1.5 border-r border-gray-100 whitespace-nowrap max-w-xs">
                        <CellChip col={c} val={row[c]} />
                      </td>
                    ))}
                    {editable && (
                      <td className="px-2 py-1.5 text-center sticky right-0 border-l border-gray-100 bg-white group-hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setEditRow(row)}
                            className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-100 transition-all" title="Edit">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => { setEditRow(row); setDeleteConfirm(true); }}
                            className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-100 transition-all" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination + status bar */}
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 flex items-center justify-between text-[11px] text-gray-500">
        <div className="flex items-center gap-3">
          <span>Showing <b>{page * PAGE_SIZE + 1}</b>–<b>{Math.min((page + 1) * PAGE_SIZE, sorted.length)}</b> of <b>{sorted.length}</b></span>
          {selectedIds.size > 0 && <span className="text-blue-600">{selectedIds.size} selected</span>}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(0)} disabled={page === 0}
              className="px-2 py-1 rounded border border-gray-200 hover:bg-white disabled:opacity-30 transition-all">«</button>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="px-2 py-1 rounded border border-gray-200 hover:bg-white disabled:opacity-30 transition-all">‹</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, k) => {
              const pg = Math.max(0, Math.min(page - 2, totalPages - 5)) + k;
              return (
                <button key={pg} onClick={() => setPage(pg)}
                  className={`px-2.5 py-1 rounded border transition-all ${pg === page ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 hover:bg-white'}`}>
                  {pg + 1}
                </button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
              className="px-2 py-1 rounded border border-gray-200 hover:bg-white disabled:opacity-30 transition-all">›</button>
            <button onClick={() => setPage(totalPages - 1)} disabled={page === totalPages - 1}
              className="px-2 py-1 rounded border border-gray-200 hover:bg-white disabled:opacity-30 transition-all">»</button>
          </div>
        )}
      </div>

      {/* Modals */}
      {insertOpen && (
        <RowModal mode="insert" tableName={tableName} columns={columns}
          onClose={() => setInsertOpen(false)} onSaved={fetchData} />
      )}
      {editRow && !deleteConfirm && (
        <RowModal mode="edit" row={editRow} tableName={tableName} columns={columns}
          onClose={() => setEditRow(null)} onSaved={fetchData} />
      )}
      {deleteConfirm && (
        <DeleteConfirm
          count={editRow ? 1 : selectedIds.size}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => { setDeleteConfirm(false); setEditRow(null); }} />
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DatabaseViewer() {
  const { user, isAdmin, loading, adminLoading, signIn, signOut } = useAuth();

  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [loginErr, setLoginErr]     = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [activeView, setActiveView] = useState<'browser' | 'sql'>('browser');
  const [selectedTable, setSelectedTable] = useState<TableName>(ALL_TABLES[0].name);
  const [tableCounts, setTableCounts] = useState<Record<string, number>>({});
  const [expandedDb, setExpandedDb] = useState(true);

  const isAuthenticated = !loading && !adminLoading && !!user && isAdmin;

  const fetchCounts = useCallback(async () => {
    const counts: Record<string, number> = {};
    await Promise.all(ALL_TABLES.map(async t => {
      const { count } = await (supabase.from(t.name) as any).select('*', { count: 'exact', head: true });
      counts[t.name] = count ?? 0;
    }));
    setTableCounts(counts);
  }, []);

  useEffect(() => { if (isAuthenticated) fetchCounts(); }, [isAuthenticated, fetchCounts]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoginLoading(true); setLoginErr('');
    const { error } = await signIn(email, password);
    if (error) setLoginErr(error.message || 'Invalid credentials');
    setLoginLoading(false);
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading || adminLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  // ── Login ───────────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4 shadow-xl">
              <Database className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">JU Database Manager</h1>
            <p className="text-gray-400 text-sm mt-1">Sign in with your admin account to continue</p>
          </div>

          <form onSubmit={handleLogin} className="bg-white rounded-2xl p-6 shadow-2xl space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="admin@example.com"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <AnimatePresence>
              {loginErr && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 text-red-600 text-xs bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />{loginErr}
                </motion.div>
              )}
            </AnimatePresence>
            <button type="submit" disabled={loginLoading}
              className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors shadow-sm">
              {loginLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {loginLoading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // ── Main App ─────────────────────────────────────────────────────────────────
  const currentMeta = ALL_TABLES.find(t => t.name === selectedTable)!;

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden font-mono">
      {/* Top bar */}
      <header className="bg-gray-900 text-white flex items-center px-4 py-2.5 gap-4 shrink-0 border-b border-gray-700 select-none">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-400" />
          <span className="font-bold text-sm tracking-wide text-blue-300">JU Database Manager</span>
        </div>

        <div className="h-4 w-px bg-gray-700" />

        {/* Tabs */}
        <div className="flex items-center gap-1">
          <button onClick={() => setActiveView('browser')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors ${activeView === 'browser' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
            <Table2 className="w-3.5 h-3.5" /> Table Browser
          </button>
          <button onClick={() => setActiveView('sql')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors ${activeView === 'sql' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
            <Code2 className="w-3.5 h-3.5" /> SQL Editor
          </button>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2 text-[11px] text-gray-400">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{user?.email}</span>
        </div>
        <button onClick={() => signOut()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
          <LogOut className="w-3.5 h-3.5" /> Logout
        </button>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — object browser */}
        {activeView === 'browser' && (
          <aside className="w-52 shrink-0 bg-gray-800 border-r border-gray-700 flex flex-col overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-700">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Object Browser</p>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              {/* Database node */}
              <button onClick={() => setExpandedDb(!expandedDb)}
                className="w-full flex items-center gap-1.5 px-2.5 py-2 hover:bg-gray-700 transition-colors text-left group">
                {expandedDb ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
                <Database className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-[12px] text-gray-200 font-semibold">ju_database</span>
              </button>

              {expandedDb && (
                <div className="ml-3 border-l border-gray-700 pl-1 py-1 space-y-0.5">
                  {/* Tables heading */}
                  <div className="flex items-center gap-1.5 px-2 py-1">
                    <List className="w-3 h-3 text-gray-500" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Tables ({ALL_TABLES.length})</span>
                  </div>
                  {ALL_TABLES.map(t => {
                    const Icon = t.icon;
                    const isActive = selectedTable === t.name;
                    return (
                      <button key={t.name} onClick={() => setSelectedTable(t.name)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-all text-left ${isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}>
                        <Icon className="w-3 h-3 shrink-0" style={{ color: isActive ? 'white' : t.color }} />
                        <span className="text-[12px] flex-1 truncate font-mono">{t.name}</span>
                        <span className={`text-[10px] px-1 rounded ${isActive ? 'bg-blue-500 text-blue-100' : 'bg-gray-700 text-gray-500'}`}>
                          {tableCounts[t.name] ?? '…'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* DB info */}
            <div className="border-t border-gray-700 px-3 py-2 text-[10px] text-gray-500">
              <p>PostgreSQL · Supabase</p>
              <p className="text-emerald-500 flex items-center gap-1 mt-0.5"><CheckCircle2 className="w-2.5 h-2.5" /> Connected</p>
            </div>
          </aside>
        )}

        {/* Main panel */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          {activeView === 'sql' ? (
            <SqlEditor />
          ) : (
            <>
              {/* Table tab bar */}
              <div className="bg-gray-100 border-b border-gray-200 px-4 flex items-center gap-0 h-9 shrink-0">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-b-0 border-gray-200 rounded-t-md -mb-px text-[12px] text-gray-700 font-semibold">
                  <Table2 className="w-3.5 h-3.5" style={{ color: currentMeta.color }} />
                  {selectedTable}
                  {!currentMeta.editable && <span className="ml-1 px-1 rounded text-[10px] bg-gray-100 text-gray-400">readonly</span>}
                </div>
              </div>

              {/* Data */}
              <TableDataView
                tableName={selectedTable}
                editable={currentMeta.editable}
                onCountChange={n => setTableCounts(c => ({ ...c, [selectedTable]: n }))}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
