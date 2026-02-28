import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Settings, Globe, Shield, UserCog, Save, AlertCircle, CheckCircle,
  Eye, EyeOff, Lock, Mail, Clock, Trash2, Plus, ToggleLeft, ToggleRight
} from 'lucide-react';

interface SiteSetting {
  id: string;
  key: string;
  value: string | null;
}

interface AdminUser {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

interface LoginEvent {
  timestamp: string;
  action: string;
  email: string;
}

export default function AdminSettings() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<'site' | 'account' | 'security'>('site');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Site settings
  const [siteSettings, setSiteSettings] = useState<SiteSetting[]>([]);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [editedSettings, setEditedSettings] = useState<Record<string, string>>({});
  const [newSettingKey, setNewSettingKey] = useState('');
  const [newSettingValue, setNewSettingValue] = useState('');

  // Account settings
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Security - admin users
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // Fetch site settings
  useEffect(() => {
    fetchSiteSettings();
    fetchAdminUsers();
  }, []);

  const fetchSiteSettings = async () => {
    setLoadingSettings(true);
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .order('key');
    if (data) {
      setSiteSettings(data);
      const edits: Record<string, string> = {};
      data.forEach(s => { edits[s.key] = s.value || ''; });
      setEditedSettings(edits);
    }
    if (error) showMsg('error', error.message);
    setLoadingSettings(false);
  };

  const fetchAdminUsers = async () => {
    setLoadingAdmins(true);
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .order('created_at');
    if (data) setAdminUsers(data);
    if (error) showMsg('error', error.message);
    setLoadingAdmins(false);
  };

  const handleSaveSiteSettings = async () => {
    setSavingSettings(true);
    try {
      for (const setting of siteSettings) {
        const newValue = editedSettings[setting.key];
        if (newValue !== (setting.value || '')) {
          await supabase
            .from('site_settings')
            .update({ value: newValue })
            .eq('id', setting.id);
        }
      }
      showMsg('success', 'Site settings saved successfully');
      fetchSiteSettings();
    } catch {
      showMsg('error', 'Failed to save settings');
    }
    setSavingSettings(false);
  };

  const handleAddSetting = async () => {
    if (!newSettingKey.trim()) return;
    const { error } = await supabase
      .from('site_settings')
      .insert({ key: newSettingKey.trim(), value: newSettingValue.trim() || null });
    if (error) showMsg('error', error.message);
    else {
      showMsg('success', `Setting "${newSettingKey}" added`);
      setNewSettingKey('');
      setNewSettingValue('');
      fetchSiteSettings();
    }
  };

