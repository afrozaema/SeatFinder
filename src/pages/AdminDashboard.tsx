import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  GraduationCap, LogOut, Plus, Pencil, Trash2, Search, Users,
  Building, MapPin, Clock, Save, X, AlertCircle, CheckCircle
} from 'lucide-react';

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
}

const emptyStudent = {
  roll_number: '', name: '', institution: '', building: '', room: '', floor: '',
  report_time: '', start_time: '', end_time: '', directions: '', map_url: ''
};

export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyStudent);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/admin/login');
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) fetchStudents();
  }, [user, isAdmin]);

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('roll_number');
    if (data) setStudents(data);
    if (error) showMessage('error', error.message);
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

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
    });
    setEditingId(student.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) {
      showMessage('error', error.message);
    } else {
      showMessage('success', 'Student deleted successfully');
      fetchStudents();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    if (editingId) {
      const { error } = await supabase.from('students').update(formData).eq('id', editingId);
      if (error) showMessage('error', error.message);
      else showMessage('success', 'Student updated successfully');
    } else {
      const { error } = await supabase.from('students').insert(formData);
      if (error) showMessage('error', error.message);
      else showMessage('success', 'Student added successfully');
    }

    setSaving(false);
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyStudent);
    fetchStudents();
  };

  const filteredStudents = students.filter(s =>
    s.roll_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.institution.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-md border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <a href="/" className="text-sm text-blue-600 hover:text-blue-800 font-medium">← Home</a>
            <button onClick={signOut}
              className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium">
              <LogOut className="w-4 h-4" /><span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-full"><Users className="w-6 h-6 text-blue-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{students.length}</p><p className="text-sm text-gray-500">Total Students</p></div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-full"><Building className="w-6 h-6 text-green-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{new Set(students.map(s => s.institution)).size}</p><p className="text-sm text-gray-500">Institutions</p></div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-full"><MapPin className="w-6 h-6 text-purple-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{new Set(students.map(s => s.building)).size}</p><p className="text-sm text-gray-500">Buildings</p></div>
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

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
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
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setFormData(emptyStudent); }}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center space-x-2 font-semibold shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" /><span>Add Student</span>
          </button>
        </div>

        {/* Form Modal */}
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

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Roll', 'Name', 'Institution', 'Building', 'Room', 'Floor', 'Report', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">{student.roll_number}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{student.name}</td>
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
      </div>
    </div>
  );
}
