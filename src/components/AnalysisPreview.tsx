import React, { useRef, useState, useEffect } from 'react';
import { 
  Target, 
  Flag, 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  Lightbulb,
  LayoutList,
  Info,
  Video,
  Sparkles,
  BookOpen,
  PlayCircle,
  PauseCircle
} from 'lucide-react';
import { VideoAnalysis } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface AnalysisPreviewProps {
  analysis: VideoAnalysis;
  videoUrl?: string;
}

export const AnalysisPreview: React.FC<AnalysisPreviewProps> = ({ analysis, videoUrl }) => {
  const { language } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeSegment, setActiveSegment] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || activeSegment === null) return;

    const segment = analysis.timeline[activeSegment];
    
    const handleTimeUpdate = () => {
      if (video.currentTime >= segment.endTime) {
        video.pause();
        setIsPlaying(false);
        setActiveSegment(null);
        video.removeEventListener('timeupdate', handleTimeUpdate);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [activeSegment, analysis.timeline]);

  const playSegment = (index: number) => {
    const video = videoRef.current;
    if (!video) return;

    const segment = analysis.timeline[index];
    video.currentTime = segment.startTime;
    video.play();
    setActiveSegment(index);
    setIsPlaying(true);
  };

  return (
    <div className="analysis-right">
      {/* Video Player Section */}
      {videoUrl && (
        <div className="video-preview-panel">
          <div className="video-preview-frame">
            <video 
              ref={videoRef}
              src={videoUrl} 
              controls
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            {!isPlaying && activeSegment === null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20">
                  <PlayCircle size={48} />
                </div>
              </div>
            )}
          </div>
          <div className="p-4 flex items-center justify-between bg-slate-900/50 backdrop-blur-sm border-t border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(91,108,255,0.8)]" />
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Live Analysis Player</span>
            </div>
            {activeSegment !== null && (
              <div className="flex items-center gap-2 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">
                  Playing: {analysis.timeline[activeSegment].label}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-primary">{analysis.video_title}</h2>
          <div className="flex items-center gap-2 text-sm text-secondary">
            <Clock size={14} />
            <span>{language === 'vi' ? `Thời lượng ước tính: ${analysis.duration_estimate}` : `Estimated duration: ${analysis.duration_estimate}`}</span>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <OverviewCard 
            icon={<Target size={20} />} 
            title={language === 'vi' ? "Chủ đề chính" : "Main Topic"} 
            value={analysis.overview.main_topic}
            color="indigo"
          />
          <OverviewCard 
            icon={<Flag size={20} />} 
            title={language === 'vi' ? "Mục tiêu" : "Content Goal"} 
            value={analysis.overview.content_goal}
            color="emerald"
          />
          <OverviewCard 
            icon={<Users size={20} />} 
            title={language === 'vi' ? "Khán giả" : "Target Audience"} 
            value={analysis.overview.target_audience}
            color="amber"
          />
        </div>

        {/* Theoretical Anchor */}
        <div className="panel-elevated p-6">
          <h3 className="text-sm font-semibold text-indigo-400 mb-3 flex items-center gap-2">
            <BookOpen size={18} />
            {language === 'vi' ? 'Nền tảng lý thuyết (Theoretical Anchor)' : 'Theoretical Anchor'}
          </h3>
          <p className="text-secondary leading-relaxed italic border-l-4 border-indigo-500/30 pl-4 text-sm">
            {analysis.overview.theoretical_anchor}
          </p>
        </div>

        {/* Bullet Summary */}
        <div className="panel p-6">
          <h3 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2">
            <Info size={18} className="text-muted" />
            {language === 'vi' ? 'Tóm tắt nội dung' : 'Content Summary'}
          </h3>
          <ul className="space-y-2">
            {(analysis.overview?.bullet_summary || []).map((item, i) => (
              <li key={i} className="flex gap-3 text-sm text-secondary">
                <span className="text-muted font-mono">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Timeline Table */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
            <LayoutList size={18} className="text-muted" />
            {language === 'vi' ? 'Phân tích Timeline' : 'Timeline Analysis'}
          </h3>
          <div className="overflow-hidden rounded-2xl border border-white/5 bg-slate-900/50 shadow-xl">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/5">
                    <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">{language === 'vi' ? 'Thời gian' : 'Time'}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">{language === 'vi' ? 'Phân loại' : 'Label'}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">{language === 'vi' ? 'Diễn biến' : 'What Happens'}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">{language === 'vi' ? 'Mục đích' : 'Intent'}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">{language === 'vi' ? 'Hành vi' : 'Psychology'}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(analysis.timeline || []).map((segment, i) => (
                    <tr key={i} className={`hover:bg-white/5 transition-colors ${activeSegment === i ? 'bg-indigo-500/10' : ''}`}>
                      <td className="px-4 py-4 text-xs font-mono text-muted whitespace-nowrap">
                        {segment.start} – {segment.end}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                          segment.label.toLowerCase().includes('hook') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          segment.label.toLowerCase().includes('cta') ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                          segment.label.toLowerCase().includes('social') ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-white/5 text-secondary border border-white/10'
                        }`}>
                          {segment.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-secondary min-w-[200px]">
                        {segment.what_happens}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {segment.intent}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-secondary italic">
                        {segment.viewer_psychology}
                      </td>
                      <td className="px-4 py-4">
                        <button 
                          onClick={() => playSegment(i)}
                          className={`flex items-center gap-1.5 py-1.5 px-3 rounded-md transition-all text-xs font-medium whitespace-nowrap ${
                            activeSegment === i 
                              ? 'bg-indigo-600 text-white shadow-glow' 
                              : 'bg-white/5 text-muted hover:bg-indigo-500/20 hover:text-indigo-400'
                          }`}
                        >
                          {activeSegment === i && isPlaying ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
                          {activeSegment === i && isPlaying ? 'Playing' : 'Play clip'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Distribution Logic & Save Motivation */}
        <div className="panel-elevated p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Sparkles size={120} />
          </div>
          <div className="relative z-10">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 mb-4">{language === 'vi' ? 'Chiến lược Viral & Động lực Lưu (Utility Value)' : 'Viral Strategy & Utility Value'}</h3>
            <p className="text-lg font-medium leading-relaxed italic text-primary">
              "{analysis.distribution_logic}"
            </p>
          </div>
        </div>

        {/* Insights Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <InsightBlock 
            title={language === 'vi' ? "Ưu điểm" : "Strengths"} 
            items={analysis.strengths} 
            icon={<CheckCircle size={18} />} 
            color="emerald" 
          />
          <InsightBlock 
            title={language === 'vi' ? "Vấn đề" : "Issues"} 
            items={analysis.issues} 
            icon={<AlertTriangle size={18} />} 
            color="rose" 
          />
          <InsightBlock 
            title={language === 'vi' ? "Framework nhân bản" : "Recommendations"} 
            items={analysis.recommendations} 
            icon={<Lightbulb size={18} />} 
            color="violet" 
          />
        </div>
      </div>
    </div>
  );
};

const OverviewCard = ({ icon, title, value, color }: { icon: React.ReactNode, title: string, value: string, color: string }) => {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };

  return (
    <div className={`p-4 rounded-2xl border ${colors[color]} flex items-start gap-3 shadow-lg`}>
      <div className="shrink-0 mt-1">{icon}</div>
      <div>
        <p className="text-xs font-medium opacity-70 uppercase tracking-wider">{title}</p>
        <p className="text-sm font-bold mt-0.5">{value}</p>
      </div>
    </div>
  );
};

const InsightBlock = ({ title, items, icon, color }: { title: string, items: string[], icon: React.ReactNode, color: string }) => {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  };

  return (
    <div className={`p-6 rounded-2xl border ${colors[color]} space-y-4 shadow-lg`}>
      <h3 className="text-sm font-bold flex items-center gap-2">
        {icon}
        {title}
      </h3>
      <ul className="space-y-3">
        {(items || []).map((item, i) => (
          <li key={i} className="text-sm leading-relaxed flex gap-2">
            <span className="opacity-40 shrink-0">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

const Clock = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
