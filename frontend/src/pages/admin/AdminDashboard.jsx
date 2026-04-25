import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Card } from '../../components/ui/Card';
import { Users, Folder, Activity, Plus, UploadCloud } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, projects: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [usersRes, projectsRes] = await Promise.all([
          api.get('/users'),
          api.get('/projects')
        ]);
        
        setStats({
          users: usersRes.data.total,
          projects: projectsRes.data.total,
        });
      } catch (err) {
        console.error('Failed to load admin stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-10 w-48 bg-gray-200 rounded animate-pulse mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">System Terminal</h1>
          <p className="text-gray-500 mt-2">Manage global business operations and execute deployments.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/update-upload" className="bg-white text-indigo-600 border border-indigo-200 px-4 py-2.5 rounded-lg font-medium hover:bg-indigo-50 transition-colors flex items-center gap-2 text-sm shadow-sm hover:shadow">
            <UploadCloud size={18} /> Direct Upload
          </Link>
          <Link to="/admin/projects" className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition flex items-center gap-2 text-sm shadow-sm hover:shadow">
            <Plus size={18} /> New Project
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 md:p-8 flex items-center gap-5 hover:border-indigo-100 hover:shadow-md transition-all cursor-pointer group">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-100 group-hover:scale-105 transition-all">
            <Users className="text-indigo-600" size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Provisioned</p>
            <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{stats.users}</h3>
            <p className="text-xs text-indigo-600 font-semibold mt-1">Clients Active</p>
          </div>
        </Card>

        <Card className="p-6 md:p-8 flex items-center gap-5 hover:border-blue-100 hover:shadow-md transition-all cursor-pointer group">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-100 group-hover:scale-105 transition-all">
            <Folder className="text-blue-600" size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Active Pipelines</p>
            <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{stats.projects}</h3>
            <p className="text-xs text-blue-600 font-semibold mt-1">Projects Open</p>
          </div>
        </Card>

        <Card className="p-6 md:p-8 flex items-center gap-5 hover:border-emerald-100 hover:shadow-md transition-all cursor-pointer group">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center group-hover:bg-emerald-100 group-hover:scale-105 transition-all">
            <Activity className="text-emerald-600" size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Node Status</p>
            <h3 className="text-2xl font-bold text-emerald-600 tracking-tight mt-1">100% OK</h3>
            <p className="text-xs text-gray-400 mt-1">API Online</p>
          </div>
        </Card>
      </div>

      <div className="mt-10">
         <h2 className="text-lg font-bold text-gray-900 mb-4 px-1">Quick Toggles</h2>
         <Card className="p-1 items-center bg-gray-50/50 border border-gray-100 text-center text-sm font-medium text-gray-400 py-12 border-dashed">
            Metrics tracking coming natively in v1.2
         </Card>
      </div>
    </div>
  );
}
