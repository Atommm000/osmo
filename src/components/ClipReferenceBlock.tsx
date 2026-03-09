import React from "react";
import { Play, Clock } from "lucide-react";

interface ClipReferenceBlockProps {
  start: number;
  end: number;
  label: string;
  note?: string;
  thumbnail?: string;
  onSeek: (start: number, end: number) => void;
  isActive?: boolean;
}

export function ClipReferenceBlock({
  start,
  end,
  label,
  note,
  thumbnail,
  onSeek,
  isActive = false,
}: ClipReferenceBlockProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className={`clip-reference ${isActive ? 'ring-2 ring-indigo-500 bg-indigo-500/5' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-bold text-primary">{label}</div>
          <div 
            className="flex items-center gap-1.5 text-[11px] text-muted font-mono mt-1 cursor-pointer hover:text-indigo-400 transition-colors"
            onClick={() => onSeek(start, end)}
          >
            <Clock size={12} />
            {formatTime(start)} – {formatTime(end)}
          </div>
        </div>

        <button 
          className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'} py-1.5 px-4 text-xs`}
          onClick={() => onSeek(start, end)}
          type="button"
        >
          <Play size={14} />
          {isActive ? 'Playing' : 'Play clip'}
        </button>
      </div>

      <div 
        className="clip-preview group cursor-pointer border border-white/10 rounded-xl overflow-hidden relative" 
        onClick={() => onSeek(start, end)}
      >
        {thumbnail ? (
          <img 
            className="w-full h-32 object-cover transition-transform group-hover:scale-105" 
            src={thumbnail} 
            alt={label} 
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-32 bg-slate-800 flex items-center justify-center">
            <Play size={24} className="text-muted" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
          <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
            <Play size={20} fill="currentColor" />
          </div>
        </div>
      </div>

      {note && <p className="text-xs text-secondary leading-relaxed italic mt-3 border-l-2 border-indigo-500/30 pl-3">{note}</p>}
    </div>
  );
}
