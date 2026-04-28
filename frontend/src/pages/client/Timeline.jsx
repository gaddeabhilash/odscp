import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useProjectStore } from '../../store/projectStore';
import { getUpdates } from '../../services/projectService';
import { getDownloadUrl } from '../../api/axios';
import { Card } from '../../components/ui/Card';
import { Clock, Image as ImageIcon, FileText, Video, ChevronDown, Phone, MessageCircle, Download } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function Timeline() {
  const { user, token } = useAuthStore();
  const { projects, updates: allUpdates, fetchProjects, appendUpdates } = useProjectStore();
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
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
        console.error('Failed to load timeline feed', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [user._id, location.search, fetchProjects]);

  const handleProjectChange = (e) => {
    setSelectedProjectId(e.target.value);
    setPage(1); // Reset page on project change
  };

  const updates = useMemo(() => {
    return allUpdates.filter(u => 
      u.projectId === selectedProjectId || 
      (u.projectId && u.projectId._id === selectedProjectId)
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [allUpdates, selectedProjectId]);

  const hasMore = updates.length >= page * 20;

  const loadMore = async () => {
    if (!selectedProjectId || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await getUpdates(selectedProjectId, nextPage, 20);
      const newUpdates = res.data || [];
      if (newUpdates.length > 0) {
        appendUpdates(newUpdates);
        setPage(nextPage);
      }
    } catch (err) {
      console.error('Failed to load more updates', err);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pt-6 px-4">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-40 bg-gray-200 rounded-2xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  const selectedProject = projects.find(p => p._id === selectedProjectId);

  return (
    <div className="max-w-3xl mx-auto py-8 px-2 md:px-0 animate-in slide-in-from-bottom-4 duration-500 pb-32">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-stone-200 pb-8">
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-serif text-stone-900 tracking-tight">Design Progression</h1>
          <p className="text-stone-500 mt-2 font-sans tracking-wide uppercase text-xs">Visual progression directly from your design team.</p>
        </div>

        {projects.length > 1 && (
          <div className="relative w-full md:w-64 group">
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

      {updates.length === 0 ? (
        <Card className="p-12 text-center text-stone-500 border-dashed border-2 border-stone-200 bg-stone-50/50">
          <Clock className="mx-auto mb-4 text-stone-400" size={32} />
          <p className="font-serif text-lg text-stone-700">No design milestones shared yet.</p>
        </Card>
      ) : (
        <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-brand-200 before:via-stone-200 before:to-transparent">
          {updates.map((update) => (
            <div key={update._id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-brand-50 text-brand-700 shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ml-0 md:mx-auto transition-transform hover:scale-110">
                {update.mediaType === 'video' ? <Video size={16} /> : update.mediaType === 'document' ? <FileText size={16} /> : <ImageIcon size={16} />}
              </div>
              
              <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 hover:shadow-2xl transition-all duration-500 border-stone-100 rounded-none bg-white">
                <div className="flex justify-between items-start mb-4 border-b border-stone-100 pb-4">
                  <h3 className="font-serif text-stone-900 text-xl leading-tight">{update.title}</h3>
                  <span className="text-[10px] font-sans font-semibold uppercase tracking-widest text-brand-800 bg-brand-50 px-3 py-1.5 whitespace-nowrap ml-3 border border-brand-100">
                    {new Date(update.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                {update.description && (
                  <p className="text-stone-600 text-sm mb-5 leading-relaxed font-sans">
                    {update.description}
                  </p>
                )}

                {update.mediaUrl && (
                  <div className="mt-5 overflow-hidden bg-stone-50 border border-stone-100 group-hover:shadow-lg transition-shadow">
                    {update.mediaType === 'video' ? (
                      <video src={update.mediaUrl} controls className="w-full h-auto max-h-[500px] object-contain" />
                    ) : update.mediaType === 'document' ? (
                      <div className="flex items-center justify-between p-6 bg-stone-900 text-white group-hover:bg-stone-800 transition-colors">
                         <div className="flex items-center gap-4">
                           <FileText className="text-brand-300" size={32} />
                           <div>
                             <p className="text-[10px] font-sans uppercase tracking-widest text-brand-200 mb-1">Architectural Document</p>
                             <p className="text-sm font-serif truncate max-w-[200px] md:max-w-xs">{update.title}</p>
                           </div>
                         </div>
                          <button 
                           onClick={() => window.open(getDownloadUrl(`updates/${update._id}/download?token=${token}`), '_blank')}
                           className="p-3 bg-white/10 hover:bg-white/20 transition-all border border-white/10"
                         >
                           <Download size={20} className="text-white" />
                         </button>
                      </div>
                    ) : (
                      <img 
                        src={update.mediaUrl} 
                        alt={update.title} 
                        className="w-full h-auto max-h-[500px] object-cover transition-transform duration-700 hover:scale-[1.02]" 
                      />
                    )}
                  </div>
                )}
              </Card>
            </div>
          ))}
        </div>
      )}

      {hasMore && updates.length > 0 && (
        <div className="flex justify-center mt-12">
          <button 
            onClick={loadMore} 
            disabled={loadingMore}
            className="px-8 py-4 bg-stone-900 text-white font-sans uppercase tracking-widest text-xs hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loadingMore ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Curating...
              </>
            ) : 'Load More Milestones'}
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
