import React, { useState, useCallback } from 'react';
import { Upload } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useLanguage } from '../contexts/LanguageContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface VideoUploadProps {
  onUpload: (files: File[]) => void;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({ onUpload }) => {
  const { language } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('video/'));
    if (files.length > 0) {
      onUpload(files);
    }
  }, [onUpload]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(f => f.type.startsWith('video/'));
      if (files.length > 0) {
        onUpload(files);
      }
    }
  }, [onUpload]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative border-2 border-dashed rounded-3xl p-10 transition-all duration-300 flex flex-col items-center justify-center gap-4 cursor-pointer group",
        isDragging 
          ? "border-indigo-500 bg-indigo-500/10 shadow-[0_0_30px_rgba(99,102,241,0.15)]" 
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]"
      )}
    >
      <input
        type="file"
        multiple
        accept="video/*"
        onChange={handleFileChange}
        className="absolute inset-0 opacity-0 cursor-pointer z-10"
      />
      <div className={cn(
        "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300",
        isDragging ? "bg-indigo-500 text-white scale-110" : "bg-white/5 text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/20"
      )}>
        <Upload size={28} />
      </div>
      <div className="text-center space-y-1">
        <p className="text-base font-bold text-primary">
          {language === 'vi' ? 'Kéo thả video vào đây' : 'Drag and drop video here'}
        </p>
        <p className="text-sm text-secondary">
          {language === 'vi' ? 'Hoặc click để chọn file' : 'Or click to browse files'}
        </p>
      </div>
    </div>
  );
};
