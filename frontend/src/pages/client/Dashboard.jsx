import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { getProjects } from '../../services/projectService';
import { Card } from '../../components/ui/Card';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await getProjects(user._id);
        setProjects(res.data);
      } catch (err) {
        console.error('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user._id]);

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Overview</h1>
        <p className="text-gray-500 mt-1">Welcome back, {user.name}!</p>
      </div>
      
      {projects.length === 0 ? (
        <Card className="p-12 text-center text-gray-500 border-dashed border-2">
          No active projects assigned to your account yet.
        </Card>
      ) : (
        projects.map(project => (
          <Card 
            key={project._id} 
            className="p-6 md:p-8 transition-all hover:shadow-xl hover:-translate-y-1 group cursor-pointer border-gray-100"
            onClick={() => navigate(`/timeline?projectId=${project._id}`)}
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{project.projectName}</h3>
                <p className="text-sm text-gray-500 mt-1">Started {new Date(project.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  project.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'
                }`}>
                  {project.status} Phase
                </span>
                <ChevronRight className="text-gray-300 group-hover:text-indigo-600 transition-colors" size={24} />
              </div>
            </div>
            
            <div className="mt-8 bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-gray-700">Completion</span>
                <span className="font-bold text-indigo-600">{project.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-3 rounded-full transition-all duration-1000 ease-out relative" 
                  style={{ width: `${project.progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 w-full h-full"></div>
                </div>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
