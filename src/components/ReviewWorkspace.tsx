import React, { useRef, useState } from "react";
import { ArrowLeft, Target, Flag, Users, CheckCircle, AlertTriangle, Lightbulb, LayoutList, BookOpen, Sparkles, PlayCircle, FileText } from "lucide-react";
import { VideoAnalysis } from "../types";
import { useLanguage } from "../contexts/LanguageContext";
import { ClipReferenceBlock } from "./ClipReferenceBlock";

interface ReviewWorkspaceProps {
  videoUrl: string;
  analysis: VideoAnalysis;
  onBack: () => void;
  onWriteScript: () => void;
}

export function ReviewWorkspace({ videoUrl, analysis, onBack, onWriteScript }: ReviewWorkspaceProps) {
  const { language } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSegment, setActiveSegment] = useState<number | null>(null);

  // Set up listener for auto-pause at segment end
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || activeSegment === null) return;

    const segment = analysis?.timeline?.[activeSegment];
    if (!segment) return;
    
    const handleTimeUpdate = () => {
      // Small buffer (0.1s) to ensure we hit the end time
      if (video.currentTime >= segment.endTime - 0.1) {
        video.pause();
        setIsPlaying(false);
        setActiveSegment(null);
        video.removeEventListener('timeupdate', handleTimeUpdate);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [activeSegment, analysis]);

  const handleSeek = (start: number, end: number, index: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = start;
    video.play();
    setIsPlaying(true);
    setActiveSegment(index);
    
    // Scroll the video player into view on mobile
    if (window.innerWidth < 768) {
      video.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="review-workspace">
      <div className="review-workspace-topbar flex items-center justify-between">
        <button 
          className="back-button flex items-center gap-2 hover:bg-white/10 transition-colors" 
          onClick={onBack}
          type="button"
        >
          <ArrowLeft size={16} />
          {language === 'vi' ? 'Quay lại Phân tích' : 'Back to Analysis'}
        </button>

        <button 
          className="btn btn-primary px-6 py-2 shadow-glow" 
          onClick={onWriteScript}
          type="button"
        >
          <FileText size={16} />
          {language === 'vi' ? 'Viết kịch bản ngay' : 'Write Script Now'}
        </button>
      </div>

      <div className="review-grid">
        <aside className="review-left">
          <div className="video-preview-panel sticky top-24">
            <div className="video-preview-frame">
              <video 
                ref={videoRef}
                src={videoUrl} 
                controls
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="w-full h-full object-contain"
              />
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20">
                    <PlayCircle size={48} />
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 flex items-center justify-between bg-slate-900/50 backdrop-blur-sm border-t border-white/5">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(91,108,255,0.8)]' : 'bg-slate-500'}`} />
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
                  {isPlaying ? 'Live Analysis Player' : 'Player Ready'}
                </span>
              </div>
              {activeSegment !== null && (
                <div className="flex items-center gap-2 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter truncate max-w-[150px]">
                    Playing: {analysis.timeline[activeSegment].label}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 space-y-4">
            <div className="panel p-5">
              <h4 className="text-xs font-bold text-muted uppercase tracking-widest mb-3">{language === 'vi' ? 'Thông tin video' : 'Video Information'}</h4>
              <h2 className="text-lg font-bold text-primary leading-tight">{analysis.video_title}</h2>
              <p className="text-xs text-secondary mt-2">
                {language === 'vi' ? `Thời lượng ước tính: ${analysis.duration_estimate}` : `Estimated duration: ${analysis.duration_estimate}`}
              </p>
            </div>
          </div>
        </aside>

        <section className="review-right">
          {/* Overview Section */}
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

          <div className="panel-elevated p-6">
            <h3 className="text-sm font-semibold text-indigo-400 mb-3 flex items-center gap-2">
              <BookOpen size={18} />
              {language === 'vi' ? 'Nền tảng lý thuyết (Theoretical Anchor)' : 'Theoretical Anchor'}
            </h3>
            <p className="text-secondary leading-relaxed italic border-l-4 border-indigo-500/30 pl-4 text-sm">
              {analysis.overview.theoretical_anchor}
            </p>
          </div>

          {/* Timeline Section */}
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-primary flex items-center gap-2 uppercase tracking-widest">
              <LayoutList size={18} className="text-muted" />
              {language === 'vi' ? 'Phân tích Timeline' : 'Timeline Analysis'}
            </h3>
            
            <div className="grid grid-cols-1 gap-6">
              {(analysis.timeline || []).map((segment, i) => (
                <ClipReferenceBlock
                  key={i}
                  start={segment.startTime}
                  end={segment.endTime}
                  label={segment.label}
                  note={segment.what_happens}
                  thumbnail={segment.snapshotUrl}
                  isActive={activeSegment === i}
                  onSeek={(start, end) => handleSeek(start, end, i)}
                />
              ))}
            </div>
          </div>

          {/* Distribution Section */}
          <div className="panel-elevated p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Sparkles size={120} />
            </div>
            <div className="relative z-10">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 mb-4">{language === 'vi' ? 'Chiến lược Viral & Động lực Lưu' : 'Viral Strategy & Utility Value'}</h3>
              <p className="text-lg font-medium leading-relaxed italic text-primary">
                "{analysis.distribution_logic}"
              </p>
            </div>
          </div>

          {/* Insights Section */}
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
        </section>
      </div>
    </div>
  );
}

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
