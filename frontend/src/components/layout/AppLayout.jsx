import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Home, Clock, Folder, Users, LayoutDashboard, Menu, MessageSquare, X as CloseIcon } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const AppLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const clientLinks = [
    { name: 'Overview', path: '/dashboard', icon: <Home size={20} /> },
    { name: 'Timeline', path: '/timeline', icon: <Clock size={20} /> },
    { name: 'Files', path: '/files', icon: <Folder size={20} /> },
    { name: 'Contact Team', path: '/contact', icon: <MessageSquare size={20} /> },
  ];

  const adminLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Clients', path: '/admin/clients', icon: <Users size={20} /> },
    { name: 'Projects', path: '/admin/projects', icon: <Folder size={20} /> },
    { name: 'Contact Center', path: '/contact', icon: <MessageSquare size={20} /> },
  ];

  const links = user?.role === 'admin' ? adminLinks : clientLinks;

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-stone-50 flex overflow-hidden font-sans">
      {/* Sidebar Desktop */}
      <aside className="w-64 bg-stone-900 border-r border-stone-800 hidden md:flex flex-col shrink-0 text-stone-300">
        <div className="h-20 flex items-center px-8 border-b border-stone-800">
          <span className="text-2xl font-serif text-brand-300 tracking-wider uppercase">Orniva.</span>
        </div>
        <nav className="flex-1 py-8 flex flex-col gap-2 px-4">
          {links.map((link) => {
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all uppercase tracking-widest ${
                  isActive ? 'bg-brand-600 text-white shadow-lg' : 'text-stone-400 hover:bg-stone-800 hover:text-stone-100'
                }`}
              >
                {link.icon}
                {link.name}
              </Link>
            )
          })}
        </nav>
        <div className="p-6 border-t border-stone-800 bg-stone-950/30">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-brand-800 border border-brand-600 flex items-center justify-center text-brand-100 font-serif text-lg uppercase">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-sans tracking-wide text-white truncate">{user?.name}</span>
              <span className="text-[10px] uppercase tracking-widest text-brand-400 truncate">{user?.role}</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-widest text-stone-400 hover:bg-red-900/30 hover:text-red-400 rounded-xl transition-all border border-transparent hover:border-red-900/50"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-stone-900 z-50 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${
        isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      }`}>
        <div className="h-20 flex items-center justify-between px-6 border-b border-stone-800">
          <span className="text-2xl font-serif text-brand-300 tracking-wider uppercase">Orniva.</span>
          <button onClick={closeMobileMenu} className="text-stone-400 hover:text-white p-1">
            <CloseIcon size={24} />
          </button>
        </div>
        <nav className="flex-1 py-6 flex flex-col gap-1 px-4 overflow-y-auto">
          {links.map((link) => {
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl uppercase tracking-widest text-xs transition-all ${
                  isActive ? 'bg-brand-600 text-white shadow-lg' : 'text-stone-400 hover:bg-stone-800 hover:text-white'
                }`}
              >
                {link.icon}
                {link.name}
              </Link>
            )
          })}
        </nav>
        <div className="p-6 border-t border-stone-800 bg-stone-950/30">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-brand-800 border border-brand-600 text-brand-100 flex items-center justify-center font-serif text-xl uppercase">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex flex-col">
              <span className="text-sm tracking-wide text-white uppercase">{user?.name}</span>
              <span className="text-[10px] text-brand-400 uppercase tracking-widest">{user?.role}</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-4 text-xs font-bold uppercase tracking-widest text-red-400 bg-red-900/20 hover:bg-red-900/40 rounded-xl transition-all border border-red-900/30"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Panel */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile Header */}
        <header className="h-20 bg-stone-900 border-b border-stone-800 flex items-center justify-between px-6 md:hidden shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleMobileMenu}
              className="p-2 text-stone-400 hover:text-white transition-colors"
            >
              <Menu size={24} />
            </button>
            <span className="text-xl font-serif text-brand-300 tracking-wider uppercase">Orniva.</span>
          </div>
          <div className="w-10 h-10 rounded-full border border-brand-600 bg-brand-800 flex items-center justify-center text-brand-100 font-serif text-lg">
            {user?.name?.charAt(0)}
          </div>
        </header>

        {/* Dynamic Inner Outlet */}
        <div className="flex-1 overflow-auto p-4 md:p-8 relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
