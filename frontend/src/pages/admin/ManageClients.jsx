import { useEffect, useState, useRef } from 'react';
import api from '../../api/axios';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  Users, Plus, Search, Mail, Shield, Trash2,
  Loader2, UserPlus, Edit2, X, Save, ExternalLink, Briefcase, ChevronRight, Clock, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ManageClients() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientProjects, setClientProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [showQuickProjectModal, setShowQuickProjectModal] = useState(null); // stores user for quick project

  // Forms
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'client' });
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'client' });
  const [quickProjectForm, setQuickProjectForm] = useState({ projectName: '', status: 'Planning', progress: 0 });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data.data || []);
    } catch {
      toast.error('Failed to fetch user directory');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientProjects = async (clientId) => {
    setLoadingProjects(true);
    try {
      const res = await api.get(`/projects/client/${clientId}`);
      setClientProjects(res.data.data || []);
    } catch {
      toast.error('Failed to load client pipelines');
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleOpenClientDetail = (user) => {
    if (user.role !== 'client') return;
    setSelectedClient(user);
    fetchClientProjects(user._id);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', newUser);
      toast.success('User provisioned successfully');
      setShowAddModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'client' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Revoke access for "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('Access revoked');
      setUsers(prev => prev.filter(u => u._id !== id));
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/users/${editingUser._id}`, editForm);
      toast.success('User updated successfully');
      setUsers(prev => prev.map(u => u._id === editingUser._id ? { ...u, ...res.data.data } : u));
      setEditingUser(null);
    } catch {
      toast.error('Failed to update user');
    }
  };

  const handleCreateQuickProject = async (e) => {
    e.preventDefault();
    try {
      await api.post('/projects', {
        ...quickProjectForm,
        clientId: showQuickProjectModal._id
      });
      toast.success('Pipeline provisioned for client');
      setShowQuickProjectModal(null);
      setQuickProjectForm({ projectName: '', status: 'Planning', progress: 0 });
      if (selectedClient?._id === showQuickProjectModal._id) {
        fetchClientProjects(selectedClient._id);
      }
    } catch {
      toast.error('Failed to provision quick pipeline');
    }
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Access Directory</h1>
          <p className="text-gray-500 mt-2">Manage provisioned entities and authentication protocols.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-6 py-3 font-bold uppercase tracking-wider text-xs">
          <UserPlus size={18} /> Provision Access
        </Button>
      </div>

      {/* Search */}
      <div className="relative group max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
        <input
          type="text"
          placeholder="SEARCH DIRECTORY..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-xs tracking-widest text-gray-800"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 space-y-4">
          <Loader2 className="animate-spin" size={40} />
          <p className="font-bold tracking-widest text-xs uppercase">Scanning Directory...</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Entity</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Clearance</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Provisioned On</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map(user => (
                <tr 
                  key={user._id} 
                  className={`transition-colors group ${user.role === 'client' ? 'cursor-pointer hover:bg-gray-50/50' : 'hover:bg-gray-50/20'}`}
                  onClick={() => handleOpenClientDetail(user)}
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        {user.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black text-gray-900 uppercase tracking-tight text-sm flex items-center gap-2">
                          {user.name}
                          {user.role === 'client' && <ExternalLink size={12} className="text-gray-300 group-hover:text-indigo-400 transition-colors" />}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Mail size={12} /> {user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      user.role === 'admin'
                        ? 'bg-purple-50 text-purple-600 border border-purple-100'
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    }`}>
                      <Shield size={10} className="inline mr-1" />{user.role}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-xs font-bold text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      {user.role === 'client' && (
                        <button
                          onClick={() => setShowQuickProjectModal(user)}
                          className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Quick Provision Project"
                        >
                          <Plus size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => { setEditingUser(user); setEditForm({ name: user.name, email: user.email, role: user.role }); }}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Edit user"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user._id, user.name)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Revoke Access"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Client Detail Drawer ── */}
      {selectedClient && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl font-black">
                  {selectedClient.name?.[0]}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{selectedClient.name}</h2>
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{selectedClient.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedClient(null)} className="p-3 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-gray-100 transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <section>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Briefcase size={14} /> Active Pipelines
                  </h3>
                  <Button 
                    onClick={() => setShowQuickProjectModal(selectedClient)}
                    className="h-8 px-3 text-[10px] font-black uppercase tracking-widest flex items-center gap-1"
                  >
                    <Plus size={14} /> Provision New
                  </Button>
                </div>

                {loadingProjects ? (
                  <div className="flex justify-center py-12"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
                ) : clientProjects.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-3xl">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No active pipelines found for this entity.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {clientProjects.map(project => (
                      <Card key={project._id} className="p-5 border-gray-100 hover:border-indigo-200 transition-all group">
                        <div className="flex justify-between items-center">
                          <div className="space-y-1">
                            <h4 className="font-black text-gray-900 uppercase tracking-tight text-sm">{project.projectName}</h4>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                                <Clock size={10} /> {project.status}
                              </span>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                <CheckCircle size={10} /> {project.progress}% Complete
                              </span>
                            </div>
                          </div>
                          <button 
                            onClick={() => window.location.href = `/admin/projects?search=${project.projectName}`}
                            className="p-2 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </div>
                        <div className="h-1.5 w-full bg-gray-50 rounded-full mt-4 overflow-hidden">
                          <div className="h-full bg-indigo-600 transition-all duration-700" style={{ width: `${project.progress}%` }} />
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </section>

              <section className="pt-8 border-t border-gray-50">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Security Parameters</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Clearance</p>
                    <p className="text-xs font-bold text-gray-900 uppercase">{selectedClient.role}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Provisioned</p>
                    <p className="text-xs font-bold text-gray-900 uppercase">{new Date(selectedClient.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </section>
            </div>

            <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex gap-3">
              <Button 
                variant="ghost" 
                className="flex-1 font-black uppercase text-xs tracking-widest py-4 border border-gray-200"
                onClick={() => { setEditingUser(selectedClient); setEditForm({ name: selectedClient.name, email: selectedClient.email, role: selectedClient.role }); }}
              >
                Modify Entity
              </Button>
              <Button 
                variant="danger" 
                className="flex-1 font-black uppercase text-xs tracking-widest py-4 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100"
                onClick={() => { handleDeleteUser(selectedClient._id, selectedClient.name); setSelectedClient(null); }}
              >
                Revoke Access
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Project Modal ── */}
      {showQuickProjectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in zoom-in-95 duration-200">
          <Card className="w-full max-w-md p-8 shadow-2xl border-0">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Quick Provision</h2>
                <p className="text-xs text-indigo-600 font-bold uppercase mt-1">For {showQuickProjectModal.name}</p>
              </div>
              <button onClick={() => setShowQuickProjectModal(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateQuickProject} className="space-y-6">
              <Input 
                label="PIPELINE IDENTIFIER *" 
                value={quickProjectForm.projectName}
                onChange={e => setQuickProjectForm({ ...quickProjectForm, projectName: e.target.value })}
                placeholder="E.g., SKYLINE VILLA" 
                required 
              />
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Initial Phase</label>
                <select 
                  value={quickProjectForm.status} 
                  onChange={e => setQuickProjectForm({ ...quickProjectForm, status: e.target.value })}
                  className="w-full px-4 py-3.5 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-indigo-500 bg-gray-50/50 font-bold text-xs text-gray-700"
                >
                  <option value="Planning">Planning</option>
                  <option value="Design">Design</option>
                  <option value="Execution">Execution</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowQuickProjectModal(null)} className="flex-1 font-bold uppercase text-xs py-4">Abort</Button>
                <Button type="submit" className="flex-1 font-bold uppercase text-xs py-4 shadow-lg shadow-indigo-100">Provision</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ── Provision User Modal (Legacy/Full) ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in zoom-in-95 duration-200">
          <Card className="w-full max-w-lg p-8 shadow-2xl border-0">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Provision Access Token</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-6">
              <Input label="ENTITY NAME *" value={newUser.name}
                onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="Full Name" required />
              <Input label="IDENTIFIER (EMAIL) *" type="email" value={newUser.email}
                onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="client@company.com" required />
              <Input label="SECRET KEY (PASSWORD) *" type="password" value={newUser.password}
                onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="••••••••" required />
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Clearance Level</label>
                <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-4 py-3.5 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-indigo-500 bg-gray-50/50 font-bold text-xs text-gray-700">
                  <option value="client">Client (Restricted)</option>
                  <option value="admin">Administrator (Full Access)</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)} className="flex-1 font-bold uppercase text-xs py-4">Abort</Button>
                <Button type="submit" className="flex-1 font-bold uppercase text-xs py-4 shadow-lg shadow-indigo-100">Execute Provisioning</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ── Edit User Modal ── */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-8 shadow-2xl border-0">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Edit User</h2>
                <p className="text-xs text-indigo-600 font-bold uppercase mt-1">{editingUser.email}</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-6">
              <Input label="ENTITY NAME *" value={editForm.name}
                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Full Name" required />
              <Input label="EMAIL *" type="email" value={editForm.email}
                onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="client@company.com" required />
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Clearance Level</label>
                <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-4 py-3.5 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-indigo-500 bg-gray-50/50 font-bold text-xs text-gray-700">
                  <option value="client">Client (Restricted)</option>
                  <option value="admin">Administrator (Full Access)</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setEditingUser(null)} className="flex-1 font-bold uppercase text-xs py-4">Cancel</Button>
                <Button type="submit" className="flex-1 font-bold uppercase text-xs py-4 flex items-center gap-2 justify-center shadow-lg shadow-indigo-100">
                  <Save size={16} /> Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
