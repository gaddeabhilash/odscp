import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { getProjects, getFiles } from '../../services/projectService';
import { Card } from '../../components/ui/Card';
import { FileText, Download, ExternalLink, Search, FolderOpen, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Files() {
  const { user } = useAuthStore();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const projRes = await getProjects(user._id);
        if (projRes.data.length > 0) {
          // Utilizing first project implicitly as main dashboard logic mapping
          const defaultProjectId = projRes.data[0]._id;
          const filesRes = await getFiles(defaultProjectId);
          setFiles(filesRes.data || []);
        }
      } catch (err) {
        console.error('Failed to load shared artifacts', err);
        toast.error('Terminal error: Failed to retrieve shared assets');
      } finally {
        setLoading(false);
      }
    };
    fetchFiles();
  }, [user._id]);

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

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 md:px-0 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-100 pb-8 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight uppercase">Document Archive</h1>
          <p className="text-gray-500 mt-2">Access blueprints, quotations, and official project documentation.</p>
        </div>
        <div className="relative group w-full md:w-72">
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
