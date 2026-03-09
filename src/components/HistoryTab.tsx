import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { History, Calendar, FileText, Video, Loader2, Trash2, Edit2, Check, X } from 'lucide-react';
import { HistoryItem } from '../types';
import { AnalysisPreview } from './AnalysisPreview';
import { useLanguage } from '../contexts/LanguageContext';
import { SearchInput } from './SearchInput';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface HistoryTabProps {
  history: HistoryItem[];
  isLoading: boolean;
  onSelectForScript: (item: HistoryItem) => void;
  onRestoreAnalysis: (item: HistoryItem) => void;
  onRefresh: () => Promise<void>;
}

export function HistoryTab({ history, isLoading, onSelectForScript, onRestoreAnalysis, onRefresh }: HistoryTabProps) {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm(language === 'vi' ? "Bạn có chắc chắn muốn xóa video này khỏi lịch sử?" : "Are you sure you want to delete this video from history?")) return;

    try {
      const { error } = await supabase.from('analyses').delete().eq('id', id);
      if (!error) {
        await onRefresh();
        if (selectedItem?.id === id) setSelectedItem(null);
      } else {
        alert(`Lỗi khi xóa: ${error.message || 'Không xác định'}`);
      }
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Không thể kết nối tới máy chủ để xóa.");
    }
  };

  const startRename = (e: React.MouseEvent, item: HistoryItem) => {
    e.stopPropagation();
    setEditingId(item.id);
    setEditName(item.name);
  };

  const handleRename = async (e: React.FormEvent | React.MouseEvent | React.KeyboardEvent, id: string) => {
    if (e.type === 'click') (e as React.MouseEvent).stopPropagation();
    
    try {
      const { error } = await supabase
        .from('analyses')
        .update({ video_title: editName })
        .eq('id', id);
        
      if (!error) {
        await onRefresh();
        if (selectedItem?.id === id) setSelectedItem(prev => prev ? { ...prev, name: editName } : null);
        setEditingId(null);
      } else {
        console.error("Rename failed:", error);
      }
    } catch (err) {
      console.error("Rename failed:", err);
    }
  };

  const filteredHistory = history.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="analysis-layout max-w-7xl mx-auto">
      <div className="space-y-6">
        <SearchInput
          placeholder={t.searchVideo}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-2 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted">
              <Loader2 size={32} className="animate-spin mb-4" />
              <p className="text-sm">{language === 'vi' ? 'Đang tải lịch sử...' : 'Loading history...'}</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-12 panel empty-state">
              <History size={32} className="mx-auto text-muted mb-4 opacity-20" />
              <p className="text-sm text-muted">{t.noVideoFound}</p>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div key={item.id} className="relative group">
                <div
                  onClick={() => setSelectedItem(item)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedItem?.id === item.id 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-glow' 
                      : 'bg-white/5 border-white/5 hover:border-white/10 text-primary'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className={`p-2 rounded-lg ${selectedItem?.id === item.id ? 'bg-white/20' : 'bg-white/5'}`}>
                      <Video size={16} className={selectedItem?.id === item.id ? 'text-white' : 'text-indigo-400'} />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${selectedItem?.id === item.id ? 'text-white/60' : 'text-muted'}`}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {editingId === item.id ? (
                    <div className="flex items-center gap-1 mb-1" onClick={e => e.stopPropagation()}>
                      <input
                        autoFocus
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleRename(e, item.id)}
                        className="flex-1 text-sm bg-black/20 border-white/10"
                      />
                      <button 
                        onClick={e => handleRename(e, item.id)} 
                        className={`p-1 rounded transition-colors ${selectedItem?.id === item.id ? 'hover:bg-white/20 text-emerald-300' : 'hover:bg-white/5 text-emerald-500'}`}
                      >
                        <Check size={14} />
                      </button>
                      <button 
                        onClick={e => { e.stopPropagation(); setEditingId(null); }} 
                        className={`p-1 rounded transition-colors ${selectedItem?.id === item.id ? 'hover:bg-white/20 text-rose-300' : 'hover:bg-white/5 text-rose-500'}`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <h4 className="text-sm font-bold truncate mb-1 pr-12">{item.name}</h4>
                  )}

                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-medium ${selectedItem?.id === item.id ? 'text-white/80' : 'text-secondary'}`}>
                      {item.analysis.timeline?.length || 0} segments
                    </span>
                    {item.script && (
                      <span className={`flex items-center gap-1 text-[10px] font-bold ${selectedItem?.id === item.id ? 'text-emerald-300' : 'text-emerald-500'}`}>
                        <FileText size={10} />
                        Script
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Actions Overlay */}
                <div className={`absolute top-4 right-4 flex items-center gap-1 transition-opacity ${
                  selectedItem?.id === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}>
                  <button 
                    onClick={(e) => startRename(e, item)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      selectedItem?.id === item.id ? 'hover:bg-white/20 text-white/70' : 'hover:bg-white/5 text-muted'
                    }`}
                    title={language === 'vi' ? "Đổi tên" : "Rename"}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={(e) => handleDelete(e, item.id)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      selectedItem?.id === item.id ? 'hover:bg-rose-500 text-white/70' : 'hover:bg-rose-500/10 text-rose-500'
                    }`}
                    title={language === 'vi' ? "Xóa" : "Delete"}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="min-w-0">
        <AnimatePresence mode="wait">
          {!selectedItem ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12 panel empty-state"
            >
              <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-muted mb-6 border border-white/5 shadow-xl">
                <History size={40} />
              </div>
              <h3 className="text-xl font-bold text-primary">{t.historyDetail}</h3>
              <p className="text-secondary max-w-xs mt-3 leading-relaxed">{t.historyHint}</p>
            </motion.div>
          ) : (
            <motion.div
              key={selectedItem.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="panel p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-primary">{selectedItem.name}</h2>
                  <p className="text-xs text-secondary mt-1 flex items-center gap-2">
                    <Calendar size={12} />
                    {language === 'vi' ? `Phân tích vào ${new Date(selectedItem.created_at).toLocaleString()}` : `Analyzed on ${new Date(selectedItem.created_at).toLocaleString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onRestoreAnalysis(selectedItem)}
                    className="btn btn-secondary px-6 py-3"
                  >
                    <Video size={18} />
                    {language === 'vi' ? 'Xem lại Phân tích' : 'Review Analysis'}
                  </button>
                  <button
                    onClick={() => onSelectForScript(selectedItem)}
                    className="btn btn-primary px-6 py-3"
                  >
                    <FileText size={18} />
                    {language === 'vi' ? 'Dùng cho Kịch bản' : 'Use for Script'}
                  </button>
                </div>
              </div>

              <AnalysisPreview 
                analysis={selectedItem.analysis} 
                videoUrl={`/uploads/${selectedItem.filename}`} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
