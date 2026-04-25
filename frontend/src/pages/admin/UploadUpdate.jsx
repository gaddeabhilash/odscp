import { useState, useRef, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { UploadCloud, Image as ImageIcon, X, FileVideo } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useNavigate, useLocation } from 'react-router-dom';

export default function UploadUpdate() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const pid = params.get('projectId');
    if (pid) setProjectId(pid);

    const fetchProjects = async () => {
      try {
        const res = await api.get('/projects');
        setProjects(res.data.data || []);
      } catch (err) {
        toast.error('Failed to load target projects');
      }
    };
    fetchProjects();
  }, [location.search]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) return;
    
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error('Invalid format. Use JPG, PNG, or MP4.');
      return;
    }

    if (selectedFile.size > 100 * 1024 * 1024) {
      toast.error('File size exceeds 100MB limit.');
      return;
    }

    setFile(selectedFile);
    
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview({ url: objectUrl, type: selectedFile.type });
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!projectId) return toast.error('Please assign a project stream');
    if (!title) return toast.error('Title constraint required');

    const formData = new FormData();
    formData.append('projectId', projectId);
    formData.append('title', title);
    if (description) formData.append('description', description);
    if (file) formData.append('media', file);

    setIsUploading(true);

    try {
      await api.post('/updates', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Media successfully executed pipeline!');
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Deployment execution failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-4 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Deploy Media Block</h1>
        <p className="text-gray-500 mt-2">Package visual updates directly into client chronologies automatically handling Cloudinary transformations.</p>
      </div>

      <Card className="p-6 md:p-10 border-0 shadow-lg bg-white/70 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700 tracking-wide uppercase">Target Feed <span className="text-red-500">*</span></label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              required
              className="px-4 py-3.5 border-2 border-gray-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 bg-gray-50/50 uppercase text-sm font-bold text-gray-800 transition-all"
            >
              <option value="" disabled>-- Bind Pipeline Tracker --</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.projectName}</option>
              ))}
            </select>
          </div>

          <Input 
            label="SUBJECT LINE *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="E.g., Structural mapping finalized"
            required
            className="font-semibold uppercase tracking-wide"
          />

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700 tracking-wide uppercase">Supporting Context</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What specifically changed? Internal notes..."
              rows={4}
              className="px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 bg-gray-50/50 resize-none transition-all leading-relaxed"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700 tracking-wide uppercase">Visual Artifacts</label>
            
            {!preview ? (
              <div 
                className={`w-full border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isDragging ? 'border-indigo-500 bg-indigo-50 scale-[1.02]' : 'border-gray-200 bg-gray-50/50 hover:bg-gray-100 hover:border-gray-300'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileSelect}
                  accept="image/*,video/mp4,video/quicktime"
                />
                <div className="bg-white p-5 rounded-full shadow-sm border border-gray-100 mb-5 relative group-hover:scale-110 transition-transform">
                  <UploadCloud size={32} className="text-indigo-600" />
                </div>
                <p className="font-bold text-gray-900 text-lg">Click or drag media here</p>
                <p className="text-sm text-gray-500 mt-2 max-w-sm text-center leading-relaxed">
                  Engine handles auto-transcoding metrics mapping for video and imagery blobs up to 100MB limit.
                </p>
              </div>
            ) : (
              <div className="relative rounded-3xl overflow-hidden bg-gray-900 flex flex-col items-center justify-center shadow-inner group">
                {preview.type.startsWith('video') ? (
                  <video src={preview.url} controls className="max-h-[500px] w-full bg-black" />
                ) : (
                  <img src={preview.url} alt="Preview" className="max-h-[500px] w-full object-contain" />
                )}
                
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    type="button" 
                    onClick={clearFile}
                    className="bg-black/60 hover:bg-black text-white p-2.5 rounded-full backdrop-blur-md transition-all border border-white/10 shadow-xl"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-xl text-sm font-semibold tracking-wide flex items-center gap-2 border border-white/10">
                  {preview.type.startsWith('video') ? <FileVideo size={18} className="text-indigo-400" /> : <ImageIcon size={18} className="text-emerald-400" />}
                  {file.name}
                </div>
              </div>
            )}
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={() => navigate('/admin/dashboard')} className="w-full sm:w-auto font-bold uppercase tracking-wide">
              Abort Sequence
            </Button>
            <Button type="submit" isLoading={isUploading} className="w-full sm:w-auto px-8 py-3 flex items-center gap-2 font-bold uppercase tracking-wide rounded-xl">
              <UploadCloud size={20} />
              Execute Pipeline Upload
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
