import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { login } from '../../services/authService';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Layers } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await login({ email, password });
      
      setAuth(response.data, response.data.token);
      toast.success('Authentication Successful');
      
      if (response.data.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-stone-50">
      {/* Left Side - Hero Image */}
      <div className="hidden lg:flex w-1/2 relative bg-stone-900">
        <div className="absolute inset-0 bg-stone-900/20 z-10"></div>
        <img 
          src="/images/orniva_interior_bg.png" 
          alt="Orniva Design Studio Interior" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute bottom-12 left-12 z-20 text-white">
          <h2 className="font-serif text-5xl font-medium tracking-wide mb-4">Curating Space.<br/>Defining Elegance.</h2>
          <p className="font-sans text-stone-200 tracking-wider text-sm uppercase">Exclusive Client Portal</p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16">
        <div className="w-full max-w-md">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-stone-900 flex items-center justify-center">
                <Layers className="text-brand-300" size={24} />
              </div>
              <span className="font-serif text-2xl font-semibold tracking-wider text-stone-900 uppercase">Orniva</span>
            </div>
            
            <h1 className="text-4xl font-serif text-stone-900 mb-3 tracking-tight">Welcome Back</h1>
            <p className="text-stone-500 font-sans tracking-wide">Enter your credentials to access your design milestones.</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="client@example.com" 
                required 
                className="w-full bg-white border-b-2 border-stone-200 px-4 py-4 focus:outline-none focus:border-stone-900 transition-colors placeholder:text-stone-300 font-sans"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••" 
                required 
                className="w-full bg-white border-b-2 border-stone-200 px-4 py-4 focus:outline-none focus:border-stone-900 transition-colors placeholder:text-stone-300 font-sans"
              />
            </div>
            
            <div className="pt-6">
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-stone-900 hover:bg-stone-800 text-white font-sans uppercase tracking-widest text-sm py-5 transition-colors flex justify-center items-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : 'Sign In'}
              </button>
            </div>
          </form>

          <p className="mt-12 text-center text-xs text-stone-400 font-sans tracking-widest uppercase">
            © {new Date().getFullYear()} Orniva Design Studio. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
