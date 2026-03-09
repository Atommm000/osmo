import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Loader2, Send, Copy, Check, AlertCircle } from 'lucide-react';
import { HistoryItem, ReviewerScript } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';

interface ScriptTabProps {
  initialItem: HistoryItem | null;
  history: HistoryItem[];
  onRefresh?: () => Promise<void>;
}

export function ScriptTab({ initialItem, history, onRefresh }: ScriptTabProps) {
  const { language } = useLanguage();
  const [selectedId, setSelectedId] = useState<string>(initialItem?.id || '');
  const [tone, setTone] = useState('review_douyin');
  const [customTone, setCustomTone] = useState('');
  const [length, setLength] = useState('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [script, setScript] = useState<ReviewerScript | null>(initialItem?.script || null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialItem) {
      setSelectedId(initialItem.id);
      setScript(initialItem.script || null);
    }
  }, [initialItem]);

  const generateScript = async () => {
    if (!selectedId) return;
    setIsGenerating(true);
    setError(null);
    try {
      const currentItem = history.find(h => h.id === selectedId);
      const res = await fetch('/api/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: selectedId, 
          analysis: currentItem?.analysis,
          tone: tone === 'khac' ? customTone : tone, 
          length 
        }),
      });
      
      const contentType = res.headers.get('content-type');
      if (!res.ok) {
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          throw new Error(data.error || "Failed to generate script");
        } else {
          throw new Error(`Server error (${res.status}). Vui lòng thử lại sau.`);
        }
      }
      
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error("Dữ liệu phản hồi không hợp lệ.");
      }

      const data = await res.json();
      setScript(data);
      
      // Persist the script to Supabase
      if (selectedId && !selectedId.startsWith('temp-')) {
        const { error: updateError } = await supabase
          .from('analyses')
          .update({ script: data })
          .eq('id', selectedId);
          
        if (updateError) {
          console.error("Failed to persist script to Supabase:", updateError);
        } else if (onRefresh) {
          await onRefresh();
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!script) return;
    const text = [
      "HOOK:",
      ...(script.hook || []).map(i => `- ${i.voiceover}`),
      "\nINTRO:",
      ...(script.intro || []).map(i => `- ${i.voiceover}`),
      "\nBODY:",
      ...(script.body || []).map(i => `- ${i.voiceover}`),
      "\nOUTRO:",
      ...(script.conclusion || []).map(i => `- ${i.voiceover}`),
    ].join('\n');
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedItem = history.find(h => h.id === selectedId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
      <div className="lg:col-span-4 space-y-6">
        <div className="panel p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted uppercase tracking-wider">{language === 'vi' ? 'Chọn video đã phân tích' : 'Select analyzed video'}</label>
            <select
              value={selectedId}
              onChange={(e) => {
                const item = history.find(h => h.id === e.target.value);
                setSelectedId(e.target.value);
                setScript(item?.script || null);
              }}
              className="w-full"
            >
              <option value="">-- {language === 'vi' ? 'Chọn video' : 'Select video'} --</option>
              {history.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted uppercase tracking-wider">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full"
              >
                <option value="review_douyin">Review Douyin</option>
                <option value="neutral">{language === 'vi' ? 'Trung tính' : 'Neutral'}</option>
                <option value="serious">{language === 'vi' ? 'Nghiêm túc' : 'Serious'}</option>
                <option value="energetic">{language === 'vi' ? 'Năng lượng' : 'Energetic'}</option>
                <option value="khac">{language === 'vi' ? 'Khác (Tùy chỉnh)' : 'Other (Custom)'}</option>
              </select>
            </div>

            {tone === 'khac' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2"
              >
                <label className="text-xs font-bold text-muted uppercase tracking-wider">{language === 'vi' ? 'Yêu cầu tone mới' : 'Custom tone request'}</label>
                <textarea
                  value={customTone}
                  onChange={(e) => setCustomTone(e.target.value)}
                  placeholder={language === 'vi' ? "Nhập yêu cầu sáng tạo tone của bạn tại đây..." : "Enter your custom tone request here..."}
                  className="w-full min-h-[100px] resize-none"
                />
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted uppercase tracking-wider">{language === 'vi' ? 'Độ dài' : 'Length'}</label>
              <select
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="w-full"
              >
                <option value="short">{language === 'vi' ? 'Ngắn' : 'Short'}</option>
                <option value="medium">{language === 'vi' ? 'Vừa' : 'Medium'}</option>
                <option value="long">{language === 'vi' ? 'Dài' : 'Long'}</option>
              </select>
            </div>
          </div>

          <button
            onClick={generateScript}
            disabled={!selectedId || isGenerating}
            className="btn btn-primary w-full py-4 text-base"
          >
            {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Send size={18} />}
            {language === 'vi' ? 'Tạo kịch bản phân tích' : 'Generate Script'}
          </button>
        </div>

        {selectedItem && (
          <div className="panel p-6">
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-4">{language === 'vi' ? 'Tóm tắt video' : 'Video Summary'}</h3>
            <p className="text-sm text-secondary line-clamp-6 leading-relaxed">{selectedItem.analysis.overview.bullet_summary.join(' ')}</p>
          </div>
        )}
      </div>

      <div className="lg:col-span-8">
        <AnimatePresence mode="wait">
          {!script && !isGenerating ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12 panel empty-state"
            >
              <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-muted mb-6 border border-white/5 shadow-xl">
                <FileText size={40} />
              </div>
              <h3 className="text-xl font-bold text-primary">{language === 'vi' ? 'Sẵn sàng tạo kịch bản' : 'Ready to generate script'}</h3>
              <p className="text-secondary max-w-xs mt-3 leading-relaxed">{language === 'vi' ? 'Chọn một video đã phân tích và nhấn nút "Tạo kịch bản" để bắt đầu.' : 'Select an analyzed video and click "Generate Script" to start.'}</p>
            </motion.div>
          ) : isGenerating ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12 panel"
            >
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping opacity-20" />
                <div className="relative w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                  <FileText size={48} />
                </div>
              </div>
              <h3 className="text-xl font-bold text-primary">{language === 'vi' ? 'Đang soạn thảo...' : 'Drafting script...'}</h3>
              <p className="text-secondary max-w-xs mt-3 leading-relaxed">{language === 'vi' ? 'Gemini đang chuyển đổi các điểm phân tích thành một kịch bản reviewer chuyên nghiệp.' : 'Gemini is transforming analysis points into a professional reviewer script.'}</p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12 panel border-rose-500/20"
            >
              <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center text-rose-500 mb-6 border border-rose-500/20 shadow-xl">
                <AlertCircle size={40} />
              </div>
              <h3 className="text-xl font-bold text-primary">{language === 'vi' ? 'Lỗi tạo kịch bản' : 'Script Generation Error'}</h3>
              <p className="text-rose-400 mt-3 leading-relaxed">{error}</p>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="panel overflow-hidden h-full flex flex-col"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-primary">{language === 'vi' ? 'Kịch bản Reviewer' : 'Reviewer Script'}</h3>
                    <p className="text-[10px] text-muted uppercase tracking-wider">{language === 'vi' ? 'Đã hoàn thành' : 'Completed'}</p>
                  </div>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="btn btn-secondary text-xs"
                >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  {copied ? (language === 'vi' ? 'Đã copy' : 'Copied') : (language === 'vi' ? 'Copy kịch bản' : 'Copy Script')}
                </button>
              </div>

              <div className="p-8 space-y-10 overflow-y-auto custom-scrollbar flex-1">
                <section className="space-y-4">
                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">01. {language === 'vi' ? 'Mở đầu (Hook)' : 'Hook'}</h4>
                  <div className="space-y-4">
                    {script?.hook?.map((item, i) => (
                      <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-muted uppercase">Voiceover</span>
                          <p className="text-sm font-medium text-primary leading-relaxed">"{item.voiceover}"</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-muted uppercase">Visual</span>
                          <p className="text-xs text-secondary italic leading-relaxed">{item.visual_description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="space-y-4">
                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">02. {language === 'vi' ? 'Giới thiệu (Intro)' : 'Intro'}</h4>
                  <div className="space-y-4">
                    {script?.intro?.map((item, i) => (
                      <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-muted uppercase">Voiceover</span>
                          <p className="text-sm font-medium text-primary leading-relaxed">"{item.voiceover}"</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-muted uppercase">Visual</span>
                          <p className="text-xs text-secondary italic leading-relaxed">{item.visual_description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="space-y-4">
                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">03. {language === 'vi' ? 'Nội dung chính (Body)' : 'Body'}</h4>
                  <div className="space-y-4">
                    {script?.body?.map((item, i) => (
                      <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-muted uppercase">Voiceover</span>
                          <p className="text-sm font-medium text-primary leading-relaxed">"{item.voiceover}"</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-muted uppercase">Visual</span>
                          <p className="text-xs text-secondary italic leading-relaxed">{item.visual_description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="space-y-4">
                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">04. {language === 'vi' ? 'Kết luận (Outro)' : 'Outro'}</h4>
                  <div className="space-y-4">
                    {script?.conclusion?.map((item, i) => (
                      <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-muted uppercase">Voiceover</span>
                          <p className="text-sm font-medium text-primary leading-relaxed">"{item.voiceover}"</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-muted uppercase">Visual</span>
                          <p className="text-xs text-secondary italic leading-relaxed">{item.visual_description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
