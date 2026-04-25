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
      
      // Store into Zustand & localStorage
      setAuth(response.data, response.data.token);
      toast.success('Successfully logged in!');
      
      if (response.data.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-sm">
            <Layers className="text-white" size={24} />
          </div>
          <h1 className="text-3xl font-bold font-sans text-gray-900 tracking-tight">Client Portal</h1>
          <p className="text-gray-500 mt-2">Sign in to manage your spaces</p>
        </div>
        
        <Card className="p-6 md:p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <Input 
              label="Email Address" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="you@example.com" 
              required 
            />
            <Input 
              label="Password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••" 
              required 
            />
            
            <div className="pt-2">
              <Button type="submit" className="w-full py-2.5" isLoading={isLoading}>
                Sign In
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
