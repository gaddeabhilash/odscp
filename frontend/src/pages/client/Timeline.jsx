import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { getProjects, getUpdates } from '../../services/projectService';
import { Card } from '../../components/ui/Card';
import { Clock, Image as ImageIcon, FileText, Video, ChevronDown } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function Timeline() {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const projRes = await getProjects(user._id);
        const userProjects = projRes.data || [];
        setProjects(userProjects);

        if (userProjects.length > 0) {
          // Check for projectId in URL
          const params = new URLSearchParams(location.search);
          const urlPid = params.get('projectId');
          
          // Use URL ID if valid, otherwise use first project
          const initialPid = (urlPid && userProjects.some(p => p._id === urlPid)) 
            ? urlPid 
            : userProjects[0]._id;
          
          setSelectedProjectId(initialPid);
          await fetchUpdates(initialPid);
        }
      } catch (err) {
        console.error('Failed to load initial data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [user._id, location.search]);

  const fetchUpdates = async (pid) => {
    try {
      const updatesRes = await getUpdates(pid);
      setUpdates(updatesRes.data || []);
    } catch (err) {
      console.error('Failed to load updates', err);
    }
  };

  const handleProjectChange = (e) => {
    const pid = e.target.value;
    setSelectedProjectId(pid);
    fetchUpdates(pid);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pt-6 px-4">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse shrink-0"></div>
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded-md w-3/4 animate-pulse"></div>
              <div className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const selectedProject = projects.find(p => p._id === selectedProjectId);

  return (
    <div className="max-w-3xl mx-auto py-8 px-2 md:px-0 animate-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-100 pb-8">
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Project Feed</h1>
          <p className="text-gray-500 mt-2">Latest visual progression directly from your design team.</p>
        </div>

        {projects.length > 1 && (
          <div className="relative w-full md:w-64 group">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Switch Pipeline</label>
            <div className="relative">
              <select
                value={selectedProjectId}
                onChange={handleProjectChange}
                className="w-full pl-4 pr-10 py-3 bg-white border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-indigo-500 transition-all font-bold text-xs tracking-wider appearance-none cursor-pointer"
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

      {selectedProject && (
        <div className="mb-8 flex items-center gap-3 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black">
            {selectedProject.projectName[0].toUpperCase()}
          </div>
          <div>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">Active View</p>
            <p className="text-sm font-black text-indigo-900 uppercase mt-1">{selectedProject.projectName}</p>
          </div>
          <div className="ml-auto text-right">
             <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">Progress</p>
             <p className="text-sm font-black text-indigo-900 mt-1">{selectedProject.progress}%</p>
          </div>
        </div>
      )}

      {updates.length === 0 ? (
        <Card className="p-12 text-center text-gray-500 border-dashed border-2 bg-gray-50/50">
          <Clock className="mx-auto mb-4 text-gray-400" size={32} />
          <p className="font-medium text-gray-700">No updates quite yet.</p>
          <p className="text-sm mt-1">Your timeline will populate once progression is tracked.</p>
        </Card>
      ) : (
        <div className="space-y-10 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-100 before:via-gray-200 before:to-transparent">
          {updates.map((update) => (
            <div key={update._id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-indigo-50 text-indigo-600 shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ml-0 md:mx-auto transition-transform hover:scale-110">
                {update.mediaType === 'video' ? <Video size={16} /> : update.mediaUrl ? <ImageIcon size={16} /> : <FileText size={16} />}
              </div>
              
              <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-gray-100">
                <div className="flex justify-between items-start mb-3 border-b border-gray-50 pb-3">
                  <h3 className="font-bold text-gray-900 text-lg leading-tight">{update.title}</h3>
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full whitespace-nowrap ml-3">
                    {new Date(update.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                
                {update.description && (
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed whitespace-pre-wrap">
                    {update.description}
                  </p>
                )}

                {update.mediaUrl && (
                  <div className="mt-4 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 shadow-sm group-hover:shadow-md transition-shadow">
                    {update.mediaType === 'video' ? (
                      <video src={update.mediaUrl} controls className="w-full h-56 object-cover" />
                    ) : (
                      <img src={update.mediaUrl} alt={update.title} className="w-full h-56 object-cover hover:scale-105 transition-transform duration-700" />
                    )}
                  </div>
                )}
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
