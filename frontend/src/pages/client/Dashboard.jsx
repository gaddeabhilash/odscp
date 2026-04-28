import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useProjectStore } from '../../store/projectStore';
import { Card } from '../../components/ui/Card';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { projects, fetchProjects } = useProjectStore();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        await fetchProjects(user._id);
      } catch (err) {
        console.error('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user._id, fetchProjects]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-8"></div>
        <div className="h-40 bg-gray-200 rounded-xl animate-pulse"></div>
        <div className="h-40 bg-gray-200 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="mb-12">
        <h1 className="text-4xl font-serif text-stone-900 tracking-tight">Design Portfolio</h1>
        <p className="text-stone-500 mt-2 font-sans tracking-wide uppercase text-xs">Curated Spaces for {user.name}</p>
      </div>

      {projects.length === 0 ? (
        <Card className="p-12 text-center text-stone-400 border-dashed border-2 border-stone-200">
          <p className="font-serif text-lg">Your design journey is about to begin.</p>
        </Card>
      ) : (
        projects.map(project => (
          <Card
            key={project._id}
            className="p-6 md:p-8 transition-all hover:shadow-2xl hover:-translate-y-1 group cursor-pointer border-stone-100 rounded-none bg-white"
            onClick={() => navigate(`/timeline?projectId=${project._id}`)}
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h3 className="text-2xl font-serif text-stone-900 group-hover:text-brand-600 transition-colors uppercase tracking-widest">{project.projectName}</h3>
                <p className="text-xs text-stone-400 mt-2 font-sans tracking-widest uppercase">Initiated {new Date(project.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-4 py-1.5 border text-xs font-sans tracking-widest uppercase ${project.status === 'Completed' ? 'border-brand-200 bg-brand-50 text-brand-800' : 'border-stone-200 bg-stone-50 text-stone-700'
                  }`}>
                  {project.status}
                </span>
                <ChevronRight className="text-stone-300 group-hover:text-brand-600 transition-colors" size={24} />
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-stone-100">
              <div className="flex justify-between text-xs mb-3 font-sans tracking-widest uppercase">
                <span className="text-stone-500">Design Progression</span>
                <span className="font-semibold text-brand-700">{project.progress}%</span>
              </div>
              <div className="w-full bg-stone-100 h-1 overflow-hidden">
                <div
                  className="bg-brand-600 h-1 transition-all duration-1000 ease-out"
                  style={{ width: `${project.progress}%` }}
                >
                </div>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
