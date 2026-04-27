import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { getProjects, getFiles } from '../../services/projectService';
import { Card } from '../../components/ui/Card';
import { FileText, Download, ExternalLink, Search, FolderOpen, ChevronDown, Phone, MessageCircle, RefreshCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';

export default function Files() {
  const { user, token } = useAuthStore();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const location = useLocation();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const projRes = await getProjects(user._id);
        const userProjects = projRes.data || [];
        setProjects(userProjects);

        if (userProjects.length > 0) {
          const params = new URLSearchParams(location.search);
          const urlPid = params.get('projectId');
          const initialPid = (urlPid && userProjects.some(p => p._id === urlPid)) 
            ? urlPid 
            : userProjects[0]._id;
          
          setSelectedProjectId(initialPid);
          await fetchProjectFiles(initialPid);
        }
      } catch (err) {
        console.error('Failed to load shared artifacts', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [user._id, location.search]);

  const fetchProjectFiles = async (pid) => {
    if (!pid) return;
    setRefreshing(true);
    try {
      const filesRes = await getFiles(pid);
      setFiles(filesRes.data || []);
      if (refreshing) toast.success('Document sync complete');
    } catch (err) {
      toast.error('Failed to sync documents');
    } finally {
      setRefreshing(false);
    }
  };

  const handleProjectChange = (e) => {
    const pid = e.target.value;
    setSelectedProjectId(pid);
    fetchProjectFiles(pid);
  };

  const filteredFiles = files.filter(f => 
    f.fileName.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-8 animate-in fade-in duration-500">
        <div className="h-10 w-48 bg-gray-200 rounded animate-pulse mb-8"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-20 bg-gray-200 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const selectedProject = projects.find(p => p._id === selectedProjectId);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 md:px-0 animate-in slide-in-from-bottom-4 duration-500 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-100 pb-8 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight uppercase">Document Archive</h1>
          <p className="text-gray-500 mt-2 font-medium">Official blueprints, quotations, and project reports.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-end">
           <button 
            onClick={() => fetchProjectFiles(selectedProjectId)}
            className={`p-2.5 bg-gray-50 text-gray-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all mb-0.5 ${refreshing ? 'animate-spin' : ''}`}
            title="Force Refresh"
          >
            <RefreshCcw size={20} />
          </button>
          {projects.length > 1 && (
            <div className="relative group w-full sm:w-64">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Switch Stream</label>
              <div className="relative">
                <select
                  value={selectedProjectId}
                  onChange={handleProjectChange}
                  className="w-full pl-4 pr-10 py-2.5 bg-white border-2 border-gray-100 rounded-xl focus:outline-none focus:border-indigo-500 transition-all font-bold text-xs tracking-wider appearance-none cursor-pointer"
                >
                  {projects.map(p => (
                    <option key={p._id} value={p._id}>{p.projectName.toUpperCase()}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-indigo-500" size={16} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mb-8 relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
        <input
          type="text"
          placeholder="FILTER BY FILENAME..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-indigo-500 transition-all font-bold text-xs tracking-widest text-gray-800"
        />
      </div>

      {filteredFiles.length === 0 ? (
        <Card className="p-20 text-center border-dashed border-2 bg-gray-50/50">
          <FolderOpen className="mx-auto mb-4 text-gray-300" size={48} />
          <p className="font-bold text-gray-500 uppercase tracking-widest text-sm">No files identified</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredFiles.map((file) => (
            <Card key={file._id} className="p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-gray-100 group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 uppercase tracking-tight text-sm mb-1">{file.fileName}</h3>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                       Shared {new Date(file.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => window.open(`/api/files/${file._id}/download?token=${token}`, '_blank')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-indigo-600 transition-all text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95"
                  >
                    <Download size={14} /> Download
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* QUICK CONTACT SECTION (AS REQUESTED) */}
      <div className="mt-24 border-t border-gray-100 pt-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Need Assistance?</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Connect with our team for immediate project support.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {[
            { name: "Support Line 1", phone: "9398801834" },
            { name: "Support Line 2", phone: "7993107169" }
          ].map((contact, idx) => (
            <Card key={idx} className="p-6 border-gray-100 hover:shadow-xl transition-all">
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3">{contact.name}</p>
              <div className="flex gap-2">
                <a href={`tel:${contact.phone}`} className="flex-1 bg-gray-900 text-white py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest">
                  <Phone size={12} /> Call
                </a>
                <a href={`https://wa.me/91${contact.phone}`} target="_blank" rel="noreferrer" className="flex-1 bg-emerald-500 text-white py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest">
                  <MessageCircle size={12} /> WhatsApp
                </a>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
