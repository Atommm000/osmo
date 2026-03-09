import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Video, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { VideoUpload } from './VideoUpload';
import { VideoAnalysis, QueuedVideo } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface AnalysisSetupProps {
  onAnalysisComplete: (result: VideoAnalysis, videoUrl: string, filename?: string) => void;
  videos: QueuedVideo[];
  setVideos: React.Dispatch<React.SetStateAction<QueuedVideo[]>>;
}

export function AnalysisSetup({ onAnalysisComplete, videos, setVideos }: AnalysisSetupProps) {
  const { language, t } = useLanguage();
  const [selectedVideoId, setSelectedVideoId] = useState<string | undefined>();
  const [analysisLanguage, setAnalysisLanguage] = useState('Vietnamese');

  const processVideo = async (file: File) => {
    const MAX_SIZE = 20 * 1024 * 1024;
    
    const tempId = Math.random().toString(36).substring(7);
    const videoUrl = URL.createObjectURL(file);

    if (file.size > MAX_SIZE) {
      setVideos(prev => [{
        id: tempId,
        name: file.name,
        status: 'error',
        videoUrl,
        error: language === 'vi' ? "Video quá lớn (tối đa 20MB). Vui lòng nén video hoặc sử dụng clip ngắn hơn." : "Video too large (max 20MB). Please compress or use a shorter clip."
      }, ...prev]);
      return;
    }

    const newVideo: QueuedVideo = {
      id: tempId,
      name: file.name,
      status: 'processing',
      videoUrl
    };
    
    setVideos(prev => [newVideo, ...prev]);
    setSelectedVideoId(tempId);

    const formData = new FormData();
    formData.append('video', file);
    formData.append('language', analysisLanguage);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        if (contentType && contentType.includes('application/json')) {
          const err = await response.json();
          throw new Error(err.error || 'Analysis failed');
        } else {
          await response.text();
          throw new Error(`Server error (${response.status}). Vui lòng thử lại sau.`);
        }
      }

      const data = await response.json();
      setVideos(prev => prev.map(v => v.id === tempId ? { 
        ...v, 
        id: data.id, 
        status: 'completed', 
        result: data.analysis,
        filename: data.filename
      } : v));
      
      // Automatically navigate to review workspace with persistent filename
      onAnalysisComplete(data.analysis, videoUrl, data.filename);
    } catch (error) {
      console.error("Analysis failed:", error);
      setVideos(prev => prev.map(v => v.id === tempId ? { 
        ...v, 
        status: 'error', 
        error: (error as Error).message 
      } : v));
    }
  };

  const handleUpload = (files: File[]) => {
    files.forEach(processVideo);
  };

  const selectedVideo = videos.find(v => v.id === selectedVideoId);

  return (
    <div className="analysis-layout max-w-7xl mx-auto">
      <div className="space-y-8">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={14} />
              {language === 'vi' ? 'Tải lên' : 'Upload'}
            </h2>
            <div className="flex items-center gap-2 bg-white/5 rounded-full px-3 py-1 border border-white/5">
              <span className="text-[10px] font-bold text-muted uppercase tracking-tighter">
                {language === 'vi' ? 'Ngôn ngữ phân tích:' : 'Analysis Language:'}
              </span>
              <select 
                value={analysisLanguage}
                onChange={(e) => setAnalysisLanguage(e.target.value)}
                className="bg-transparent text-[10px] font-medium focus:outline-none cursor-pointer text-primary"
              >
                <option value="Vietnamese">{t.vietnamese}</option>
                <option value="English">{t.english}</option>
              </select>
            </div>
          </div>
          <VideoUpload onUpload={handleUpload} />
          <p className="text-[10px] text-muted italic text-center">{language === 'vi' ? 'Tối đa 20MB mỗi video.' : 'Max 20MB per video.'}</p>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted uppercase tracking-wider">{language === 'vi' ? 'Hoặc nhập link Google Drive' : 'Or enter Google Drive link'}</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder={language === 'vi' ? "Dán link folder hoặc video..." : "Paste folder or video link..."}
                className="flex-1"
              />
              <button className="btn btn-primary text-xs">
                {language === 'vi' ? 'Thêm' : 'Add'}
              </button>
            </div>
            <p className="text-[10px] text-muted italic">{language === 'vi' ? 'Lưu ý: Video cần để chế độ công khai hoặc chia sẻ quyền truy cập.' : 'Note: Video must be public or shared.'}</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">{language === 'vi' ? 'Danh sách xử lý' : 'Processing Queue'}</h2>
          <div className="space-y-2 max-h-[calc(100vh-500px)] overflow-y-auto pr-2 custom-scrollbar">
            {videos.length === 0 && (
              <p className="text-xs text-muted italic">{language === 'vi' ? 'Chưa có video nào được tải lên.' : 'No videos uploaded yet.'}</p>
            )}
            {videos.map((v) => (
              <button
                key={v.id}
                onClick={() => {
                  setSelectedVideoId(v.id);
                  if (v.status === 'completed' && v.result) {
                    onAnalysisComplete(v.result, v.videoUrl || '', v.filename);
                  }
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  selectedVideoId === v.id 
                    ? 'bg-indigo-500/10 border-indigo-500/30 shadow-glow' 
                    : 'bg-white/5 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold truncate max-w-[150px] text-primary">{v.name}</span>
                  {v.status === 'processing' && <Loader2 size={12} className="animate-spin text-indigo-500" />}
                  {v.status === 'completed' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                  {v.status === 'error' && <AlertCircle size={12} className="text-rose-500" />}
                </div>
                <p className="text-[10px] text-muted uppercase tracking-tighter">
                  {v.status === 'processing' ? t.analyzing : v.status === 'completed' ? (language === 'vi' ? 'Hoàn tất' : 'Completed') : v.status === 'error' ? (language === 'vi' ? 'Lỗi' : 'Error') : (language === 'vi' ? 'Chờ xử lý' : 'Pending')}
                </p>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="min-w-0">
        <AnimatePresence mode="wait">
          {!selectedVideo ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12 panel empty-state"
            >
              <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-muted mb-6 border border-white/5 shadow-xl">
                <Video size={40} />
              </div>
              <h3 className="text-xl font-bold text-primary">{language === 'vi' ? 'Chưa chọn video' : 'No video selected'}</h3>
              <p className="text-secondary max-w-xs mt-3 leading-relaxed">{language === 'vi' ? 'Tải video lên hoặc chọn từ danh sách bên trái để xem bản phân tích chi tiết.' : 'Upload a video or select from the list to view detailed analysis.'}</p>
            </motion.div>
          ) : selectedVideo.status === 'processing' ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12 panel"
            >
              <Loader2 size={48} className="text-indigo-500 animate-spin mb-6" />
              <h3 className="text-xl font-bold text-primary">{t.analyzing}</h3>
              <p className="text-secondary max-w-xs mt-3 leading-relaxed">{language === 'vi' ? 'Gemini AI đang xem và đánh giá từng giây trong video của bạn. Quá trình này có thể mất 1-2 phút.' : 'Gemini AI is watching and evaluating every second of your video. This may take 1-2 minutes.'}</p>
            </motion.div>
          ) : selectedVideo.status === 'error' ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12 panel border-rose-500/20"
            >
              <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center text-rose-500 mb-6 border border-rose-500/20 shadow-xl">
                <AlertCircle size={40} />
              </div>
              <h3 className="text-xl font-bold text-primary">{language === 'vi' ? 'Lỗi phân tích' : 'Analysis Error'}</h3>
              <p className="text-rose-400 max-w-xs mt-3 leading-relaxed">{selectedVideo.error}</p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
