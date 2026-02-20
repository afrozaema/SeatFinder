import { useState, useEffect, useCallback, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { sql as sqlLang } from '@codemirror/lang-sql';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { EditorView, keymap } from '@codemirror/view';
import { Prec } from '@codemirror/state';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database, Lock, Eye, EyeOff, LogOut, Table2, Search,
  RefreshCw, AlertCircle, CheckCircle2, Users,
  Pencil, Trash2, X, Save, Play, ChevronRight,
  ChevronDown, Plus, Download, Upload, Filter,
  BookOpen, Activity, Settings, FileText, Code2,
  List, ArrowUpDown, CheckSquare, Square, Copy,
  BarChart3, Columns, Info, Hash, AlignLeft, Calendar,
  ToggleLeft, Layers, UserPlus, Shield, Mail, Key, UserX
} from 'lucide-react';

// ─── Types & Constants ────────────────────────────────────────────────────────
type TableName = 'students' | 'teachers' | 'search_logs' | 'activity_logs' |
  'site_settings' | 'incidents' | 'keep_alive_log' | 'user_roles';

const ALL_TABLES: { name: TableName; icon: any; editable: boolean; color: string }[] = [
  { name: 'students',       icon: BookOpen,    editable: true,  color: '#3b82f6' },
  { name: 'teachers',       icon: Users,       editable: true,  color: '#10b981' },
  { name: 'incidents',      icon: AlertCircle, editable: true,  color: '#ef4444' },
  { name: 'site_settings',  icon: Settings,    editable: true,  color: '#8b5cf6' },
  { name: 'search_logs',    icon: Search,      editable: false, color: '#f59e0b' },
  { name: 'activity_logs',  icon: Activity,    editable: false, color: '#ec4899' },
  { name: 'keep_alive_log', icon: Database,    editable: false, color: '#06b6d4' },
  { name: 'user_roles',     icon: FileText,    editable: false, color: '#6366f1' },
];

const ROW_LIMITS = [25, 50, 100, 250, 500];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function inferType(col: string, val: any): string {
  if (col === 'id' || col.endsWith('_id')) return 'uuid';
  if (col.endsWith('_at') || col === 'pinged_at') return 'timestamptz';
  if (col === 'exam_date') return 'date';
  if (typeof val === 'boolean' || col === 'found') return 'boolean';
  if (typeof val === 'number') return 'integer';
  return 'text';
}

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    uuid: 'bg-purple-100 text-purple-700',
    timestamptz: 'bg-blue-100 text-blue-700',
    date: 'bg-cyan-100 text-cyan-700',
    boolean: 'bg-amber-100 text-amber-700',
    integer: 'bg-green-100 text-green-700',
    text: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${colors[type] || colors.text}`}>{type}</span>
  );
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

// ─── Row Modal (Insert / Edit) ────────────────────────────────────────────────
function RowModal({ row, tableName, columns, onClose, onSaved, mode }: {
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
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-gray-50 rounded-t-xl">
          <div className="flex items-center gap-2">
            {mode === 'edit' ? <Pencil className="w-4 h-4 text-blue-500" /> : <Plus className="w-4 h-4 text-emerald-500" />}
            <span className="font-semibold text-gray-800 text-sm">{mode === 'edit' ? 'Edit Row' : 'Insert Row'} — <code className="text-blue-600">{tableName}</code></span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"><X className="w-4 h-4" /></button>
        </div>
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

// ─── Delete Confirm ───────────────────────────────────────────────────────────
function DeleteConfirm({ count, onConfirm, onCancel, loading }: { count: number; onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5 border border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0"><Trash2 className="w-4 h-4 text-red-600" /></div>
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

// ─── CSV Import Modal ─────────────────────────────────────────────────────────
function CsvImportModal({ tableName, columns, onClose, onImported }: {
  tableName: TableName; columns: string[]; onClose: () => void; onImported: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState<number | null>(null);

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n');
    const hdrs = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const obj: Record<string, string> = {};
      hdrs.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
      return obj;
    });
    setHeaders(hdrs);
    setPreview(rows.slice(0, 5));
    return rows;
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(''); setPreview([]); setDone(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try { parseCSV(ev.target?.result as string); }
      catch { setError('Invalid CSV file.'); }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!fileRef.current?.files?.[0]) return;
    setImporting(true); setError('');
    const text = await fileRef.current.files[0].text();
    const rows = parseCSV(text);
    const skipCols = ['id', 'created_at', 'updated_at'];
    const clean = rows.map(r => {
      const obj: Record<string, string> = {};
      Object.keys(r).forEach(k => { if (!skipCols.includes(k)) obj[k] = r[k]; });
      return obj;
    });
    const { error: err } = await (supabase.from(tableName) as any).insert(clean);
    if (err) { setError(err.message); setImporting(false); return; }
    setDone(clean.length);
    setImporting(false);
    onImported();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-xl flex flex-col border border-gray-200">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-gray-50 rounded-t-xl">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-blue-500" />
            <span className="font-semibold text-gray-800 text-sm">Import CSV → <code className="text-blue-600">{tableName}</code></span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Available columns */}
          <div>
            <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-1.5">Available columns</p>
            <div className="flex flex-wrap gap-1.5">
              {columns.filter(c => !['id','created_at','updated_at'].includes(c)).map(c => (
                <span key={c} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-mono rounded-md border border-blue-200">{c}</span>
              ))}
            </div>
          </div>

          {/* File input */}
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all">
            <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Click to select CSV file</p>
            <p className="text-[11px] text-gray-400 mt-1">First row must be column headers</p>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div className="overflow-auto rounded-lg border border-gray-200">
              <p className="px-3 py-1.5 text-[11px] text-gray-500 bg-gray-50 border-b border-gray-200 font-semibold">Preview (first 5 rows)</p>
              <table className="w-full text-[11px]">
                <thead><tr>{headers.map(h => <th key={h} className="px-3 py-1.5 text-left font-semibold text-gray-500 bg-gray-50 border-r border-gray-100 font-mono">{h}</th>)}</tr></thead>
                <tbody>{preview.map((r, i) => (
                  <tr key={i} className="border-t border-gray-100">{headers.map(h => <td key={h} className="px-3 py-1.5 text-gray-700 border-r border-gray-100 truncate max-w-24">{r[h]}</td>)}</tr>
                ))}</tbody>
              </table>
            </div>
          )}

          {error && <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2"><AlertCircle className="w-3.5 h-3.5" />{error}</div>}
          {done !== null && <div className="flex items-center gap-2 text-emerald-700 text-xs bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2"><CheckCircle2 className="w-3.5 h-3.5" />{done} rows imported successfully!</div>}
        </div>

        <div className="px-5 py-3.5 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-200 transition-colors">Close</button>
          <button onClick={handleImport} disabled={importing || preview.length === 0}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5 transition-colors">
            {importing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            Import All Rows
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Table Structure Tab ──────────────────────────────────────────────────────
function StructureView({ data, tableName }: { data: any[]; tableName: TableName }) {
  if (data.length === 0) return (
    <div className="flex flex-col items-center justify-center h-40 text-gray-400">
      <Info className="w-8 h-8 mb-2" />
      <p className="text-sm">No data to infer structure</p>
    </div>
  );
  const sample = data[0];
  const columns = Object.keys(sample);
  const pkCols = ['id'];
  const notNullDefaults: Record<string, string> = {
    id: 'gen_random_uuid()', created_at: 'now()', updated_at: 'now()', exam_date: 'CURRENT_DATE'
  };

  return (
    <div className="overflow-auto flex-1">
      <table className="w-full text-[12px] border-collapse">
        <thead className="sticky top-0 z-10">
          <tr className="bg-gray-100 border-b-2 border-gray-300">
            {['#', 'Column', 'Type', 'Nullable', 'Default', 'Key'].map(h => (
              <th key={h} className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-600 border-r border-gray-200 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {columns.map((col, i) => {
            const type = inferType(col, sample[col]);
            const isPk = pkCols.includes(col);
            const isNullable = !['id','created_at','updated_at','roll_number','name','title','action','entity_type','user_id'].includes(col);
            const defaultVal = notNullDefaults[col] ?? (isNullable ? 'NULL' : '—');
            return (
              <tr key={col} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} hover:bg-blue-50/30 transition-colors`}>
                <td className="px-4 py-2 text-gray-400 font-mono border-r border-gray-100">{i + 1}</td>
                <td className="px-4 py-2 border-r border-gray-100">
                  <div className="flex items-center gap-1.5">
                    {isPk && <span className="text-[9px] px-1 py-0.5 bg-yellow-100 text-yellow-700 rounded font-bold">PK</span>}
                    {col.endsWith('_id') && !isPk && <span className="text-[9px] px-1 py-0.5 bg-blue-100 text-blue-700 rounded font-bold">FK</span>}
                    <span className="font-mono font-semibold text-gray-800">{col}</span>
                  </div>
                </td>
                <td className="px-4 py-2 border-r border-gray-100"><TypeBadge type={type} /></td>
                <td className="px-4 py-2 border-r border-gray-100">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${isNullable ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                    {isNullable ? 'YES' : 'NO'}
                  </span>
                </td>
                <td className="px-4 py-2 border-r border-gray-100 font-mono text-[11px] text-gray-500">{defaultVal}</td>
                <td className="px-4 py-2 font-mono text-[11px]">
                  {isPk ? <span className="text-yellow-600 font-bold">PRIMARY</span>
                    : col.endsWith('_id') ? <span className="text-blue-500">FOREIGN</span>
                    : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Summary */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex gap-6 text-[11px] text-gray-500">
        <span><b className="text-gray-700">{columns.length}</b> columns</span>
        <span><b className="text-gray-700">{columns.filter(c => ['id'].includes(c)).length}</b> primary key</span>
        <span><b className="text-gray-700">{columns.filter(c => c.endsWith('_id') && c !== 'id').length}</b> foreign keys</span>
        <span>Table: <b className="text-gray-700 font-mono">{tableName}</b></span>
      </div>
    </div>
  );
}

