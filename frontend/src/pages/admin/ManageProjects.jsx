import { useEffect, useState, useRef } from 'react';
import api from '../../api/axios';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  Folder, Plus, Search, Edit2, Trash2, CheckCircle, Clock,
  Loader2, X, UploadCloud, FileText, Save, ExternalLink, Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const STATUS_OPTIONS = ['Planning', 'Design', 'Execution', 'In Progress', 'Review', 'Completed'];

export default function ManageProjects() {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  // Modals & Drawers
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null); 
  const [selectedProject, setSelectedProject] = useState(null); 
  const [projectUpdates, setProjectUpdates] = useState([]);
  const [projectFiles, setProjectFiles] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailTab, setDetailTab] = useState('timeline'); 

  // Create form state
  const [newProject, setNewProject] = useState({
    projectName: '', clientId: '', status: 'Planning', progress: 0,
  });
  const [docFile, setDocFile] = useState(null);
  const docInputRef = useRef(null);

  // Edit form state
  const [editForm, setEditForm] = useState({ status: '', progress: 0 });
  const [editDocFile, setEditDocFile] = useState(null);
  const editDocInputRef = useRef(null);

  // Update Edit form state
  const [editingUpdate, setEditingUpdate] = useState(null);
  const [updateEditForm, setUpdateEditForm] = useState({ title: '', description: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projRes, userRes] = await Promise.all([
        api.get('/projects'),
        api.get('/users'),
      ]);
      setProjects(projRes.data.data || []);
      setUsers(userRes.data.data.filter(u => u.role === 'client') || []);
    } catch {
      toast.error('Failed to fetch pipeline data');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectDetails = async (projectId) => {
    setLoadingDetails(true);
    try {
      const [updatesRes, filesRes] = await Promise.all([
        api.get(`/updates/project/${projectId}`),
        api.get(`/files/project/${projectId}`),
      ]);
      setProjectUpdates(updatesRes.data.data || []);
      setProjectFiles(filesRes.data.data || []);
    } catch {
      toast.error('Failed to load project details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleOpenDetail = (project) => {
    setSelectedProject(project);
    fetchProjectDetails(project._id);
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProject.clientId) return toast.error('Please assign a client');

    try {
      const res = await api.post('/projects', newProject);
      const createdProject = res.data.data;

      if (docFile && createdProject?._id) {
        const formData = new FormData();
        formData.append('projectId', createdProject._id);
        formData.append('file', docFile);
        formData.append('fileName', docFile.name);
        await api.post('/files', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      toast.success('Pipeline provisioned successfully');
      setShowAddModal(false);
      setNewProject({ projectName: '', clientId: '', status: 'Planning', progress: 0 });
      setDocFile(null);
      fetchData();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Action failed';
      toast.error(`Provision failed: ${errorMsg}`);
    }
  };

  const handleDeleteProject = async (id, name) => {
    if (!window.confirm(`Delete pipeline "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Pipeline deleted');
      setProjects(prev => prev.filter(p => p._id !== id));
      if (selectedProject?._id === id) setSelectedProject(null);
    } catch {
      toast.error('Failed to delete pipeline');
    }
  };

  const openEdit = (project) => {
    setEditingProject(project);
    setEditForm({ status: project.status, progress: project.progress });
    setEditDocFile(null);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/projects/${editingProject._id}`, editForm);
      
      if (editDocFile) {
        const formData = new FormData();
        formData.append('projectId', editingProject._id);
        formData.append('file', editDocFile);
        formData.append('fileName', editDocFile.name);
        await api.post('/files', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      toast.success('Pipeline updated');
      setProjects(prev =>
        prev.map(p => p._id === editingProject._id ? { ...p, ...res.data.data } : p)
      );
      if (selectedProject?._id === editingProject._id) {
        setSelectedProject(prev => ({ ...prev, ...res.data.data }));
        fetchProjectDetails(editingProject._id);
      }
      setEditingProject(null);
      setEditDocFile(null);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Update failed';
      toast.error(`Pipeline failure: ${errorMsg}`);
    }
  };

  const handleDeleteUpdate = async (id) => {
    if (!window.confirm('Delete this timeline update?')) return;
    try {
      await api.delete(`/updates/${id}`);
      toast.success('Timeline entry removed');
      setProjectUpdates(prev => prev.filter(u => u._id !== id));
    } catch {
      toast.error('Failed to remove update');
    }
  };

  const handleSaveUpdateEdit = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/updates/${editingUpdate._id}`, updateEditForm);
      toast.success('Entry modified');
      setProjectUpdates(prev => 
        prev.map(u => u._id === editingUpdate._id ? { ...u, ...updateEditForm } : u)
      );
      setEditingUpdate(null);
    } catch {
      toast.error('Failed to edit entry');
    }
  };

  const handleDeleteFile = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await api.post(`/files/${id}/delete`);
      toast.success('Document purged');
      setProjectFiles(prev => prev.filter(f => f._id !== id));
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Purge failed';
      toast.error(`System Error: ${errorMsg}`);
    }
  };

  const handleDownload = (fileUrl, fileName) => {
    toast.success(`Opening: ${fileName}`);
    const safeUrl = `${fileUrl}${fileUrl.includes('?') ? '&' : '?'}cb=${Date.now()}`;
    window.open(safeUrl, '_blank');
  };

  const filteredProjects = projects.filter(p =>
    p.projectName?.toLowerCase().includes(search.toLowerCase()) ||
    p.clientId?.name?.toLowerCase().includes(search.toLowerCase())
  );


  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Active Pipelines</h1>
          <p className="text-gray-500 mt-2">Manage and monitor deployment progress across all active client streams.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-6 py-3 font-bold uppercase tracking-wider text-xs">
          <Plus size={18} /> New Deployment
        </Button>
      </div>

      {/* Search */}
      <div className="relative group max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
        <input
          type="text"
          placeholder="SEARCH PIPELINES..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-xs tracking-widest text-gray-800"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 space-y-4">
          <Loader2 className="animate-spin" size={40} />
          <p className="font-bold tracking-widest text-xs uppercase">Initializing Stream...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card className="p-20 text-center border-dashed border-2 bg-gray-50/50">
          <Folder className="mx-auto mb-4 text-gray-300" size={48} />
          <p className="font-bold text-gray-500 uppercase tracking-widest text-sm">No pipelines detected</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <Card 
              key={project._id} 
              className="p-6 hover:shadow-xl hover:-translate-y-1 transition-all border-gray-100/60 group cursor-pointer relative"
              onClick={() => handleOpenDetail(project)}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors text-indigo-600">
                  <Folder size={24} />
                </div>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => navigate(`/admin/update-upload?projectId=${project._id}`)}
                    className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    title="Direct Media Upload"
                  >
                    <UploadCloud size={16} />
                  </button>
                  <button
                    onClick={() => openEdit(project)}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    title="Edit pipeline"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project._id, project.projectName)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="Delete pipeline"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-1 mb-6">
                <h3 className="font-black text-gray-900 text-lg leading-tight uppercase tracking-tight">{project.projectName}</h3>
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                  <Clock size={12} /> {project.status} Phase
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Completion Metric</p>
                  <p className="text-sm font-black text-gray-900">{project.progress}%</p>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-1000"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
                <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-600 border-2 border-white">
                      {project.clientId?.name?.[0]}
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{project.clientId?.name}</span>
                  </div>
                  <CheckCircle size={16} className={project.progress === 100 ? 'text-emerald-500' : 'text-gray-200'} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Project Detail Drawer ── */}
      {selectedProject && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-full bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            {/* Drawer Header */}
            <div className="p-8 border-b border-gray-100 bg-gray-50/50">
              <div className="max-w-5xl mx-auto w-full">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-xl font-black">
                      {selectedProject.projectName?.[0]}
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{selectedProject.projectName}</h2>
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Client: {selectedProject.clientId?.name}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedProject(null)} className="p-3 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-gray-100 transition-all">
                    <X size={24} />
                  </button>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setDetailTab('timeline')}
                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      detailTab === 'timeline' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-gray-400 hover:text-indigo-600'
                    }`}
                  >
                    Timeline
                  </button>
                  <button 
                    onClick={() => setDetailTab('docs')}
                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      detailTab === 'docs' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-gray-400 hover:text-indigo-600'
                    }`}
                  >
                    Documents
                  </button>
                </div>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-5xl mx-auto w-full">
                {loadingDetails ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Loader2 className="animate-spin mb-4" size={32} />
                    <p className="text-[10px] font-black uppercase tracking-widest">Retrieving Artifacts...</p>
                  </div>
                ) : detailTab === 'timeline' ? (
                  <div className="space-y-6">
                    {projectUpdates.length === 0 ? (
                      <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-3xl">
                        <Clock className="mx-auto mb-4 text-gray-200" size={48} />
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Timeline is empty</p>
                      </div>
                    ) : (
                      projectUpdates.map(update => (
                        <div key={update._id} className="relative pl-8 border-l-2 border-gray-100 pb-8 last:pb-0">
                          <div className="absolute -left-[9px] top-0 w-4 h-4 bg-white border-2 border-indigo-600 rounded-full"></div>
                          <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow group">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-black text-gray-900 uppercase tracking-tight text-sm">{update.title}</h4>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{new Date(update.createdAt).toLocaleString()}</p>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => { setEditingUpdate(update); setUpdateEditForm({ title: update.title, description: update.description }); }}
                                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteUpdate(update._id)}
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed">{update.description}</p>
                            {update.mediaUrl && (
                              <div className="mt-4 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                                {update.mediaType === 'video' ? (
                                  <video src={update.mediaUrl} controls className="w-full max-h-[500px] object-contain" />
                                ) : (
                                  <img src={update.mediaUrl} alt={update.title} className="w-full max-h-[500px] object-contain" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {projectFiles.length === 0 ? (
                      <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-3xl">
                        <FileText className="mx-auto mb-4 text-gray-200" size={48} />
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No documents shared</p>
                      </div>
                    ) : (
                      projectFiles.map(file => (
                        <div key={file._id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-indigo-200 transition-colors group">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                              <FileText size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{file.fileName}</p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(file.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        <div className="flex gap-1">
                          <a 
                            href={`${file.fileUrl}${file.fileUrl.includes('?') ? '&' : '?'}cb=${Date.now()}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-indigo-600 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm"
                          >
                            <Download size={14} /> Download
                          </a>

                          <button 
                            onClick={() => handleDeleteFile(file._id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="p-8 border-t border-gray-100">
              <div className="max-w-5xl mx-auto w-full flex gap-4">
                <Button 
                  onClick={() => navigate('/admin/update-upload', { state: { projectId: selectedProject._id } })}
                  className="flex-1 font-bold uppercase text-xs py-4 flex items-center gap-2 justify-center"
                >
                  <Plus size={16} /> New Timeline Update
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => openEdit(selectedProject)}
                  className="flex-1 font-bold uppercase text-xs py-4 flex items-center gap-2 justify-center border-2"
                >
                  <Edit2 size={16} /> Edit Pipeline
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Project Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-8 shadow-2xl border-0 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Provision New Pipeline</h2>
              <button onClick={() => { setShowAddModal(false); setDocFile(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-6">
              <Input
                label="PROJECT IDENTIFIER *"
                value={newProject.projectName}
                onChange={e => setNewProject({ ...newProject, projectName: e.target.value })}
                placeholder="E.g., SKYLINE PENTHOUSE"
                required
              />

              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Target Client *</label>
                <select
                  value={newProject.clientId}
                  onChange={e => setNewProject({ ...newProject, clientId: e.target.value })}
                  required
                  className="w-full px-4 py-3.5 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-indigo-500 bg-gray-50/50 font-bold text-xs text-gray-700"
                >
                  <option value="">-- SELECT ASSIGNEE --</option>
                  {users.map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Initial Phase</label>
                  <select
                    value={newProject.status}
                    onChange={e => setNewProject({ ...newProject, status: e.target.value })}
                    className="w-full px-4 py-3.5 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-indigo-500 bg-gray-50/50 font-bold text-xs text-gray-700"
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <Input
                  label="START METRIC (%)"
                  type="number" min="0" max="100"
                  value={newProject.progress}
                  onChange={e => setNewProject({ ...newProject, progress: parseInt(e.target.value) || 0 })}
                />
              </div>

              {/* Document Upload */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Attach Document (Optional)</label>
                {docFile ? (
                  <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border-2 border-indigo-200 rounded-xl">
                    <FileText size={20} className="text-indigo-600 shrink-0" />
                    <span className="text-xs font-bold text-indigo-800 truncate flex-1">{docFile.name}</span>
                    <button type="button" onClick={() => { setDocFile(null); docInputRef.current.value = ''; }}
                      className="text-indigo-400 hover:text-red-500 transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => docInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all"
                  >
                    <UploadCloud size={24} className="text-gray-400" />
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Click to attach PDF / DOC</p>
                  </div>
                )}
                <input
                  ref={docInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xlsx,.png,.jpg"
                  onChange={e => setDocFile(e.target.files[0] || null)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => { setShowAddModal(false); setDocFile(null); }} className="flex-1 font-bold uppercase text-xs tracking-widest py-4">
                  Abort
                </Button>
                <Button type="submit" className="flex-1 font-bold uppercase text-xs tracking-widest py-4 shadow-lg shadow-indigo-200">
                  Execute Provision
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ── Edit Project Modal ── */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <Card className="w-full max-w-md p-8 shadow-2xl border-0 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Edit Pipeline</h2>
                <p className="text-xs text-indigo-600 font-bold uppercase mt-1">{editingProject.projectName}</p>
              </div>
              <button onClick={() => setEditingProject(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Project Phase / Status</label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-4 py-3.5 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-indigo-500 bg-gray-50/50 font-bold text-xs text-gray-700"
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest">
                  Completion Metric — <span className="text-indigo-600">{editForm.progress}%</span>
                </label>
                <input
                  type="range" min="0" max="100" step="1"
                  value={editForm.progress}
                  onChange={e => setEditForm({ ...editForm, progress: parseInt(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all"
                    style={{ width: `${editForm.progress}%` }}
                  />
                </div>
              </div>

              {/* Edit Document Upload */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Upload New Document</label>
                {editDocFile ? (
                  <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border-2 border-indigo-200 rounded-xl">
                    <FileText size={20} className="text-indigo-600 shrink-0" />
                    <span className="text-xs font-bold text-indigo-800 truncate flex-1">{editDocFile.name}</span>
                    <button type="button" onClick={() => { setEditDocFile(null); editDocInputRef.current.value = ''; }}
                      className="text-indigo-400 hover:text-red-500 transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => editDocInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all"
                  >
                    <UploadCloud size={24} className="text-gray-400" />
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Replace or add document</p>
                  </div>
                )}
                <input
                  ref={editDocInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xlsx,.png,.jpg"
                  onChange={e => setEditDocFile(e.target.files[0] || null)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setEditingProject(null)} className="flex-1 font-bold uppercase text-xs py-4">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 font-bold uppercase text-xs py-4 flex items-center gap-2 justify-center shadow-lg shadow-indigo-100">
                  <Save size={16} /> Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
      {/* Edit Update Modal */}
      {editingUpdate && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-8 shadow-2xl border-0">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Edit Timeline Entry</h2>
              <button onClick={() => setEditingUpdate(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveUpdateEdit} className="space-y-6">
              <Input 
                label="UPDATE TITLE *" 
                value={updateEditForm.title}
                onChange={e => setUpdateEditForm({ ...updateEditForm, title: e.target.value })}
                required 
              />
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest">DESCRIPTION</label>
                <textarea 
                  value={updateEditForm.description}
                  onChange={e => setUpdateEditForm({ ...updateEditForm, description: e.target.value })}
                  className="w-full px-4 py-3.5 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-indigo-500 bg-gray-50/50 font-bold text-xs text-gray-700 min-h-[120px]"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setEditingUpdate(null)} className="flex-1 font-bold uppercase text-xs py-4">Cancel</Button>
                <Button type="submit" className="flex-1 font-bold uppercase text-xs py-4 shadow-lg shadow-indigo-100">Update Entry</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
