import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database, Lock, Eye, EyeOff, LogOut, Table2, Users, Search,
  Activity, Settings, BookOpen, ChevronRight, RefreshCw, Hash,
  AlertCircle, CheckCircle2, ArrowLeft
} from 'lucide-react';

const TABLES = [
  { name: 'students', label: 'Students', icon: BookOpen, color: 'from-blue-500 to-cyan-500' },
  { name: 'teachers', label: 'Teachers', icon: Users, color: 'from-emerald-500 to-teal-500' },
  { name: 'search_logs', label: 'Search Logs', icon: Search, color: 'from-orange-500 to-amber-500' },
  { name: 'activity_logs', label: 'Activity Logs', icon: Activity, color: 'from-rose-500 to-pink-500' },
  { name: 'site_settings', label: 'Site Settings', icon: Settings, color: 'from-violet-500 to-purple-500' },
  { name: 'incidents', label: 'Incidents', icon: AlertCircle, color: 'from-red-500 to-orange-500' },
];

type TableName = 'students' | 'teachers' | 'search_logs' | 'activity_logs' | 'site_settings' | 'incidents';

export default function DatabaseViewer() {
  const { user, isAdmin, loading, adminLoading, signIn, signOut } = useAuth();
  const navigate = useNavigate();

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Viewer state
  const [selectedTable, setSelectedTable] = useState<TableName | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableCounts, setTableCounts] = useState<Record<string, number>>({});
  const [dataLoading, setDataLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const isAuthenticated = !loading && !adminLoading && user && isAdmin;

  // Fetch row counts for all tables
  const fetchCounts = useCallback(async () => {
    const counts: Record<string, number> = {};
    await Promise.all(
      TABLES.map(async (t) => {
        const { count } = await supabase
          .from(t.name as TableName)
          .select('*', { count: 'exact', head: true });
        counts[t.name] = count ?? 0;
      })
    );
    setTableCounts(counts);
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchCounts();
  }, [isAuthenticated, fetchCounts]);

  // Fetch table data
  const fetchTableData = useCallback(async (tableName: TableName) => {
    setDataLoading(true);
    setPage(0);
    const { data } = await supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    setTableData(data ?? []);
    setDataLoading(false);
  }, []);

  useEffect(() => {
    if (selectedTable && isAuthenticated) {
      fetchTableData(selectedTable);
    }
  }, [selectedTable, isAuthenticated, fetchTableData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    const { error } = await signIn(email, password);
    if (error) {
      setLoginError(error.message || 'Invalid credentials');
    }
    setLoginLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setSelectedTable(null);
    setTableData([]);
  };

  // Filter rows by search
  const filteredData = tableData.filter(row =>
    !searchQuery ||
    Object.values(row).some(v =>
      String(v ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const paginatedData = filteredData.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);

  // Get columns from first row
  const columns = paginatedData.length > 0 ? Object.keys(paginatedData[0]) : [];

  // ─── LOGIN SCREEN ───────────────────────────────────────────────────────────
  if (loading || adminLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Database className="w-10 h-10 text-blue-400" />
          </motion.div>
          <p className="text-gray-400 text-sm">Checking session…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-4 shadow-lg shadow-blue-500/30">
              <Database className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Database Viewer</h1>
            <p className="text-gray-400 text-sm mt-1">Admin access required</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 pr-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {loginError && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {loginError}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {loginLoading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                  <RefreshCw className="w-4 h-4" />
                </motion.div>
              ) : <Lock className="w-4 h-4" />}
              {loginLoading ? 'Signing in…' : 'Sign In'}
            </button>

            <button type="button" onClick={() => navigate('/')}
              className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-gray-300 text-sm transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to home
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // ─── MAIN VIEWER ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <div className="w-64 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">JU Database</p>
              <p className="text-gray-500 text-xs">Visual Viewer</p>
            </div>
          </div>
        </div>

        {/* Tables list */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider px-2 mb-2">Tables</p>
          {TABLES.map((table) => {
            const Icon = table.icon;
            const isSelected = selectedTable === table.name;
            return (
              <button
                key={table.name}
                onClick={() => { setSelectedTable(table.name as TableName); setSearchQuery(''); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-sm ${
                  isSelected
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{table.label}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-md ${isSelected ? 'bg-blue-500/30 text-blue-300' : 'bg-gray-800 text-gray-500'}`}>
                  {tableCounts[table.name] ?? '…'}
                </span>
              </button>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center gap-2 px-2 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
            <p className="text-gray-400 text-xs truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 text-sm transition-all"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedTable ? (
          /* Welcome / overview */
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-lg">
              <Table2 className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Select a Table</h2>
              <p className="text-gray-500 text-sm mb-8">Choose a table from the sidebar to view and explore its data.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {TABLES.map(t => {
                  const Icon = t.icon;
                  return (
                    <button key={t.name} onClick={() => setSelectedTable(t.name as TableName)}
                      className="p-4 bg-gray-900 border border-gray-800 rounded-2xl hover:border-gray-700 transition-all group text-left">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                        <Icon className="w-4.5 h-4.5 text-white" />
                      </div>
                      <p className="text-white text-sm font-semibold">{t.label}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{tableCounts[t.name] ?? '…'} rows</p>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-4 bg-gray-900/50">
              <div>
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-gray-500" />
                  <h2 className="text-white font-bold">{TABLES.find(t => t.name === selectedTable)?.label}</h2>
                  <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-md">
                    {filteredData.length} rows
                  </span>
                </div>
                <p className="text-gray-600 text-xs mt-0.5">table: {selectedTable}</p>
              </div>

              <div className="flex-1" />

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setPage(0); }}
                  placeholder="Search rows…"
                  className="bg-gray-800 border border-gray-700 rounded-xl pl-8 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
                />
              </div>

              {/* Refresh */}
              <button onClick={() => fetchTableData(selectedTable)}
                className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Table data */}
            <div className="flex-1 overflow-auto">
              {dataLoading ? (
                <div className="flex items-center justify-center h-64">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <RefreshCw className="w-6 h-6 text-blue-400" />
                  </motion.div>
                </div>
              ) : paginatedData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-600">
                  <Table2 className="w-10 h-10 mb-3" />
                  <p>No rows found</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-900 border-b border-gray-800 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 font-semibold w-12">#</th>
                      {columns.map(col => (
                        <th key={col} className="px-4 py-3 text-left text-xs text-gray-500 font-semibold whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {paginatedData.map((row, i) => (
                      <motion.tr
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.01 }}
                        className="hover:bg-gray-900/60 transition-colors"
                      >
                        <td className="px-4 py-3 text-gray-600 text-xs">{page * PAGE_SIZE + i + 1}</td>
                        {columns.map(col => {
                          const val = row[col];
                          const display = val === null ? (
                            <span className="text-gray-700 italic">null</span>
                          ) : typeof val === 'boolean' ? (
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${val ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                              {String(val)}
                            </span>
                          ) : col.includes('_at') || col === 'created_at' || col === 'updated_at' ? (
                            <span className="text-gray-400 text-xs">{new Date(val).toLocaleString()}</span>
                          ) : col === 'id' || col.endsWith('_id') ? (
                            <span className="text-gray-600 text-xs font-mono">{String(val).substring(0, 8)}…</span>
                          ) : (
                            <span className="text-gray-200">{String(val).substring(0, 80)}{String(val).length > 80 ? '…' : ''}</span>
                          );
                          return <td key={col} className="px-4 py-3 whitespace-nowrap">{display}</td>;
                        })}
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-3 border-t border-gray-800 flex items-center justify-between bg-gray-900/50">
                <p className="text-gray-500 text-xs">
                  Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredData.length)} of {filteredData.length}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                    className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white disabled:opacity-30 text-xs transition-all">
                    Prev
                  </button>
                  <span className="px-3 py-1.5 text-gray-400 text-xs">
                    {page + 1} / {totalPages}
                  </span>
                  <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
                    className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white disabled:opacity-30 text-xs transition-all">
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
