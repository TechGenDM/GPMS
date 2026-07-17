'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFeedback } from '@/components/ui/Feedback';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { 
  Search, Plus, MoreVertical, Edit2, UserX, Shield, ShieldAlert, ShieldCheck
} from 'lucide-react';

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'SuperAdmin' | 'Admin' | 'Volunteer';
  status: 'Active' | 'Disabled';
  lastLogin: string;
  createdAt: string;
}

export function UserManagement({ currentUserRole }: { currentUserRole: string }) {
  const { showLoading, showSuccess, showError } = useFeedback();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'Volunteer' as User['role'],
    status: 'Active' as User['status']
  });
  const [submitting, setSubmitting] = useState(false);

  // Disable user confirmation
  const [userToDisable, setUserToDisable] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data || []);
      } else {
        showError(data.message || 'Failed to fetch users');
      }
    } catch (err) {
      showError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.phone.includes(search)
  );

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({ fullName: '', email: '', phone: '', role: 'Volunteer', status: 'Active' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Admin cannot change roles, force to Volunteer on create
    const payload = { ...formData };
    if (currentUserRole === 'Admin') {
      if (!editingUser) payload.role = 'Volunteer';
    }

    setSubmitting(true);
    try {
      const method = editingUser ? 'PUT' : 'POST';
      const body = editingUser ? { ...payload, userId: editingUser.id } : payload;
      
      const res = await fetch('/api/users', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      if (data.success) {
        showSuccess(editingUser ? 'User updated successfully' : 'User created successfully');
        setIsModalOpen(false);
        fetchUsers();
      } else {
        showError(data.message || 'Failed to save user');
      }
    } catch (err) {
      showError('An error occurred while saving');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisable = async () => {
    if (!userToDisable) return;
    try {
      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userToDisable.id })
      });
      
      const data = await res.json();
      if (data.success) {
        showSuccess('User disabled successfully');
        fetchUsers();
      } else {
        showError(data.message || 'Failed to disable user');
      }
    } catch (err) {
      showError('An error occurred');
    } finally {
      setUserToDisable(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'SuperAdmin': return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200"><ShieldAlert className="w-3 h-3" /> SuperAdmin</span>;
      case 'Admin': return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200"><ShieldCheck className="w-3 h-3" /> Admin</span>;
      default: return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200"><Shield className="w-3 h-3" /> Volunteer</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'Active' 
      ? <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
      : <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">Disabled</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Button onClick={handleOpenCreate} className="w-full sm:w-auto flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add User
        </Button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                <th className="p-4 font-medium">Name / Email</th>
                <th className="p-4 font-medium hidden sm:table-cell">Phone</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium hidden md:table-cell">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">Loading users...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">No users found.</td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-slate-900">{user.fullName}</div>
                      <div className="text-sm text-slate-500">{user.email}</div>
                      <div className="md:hidden mt-1">{getStatusBadge(user.status)}</div>
                    </td>
                    <td className="p-4 text-slate-600 hidden sm:table-cell">{user.phone}</td>
                    <td className="p-4">{getRoleBadge(user.role)}</td>
                    <td className="p-4 hidden md:table-cell">{getStatusBadge(user.status)}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleOpenEdit(user)}
                          className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        {user.status === 'Active' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setUserToDisable(user)}
                            className="h-8 w-8 p-0 text-slate-500 hover:text-red-600"
                          >
                            <UserX className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Modal for Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.fullName}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input 
                  required
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  disabled={!!editingUser}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input 
                  required
                  type="tel" 
                  pattern="[0-9]{10}"
                  title="10 digit phone number"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {currentUserRole === 'SuperAdmin' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                  <select 
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value as User['role']})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Volunteer">Volunteer</option>
                    <option value="Admin">Admin</option>
                    <option value="SuperAdmin">SuperAdmin</option>
                  </select>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? 'Saving...' : 'Save User'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Disable Modal */}
      <ConfirmModal
        isOpen={!!userToDisable}
        title="Disable User"
        message={`Are you sure you want to disable access for ${userToDisable?.fullName}? They will no longer be able to log in.`}
        confirmText="Disable"
        cancelText="Cancel"
        onConfirm={handleDisable}
        onCancel={() => setUserToDisable(null)}
        isDestructive={true}
      />
    </div>
  );
}
