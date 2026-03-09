import React from 'react';
import { CheckCircle2, CircleDashed, AlertCircle, FileVideo, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QueuedVideo } from '../types';

interface VideoQueueProps {
  videos: QueuedVideo[];
  onSelect: (video: QueuedVideo) => void;
  selectedId?: string;
}

export const VideoQueue: React.FC<VideoQueueProps> = ({ videos, onSelect, selectedId }) => {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
        <Clock size={14} />
        Danh sách xử lý
      </h3>
      <AnimatePresence initial={false}>
        {videos.length === 0 ? (
          <p className="text-sm text-slate-400 italic py-4 text-center">Chưa có video nào</p>
        ) : (
          videos.map((video) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => onSelect(video)}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                selectedId === video.id
                  ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200'
                  : 'bg-white border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                video.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                video.status === 'error' ? 'bg-rose-50 text-rose-600' :
                'bg-slate-50 text-slate-400'
              }`}>
                <FileVideo size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{video.file.name}</p>
                <p className="text-xs text-slate-500 capitalize">{video.status}</p>
              </div>
              <div className="shrink-0">
                {video.status === 'processing' && (
                  <CircleDashed size={18} className="text-indigo-500 animate-spin" />
                )}
                {video.status === 'completed' && (
                  <CheckCircle2 size={18} className="text-emerald-500" />
                )}
                {video.status === 'error' && (
                  <AlertCircle size={18} className="text-rose-500" />
                )}
              </div>
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </div>
  );
};
