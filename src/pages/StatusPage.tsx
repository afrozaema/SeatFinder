import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Heart, Activity, Clock, Server, Globe, Shield, Database,
  CheckCircle, XCircle, AlertTriangle, ArrowLeft, RefreshCw, Wifi, Zap,
  GraduationCap
} from 'lucide-react';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// ─── Types ───────────────────────────────────────────────────
interface KeepAliveLog {
  id: string;
  status: string;
  response_time_ms: number;
  error_message: string | null;
  record_count: number | null;
  pinged_at: string;
}

interface Incident {
  id: string;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  started_at: string;
  resolved_at: string | null;
}

interface SSLInfo {
  valid: boolean;
  hostname: string;
  issuer: string;
  protocol: string;
  checked_at: string;
  error?: string | null;
}

// ─── LiveTimer ───────────────────────────────────────────────
function LiveTimer({ since }: { since: string }) {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    const update = () => {
      const diff = Date.now() - new Date(since).getTime();
      const mins = Math.floor(diff / 60000);
      const hrs = Math.floor(mins / 60);
      const days = Math.floor(hrs / 24);
      if (days > 0) setElapsed(`${days}d ${hrs % 24}h ago`);
      else if (hrs > 0) setElapsed(`${hrs}h ${mins % 60}m ago`);
      else setElapsed(`${mins}m ${Math.floor((diff % 60000) / 1000)}s ago`);
    };
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, [since]);
  return <span className="font-mono text-sm text-blue-300/80">{elapsed}</span>;
}

// ─── HeartbeatIcon ───────────────────────────────────────────
function HeartbeatIcon({ isUp }: { isUp: boolean }) {
  return (
    <motion.div
      animate={isUp ? { scale: [1, 1.2, 1] } : {}}
      transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
      className={`p-5 rounded-full ${isUp ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 shadow-lg shadow-blue-500/10' : 'bg-red-500/20'}`}
    >
      <Heart className={`w-12 h-12 ${isUp ? 'text-blue-400 fill-blue-400' : 'text-red-400 fill-red-400'}`} />
    </motion.div>
  );
}

