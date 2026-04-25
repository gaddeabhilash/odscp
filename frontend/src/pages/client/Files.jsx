import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { getProjects, getFiles } from '../../services/projectService';
import { Card } from '../../components/ui/Card';
import { FileText, Download, ExternalLink, Search, FolderOpen, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';

export default function Files() {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
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
        toast.error('Terminal error: Failed to retrieve shared assets');
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [user._id, location.search]);

  const fetchProjectFiles = async (pid) => {
    try {
      const filesRes = await getFiles(pid);
      setFiles(filesRes.data || []);
    } catch (err) {
      console.error('Failed to load files', err);
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
    <div className="max-w-4xl mx-auto py-8 px-4 md:px-0 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-100 pb-8 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight uppercase">Document Archive</h1>
          <p className="text-gray-500 mt-2">Access blueprints, quotations, and official project documentation.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          {projects.length > 1 && (
            <div className="relative group w-full sm:w-64">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Switch Project</label>
              <div className="relative">
                <select
                  value={selectedProjectId}
                  onChange={handleProjectChange}
                  className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border-2 border-transparent rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-xs tracking-wider appearance-none cursor-pointer"
                >
                  {projects.map(p => (
                    <option key={p._id} value={p._id}>{p.projectName.toUpperCase()}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
            </div>
          )}

          <div className="relative group w-full sm:w-64">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Filter Artifacts</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="SEARCH ARCHIVE..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-2 border-transparent rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-xs tracking-wider text-gray-800"
              />
            </div>
          </div>
        </div>
      </div>

      {selectedProject && (
        <div className="mb-8 flex items-center gap-3 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black">
            {selectedProject.projectName[0].toUpperCase()}
          </div>
          <div>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">Showing Documents for</p>
            <p className="text-sm font-black text-indigo-900 uppercase mt-1">{selectedProject.projectName}</p>
          </div>
        </div>
      )}

      {filteredFiles.length === 0 ? (
        <Card className="p-20 text-center border-dashed border-2 bg-gray-50/50">
          <FolderOpen className="mx-auto mb-4 text-gray-300" size={48} />
          <p className="font-bold text-gray-400 uppercase tracking-widest text-sm">No artifacts deployed</p>
          <p className="text-xs text-gray-400 mt-2">Shared files will appear here as the project matures.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredFiles.map((file) => (
            <Card key={file._id} className="p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all border-gray-100/80 group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 uppercase tracking-tight text-sm leading-none">{file.fileName}</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">
                      Deployed on {new Date(file.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <a 
                    href={file.fileUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    title="View Source"
                  >
                    <ExternalLink size={20} />
                  </a>
                  <a 
                    href={file.fileUrl} 
                    download 
                    className="p-3 bg-gray-900 text-white rounded-xl hover:bg-indigo-600 transition-all shadow-sm hover:shadow-lg flex items-center gap-2 px-5"
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Fetch File</span>
                    <Download size={18} />
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-12 p-6 bg-indigo-900 rounded-3xl text-white relative overflow-hidden group">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h4 className="text-xl font-black uppercase tracking-tight">Need specific assets?</h4>
            <p className="text-indigo-200 text-sm mt-1">Request custom exports or higher resolution blueprints from your project lead.</p>
          </div>
          <button className="bg-white text-indigo-900 px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-100 transition-colors shadow-xl">
            Contact Team
          </button>
        </div>
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
      </div>
    </div>
  );
}