// ─── Stats Tab ────────────────────────────────────────────────────────────────
function StatsView({ data, tableName }: { data: any[]; tableName: TableName }) {
  if (data.length === 0) return (
    <div className="flex flex-col items-center justify-center h-40 text-gray-400">
      <BarChart3 className="w-8 h-8 mb-2" /><p className="text-sm">No data</p>
    </div>
  );
  const columns = Object.keys(data[0]);

  const stats = columns.map(col => {
    const vals = data.map(r => r[col]).filter(v => v !== null && v !== undefined);
    const nullCount = data.length - vals.length;
    const uniqueVals = new Set(vals.map(String));
    const type = inferType(col, data[0][col]);
    const numVals = vals.map(Number).filter(n => !isNaN(n));
    const avg = numVals.length ? (numVals.reduce((a, b) => a + b, 0) / numVals.length).toFixed(2) : null;
    const min = numVals.length ? Math.min(...numVals) : null;
    const max = numVals.length ? Math.max(...numVals) : null;

    // Most frequent value
    const freq: Record<string, number> = {};
    vals.forEach(v => { const k = String(v); freq[k] = (freq[k] || 0) + 1; });
    const topEntry = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
    const topVal = topEntry ? `${topEntry[0]} (${topEntry[1]}×)` : '—';

    return { col, type, total: data.length, nullCount, unique: uniqueVals.size, avg, min, max, topVal };
  });

  return (
    <div className="flex-1 overflow-auto p-4">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Total Rows', value: data.length, icon: Hash, color: 'bg-blue-50 text-blue-700 border-blue-200' },
          { label: 'Columns', value: columns.length, icon: Columns, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          { label: 'Table', value: tableName, icon: Table2, color: 'bg-purple-50 text-purple-700 border-purple-200' },
          { label: 'Null Cols', value: columns.filter(c => data.some(r => r[c] === null)).length, icon: AlertCircle, color: 'bg-amber-50 text-amber-700 border-amber-200' },
        ].map(s => (
          <div key={s.label} className={`border rounded-xl p-3 ${s.color}`}>
            <div className="flex items-center gap-2 mb-1">
              <s.icon className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">{s.label}</span>
            </div>
            <p className="text-lg font-bold font-mono">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Per-column stats */}
      <table className="w-full text-[12px] border-collapse rounded-xl overflow-hidden border border-gray-200">
        <thead>
          <tr className="bg-gray-100 border-b-2 border-gray-300">
            {['Column', 'Type', 'Total', 'Nulls', 'Unique', 'Min', 'Max', 'Avg', 'Most Frequent'].map(h => (
              <th key={h} className="px-3 py-2.5 text-left text-[11px] font-bold text-gray-600 border-r border-gray-200 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stats.map((s, i) => (
            <tr key={s.col} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-blue-50/20 transition-colors`}>
              <td className="px-3 py-2 font-mono font-semibold text-gray-800 border-r border-gray-100">{s.col}</td>
              <td className="px-3 py-2 border-r border-gray-100"><TypeBadge type={s.type} /></td>
              <td className="px-3 py-2 border-r border-gray-100 text-gray-600">{s.total}</td>
              <td className="px-3 py-2 border-r border-gray-100">
                <span className={s.nullCount > 0 ? 'text-amber-600 font-semibold' : 'text-gray-400'}>{s.nullCount}</span>
              </td>
              <td className="px-3 py-2 border-r border-gray-100 text-gray-600">{s.unique}</td>
              <td className="px-3 py-2 border-r border-gray-100 text-gray-500 font-mono">{s.min ?? '—'}</td>
              <td className="px-3 py-2 border-r border-gray-100 text-gray-500 font-mono">{s.max ?? '—'}</td>
              <td className="px-3 py-2 border-r border-gray-100 text-gray-500 font-mono">{s.avg ?? '—'}</td>
              <td className="px-3 py-2 text-gray-600 text-[11px] max-w-32 truncate">{s.topVal}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


type SqlGroup = { group: string; items: { label: string; sql: string; type: 'select' | 'insert' | 'update' | 'delete' }[] };


function SqlEditor() {
  const [sql, setSql] = useState('SELECT * FROM students\nORDER BY created_at DESC\nLIMIT 50;');
  const [results, setResults] = useState<any[] | null>(null);
  const [affectedRows, setAffectedRows] = useState<number | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [cols, setCols] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
  const [execTime, setExecTime] = useState<number | null>(null);
  const runQueryRef = useRef<() => void>(() => {});

  // ── Ctrl+Enter to run ─────────────────────────────────────────────────────
  const ctrlEnterExtension = Prec.highest(
    keymap.of([{
      key: 'Ctrl-Enter',
      run: () => { runQueryRef.current(); return true; },
    }])
  );

  const SNIPPET_GROUPS: SqlGroup[] = [
    {
      group: '🔍 SELECT',
      items: [
        { label: 'All students',       type: 'select', sql: 'SELECT * FROM students\nORDER BY created_at DESC\nLIMIT 50;' },
        { label: 'All teachers',       type: 'select', sql: 'SELECT * FROM teachers\nLIMIT 50;' },
        { label: 'Search logs',        type: 'select', sql: 'SELECT * FROM search_logs\nORDER BY created_at DESC\nLIMIT 25;' },
        { label: 'Activity logs',      type: 'select', sql: 'SELECT * FROM activity_logs\nORDER BY created_at DESC\nLIMIT 25;' },
        { label: 'Incidents',          type: 'select', sql: 'SELECT * FROM incidents\nLIMIT 25;' },
        { label: 'Site settings',      type: 'select', sql: 'SELECT * FROM site_settings;' },
        { label: 'Keep alive log',     type: 'select', sql: 'SELECT * FROM keep_alive_log\nORDER BY pinged_at DESC\nLIMIT 20;' },
        { label: 'User roles',         type: 'select', sql: 'SELECT * FROM user_roles;' },
        { label: 'Students by unit',   type: 'select', sql: 'SELECT unit, COUNT(*) as count\nFROM students\nGROUP BY unit\nORDER BY count DESC;' },
        { label: 'Found vs not found', type: 'select', sql: 'SELECT found, COUNT(*) as count\nFROM search_logs\nGROUP BY found;' },
      ],
    },
    {
      group: '➕ INSERT',
      items: [
        { label: 'Insert student', type: 'insert', sql: `INSERT INTO students (roll_number, name, institution, building, room, floor, report_time, start_time, end_time, directions, map_url, unit, exam_date)\nVALUES (\n  'ROLL001',\n  'Student Name',\n  'Institution Name',\n  'Building A',\n  'Room 101',\n  '1st',\n  '08:30 AM',\n  '09:00 AM',\n  '12:00 PM',\n  'Take main entrance, go straight',\n  'https://maps.google.com/',\n  'UNIT-A',\n  CURRENT_DATE\n);` },
        { label: 'Insert teacher', type: 'insert', sql: `INSERT INTO teachers (teacher_id, name, department, designation, email, phone, office_room)\nVALUES (\n  'TEACH001',\n  'Teacher Name',\n  'Computer Science',\n  'Professor',\n  'teacher@example.com',\n  '+1234567890',\n  'Room 201'\n);` },
        { label: 'Insert incident', type: 'insert', sql: `INSERT INTO incidents (title, description, severity, status)\nVALUES (\n  'Service Disruption',\n  'Brief description of the incident',\n  'minor',\n  'investigating'\n);` },
        { label: 'Insert site setting', type: 'insert', sql: `INSERT INTO site_settings (key, value)\nVALUES ('setting_key', 'setting_value')\nON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;` },
      ],
    },
    {
      group: '✏️ UPDATE',
      items: [
        { label: 'Update student room', type: 'update', sql: `UPDATE students\nSET room = 'Room 202', building = 'Building B'\nWHERE roll_number = 'ROLL001'\nRETURNING *;` },
        { label: 'Update teacher dept', type: 'update', sql: `UPDATE teachers\nSET department = 'Mathematics', designation = 'Associate Professor'\nWHERE teacher_id = 'TEACH001'\nRETURNING *;` },
        { label: 'Resolve incident',    type: 'update', sql: `UPDATE incidents\nSET status = 'resolved', resolved_at = NOW()\nWHERE status != 'resolved'\nRETURNING id, title, status, resolved_at;` },
        { label: 'Update site setting', type: 'update', sql: `UPDATE site_settings\nSET value = 'new_value'\nWHERE key = 'setting_key'\nRETURNING *;` },
      ],
    },
    {
      group: '🗑️ DELETE',
      items: [
        { label: 'Delete student by roll', type: 'delete', sql: `DELETE FROM students\nWHERE roll_number = 'ROLL001'\nRETURNING id, roll_number, name;` },
        { label: 'Delete teacher by id',   type: 'delete', sql: `DELETE FROM teachers\nWHERE teacher_id = 'TEACH001'\nRETURNING id, teacher_id, name;` },
        { label: 'Delete old search logs', type: 'delete', sql: `DELETE FROM search_logs\nWHERE created_at < NOW() - INTERVAL '30 days'\nRETURNING id, roll_number, created_at;` },
        { label: 'Delete incident by id',  type: 'delete', sql: `DELETE FROM incidents\nWHERE id = 'paste-uuid-here'\nRETURNING id, title;` },
      ],
    },
  ];

  const runQuery = async () => {
    setRunning(true); setError(''); setResults(null); setCols([]); setAffectedRows(null); setStatusMsg(null);
    const t0 = performance.now();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError('Not authenticated'); setRunning(false); return; }
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/execute-sql`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ sql: sql.trim().replace(/;+$/, '') }),
        }
      );
      setExecTime(Math.round(performance.now() - t0));
      const json = await res.json();
      if (!res.ok || json.error) { setError(json.error ?? `HTTP ${res.status}`); setRunning(false); return; }
      const result = json.data;
      if (Array.isArray(result)) {
        setResults(result);
        setCols(result.length > 0 ? Object.keys(result[0]) : []);
      } else if (result && typeof result === 'object') {
        if ('affected_rows' in result) setAffectedRows(Number(result.affected_rows));
        else if ('status' in result) setStatusMsg(String(result.status));
        else { setResults([result]); setCols(Object.keys(result)); }
      } else {
        setStatusMsg('Query executed successfully');
      }
    } catch (e: any) {
      setError(e.message ?? 'Network error');
    }
    setRunning(false);
  };

  // Keep ref in sync so the CodeMirror Ctrl+Enter binding always calls latest runQuery
  runQueryRef.current = runQuery;

  const exportCSV = () => {
    if (!results || !results.length) return;
    const header = cols.join(',');
    const body = results.map(r => cols.map(c => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(','));
    const blob = new Blob([[header, ...body].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'query_result.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const trimmedSql = sql.trim().toUpperCase();
  const queryType = trimmedSql.startsWith('SELECT') || trimmedSql.startsWith('WITH') ? 'select'
    : trimmedSql.startsWith('INSERT') ? 'insert'
    : trimmedSql.startsWith('UPDATE') ? 'update'
    : trimmedSql.startsWith('DELETE') ? 'delete'
    : 'other';

  const queryTypeBadge: Record<string, string> = {
    select: 'bg-blue-600', insert: 'bg-emerald-600',
    update: 'bg-amber-600', delete: 'bg-red-600', other: 'bg-gray-600',
  };

  return (
    <div className="flex h-full overflow-hidden flex-col md:flex-row">
      {/* Sidebar - hidden on mobile, collapsible */}
      <div className="hidden md:flex w-52 shrink-0 bg-gray-50 border-r border-gray-200 flex-col overflow-hidden">
        <div className="px-3 py-3 border-b border-gray-200">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Query Templates</p>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {SNIPPET_GROUPS.map(group => (
            <div key={group.group}>
              <p className="px-3 pt-3 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{group.group}</p>
              {group.items.map((s, i) => (
                <button key={i} onClick={() => setSql(s.sql)}
                  className="w-full text-left px-3 py-1.5 text-[12px] text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm transition-all flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />{s.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Toolbar */}
        <div className="bg-gray-800 px-3 md:px-4 py-2 flex items-center gap-1.5 md:gap-2 border-b border-gray-700 flex-wrap">
          <Code2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${queryTypeBadge[queryType]} text-white shrink-0`}>{queryType}</span>
          <span className="text-[11px] text-gray-400 font-mono hidden sm:inline">SQL Editor</span>
          <div className="flex-1" />
          <button onClick={runQuery} disabled={running}
            className="flex items-center gap-1 md:gap-1.5 px-2.5 md:px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] md:text-[12px] font-semibold transition-colors disabled:opacity-50 shrink-0">
            {running ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Run (Ctrl+Enter)</span>
            <span className="sm:hidden">Run</span>
          </button>
          {results && results.length > 0 && (
            <button onClick={exportCSV} className="flex items-center gap-1 md:gap-1.5 px-2.5 md:px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-[11px] md:text-[12px] transition-colors shrink-0">
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          )}
        </div>

        {/* Mobile: template selector */}
        <div className="md:hidden bg-gray-50 border-b border-gray-200 px-3 py-1.5 overflow-x-auto">
          <div className="flex gap-1.5 min-w-max">
            {SNIPPET_GROUPS.map(group => group.items.map((s, i) => (
              <button key={`${group.group}-${i}`} onClick={() => setSql(s.sql)}
                className="px-2 py-1 bg-white border border-gray-200 rounded text-[10px] text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 whitespace-nowrap transition-all">
                {s.label}
              </button>
            )))}
          </div>
        </div>

        {/* CodeMirror SQL Editor */}
        <div className="border-b border-gray-700 flex-shrink-0">
          <CodeMirror
            value={sql}
            onChange={setSql}
            theme={vscodeDark}
            extensions={[sqlLang(), EditorView.lineWrapping, ctrlEnterExtension]}
            height="220px"
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              highlightActiveLine: true,
              highlightSelectionMatches: true,
              autocompletion: true,
              bracketMatching: true,
              closeBrackets: true,
              indentOnInput: true,
            }}
            style={{ fontSize: '13px' }}
          />
          <div className="bg-gray-900 px-3 py-1 text-[10px] text-gray-500 font-mono border-t border-gray-700">
            Ctrl+Enter to run · SQL syntax highlighting powered by CodeMirror
          </div>
        </div>

        <div className="px-4 py-1.5 bg-gray-100 border-b border-gray-200 flex items-center gap-4 text-[11px]">
          {error ? (
            <span className="text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</span>
          ) : results !== null ? (
            <><span className="text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Query OK</span>
              <span className="text-gray-500">{results.length} row{results.length !== 1 ? 's' : ''} returned</span>
              {execTime !== null && <span className="text-gray-400">{execTime}ms</span>}</>
          ) : affectedRows !== null ? (
            <><span className="text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Query OK</span>
              <span className="text-gray-500">{affectedRows} row{affectedRows !== 1 ? 's' : ''} affected</span>
              {execTime !== null && <span className="text-gray-400">{execTime}ms</span>}</>
          ) : statusMsg ? (
            <span className="text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{statusMsg}</span>
          ) : (
            <span className="text-gray-400">Ready — type to get autocomplete suggestions</span>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-auto bg-white">
          {results && results.length > 0 && !error ? (
            <table className="w-full text-[12px] border-collapse">
              <thead className="sticky top-0 z-10">
                <tr>{cols.map(c => <th key={c} className="px-3 py-2 text-left font-semibold text-gray-500 bg-gray-50 border-b border-r border-gray-200 whitespace-nowrap text-[11px] font-mono">{c}</th>)}</tr>
              </thead>
              <tbody>
                {results.map((row, i) => (
                  <tr key={i} className={`border-b border-gray-100 hover:bg-blue-50/40 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                    {cols.map(c => <td key={c} className="px-3 py-1.5 border-r border-gray-100 whitespace-nowrap"><CellChip col={c} val={row[c]} /></td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : results !== null && results.length === 0 && !error ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400"><Table2 className="w-8 h-8 mb-2" /><p className="text-sm">Empty set (0 rows)</p></div>
          ) : affectedRows !== null ? (
            <div className="flex flex-col items-center justify-center h-32 text-emerald-500">
              <CheckCircle2 className="w-10 h-10 mb-2" />
              <p className="text-sm font-semibold">{affectedRows} row{affectedRows !== 1 ? 's' : ''} affected</p>
            </div>
          ) : statusMsg ? (
            <div className="flex flex-col items-center justify-center h-32 text-emerald-500">
              <CheckCircle2 className="w-10 h-10 mb-2" />
              <p className="text-sm font-semibold">{statusMsg}</p>
            </div>
          ) : !error ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-300">
              <Play className="w-8 h-8 mb-2" />
              <p className="text-sm">Run a query to see results</p>
              <p className="text-[11px] mt-1 text-gray-400">SELECT · INSERT · UPDATE · DELETE all supported</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── Table Data View ──────────────────────────────────────────────────────────
type DataTab = 'data' | 'structure' | 'stats';

function TableDataView({ tableName, editable, onCountChange }: {
  tableName: TableName; editable: boolean; onCountChange: (n: number) => void;
}) {
  const [data, setData]               = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [searchQ, setSearchQ]         = useState('');
  const [page, setPage]               = useState(0);
  const [rowLimit, setRowLimit]       = useState(100);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortCol, setSortCol]         = useState<string | null>(null);
  const [sortDir, setSortDir]         = useState<'asc' | 'desc'>('asc');
  const [editRow, setEditRow]         = useState<any | null>(null);
  const [insertOpen, setInsertOpen]   = useState(false);
  const [csvOpen, setCsvOpen]         = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [activeTab, setActiveTab]     = useState<DataTab>('data');
  const [hiddenCols, setHiddenCols]   = useState<Set<string>>(new Set());
  const [showColPicker, setShowColPicker] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await (supabase.from(tableName) as any)
      .select('*').order('created_at', { ascending: false }).limit(rowLimit);
    setData(rows ?? []);
    onCountChange((rows ?? []).length);
    setLoading(false);
  }, [tableName, rowLimit, onCountChange]);

  useEffect(() => { fetchData(); setPage(0); setSearchQ(''); setSelectedIds(new Set()); setHiddenCols(new Set()); setActiveTab('data'); }, [tableName]);
  useEffect(() => { if (activeTab === 'data') fetchData(); }, [rowLimit]);

  const allColumns = data.length > 0 ? Object.keys(data[0]) : [];
  const visibleColumns = allColumns.filter(c => !hiddenCols.has(c));

  const filtered = data.filter(r =>
    !searchQ || Object.values(r).some(v => String(v ?? '').toLowerCase().includes(searchQ.toLowerCase()))
  );
  const sorted = sortCol
    ? [...filtered].sort((a, b) => {
        const cmp = String(a[sortCol] ?? '').localeCompare(String(b[sortCol] ?? ''), undefined, { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      })
    : filtered;

  const PAGE_SIZE_VAL = 50;
  const paged = sorted.slice(page * PAGE_SIZE_VAL, (page + 1) * PAGE_SIZE_VAL);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE_VAL);

  const toggleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };
  const toggleSelect = (id: string) => setSelectedIds(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => selectedIds.size === paged.length ? setSelectedIds(new Set()) : setSelectedIds(new Set(paged.map(r => r.id)));
  const toggleCol = (col: string) => setHiddenCols(s => { const n = new Set(s); n.has(col) ? n.delete(col) : n.add(col); return n; });

  const handleDelete = async () => {
    setDeleting(true);
    const ids = editRow ? [editRow.id] : Array.from(selectedIds);
    for (const id of ids) await (supabase.from(tableName) as any).delete().eq('id', id);
    setDeleting(false); setDeleteConfirm(false); setEditRow(null); setSelectedIds(new Set());
    fetchData();
  };

  const handleDuplicate = async (row: any) => {
    const { id, created_at, updated_at, ...rest } = row;
    await (supabase.from(tableName) as any).insert([rest]);
    fetchData();
  };

  const exportCSV = () => {
    const rows = sorted;
    const header = allColumns.join(',');
    const body = rows.map(r => allColumns.map(c => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(','));
    const blob = new Blob([[header, ...body].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${tableName}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const TABS: { id: DataTab; label: string; icon: any }[] = [
    { id: 'data',      label: 'Data',      icon: Table2 },
    { id: 'structure', label: 'Structure', icon: Layers },
    { id: 'stats',     label: 'Statistics',icon: BarChart3 },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sub-tabs */}
      <div className="bg-gray-100 border-b border-gray-200 px-4 flex items-center gap-1 h-9 shrink-0">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-md text-[12px] font-semibold transition-colors -mb-px ${activeTab === t.id ? 'bg-white border border-b-0 border-gray-200 text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      {activeTab !== 'data' ? (
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeTab === 'structure' && <StructureView data={data} tableName={tableName} />}
          {activeTab === 'stats' && <StatsView data={data} tableName={tableName} />}
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="bg-white border-b border-gray-200 px-2 md:px-4 py-2 flex items-center gap-1.5 md:gap-2 flex-wrap">
            {editable && (
              <>
                <button onClick={() => setInsertOpen(true)}
                  className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] md:text-[12px] font-semibold transition-colors shadow-sm">
                  <Plus className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  <span className="hidden sm:inline">Insert</span>
                  <span className="sm:hidden">+</span>
                </button>
                <button onClick={() => setCsvOpen(true)}
                  className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] md:text-[12px] font-semibold transition-colors shadow-sm">
                  <Upload className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  <span className="hidden sm:inline">Import CSV</span>
                  <span className="sm:hidden">CSV</span>
                </button>
                {selectedIds.size > 0 && (
                  <button onClick={() => setDeleteConfirm(true)}
                    className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] md:text-[12px] font-semibold transition-colors">
                    <Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5" /> Delete ({selectedIds.size})
                  </button>
                )}
              </>
            )}

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 md:w-3.5 md:h-3.5 text-gray-400" />
              <input value={searchQ} onChange={e => { setSearchQ(e.target.value); setPage(0); }}
                placeholder="Search…"
                className="pl-7 md:pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-[11px] md:text-[12px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-28 md:w-44" />
            </div>

            <div className="flex-1" />

            {/* Row limit */}
            <div className="flex items-center gap-1 md:gap-1.5 text-[11px] md:text-[12px] text-gray-500">
              <span className="hidden sm:inline">Show</span>
              <select value={rowLimit} onChange={e => setRowLimit(Number(e.target.value))}
                className="border border-gray-200 rounded-lg px-1.5 md:px-2 py-1 text-[11px] md:text-[12px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {ROW_LIMITS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <span className="hidden sm:inline">rows</span>
            </div>

            {/* Column visibility */}
            <div className="relative">
              <button onClick={() => setShowColPicker(!showColPicker)}
                className={`flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 rounded-lg border text-[11px] md:text-[12px] transition-all ${showColPicker ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                <Columns className="w-3 h-3 md:w-3.5 md:h-3.5" />
                <span className="hidden sm:inline">Columns</span>
                {hiddenCols.size > 0 && <span className="text-blue-600 font-bold">({allColumns.length - hiddenCols.size}/{allColumns.length})</span>}
              </button>
              {showColPicker && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 p-3 w-52">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Toggle Columns</p>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {allColumns.map(col => (
                      <label key={col} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded">
                        <input type="checkbox" checked={!hiddenCols.has(col)} onChange={() => toggleCol(col)} className="accent-blue-600" />
                        <span className="text-[12px] font-mono text-gray-700">{col}</span>
                      </label>
                    ))}
                  </div>
                  <button onClick={() => setHiddenCols(new Set())} className="mt-2 text-[11px] text-blue-500 hover:text-blue-700">Show all</button>
                </div>
              )}
            </div>

            <span className="text-[11px] md:text-[12px] text-gray-400">{sorted.length} rows</span>
            <button onClick={fetchData} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition-all"><RefreshCw className="w-3 h-3 md:w-3.5 md:h-3.5" /></button>
            <button onClick={exportCSV} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition-all" title="Export CSV"><Download className="w-3 h-3 md:w-3.5 md:h-3.5" /></button>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto" onClick={() => showColPicker && setShowColPicker(false)}>
            {loading ? (
              <div className="flex items-center justify-center h-40"><RefreshCw className="w-5 h-5 text-blue-500 animate-spin" /></div>
            ) : paged.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400"><Table2 className="w-8 h-8 mb-2" /><p className="text-sm">Empty set (0 rows)</p></div>
            ) : (
              <table className="w-full text-[12px] border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    {editable && (
                      <th className="w-8 px-2 py-2.5 border-r border-gray-200">
                        <button onClick={toggleAll} className="text-gray-400 hover:text-gray-700">
                          {selectedIds.size === paged.length && paged.length > 0 ? <CheckSquare className="w-3.5 h-3.5 text-blue-500" /> : <Square className="w-3.5 h-3.5" />}
                        </button>
                      </th>
                    )}
                    <th className="px-2 py-2.5 text-center text-[10px] text-gray-400 font-semibold border-r border-gray-200 w-10">#</th>
                    {visibleColumns.map(c => (
                      <th key={c} onClick={() => toggleSort(c)}
                        className="px-3 py-2.5 text-left text-[11px] font-bold text-gray-600 border-r border-gray-200 whitespace-nowrap cursor-pointer hover:bg-gray-200 transition-colors select-none group">
                        <div className="flex items-center gap-1">
                          <span className="font-mono">{c}</span>
                          <ArrowUpDown className={`w-3 h-3 ${sortCol === c ? 'text-blue-500' : 'text-gray-300 opacity-0 group-hover:opacity-100'}`} />
                        </div>
                      </th>
                    ))}
                    {editable && <th className="px-2 py-2.5 text-center text-[10px] text-gray-400 font-semibold w-24 sticky right-0 bg-gray-100 border-l border-gray-200">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((row, i) => {
                    const isSelected = selectedIds.has(row.id);
                    return (
                      <tr key={i} className={`border-b border-gray-100 transition-colors group ${isSelected ? 'bg-blue-50' : i % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/50 hover:bg-gray-100/60'}`}>
                        {editable && (
                          <td className="px-2 py-1.5 border-r border-gray-100 text-center">
                            <button onClick={() => toggleSelect(row.id)}>
                              {isSelected ? <CheckSquare className="w-3.5 h-3.5 text-blue-500" /> : <Square className="w-3.5 h-3.5 text-gray-300 hover:text-gray-500" />}
                            </button>
                          </td>
                        )}
                        <td className="px-2 py-1.5 text-center text-[11px] text-gray-400 border-r border-gray-100 font-mono">{page * PAGE_SIZE_VAL + i + 1}</td>
                        {visibleColumns.map(c => (
                          <td key={c} className="px-3 py-1.5 border-r border-gray-100 whitespace-nowrap max-w-xs"><CellChip col={c} val={row[c]} /></td>
                        ))}
                        {editable && (
                          <td className="px-2 py-1.5 text-center sticky right-0 border-l border-gray-100 bg-white group-hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => setEditRow(row)} className="p-1.5 rounded-md bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-all" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDuplicate(row)} className="p-1.5 rounded-md bg-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all" title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
                              <button onClick={() => { setEditRow(row); setDeleteConfirm(true); }} className="p-1.5 rounded-md bg-red-100 text-red-600 hover:bg-red-600 hover:text-white transition-all" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
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

          {/* Pagination */}
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 flex items-center justify-between text-[11px] text-gray-500">
            <div className="flex items-center gap-3">
              <span>Showing <b>{page * PAGE_SIZE_VAL + 1}</b>–<b>{Math.min((page + 1) * PAGE_SIZE_VAL, sorted.length)}</b> of <b>{sorted.length}</b></span>
              {selectedIds.size > 0 && <span className="text-blue-600">{selectedIds.size} selected</span>}
              {hiddenCols.size > 0 && <span className="text-amber-600">{hiddenCols.size} columns hidden</span>}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(0)} disabled={page === 0} className="px-2 py-1 rounded border border-gray-200 hover:bg-white disabled:opacity-30">«</button>
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-2 py-1 rounded border border-gray-200 hover:bg-white disabled:opacity-30">‹</button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, k) => {
                  const pg = Math.max(0, Math.min(page - 2, totalPages - 5)) + k;
                  return (
                    <button key={pg} onClick={() => setPage(pg)}
                      className={`px-2.5 py-1 rounded border transition-all ${pg === page ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 hover:bg-white'}`}>{pg + 1}</button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} className="px-2 py-1 rounded border border-gray-200 hover:bg-white disabled:opacity-30">›</button>
                <button onClick={() => setPage(totalPages - 1)} disabled={page === totalPages - 1} className="px-2 py-1 rounded border border-gray-200 hover:bg-white disabled:opacity-30">»</button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modals */}
      {insertOpen && <RowModal mode="insert" tableName={tableName} columns={allColumns} onClose={() => setInsertOpen(false)} onSaved={fetchData} />}
      {editRow && !deleteConfirm && <RowModal mode="edit" row={editRow} tableName={tableName} columns={allColumns} onClose={() => setEditRow(null)} onSaved={fetchData} />}
      {deleteConfirm && <DeleteConfirm count={editRow ? 1 : selectedIds.size} loading={deleting} onConfirm={handleDelete} onCancel={() => { setDeleteConfirm(false); setEditRow(null); }} />}
      {csvOpen && <CsvImportModal tableName={tableName} columns={allColumns} onClose={() => setCsvOpen(false)} onImported={fetchData} />}
    </div>
  );
}

// ─── User Manager ─────────────────────────────────────────────────────────────
interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  role: string;
}

function UserManager() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'super_admin'>('admin');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    // Fetch user_roles + join with known emails stored in activity_logs
    const { data: roles } = await supabase.from('user_roles').select('*');
    if (roles) {
      // Try to get emails from activity_logs for matching user_ids
      const userIds = roles.map(r => r.user_id);
      const emailMap: Record<string, string> = {};
      for (const uid of userIds) {
        const { data: logs } = await supabase
          .from('activity_logs')
          .select('user_id')
          .eq('user_id', uid)
          .limit(1);
        if (logs) emailMap[uid] = uid; // We store uid as placeholder; real email comes from auth
      }
      setUsers(roles.map(r => ({
        id: r.id,
        email: r.user_id, // We'll show user_id since we can't query auth.users directly
        created_at: r.created_at,
        role: r.role,
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true); setError(''); setSuccess('');
    try {
      // 1. Sign up the new user via Supabase Auth admin (using service role via edge function isn't available here)
      // We use signUp which creates the user; then admin manually assigns role
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin }
      });
      if (signUpErr) throw new Error(signUpErr.message);
      const newUserId = signUpData.user?.id;
      if (!newUserId) throw new Error('User creation failed');

      // 2. Assign role
      const { error: roleErr } = await supabase.from('user_roles').insert({
        user_id: newUserId,
        role,
      });
      if (roleErr) throw new Error(roleErr.message);

      setSuccess(`User ${email} created with role "${role}". They must verify their email before logging in.`);
      setEmail(''); setPassword(''); setRole('admin');
      setShowCreate(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
    setCreating(false);
  };

  const handleDeleteRole = async (id: string) => {
    setDeletingId(id);
    await supabase.from('user_roles').delete().eq('id', id);
    setDeleteConfirmId(null);
    setDeletingId(null);
    fetchUsers();
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-500" />
          <span className="font-semibold text-gray-800 text-sm">User & Role Management</span>
          <span className="text-[11px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{users.length} users</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchUsers} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-500 transition-all"><RefreshCw className="w-3.5 h-3.5" /></button>
          <button onClick={() => { setShowCreate(true); setError(''); setSuccess(''); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[12px] font-semibold transition-colors shadow-sm">
            <UserPlus className="w-3.5 h-3.5" /> Create Admin User
          </button>
        </div>
      </div>

      {success && (
        <div className="mx-5 mt-4 flex items-start gap-2 text-emerald-700 text-sm bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="ml-auto text-emerald-400 hover:text-emerald-600"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Info banner */}
      <div className="mx-5 mt-4 flex items-start gap-2 text-blue-700 text-[12px] bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span>Showing admin/super_admin users only. Regular visitors don't have accounts — they access the site publicly.</span>
      </div>

      {/* Users table */}
      <div className="flex-1 overflow-auto p-5">
        {loading ? (
          <div className="flex items-center justify-center h-40"><RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" /></div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <Users className="w-10 h-10 mb-3" />
            <p className="text-sm font-medium">No admin users found</p>
            <p className="text-xs mt-1">Create your first admin user above</p>
          </div>
        ) : (
          <table className="w-full text-[13px] border-collapse rounded-xl overflow-hidden border border-gray-200">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-200">
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wider">#</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wider">User ID</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wider">Assigned At</th>
                <th className="px-4 py-3 text-center text-[11px] font-bold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} hover:bg-indigo-50/30 transition-colors`}>
                  <td className="px-4 py-3 text-gray-400 font-mono">{i + 1}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-blue-600">{u.email.substring(0, 20)}…</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      u.role === 'super_admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {u.role === 'super_admin' ? '⭐ super_admin' : '🛡 admin'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-[12px]">{new Date(u.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setDeleteConfirmId(u.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-100 transition-all"
                      title="Remove role"
                    >
                      <UserX className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-500" />
                <span className="font-semibold text-gray-800">Create Admin User</span>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreate} className="px-5 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="admin@example.com"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1"><Key className="w-3 h-3" /> Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min. 6 characters" minLength={6}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1"><Shield className="w-3 h-3" /> Role</label>
                <select value={role} onChange={e => setRole(e.target.value as 'admin' | 'super_admin')}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="admin">🛡 admin — Can manage students, teachers, data</option>
                  <option value="super_admin">⭐ super_admin — Full access including user roles</option>
                </select>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
                <button type="submit" disabled={creating}
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-colors">
                  {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  {creating ? 'Creating…' : 'Create User'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Role Confirm */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5 border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0"><UserX className="w-4 h-4 text-red-600" /></div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Remove admin role?</h3>
                <p className="text-gray-500 text-xs mt-0.5">This will revoke their dashboard access. The account still exists.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
              <button onClick={() => handleDeleteRole(deleteConfirmId)} disabled={!!deletingId}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5 transition-colors">
                {deletingId ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />}
                Remove Role
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DatabaseViewer() {
  const { user, isAdmin, loading, adminLoading, signIn, signOut } = useAuth();
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPw, setShowPw]           = useState(false);
  const [loginErr, setLoginErr]       = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [activeView, setActiveView]   = useState<'browser' | 'sql' | 'users'>('browser');
  const [selectedTable, setSelectedTable] = useState<TableName>(ALL_TABLES[0].name);
  const [tableCounts, setTableCounts] = useState<Record<string, number>>({});
  const [expandedDb, setExpandedDb]   = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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

  if (loading || adminLoading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center"><RefreshCw className="w-6 h-6 text-blue-500 animate-spin" /></div>
  );

  if (!isAuthenticated) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4 shadow-xl"><Database className="w-8 h-8 text-white" /></div>
          <h1 className="text-2xl font-bold text-white">JU Database Manager</h1>
          <p className="text-gray-400 text-sm mt-1">Admin access required</p>
        </div>
        <form onSubmit={handleLogin} className="bg-white rounded-2xl p-6 shadow-2xl space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="admin@example.com"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Password</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
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

  const currentMeta = ALL_TABLES.find(t => t.name === selectedTable) ?? ALL_TABLES[0];

  const SidebarContent = () => (
    <>
      <div className="px-3 py-2 border-b border-gray-700">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Object Browser</p>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        <button onClick={() => setExpandedDb(!expandedDb)}
          className="w-full flex items-center gap-1.5 px-2.5 py-2 hover:bg-gray-700 transition-colors text-left">
          {expandedDb ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
          <Database className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-[12px] text-gray-200 font-semibold">ju_database</span>
        </button>
        {expandedDb && (
          <div className="ml-3 border-l border-gray-700 pl-1 py-1 space-y-0.5">
            <div className="flex items-center gap-1.5 px-2 py-1">
              <List className="w-3 h-3 text-gray-500" />
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Tables ({ALL_TABLES.length})</span>
            </div>
            {ALL_TABLES.map(t => {
              const Icon = t.icon;
              const isActive = selectedTable === t.name;
              return (
                <button key={t.name} onClick={() => { setSelectedTable(t.name); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-all text-left ${isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}>
                  <Icon className="w-3 h-3 shrink-0" style={{ color: isActive ? 'white' : t.color }} />
                  <span className="text-[12px] flex-1 truncate font-mono">{t.name}</span>
                  <span className={`text-[10px] px-1 rounded ${isActive ? 'bg-blue-500 text-blue-100' : 'bg-gray-700 text-gray-500'}`}>{tableCounts[t.name] ?? '…'}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="border-t border-gray-700 px-3 py-2 text-[10px] text-gray-500">
        <p>PostgreSQL · Cloud DB</p>
        <p className="text-emerald-500 flex items-center gap-1 mt-0.5"><CheckCircle2 className="w-2.5 h-2.5" /> Connected</p>
      </div>
    </>
  );

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden font-mono">
      {/* Top bar */}
      <header className="bg-gray-900 text-white flex items-center px-3 md:px-4 py-2.5 gap-2 md:gap-4 shrink-0 border-b border-gray-700 select-none">
        {/* Mobile: hamburger for table browser */}
        {activeView === 'browser' && (
          <button onClick={() => setMobileSidebarOpen(true)}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors shrink-0">
            <List className="w-4 h-4" />
          </button>
        )}
        <div className="flex items-center gap-2 shrink-0">
          <Database className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
          <span className="font-bold text-xs md:text-sm tracking-wide text-blue-300 hidden sm:block">JU Database Manager</span>
          <span className="font-bold text-xs tracking-wide text-blue-300 sm:hidden">JU DB</span>
        </div>
        <div className="hidden md:block h-4 w-px bg-gray-700" />
        {/* Nav tabs */}
        <div className="flex items-center gap-0.5 md:gap-1 flex-1 md:flex-none overflow-x-auto">
          <button onClick={() => setActiveView('browser')}
            className={`flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 rounded-md text-[11px] md:text-[12px] font-semibold transition-colors whitespace-nowrap ${activeView === 'browser' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
            <Table2 className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span className="hidden sm:inline">Table Browser</span>
            <span className="sm:hidden">Tables</span>
          </button>
          <button onClick={() => setActiveView('sql')}
            className={`flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 rounded-md text-[11px] md:text-[12px] font-semibold transition-colors whitespace-nowrap ${activeView === 'sql' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
            <Code2 className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span>SQL</span>
          </button>
          <button onClick={() => setActiveView('users')}
            className={`flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 rounded-md text-[11px] md:text-[12px] font-semibold transition-colors whitespace-nowrap ${activeView === 'users' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
            <Users className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span>Users</span>
          </button>
        </div>
        <div className="flex-1 hidden md:block" />
        <div className="hidden sm:flex items-center gap-2 text-[10px] md:text-[11px] text-gray-400 shrink-0">
          <CheckCircle2 className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-400" />
          <span className="max-w-28 truncate">{user?.email}</span>
        </div>
        <button onClick={() => signOut()} className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 rounded-md text-[11px] md:text-[12px] text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0">
          <LogOut className="w-3 h-3 md:w-3.5 md:h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile sidebar overlay */}
        {mobileSidebarOpen && activeView === 'browser' && (
          <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileSidebarOpen(false)}>
            <div className="absolute inset-0 bg-black/60" />
            <aside className="absolute left-0 top-0 bottom-0 w-64 bg-gray-800 border-r border-gray-700 flex flex-col overflow-hidden z-50" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Object Browser</p>
                <button onClick={() => setMobileSidebarOpen(false)} className="p-1 rounded text-gray-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-1">
                <button onClick={() => setExpandedDb(!expandedDb)}
                  className="w-full flex items-center gap-1.5 px-2.5 py-2 hover:bg-gray-700 transition-colors text-left">
                  {expandedDb ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
                  <Database className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-[12px] text-gray-200 font-semibold">ju_database</span>
                </button>
                {expandedDb && (
                  <div className="ml-3 border-l border-gray-700 pl-1 py-1 space-y-0.5">
                    <div className="flex items-center gap-1.5 px-2 py-1">
                      <List className="w-3 h-3 text-gray-500" />
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Tables ({ALL_TABLES.length})</span>
                    </div>
                    {ALL_TABLES.map(t => {
                      const Icon = t.icon;
                      const isActive = selectedTable === t.name;
                      return (
                        <button key={t.name} onClick={() => { setSelectedTable(t.name); setMobileSidebarOpen(false); }}
                          className={`w-full flex items-center gap-2 px-2 py-2 rounded-md transition-all text-left ${isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}>
                          <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: isActive ? 'white' : t.color }} />
                          <span className="text-[13px] flex-1 truncate font-mono">{t.name}</span>
                          <span className={`text-[10px] px-1.5 rounded ${isActive ? 'bg-blue-500 text-blue-100' : 'bg-gray-700 text-gray-500'}`}>{tableCounts[t.name] ?? '…'}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="border-t border-gray-700 px-3 py-2 text-[10px] text-gray-500">
                <p>PostgreSQL · Cloud DB</p>
                <p className="text-emerald-500 flex items-center gap-1 mt-0.5"><CheckCircle2 className="w-2.5 h-2.5" /> Connected</p>
              </div>
            </aside>
          </div>
        )}

        {/* Desktop sidebar - only for browser view */}
        {activeView === 'browser' && (
          <aside className="hidden md:flex w-52 shrink-0 bg-gray-800 border-r border-gray-700 flex-col overflow-hidden">
            <SidebarContent />
          </aside>
        )}

        {/* Main */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white min-w-0">
          {activeView === 'sql' ? (
            <SqlEditor />
          ) : activeView === 'users' ? (
            <UserManager />
          ) : (
            <>
              <div className="bg-gray-100 border-b border-gray-200 px-2 md:px-4 flex items-center gap-0 h-9 shrink-0 overflow-x-auto">
                <div className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 bg-white border border-b-0 border-gray-200 rounded-t-md -mb-px text-[11px] md:text-[12px] text-gray-700 font-semibold whitespace-nowrap">
                  <Table2 className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0" style={{ color: currentMeta.color }} />
                  {selectedTable}
                  {!currentMeta.editable && <span className="ml-1 px-1 rounded text-[10px] bg-gray-100 text-gray-400">readonly</span>}
                </div>
              </div>
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
