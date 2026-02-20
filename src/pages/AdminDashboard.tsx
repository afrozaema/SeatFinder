import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  GraduationCap, LogOut, Plus, Pencil, Trash2, Search, Users,
  Building, MapPin, Clock, Save, X, AlertCircle, CheckCircle,
  Activity, BarChart3, Filter, ChevronDown, Eye, TrendingUp, UserCheck, Mail, Phone, Briefcase, PieChart, Database, ExternalLink
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

interface Student {
  id: string;
  roll_number: string;
  name: string;
  institution: string;
  building: string;
  room: string;
  floor: string;
  report_time: string;
  start_time: string;
  end_time: string;
  directions: string;
  map_url: string;
  unit: string;
}

interface Teacher {
  id: string;
  teacher_id: string;
  name: string;
  department: string;
  designation: string;
  email: string | null;
  phone: string | null;
  office_room: string | null;
}

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: string | null;
  created_at: string;
}

interface SearchLog {
  id: string;
  roll_number: string;
  found: boolean;
  created_at: string;
}

const emptyStudent = {
  roll_number: '', name: '', institution: '', building: '', room: '', floor: '',
  report_time: '', start_time: '', end_time: '', directions: '', map_url: '', unit: 'UNIT-A'
};

const emptyTeacher = {
  teacher_id: '', name: '', department: '', designation: '', email: '', phone: '', office_room: ''
};

type Tab = 'students' | 'teachers' | 'activity' | 'search-logs' | 'analytics';