// ─── ECG Line ────────────────────────────────────────────────
function ECGLine({ isUp }: { isUp: boolean }) {
  return (
    <svg viewBox="0 0 400 60" className="w-full h-12 overflow-visible" preserveAspectRatio="none">
      <defs>
        <linearGradient id="ecgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={isUp ? '#3b82f6' : '#ef4444'} />
          <stop offset="100%" stopColor={isUp ? '#a855f7' : '#ef4444'} />
        </linearGradient>
      </defs>
      <motion.path
        d="M0,30 L60,30 L80,30 L90,10 L100,50 L110,5 L120,55 L130,30 L150,30 L400,30"
        fill="none"
        stroke="url(#ecgGrad)"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0.3 }}
        animate={{ pathLength: 1, opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      />
    </svg>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function StatusPage() {
  const [sslInfo, setSslInfo] = useState<SSLInfo | null>(null);
  const [sslLoading, setSslLoading] = useState(true);

  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['keep-alive-logs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('keep_alive_log')
        .select('*')
        .order('pinged_at', { ascending: false })
        .limit(200);
      return (data ?? []) as KeepAliveLog[];
    },
    refetchInterval: 60000,
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: async () => {
      const { data } = await supabase
        .from('incidents')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(20);
      return (data ?? []) as Incident[];
    },
    refetchInterval: 60000,
  });

  const checkSSL = async () => {
    setSslLoading(true);
    try {
      const res = await supabase.functions.invoke('check-ssl', {
        body: { url: window.location.origin },
      });
      if (res.data) setSslInfo(res.data);
    } catch {
      setSslInfo({ valid: false, hostname: window.location.hostname, issuer: 'Unknown', protocol: 'Unknown', checked_at: new Date().toISOString(), error: 'Check failed' });
    }
    setSslLoading(false);
  };

  useEffect(() => {
    checkSSL();
    const i = setInterval(checkSSL, 300000);
    return () => clearInterval(i);
  }, []);

  const latest = logs[0];
  const isUp = latest?.status === 'ok';
  const totalChecks = logs.length;
  const successChecks = logs.filter(l => l.status === 'ok').length;
  const uptimePercent = totalChecks > 0 ? ((successChecks / totalChecks) * 100).toFixed(2) : '100.00';
  const avgResponseTime = totalChecks > 0 ? Math.round(logs.reduce((a, l) => a + l.response_time_ms, 0) / totalChecks) : 0;

  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayLogs = logs.filter(l => l.pinged_at.startsWith(dateStr));
    const success = dayLogs.filter(l => l.status === 'ok').length;
    const failure = dayLogs.length - success;
    return { date: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }), success, failure };
  });

  const responseTimeData = logs.slice(0, 50).reverse().map(l => ({
    time: new Date(l.pinged_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
    ms: l.response_time_ms,
  }));

  const recentLogs = logs.slice(0, 20);
  const services = [
    { name: 'Database', icon: Database, status: isUp, detail: latest ? `${latest.response_time_ms}ms` : '-' },
    { name: 'API Server', icon: Server, status: isUp, detail: isUp ? 'Responding' : 'Down' },
    { name: 'Website', icon: Globe, status: sslInfo?.valid ?? true, detail: sslInfo?.valid ? 'Secure' : 'Issue' },
  ];
  const activeIncidents = incidents.filter(i => i.status !== 'resolved');

  if (logsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <RefreshCw className="w-8 h-8 text-blue-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-purple-950 text-gray-100 floating-dots floating-dots-dark">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-md border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center space-x-2 text-blue-300 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              JU SeatFinder
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* ─── Hero Status Card ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border p-8 mb-8 relative overflow-hidden ${
            isUp
              ? 'bg-gradient-to-br from-blue-900/40 to-purple-900/30 border-blue-500/30 shadow-xl shadow-blue-500/5'
              : 'bg-gradient-to-br from-red-900/40 to-red-950/30 border-red-500/30'
          }`}
        >
          <div className="flex flex-col items-center text-center space-y-4 relative z-10">
            <HeartbeatIcon isUp={isUp} />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              {activeIncidents.length > 0
                ? 'System Issues Detected'
                : isUp ? 'All Systems Operational' : 'System Down'}
            </h1>
            {latest && <LiveTimer since={latest.pinged_at} />}
          </div>
          <div className="mt-6">
            <ECGLine isUp={isUp} />
          </div>
        </motion.div>

        {/* ─── Stats Grid ──────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-900/30 to-blue-950/50 p-4 text-center backdrop-blur-sm">
            <p className="text-3xl font-bold text-blue-400">{uptimePercent}%</p>
            <p className="text-xs text-blue-300/60 mt-1 uppercase tracking-wide font-semibold">Uptime</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-900/30 to-purple-950/50 p-4 text-center backdrop-blur-sm">
            <p className="text-3xl font-bold text-purple-400">{avgResponseTime}<span className="text-lg">ms</span></p>
            <p className="text-xs text-purple-300/60 mt-1 uppercase tracking-wide font-semibold">Avg Response</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="rounded-xl border border-pink-500/20 bg-gradient-to-br from-pink-900/30 to-pink-950/50 p-4 text-center backdrop-blur-sm">
            <p className="text-3xl font-bold text-pink-400">{totalChecks}</p>
            <p className="text-xs text-pink-300/60 mt-1 uppercase tracking-wide font-semibold">Total Checks</p>
          </motion.div>
        </div>

        {/* ─── Service Status ──────────────────────────────── */}
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm mb-8 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h2 className="font-semibold flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <span>Service Status</span>
            </h2>
          </div>
          <div className="divide-y divide-white/5">
            {services.map(svc => (
              <div key={svc.name} className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <svc.icon className="w-5 h-5 text-blue-300/60" />
                  <span className="font-medium">{svc.name}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-blue-300/60 font-mono">{svc.detail}</span>
                  <div className={`w-3 h-3 rounded-full ${svc.status ? 'bg-green-400 shadow-lg shadow-green-400/30' : 'bg-red-400 shadow-lg shadow-red-400/30'}`} />
                  <span className={`text-xs font-semibold ${svc.status ? 'text-green-400' : 'text-red-400'}`}>
                    {svc.status ? 'Operational' : 'Down'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Uptime Graph ────────────────────────────────── */}
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm mb-8 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h2 className="font-semibold flex items-center space-x-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <span>30-Day Uptime</span>
            </h2>
          </div>
          <div className="p-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last30Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'rgba(147,197,253,0.5)' }} interval={4} />
                <YAxis tick={{ fontSize: 10, fill: 'rgba(147,197,253,0.5)' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, fontSize: 12, color: '#e2e8f0' }}
                  labelStyle={{ color: '#93c5fd' }}
                />
                <Bar dataKey="success" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Success" />
                <Bar dataKey="failure" fill="#ef4444" radius={[2, 2, 0, 0]} name="Failure" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ─── Response Time Graph ─────────────────────────── */}
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm mb-8 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h2 className="font-semibold flex items-center space-x-2">
              <Clock className="w-5 h-5 text-purple-400" />
              <span>Response Time Trend</span>
            </h2>
          </div>
          <div className="p-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={responseTimeData}>
                <defs>
                  <linearGradient id="responseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'rgba(147,197,253,0.5)' }} interval={Math.max(1, Math.floor(responseTimeData.length / 6))} />
                <YAxis tick={{ fontSize: 10, fill: 'rgba(147,197,253,0.5)' }} unit="ms" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 8, fontSize: 12, color: '#e2e8f0' }}
                />
                <Area type="monotone" dataKey="ms" stroke="#a855f7" fill="url(#responseGrad)" strokeWidth={2} name="Response Time" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ─── SSL Certificate ─────────────────────────────── */}
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm mb-8 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h2 className="font-semibold flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-400" />
              <span>SSL Certificate</span>
            </h2>
          </div>
          <div className="p-5">
            {sslLoading ? (
              <div className="flex items-center justify-center py-6">
                <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
              </div>
            ) : sslInfo ? (
              <div className="space-y-3">
                {[
                  { label: 'Status', value: null, badge: true },
                  { label: 'Hostname', value: sslInfo.hostname, mono: true },
                  { label: 'Issuer', value: sslInfo.issuer },
                  { label: 'Protocol', value: sslInfo.protocol, mono: true },
                  { label: 'Last Checked', value: new Date(sslInfo.checked_at).toLocaleString(), small: true },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-sm text-blue-300/60">{item.label}</span>
                    {item.badge ? (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${sslInfo.valid ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                        {sslInfo.valid ? '✓ Valid' : '✗ Invalid'}
                      </span>
                    ) : (
                      <span className={`text-sm ${item.mono ? 'font-mono' : ''} ${item.small ? 'text-xs text-blue-300/40 font-mono' : 'text-blue-100'}`}>
                        {item.value}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-blue-300/40 text-sm text-center">Unable to check SSL</p>
            )}
          </div>
        </div>

        {/* ─── Incident History ─────────────────────────────── */}
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm mb-8 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h2 className="font-semibold flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              <span>Incident History</span>
            </h2>
          </div>
          {incidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <CheckCircle className="w-10 h-10 mb-2 text-blue-500/30" />
              <p className="text-sm text-blue-200/60">All systems running smoothly</p>
              <p className="text-xs text-blue-300/30 mt-1">No incidents reported</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {incidents.map(inc => (
                <div key={inc.id} className="px-5 py-4">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-medium text-sm">{inc.title}</h3>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                        inc.severity === 'critical' ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                        inc.severity === 'major' ? 'bg-orange-500/15 text-orange-400 border-orange-500/30' :
                        'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                      }`}>{inc.severity}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                        inc.status === 'resolved' ? 'bg-green-500/15 text-green-400 border-green-500/30' :
                        inc.status === 'monitoring' ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' :
                        'bg-orange-500/15 text-orange-400 border-orange-500/30'
                      }`}>{inc.status}</span>
                    </div>
                  </div>
                  {inc.description && <p className="text-xs text-blue-300/40">{inc.description}</p>}
                  <p className="text-xs text-blue-300/30 font-mono mt-1">
                    {new Date(inc.started_at).toLocaleString()}
                    {inc.resolved_at && ` → ${new Date(inc.resolved_at).toLocaleString()}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Recent Checks Log ───────────────────────────── */}
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm mb-8 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h2 className="font-semibold flex items-center space-x-2">
              <Wifi className="w-5 h-5 text-blue-400" />
              <span>Recent Checks</span>
            </h2>
          </div>
          {recentLogs.length === 0 ? (
            <div className="text-center py-10 text-blue-300/40 text-sm">No checks recorded yet</div>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
              {recentLogs.map(log => (
                <div key={log.id} className="px-5 py-3 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center space-x-3">
                    {log.status === 'ok'
                      ? <CheckCircle className="w-4 h-4 text-green-400" />
                      : <XCircle className="w-4 h-4 text-red-400" />}
                    <span className="text-xs font-mono text-blue-300/50">
                      {new Date(log.pinged_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                      log.status === 'ok' ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'
                    }`}>{log.status === 'ok' ? 'OK' : 'ERROR'}</span>
                    <span className="text-xs font-mono text-purple-300/60">{log.response_time_ms}ms</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center py-6 text-xs text-blue-300/30">
          Auto-refreshes every 60 seconds • Powered by <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-semibold">JU SeatFinder</span>
        </div>
      </div>
    </div>
  );
}