  const handleDeleteSetting = async (id: string, key: string) => {
    if (!confirm(`Delete setting "${key}"?`)) return;
    const { error } = await supabase.from('site_settings').delete().eq('id', id);
    if (error) showMsg('error', error.message);
    else {
      showMsg('success', `Setting "${key}" deleted`);
      fetchSiteSettings();
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      showMsg('error', 'Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      showMsg('error', 'Passwords do not match');
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) showMsg('error', error.message);
    else {
      showMsg('success', 'Password changed successfully');
      setNewPassword('');
      setConfirmPassword('');
    }
    setChangingPassword(false);
  };

  const handleRemoveAdmin = async (roleId: string, userId: string) => {
    if (userId === user?.id) {
      showMsg('error', 'You cannot remove your own admin role');
      return;
    }
    if (!confirm('Are you sure you want to remove this admin?')) return;
    const { error } = await supabase.from('user_roles').delete().eq('id', roleId);
    if (error) showMsg('error', error.message);
    else {
      showMsg('success', 'Admin role removed');
      fetchAdminUsers();
    }
  };

  const sections = [
    { id: 'site' as const, label: 'Site Settings', icon: Globe },
    { id: 'account' as const, label: 'Account', icon: UserCog },
    { id: 'security' as const, label: 'Security', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg flex items-center space-x-2 text-sm font-medium ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Section Tabs */}
      <div className="bg-white rounded-lg p-1 shadow-sm border flex gap-1 overflow-x-auto">
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
              activeSection === s.id
                ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}>
            <s.icon className="w-4 h-4" />
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Site Settings */}
      {activeSection === 'site' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-900 flex items-center space-x-2">
              <Globe className="w-5 h-5 text-blue-600" />
              <span>Site Settings</span>
            </h2>
            <p className="text-sm text-gray-500 mt-1">Manage key-value configuration for your site</p>
          </div>

          {loadingSettings ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {siteSettings.length === 0 ? (
                <p className="text-gray-500 text-center py-6">No settings configured yet</p>
              ) : (
                <div className="space-y-3">
                  {siteSettings.map(setting => (
                    <div key={setting.id} className="flex items-center gap-3">
                      <div className="w-1/3">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Key</label>
                        <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-mono text-gray-700">{setting.key}</div>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Value</label>
                        <input
                          type="text"
                          value={editedSettings[setting.key] || ''}
                          onChange={e => setEditedSettings(prev => ({ ...prev, [setting.key]: e.target.value }))}
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm"
                        />
                      </div>
                      <div className="pt-5">
                        <button onClick={() => handleDeleteSetting(setting.id, setting.key)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Setting */}
              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Add New Setting</p>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Key</label>
                    <input
                      type="text"
                      value={newSettingKey}
                      onChange={e => setNewSettingKey(e.target.value)}
                      placeholder="e.g., site_name"
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Value</label>
                    <input
                      type="text"
                      value={newSettingValue}
                      onChange={e => setNewSettingValue(e.target.value)}
                      placeholder="e.g., JU SeatFinder"
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 text-sm"
                    />
                  </div>
                  <button onClick={handleAddSetting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5 text-sm font-medium">
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
              </div>

              {/* Save Button */}
              {siteSettings.length > 0 && (
                <div className="border-t pt-4 flex justify-end">
                  <button onClick={handleSaveSiteSettings} disabled={savingSettings}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center gap-2 font-medium text-sm disabled:opacity-50">
                    {savingSettings ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      : <><Save className="w-4 h-4" /><span>Save Changes</span></>}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Account Settings */}
      {activeSection === 'account' && (
        <div className="space-y-6">
          {/* Current Account Info */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-900 flex items-center space-x-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <span>Account Information</span>
              </h2>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-gray-600">Email</span>
                <span className="text-sm font-mono text-gray-900">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-gray-600">User ID</span>
                <span className="text-xs font-mono text-gray-500">{user?.id}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-gray-600">Last Sign In</span>
                <span className="text-sm text-gray-900">
                  {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-gray-600">Account Created</span>
                <span className="text-sm text-gray-900">
                  {user?.created_at ? new Date(user.created_at).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-900 flex items-center space-x-2">
                <Lock className="w-5 h-5 text-orange-600" />
                <span>Change Password</span>
              </h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 chars)"
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm pr-10"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm"
                />
              </div>
              <button onClick={handleChangePassword} disabled={changingPassword || !newPassword}
                className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 flex items-center gap-2 font-medium text-sm disabled:opacity-50">
                {changingPassword ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  : <><Lock className="w-4 h-4" /><span>Update Password</span></>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Settings */}
      {activeSection === 'security' && (
        <div className="space-y-6">
          {/* Admin Users */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-900 flex items-center space-x-2">
                <Shield className="w-5 h-5 text-purple-600" />
                <span>Admin Users & Roles</span>
              </h2>
              <p className="text-sm text-gray-500 mt-1">Manage who has admin access</p>
            </div>

            {loadingAdmins ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-t-transparent" />
              </div>
            ) : (
              <div className="p-4">
                {adminUsers.length === 0 ? (
                  <p className="text-gray-500 text-center py-6">No admin roles found</p>
                ) : (
                  <div className="space-y-2 mb-4">
                    {adminUsers.map(admin => (
                      <div key={admin.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-full">
                            <UserCog className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm font-mono text-gray-900">{admin.user_id}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                admin.role === 'super_admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                              }`}>{admin.role}</span>
                              <span className="text-xs text-gray-400">
                                Added {new Date(admin.created_at).toLocaleDateString()}
                              </span>
                              {admin.user_id === user?.id && (
                                <span className="text-xs font-bold text-green-600">(You)</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {admin.user_id !== user?.id && (
                          <button onClick={() => handleRemoveAdmin(admin.id, admin.user_id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Session Info */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-900 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-green-600" />
                <span>Current Session</span>
              </h2>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-gray-600">Session Status</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 px-3 py-1 rounded-full">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Active
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-gray-600">Auth Provider</span>
                <span className="text-sm text-gray-900">Email / Password</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-gray-600">Email Verified</span>
                <span className="text-sm text-gray-900">
                  {user?.email_confirmed_at ? '✅ Yes' : '❌ No'}
                </span>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
            <div className="p-4 border-b bg-red-50">
              <h2 className="font-semibold text-red-700 flex items-center space-x-2">
                <AlertCircle className="w-5 h-5" />
                <span>Danger Zone</span>
              </h2>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-3">
                These actions are irreversible. Proceed with caution.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={async () => {
                  if (!confirm('This will delete ALL search logs. Continue?')) return;
                  const { error } = await supabase.rpc('execute_sql', { query: 'DELETE FROM search_logs' });
                  if (error) showMsg('error', error.message);
                  else showMsg('success', 'All search logs cleared');
                }}
                  className="px-4 py-2 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium">
                  Clear Search Logs
                </button>
                <button onClick={async () => {
                  if (!confirm('This will delete ALL activity logs. Continue?')) return;
                  const { error } = await supabase.rpc('execute_sql', { query: 'DELETE FROM activity_logs' });
                  if (error) showMsg('error', error.message);
                  else showMsg('success', 'All activity logs cleared');
                }}
                  className="px-4 py-2 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium">
                  Clear Activity Logs
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
