import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Home, Clock, Folder, Users, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const AppLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const clientLinks = [
    { name: 'Overview', path: '/dashboard', icon: <Home size={20} /> },
    { name: 'Timeline', path: '/timeline', icon: <Clock size={20} /> },
    { name: 'Files', path: '/files', icon: <Folder size={20} /> },
  ];

  const adminLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Clients', path: '/admin/clients', icon: <Users size={20} /> },
    { name: 'Projects', path: '/admin/projects', icon: <Folder size={20} /> },
  ];

  const links = user?.role === 'admin' ? adminLinks : clientLinks;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <span className="text-xl font-bold font-sans text-indigo-600 tracking-tight">Client Portal.</span>
        </div>
        <nav className="flex-1 py-6 flex flex-col gap-1 px-4">
          {links.map((link) => {
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                  isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {link.icon}
                {link.name}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold uppercase">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold text-gray-900 truncate">{user?.name}</span>
              <span className="text-xs text-gray-500 truncate capitalize">{user?.role}</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="mt-2 w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Panel */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile Header Shell */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:hidden shrink-0">
          <span className="text-xl font-bold text-indigo-600 tracking-tight">Portal.</span>
          <button onClick={handleLogout} className="text-gray-600 p-2 hover:bg-gray-100 rounded-md">
            <LogOut size={20} />
          </button>
        </header>

        {/* Dynamic Inner Outlet */}
        <div className="flex-1 overflow-auto p-4 md:p-8 relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
