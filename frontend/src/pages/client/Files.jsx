import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useProjectStore } from '../../store/projectStore';
import { getFiles } from '../../services/projectService';
import { getDownloadUrl } from '../../api/axios';
import { Card } from '../../components/ui/Card';
import { FileText, Download, ExternalLink, Search, FolderOpen, ChevronDown, Phone, MessageCircle, RefreshCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';

export default function Files() {
  const { user, token } = useAuthStore();
  const { projects, files: allFiles, fetchProjects, appendFiles } = useProjectStore();
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const location = useLocation();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch projects (will be instant if already cached in store)
        const userProjects = await fetchProjects(user._id);

        if (userProjects && userProjects.length > 0) {
          const params = new URLSearchParams(location.search);
          const urlPid = params.get('projectId');
          const initialPid = (urlPid && userProjects.some(p => p._id === urlPid)) 
            ? urlPid 
            : userProjects[0]._id;
          
          setSelectedProjectId(initialPid);
        }
      } catch (err) {
        console.error('Failed to load shared artifacts', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [user._id, location.search, fetchProjects]);

  const fetchProjectFiles = async (pid) => {
    if (!pid) return;
    setRefreshing(true);
    try {
      await fetchProjects(user._id, true); // Force refresh global store
      toast.success('Document sync complete');
    } catch (err) {
      toast.error('Failed to sync documents');
    } finally {
      setRefreshing(false);
    }
  };

  const handleProjectChange = (e) => {
    setSelectedProjectId(e.target.value);
    setPage(1); // Reset page on project change
  };

  const files = useMemo(() => {
    return allFiles.filter(f => 
      f.projectId === selectedProjectId || 
      (f.projectId && f.projectId._id === selectedProjectId)
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [allFiles, selectedProjectId]);

  const hasMore = files.length >= page * 20;

  const loadMore = async () => {
    if (!selectedProjectId || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await getFiles(selectedProjectId, nextPage, 20);
      const newFiles = res.data || [];
      if (newFiles.length > 0) {
        appendFiles(newFiles);
        setPage(nextPage);
      }
    } catch (err) {
      console.error('Failed to load more files', err);
    } finally {
      setLoadingMore(false);
    }
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-stone-200 pb-8 mb-8">
        <div>
          <h1 className="text-4xl font-serif text-stone-900 tracking-tight">Curated Documents</h1>
          <p className="text-stone-500 mt-2 font-sans tracking-wide uppercase text-xs">Official blueprints, quotations, and architectural reports.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-end">
           <button 
            onClick={() => fetchProjectFiles(selectedProjectId)}
            className={`p-2.5 bg-stone-50 text-stone-400 hover:text-brand-600 rounded-none hover:bg-stone-100 transition-all mb-0.5 ${refreshing ? 'animate-spin' : ''}`}
            title="Force Refresh"
          >
            <RefreshCcw size={20} />
          </button>
          {projects.length > 1 && (
            <div className="relative group w-full sm:w-64">
              <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-widest mb-2 block">Select Space</label>
              <div className="relative">
                <select
                  value={selectedProjectId}
                  onChange={handleProjectChange}
                  className="w-full pl-4 pr-10 py-3 bg-white border-b-2 border-stone-200 focus:outline-none focus:border-stone-900 transition-colors font-sans text-sm tracking-wide appearance-none cursor-pointer"
                >
                  {projects.map(p => (
                    <option key={p._id} value={p._id}>{p.projectName}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none group-focus-within:text-stone-900" size={16} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mb-8 relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-brand-600 transition-colors" size={20} />
        <input
          type="text"
          placeholder="SEARCH DOCUMENTS..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border-b-2 border-stone-200 focus:outline-none focus:border-stone-900 transition-colors font-sans text-xs tracking-widest text-stone-800 placeholder:text-stone-300"
        />
      </div>

      {filteredFiles.length === 0 ? (
        <Card className="p-20 text-center border-dashed border-2 border-stone-200 bg-stone-50/50">
          <FolderOpen className="mx-auto mb-4 text-stone-300" size={48} />
          <p className="font-serif text-lg text-stone-700">No documents found</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredFiles.map((file) => (
            <Card key={file._id} className="p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-stone-100 group rounded-none bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-700 group-hover:bg-brand-600 group-hover:text-white transition-all duration-500">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="font-serif text-stone-900 text-lg mb-1">{file.fileName}</h3>
                    <span className="text-[10px] font-sans text-stone-400 uppercase tracking-widest">
                       Shared {new Date(file.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => window.open(getDownloadUrl(`files/${file._id}/download?token=${token}`), '_blank')}
                    className="flex items-center gap-2 px-5 py-3 bg-stone-900 text-white hover:bg-stone-800 transition-colors text-[10px] font-sans uppercase tracking-widest"
                  >
                    <Download size={14} /> Download
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {hasMore && filteredFiles.length > 0 && search === '' && (
        <div className="flex justify-center mt-12">
          <button 
            onClick={loadMore} 
            disabled={loadingMore}
            className="px-8 py-4 bg-stone-900 text-white font-sans uppercase tracking-widest text-xs hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loadingMore ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Retrieving...
              </>
            ) : 'Load More Documents'}
          </button>
        </div>
      )}

      {/* QUICK CONTACT SECTION (AS REQUESTED) */}
      <div className="mt-24 border-t border-stone-200 pt-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-serif text-stone-900 tracking-tight">Need Assistance?</h2>
          <p className="text-xs font-sans text-stone-500 uppercase tracking-widest mt-2">Connect with our curatorial team.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {[
            { name: "Principal Architect", phone: "9398801834" },
            { name: "Design Director", phone: "7993107169" }
          ].map((contact, idx) => (
            <Card key={idx} className="p-8 border-stone-200 hover:shadow-xl transition-all rounded-none bg-stone-50">
              <p className="text-sm font-serif text-stone-900 mb-4">{contact.name}</p>
              <div className="flex gap-3">
                <a href={`tel:${contact.phone}`} className="flex-1 bg-stone-900 text-white py-3 flex items-center justify-center gap-2 text-xs font-sans uppercase tracking-widest hover:bg-stone-800 transition-colors">
                  <Phone size={14} /> Call
                </a>
                <a href={`https://wa.me/91${contact.phone}`} target="_blank" rel="noreferrer" className="flex-1 bg-brand-600 text-white py-3 flex items-center justify-center gap-2 text-xs font-sans uppercase tracking-widest hover:bg-brand-700 transition-colors">
                  <MessageCircle size={14} /> WhatsApp
                </a>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
