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
      case 'SuperAdmin': return <span className="inline-flex items-center gap-1 px-[10px] py-[4px] rounded-full text-[11.5px] font-bold bg-[#E8E1F3] text-ink-2"><ShieldAlert className="w-[12px] h-[12px]" /> SuperAdmin</span>;
      case 'Admin': return <span className="inline-flex items-center gap-1 px-[10px] py-[4px] rounded-full text-[11.5px] font-bold bg-cream-2 text-ink-2"><ShieldCheck className="w-[12px] h-[12px]" /> Admin</span>;
      default: return <span className="inline-flex items-center gap-1 px-[10px] py-[4px] rounded-full text-[11.5px] font-bold bg-cream-2 text-sage"><Shield className="w-[12px] h-[12px]" /> Volunteer</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'Active' 
      ? <span className="px-[10px] py-[4px] rounded-full text-[11.5px] font-bold bg-[#E7F0E8] text-sage">Active</span>
      : <span className="px-[10px] py-[4px] rounded-full text-[11.5px] font-bold bg-[#F4E9EB] text-maroon">Disabled</span>;
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-ink" />
          <input 
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-[10px] bg-white border border-hair rounded-[14px] text-[14px] text-ink focus:outline-none focus:ring-1 focus:ring-gold-soft shadow-sm"
          />
        </div>
        <button 
          onClick={handleOpenCreate} 
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-br from-gold-soft to-ember text-[#3a2205] font-bold text-[14.5px] rounded-[14px] px-5 py-[12px] shadow-md hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="bg-white border border-hair rounded-[16px] relative overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-cream-2/50 border-b border-hair text-muted-ink text-[12.5px] font-semibold tracking-wide">
                <th className="p-4">Name / Email</th>
                <th className="p-4 hidden sm:table-cell">Phone</th>
                <th className="p-4">Role</th>
                <th className="p-4 hidden md:table-cell">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hair">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-ink text-[14px]">Loading users...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-ink text-[14px]">No users found.</td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-cream-2/20 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-[14px] text-ink">{user.fullName}</div>
                      <div className="text-[12.5px] text-muted-ink mt-0.5">{user.email}</div>
                      <div className="md:hidden mt-2">{getStatusBadge(user.status)}</div>
                    </td>
                    <td className="p-4 text-ink text-[13px] hidden sm:table-cell">{user.phone}</td>
                    <td className="p-4">{getRoleBadge(user.role)}</td>
                    <td className="p-4 hidden md:table-cell">{getStatusBadge(user.status)}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleOpenEdit(user)}
                          className="p-[6px] rounded-lg text-muted-ink hover:text-ink hover:bg-hair/50 transition-colors"
                        >
                          <Edit2 className="w-[18px] h-[18px]" />
                        </button>
                        {user.status === 'Active' && (
                          <button 
                            onClick={() => setUserToDisable(user)}
                            className="p-[6px] rounded-lg text-muted-ink hover:text-maroon hover:bg-maroon/5 transition-colors"
                          >
                            <UserX className="w-[18px] h-[18px]" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="absolute left-0 right-0 bottom-0 h-[3px] bg-gradient-to-br from-gold-soft to-ember" />
      </div>

      {/* Modal for Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="bg-white rounded-[20px] shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-hair">
            <div className="px-6 py-[18px] border-b border-hair flex justify-between items-center bg-cream">
              <h2 className="text-[18px] font-playfair font-bold text-ink tracking-[0.02em]">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-[20px_24px_24px] space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-muted-ink mb-[6px]">Full Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.fullName}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                  className="w-full px-4 py-[10px] bg-white border border-hair rounded-[14px] text-[14px] text-ink focus:outline-none focus:ring-1 focus:ring-gold-soft shadow-sm"
                />
              </div>
              
              <div>
                <label className="block text-[13px] font-semibold text-muted-ink mb-[6px]">Email</label>
                <input 
                  required
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  disabled={!!editingUser}
                  className="w-full px-4 py-[10px] bg-white border border-hair rounded-[14px] text-[14px] text-ink focus:outline-none focus:ring-1 focus:ring-gold-soft shadow-sm disabled:bg-cream-2/50 disabled:text-muted-ink"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-muted-ink mb-[6px]">Phone</label>
                <input 
                  required
                  type="tel" 
                  pattern="[0-9]{10}"
                  title="10 digit phone number"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-[10px] bg-white border border-hair rounded-[14px] text-[14px] text-ink focus:outline-none focus:ring-1 focus:ring-gold-soft shadow-sm"
                />
              </div>

              {currentUserRole === 'SuperAdmin' && (
                <div>
                  <label className="block text-[13px] font-semibold text-muted-ink mb-[6px]">Role</label>
                  <select 
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value as User['role']})}
                    className="w-full px-4 py-[10px] bg-white border border-hair rounded-[14px] text-[14px] text-ink focus:outline-none focus:ring-1 focus:ring-gold-soft shadow-sm appearance-none"
                  >
                    <option value="Volunteer">Volunteer</option>
                    <option value="Admin">Admin</option>
                    <option value="SuperAdmin">SuperAdmin</option>
                  </select>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-cream-2 border border-hair text-ink font-bold text-[14px] rounded-[14px] px-4 py-[12px] shadow-sm hover:bg-hair/30 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 bg-ink text-cream font-bold text-[14px] rounded-[14px] px-4 py-[12px] shadow-md hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save User'}
                </button>
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