export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading, adminLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showTeacherForm, setShowTeacherForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyStudent);
  const [teacherFormData, setTeacherFormData] = useState(emptyTeacher);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('students');

  // Advanced filters
  const [filterInstitution, setFilterInstitution] = useState('');
  const [filterBuilding, setFilterBuilding] = useState('');
  const [filterFloor, setFilterFloor] = useState('');
  const [filterUnit, setFilterUnit] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Activity & Search logs
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [searchLogs, setSearchLogs] = useState<SearchLog[]>([]);

  useEffect(() => {
    if (!authLoading && !adminLoading && (!user || !isAdmin)) {
      navigate('/admin/login');
    }
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchStudents();
      fetchTeachers();
      fetchActivityLogs();
      fetchSearchLogs();
    }
  }, [user, isAdmin]);

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('roll_number');
    if (data) setStudents(data);
    if (error) showMessage('error', error.message);
  };

  const fetchTeachers = async () => {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .order('name');
    if (data) setTeachers(data);
    if (error) showMessage('error', error.message);
  };

  const fetchActivityLogs = async () => {
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setActivityLogs(data as ActivityLog[]);
  };

  const fetchSearchLogs = async () => {
    const { data } = await supabase
      .from('search_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (data) setSearchLogs(data as SearchLog[]);
  };

  const logActivity = async (action: string, entityType: string, entityId?: string, details?: string) => {
    if (!user) return;
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      details: details || null,
    });
    fetchActivityLogs();
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // Student handlers
  const handleEdit = (student: Student) => {
    setFormData({
      roll_number: student.roll_number,
      name: student.name,
      institution: student.institution,
      building: student.building,
      room: student.room,
      floor: student.floor,
      report_time: student.report_time,
      start_time: student.start_time,
      end_time: student.end_time,
      directions: student.directions,
      map_url: student.map_url,
      unit: student.unit || 'UNIT-A',
    });
    setEditingId(student.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    const student = students.find(s => s.id === id);
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) {
      showMessage('error', error.message);
    } else {
      showMessage('success', 'Student deleted successfully');
      await logActivity('DELETE', 'student', id, `Deleted student: ${student?.name} (${student?.roll_number})`);
      fetchStudents();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    if (editingId) {
      const { error } = await supabase.from('students').update(formData).eq('id', editingId);
      if (error) showMessage('error', error.message);
      else {
        showMessage('success', 'Student updated successfully');
        await logActivity('UPDATE', 'student', editingId, `Updated student: ${formData.name} (${formData.roll_number})`);
      }
    } else {
      const { data, error } = await supabase.from('students').insert(formData).select();
      if (error) showMessage('error', error.message);
      else {
        showMessage('success', 'Student added successfully');
        await logActivity('INSERT', 'student', data?.[0]?.id, `Added student: ${formData.name} (${formData.roll_number})`);
      }
    }

    setSaving(false);
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyStudent);
    fetchStudents();
  };

  // Teacher handlers
  const handleEditTeacher = (teacher: Teacher) => {
    setTeacherFormData({
      teacher_id: teacher.teacher_id,
      name: teacher.name,
      department: teacher.department,
      designation: teacher.designation,
      email: teacher.email || '',
      phone: teacher.phone || '',
      office_room: teacher.office_room || '',
    });
    setEditingTeacherId(teacher.id);
    setShowTeacherForm(true);
  };

  const handleDeleteTeacher = async (id: string) => {
    if (!confirm('Are you sure you want to delete this teacher?')) return;
    const teacher = teachers.find(t => t.id === id);
    const { error } = await supabase.from('teachers').delete().eq('id', id);
    if (error) {
      showMessage('error', error.message);
    } else {
      showMessage('success', 'Teacher deleted successfully');
      await logActivity('DELETE', 'teacher', id, `Deleted teacher: ${teacher?.name} (${teacher?.teacher_id})`);
      fetchTeachers();
    }
  };

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    if (editingTeacherId) {
      const { error } = await supabase.from('teachers').update(teacherFormData).eq('id', editingTeacherId);
      if (error) showMessage('error', error.message);
      else {
        showMessage('success', 'Teacher updated successfully');
        await logActivity('UPDATE', 'teacher', editingTeacherId, `Updated teacher: ${teacherFormData.name} (${teacherFormData.teacher_id})`);
      }
    } else {
      const { data, error } = await supabase.from('teachers').insert(teacherFormData).select();
      if (error) showMessage('error', error.message);
      else {
        showMessage('success', 'Teacher added successfully');
        await logActivity('INSERT', 'teacher', data?.[0]?.id, `Added teacher: ${teacherFormData.name} (${teacherFormData.teacher_id})`);
      }
    }

    setSaving(false);
    setShowTeacherForm(false);
    setEditingTeacherId(null);
    setTeacherFormData(emptyTeacher);
    fetchTeachers();
  };

  // Unique values for filters
  const institutions = [...new Set(students.map(s => s.institution))].sort();
  const buildings = [...new Set(students.map(s => s.building))].sort();
  const floors = [...new Set(students.map(s => s.floor))].sort();
  const units = [...new Set(students.map(s => s.unit))].sort();

  const filteredStudents = students.filter(s => {
    const matchesSearch =
      s.roll_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.institution.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesInstitution = !filterInstitution || s.institution === filterInstitution;
    const matchesBuilding = !filterBuilding || s.building === filterBuilding;
    const matchesFloor = !filterFloor || s.floor === filterFloor;
    const matchesUnit = !filterUnit || s.unit === filterUnit;
    return matchesSearch && matchesInstitution && matchesBuilding && matchesFloor && matchesUnit;
  });

  const filteredTeachers = teachers.filter(t => {
    return (
      t.name.toLowerCase().includes(teacherSearchQuery.toLowerCase()) ||
      t.teacher_id.toLowerCase().includes(teacherSearchQuery.toLowerCase()) ||
      t.department.toLowerCase().includes(teacherSearchQuery.toLowerCase())
    );
  });

  // Search log stats
  const totalSearches = searchLogs.length;
  const successfulSearches = searchLogs.filter(l => l.found).length;
  const topSearched = searchLogs.reduce((acc, log) => {
    acc[log.roll_number] = (acc[log.roll_number] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topSearchedList = Object.entries(topSearched)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  if (authLoading || adminLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-md border-b">
        <div className="max-w-7xl mx-auto px-3 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shrink-0">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-xl font-bold text-gray-900 truncate">Admin Dashboard</h1>
              <p className="text-[10px] sm:text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <a href="/" className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap">← Home</a>
            <a
              href="/database"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors text-xs sm:text-sm font-medium"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Database</span>
              <ExternalLink className="w-3 h-3 opacity-60 hidden sm:inline" />
            </a>
            <button onClick={signOut}
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-xs sm:text-sm font-medium">
              <LogOut className="w-3.5 h-3.5" /><span className="hidden xs:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          <div className="bg-white rounded-xl p-3 shadow-sm border flex flex-col items-center text-center gap-2">
            <div className="p-2 bg-blue-100 rounded-full"><Users className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-xl font-bold text-gray-900">{students.length}</p><p className="text-xs text-gray-500">Students</p></div>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm border flex flex-col items-center text-center gap-2">
            <div className="p-2 bg-teal-100 rounded-full"><UserCheck className="w-5 h-5 text-teal-600" /></div>
            <div><p className="text-xl font-bold text-gray-900">{teachers.length}</p><p className="text-xs text-gray-500">Teachers</p></div>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm border flex flex-col items-center text-center gap-2">
            <div className="p-2 bg-green-100 rounded-full"><Building className="w-5 h-5 text-green-600" /></div>
            <div><p className="text-xl font-bold text-gray-900">{institutions.length}</p><p className="text-xs text-gray-500">Institutions</p></div>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm border flex flex-col items-center text-center gap-2">
            <div className="p-2 bg-purple-100 rounded-full"><Eye className="w-5 h-5 text-purple-600" /></div>
            <div><p className="text-xl font-bold text-gray-900">{totalSearches}</p><p className="text-xs text-gray-500">Searches</p></div>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm border flex flex-col items-center text-center gap-2 col-span-2 sm:col-span-1">
            <div className="p-2 bg-orange-100 rounded-full"><TrendingUp className="w-5 h-5 text-orange-600" /></div>
            <div><p className="text-xl font-bold text-gray-900">{totalSearches > 0 ? Math.round((successfulSearches / totalSearches) * 100) : 0}%</p><p className="text-xs text-gray-500">Success</p></div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg flex items-center space-x-2 text-sm font-medium ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 bg-white rounded-lg p-1 shadow-sm border overflow-x-auto">
          <div className="flex gap-1 min-w-max sm:min-w-0">
            {([
              { id: 'students' as Tab, label: 'Students', icon: Users },
              { id: 'teachers' as Tab, label: 'Teachers', icon: UserCheck },
              { id: 'activity' as Tab, label: 'Activity', icon: Activity },
              { id: 'search-logs' as Tab, label: 'Logs', icon: BarChart3 },
              { id: 'analytics' as Tab, label: 'Analytics', icon: PieChart },
            ]).map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}>
                <tab.icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Students Tab */}
        {activeTab === 'students' && (
          <>
            {/* Toolbar */}
            <div className="flex flex-col gap-3 mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by roll, name, or institution..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <button onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-3 border-2 rounded-lg flex items-center space-x-2 font-medium transition-all ${
                    showFilters || filterInstitution || filterBuilding || filterFloor || filterUnit
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}>
                  <Filter className="w-5 h-5" />
                  <span>Filters</span>
                   {(filterInstitution || filterBuilding || filterFloor || filterUnit) && (
                    <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                      {[filterInstitution, filterBuilding, filterFloor, filterUnit].filter(Boolean).length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => { setShowForm(true); setEditingId(null); setFormData(emptyStudent); }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center space-x-2 font-semibold shadow-lg transition-all"
                >
                  <Plus className="w-5 h-5" /><span>Add Student</span>
                </button>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="bg-white rounded-lg border p-4 flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Institution</label>
                    <select value={filterInstitution} onChange={e => setFilterInstitution(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-500">
                      <option value="">All Institutions</option>
                      {institutions.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Building</label>
                    <select value={filterBuilding} onChange={e => setFilterBuilding(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-500">
                      <option value="">All Buildings</option>
                      {buildings.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Floor</label>
                    <select value={filterFloor} onChange={e => setFilterFloor(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-500">
                      <option value="">All Floors</option>
                      {floors.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                   </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Unit</label>
                    <select value={filterUnit} onChange={e => setFilterUnit(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-500">
                      <option value="">All Units</option>
                      {units.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button onClick={() => { setFilterInstitution(''); setFilterBuilding(''); setFilterFloor(''); setFilterUnit(''); }}
                      className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium">Clear All</button>
                  </div>
                </div>
              )}
            </div>

            {/* Showing count */}
            <p className="text-sm text-gray-500 mb-3">
              Showing {filteredStudents.length} of {students.length} students
              {(filterInstitution || filterBuilding || filterFloor || filterUnit) && ' (filtered)'}
            </p>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                     <tr>
                      {['Roll', 'Name', 'Unit', 'Institution', 'Building', 'Room', 'Floor', 'Report', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredStudents.map(student => (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-blue-600">{student.roll_number}</td>
                         <td className="px-4 py-3 font-medium text-gray-900">{student.name}</td>
                        <td className="px-4 py-3"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">{student.unit}</span></td>
                        <td className="px-4 py-3 text-gray-600">{student.institution}</td>
                        <td className="px-4 py-3 text-gray-600">{student.building}</td>
                        <td className="px-4 py-3 font-bold">{student.room}</td>
                        <td className="px-4 py-3 text-gray-600">{student.floor}</td>
                        <td className="px-4 py-3 text-gray-600">{student.report_time}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <button onClick={() => handleEdit(student)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(student.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredStudents.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No students found</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Teachers Tab */}
        {activeTab === 'teachers' && (
          <>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, ID, or department..."
                  value={teacherSearchQuery}
                  onChange={(e) => setTeacherSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                />
              </div>
              <button
                onClick={() => { setShowTeacherForm(true); setEditingTeacherId(null); setTeacherFormData(emptyTeacher); }}
                className="px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-lg hover:from-teal-700 hover:to-blue-700 flex items-center space-x-2 font-semibold shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" /><span>Add Teacher</span>
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-3">
              Showing {filteredTeachers.length} of {teachers.length} teachers
            </p>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {['ID', 'Name', 'Department', 'Designation', 'Email', 'Phone', 'Office', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredTeachers.map(teacher => (
                      <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-teal-600">{teacher.teacher_id}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{teacher.name}</td>
                        <td className="px-4 py-3 text-gray-600">{teacher.department}</td>
                        <td className="px-4 py-3 text-gray-600">{teacher.designation}</td>
                        <td className="px-4 py-3 text-gray-600">{teacher.email || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{teacher.phone || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{teacher.office_room || '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <button onClick={() => handleEditTeacher(teacher)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteTeacher(teacher.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredTeachers.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No teachers found</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Activity Log Tab */}
        {activeTab === 'activity' && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-900 flex items-center space-x-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <span>Recent Activity</span>
              </h2>
              <p className="text-sm text-gray-500 mt-1">Last 50 admin actions</p>
            </div>
            {activityLogs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No activity yet</p>
              </div>
            ) : (
              <div className="divide-y">
                {activityLogs.map(log => (
                  <div key={log.id} className="px-4 py-3 flex items-start space-x-3 hover:bg-gray-50">
                    <div className={`mt-1 p-1.5 rounded-full ${
                      log.action === 'INSERT' ? 'bg-green-100' :
                      log.action === 'UPDATE' ? 'bg-blue-100' :
                      'bg-red-100'
                    }`}>
                      {log.action === 'INSERT' ? <Plus className="w-3 h-3 text-green-600" /> :
                       log.action === 'UPDATE' ? <Pencil className="w-3 h-3 text-blue-600" /> :
                       <Trash2 className="w-3 h-3 text-red-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{log.details || `${log.action} ${log.entity_type}`}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      log.action === 'INSERT' ? 'bg-green-100 text-green-700' :
                      log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>{log.action}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search Logs Tab */}
        {activeTab === 'search-logs' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="font-semibold text-gray-900 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  <span>Top Searched Roll Numbers</span>
                </h2>
              </div>
              {topSearchedList.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No searches yet</p>
                </div>
              ) : (
                <div className="p-4">
                  <div className="space-y-2">
                    {topSearchedList.map(([roll, count], i) => {
                      const maxCount = topSearchedList[0][1];
                      return (
                        <div key={roll} className="flex items-center space-x-3">
                          <span className="text-sm font-bold text-gray-400 w-6">#{i + 1}</span>
                          <span className="text-sm font-mono font-bold text-blue-600 w-20">{roll}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full flex items-center justify-end pr-2 transition-all"
                              style={{ width: `${Math.max((count / maxCount) * 100, 15)}%` }}>
                              <span className="text-xs font-bold text-white">{count}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="font-semibold text-gray-900 flex items-center space-x-2">
                  <Search className="w-5 h-5 text-blue-600" />
                  <span>Recent Searches</span>
                </h2>
                <p className="text-sm text-gray-500 mt-1">Last 100 searches</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">Roll Number</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">Found</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {searchLogs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono font-bold text-blue-600">{log.roll_number}</td>
                        <td className="px-4 py-3">
                          {log.found ? (
                            <span className="inline-flex items-center space-x-1 text-green-700 bg-green-50 px-2 py-1 rounded-full text-xs font-semibold">
                              <CheckCircle className="w-3 h-3" /><span>Found</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-red-700 bg-red-50 px-2 py-1 rounded-full text-xs font-semibold">
                              <AlertCircle className="w-3 h-3" /><span>Not Found</span>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{new Date(log.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (() => {
          const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

          // Institution distribution
          const institutionData = Object.entries(
            students.reduce((acc, s) => { acc[s.institution] = (acc[s.institution] || 0) + 1; return acc; }, {} as Record<string, number>)
          ).map(([name, value]) => ({ name, value }));

          // Department distribution
          const departmentData = Object.entries(
            teachers.reduce((acc, t) => { acc[t.department || 'Unknown'] = (acc[t.department || 'Unknown'] || 0) + 1; return acc; }, {} as Record<string, number>)
          ).map(([name, value]) => ({ name, value }));

          // Search trends by day (last 7 days)
          const searchByDay: Record<string, { total: number; found: number }> = {};
          searchLogs.forEach(log => {
            const day = new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!searchByDay[day]) searchByDay[day] = { total: 0, found: 0 };
            searchByDay[day].total++;
            if (log.found) searchByDay[day].found++;
          });
          const searchTrendData = Object.entries(searchByDay).reverse().map(([day, d]) => ({
            day, total: d.total, found: d.found, notFound: d.total - d.found
          }));

          // Activity by type
          const activityByType = Object.entries(
            activityLogs.reduce((acc, l) => { acc[l.action] = (acc[l.action] || 0) + 1; return acc; }, {} as Record<string, number>)
          ).map(([name, value]) => ({ name, value }));

          // Building distribution
          const buildingData = Object.entries(
            students.reduce((acc, s) => { acc[s.building] = (acc[s.building] || 0) + 1; return acc; }, {} as Record<string, number>)
          ).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);

          return (
            <div className="space-y-6">
              {/* Search Trends */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <span>Search Trends</span>
                </h3>
                {searchTrendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={searchTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="day" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="found" name="Found" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="notFound" name="Not Found" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 text-center py-8">No search data available</p>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Institution Pie */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Building className="w-5 h-5 text-green-600" />
                    <span>Students by Institution</span>
                  </h3>
                  {institutionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <RePieChart>
                        <Pie data={institutionData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {institutionData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </RePieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No student data</p>
                  )}
                </div>

                {/* Department Pie */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Briefcase className="w-5 h-5 text-purple-600" />
                    <span>Teachers by Department</span>
                  </h3>
                  {departmentData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <RePieChart>
                        <Pie data={departmentData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {departmentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </RePieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No teacher data</p>
                  )}
                </div>

                {/* Building Bar */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-orange-600" />
                    <span>Students by Building</span>
                  </h3>
                  {buildingData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={buildingData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" fontSize={12} />
                        <YAxis dataKey="name" type="category" fontSize={11} width={100} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No building data</p>
                  )}
                </div>

                {/* Activity by Type */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <span>Activity by Action</span>
                  </h3>
                  {activityByType.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <RePieChart>
                        <Pie data={activityByType} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                          {activityByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </RePieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No activity data</p>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Student Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Student' : 'Add New Student'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditingId(null); }}
                className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: 'roll_number', label: 'Roll Number', placeholder: 'e.g., 230417' },
                  { key: 'name', label: 'Full Name', placeholder: 'e.g., Sadia Islam' },
                  { key: 'institution', label: 'Institution', placeholder: 'e.g., JU' },
                  { key: 'building', label: 'Building', placeholder: 'e.g., Main Building' },
                  { key: 'room', label: 'Room', placeholder: 'e.g., 506' },
                  { key: 'floor', label: 'Floor', placeholder: 'e.g., 5th Floor' },
                  { key: 'report_time', label: 'Report Time', placeholder: 'e.g., 10:00 AM' },
                  { key: 'start_time', label: 'Start Time', placeholder: 'e.g., 12:00 PM' },
                  { key: 'end_time', label: 'End Time', placeholder: 'e.g., 2:00 PM' },
                  { key: 'map_url', label: 'Map URL', placeholder: 'https://maps.google.com/...' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{field.label}</label>
                    <input
                      type="text"
                      value={(formData as any)[field.key]}
                      onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      required
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm"
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Unit</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm"
                >
                  {['UNIT-A', 'UNIT-B', 'UNIT-C', 'UNIT-D', 'UNIT-E'].map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Directions</label>
                <textarea
                  value={formData.directions}
                  onChange={(e) => setFormData(prev => ({ ...prev, directions: e.target.value }))}
                  placeholder="Enter through Gate 2 ➞ Walk to Main Building ➞ ..."
                  required
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }}
                  className="px-6 py-2 border-2 border-gray-200 rounded-lg hover:bg-gray-50 font-medium text-sm">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium text-sm flex items-center space-x-2 disabled:opacity-50">
                  {saving ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    : <><Save className="w-4 h-4" /><span>{editingId ? 'Update' : 'Add'}</span></>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teacher Form Modal */}
      {showTeacherForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingTeacherId ? 'Edit Teacher' : 'Add New Teacher'}
              </h2>
              <button onClick={() => { setShowTeacherForm(false); setEditingTeacherId(null); }}
                className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleTeacherSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: 'teacher_id', label: 'Teacher ID', placeholder: 'e.g., T001', required: true },
                  { key: 'name', label: 'Full Name', placeholder: 'e.g., Dr. Rahman', required: true },
                  { key: 'department', label: 'Department', placeholder: 'e.g., Computer Science', required: false },
                  { key: 'designation', label: 'Designation', placeholder: 'e.g., Professor', required: false },
                  { key: 'email', label: 'Email', placeholder: 'e.g., rahman@university.edu', required: false },
                  { key: 'phone', label: 'Phone', placeholder: 'e.g., +880-1234567890', required: false },
                  { key: 'office_room', label: 'Office Room', placeholder: 'e.g., Room 301', required: false },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{field.label}</label>
                    <input
                      type="text"
                      value={(teacherFormData as any)[field.key]}
                      onChange={(e) => setTeacherFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      required={field.required}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm"
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => { setShowTeacherForm(false); setEditingTeacherId(null); }}
                  className="px-6 py-2 border-2 border-gray-200 rounded-lg hover:bg-gray-50 font-medium text-sm">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-6 py-2 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-lg hover:from-teal-700 hover:to-blue-700 font-medium text-sm flex items-center space-x-2 disabled:opacity-50">
                  {saving ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    : <><Save className="w-4 h-4" /><span>{editingTeacherId ? 'Update' : 'Add'}</span></>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
