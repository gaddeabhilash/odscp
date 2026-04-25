import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { getProjects, getUpdates } from '../../services/projectService';
import { Card } from '../../components/ui/Card';
import { Clock, Image as ImageIcon, FileText, Video } from 'lucide-react';

export default function Timeline() {
  const { user } = useAuthStore();
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const projRes = await getProjects(user._id);
        if (projRes.data.length > 0) {
          // Utilizing first project implicitly as main dashboard logic mapping for brevity
          const defaultProjectId = projRes.data[0]._id;
          const updatesRes = await getUpdates(defaultProjectId);
          setUpdates(updatesRes.data || []);
        }
      } catch (err) {
        console.error('Failed to load timeline', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTimeline();
  }, [user._id]);

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

  return (
    <div className="max-w-3xl mx-auto py-8 px-2 md:px-0 animate-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Project Feed</h1>
        <p className="text-gray-500 mt-2">Latest visual progression directly from your design team.</p>
      </div>

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
