import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface CreatorNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatorNoteModal({ isOpen, onClose }: CreatorNoteModalProps) {
  const { language } = useLanguage();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="creator-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-muted hover:text-primary transition-colors"
            >
              <X size={20} />
            </button>

            <div className="space-y-6 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                Creator's Note
              </div>

              <h2 className="text-2xl font-bold text-primary">
                {language === 'vi' ? 'Đôi lời nhắn gửi từ người sáng tạo' : 'A Message from the Creator'}
              </h2>

              <div className="space-y-4 text-secondary leading-relaxed">
                <p>
                  {language === 'vi' 
                    ? 'Đầu tiên, mình muốn cảm ơn bạn vì đã dành thời gian sử dụng Cosmo. Cosmo là chiếc app đầu tiên mình tự tay xây dựng, bắt đầu từ nhu cầu phân tích video của team Uni.'
                    : 'First of all, I want to thank you for taking the time to use Cosmo. Cosmo is the first app I built myself, born from the need to analyze videos for the Uni team.'}
                </p>

                <p>
                  {language === 'vi'
                    ? 'Với sự hỗ trợ từ công ty và rất nhiều lần thử – sai trong quá trình code, Cosmo dần hình thành như bạn đang thấy hôm nay.'
                    : 'With support from the company and many trial-and-error moments during the coding process, Cosmo gradually took shape as you see it today.'}
                </p>

                <p>
                  {language === 'vi'
                    ? 'Hy vọng công cụ nhỏ này sẽ giúp bạn khám phá những tín hiệu ngầm ẩn trong mỗi video. Chúc bạn có những trải nghiệm tuyệt vời!'
                    : 'I hope this small tool helps you discover the hidden signals in every video. Wishing you a wonderful experience!'}
                </p>
              </div>

              <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-primary">Mai Lan Huong</p>
                  <p className="text-[10px] text-muted uppercase tracking-wider">Creator of Cosmo</p>
                </div>
                <button
                  onClick={onClose}
                  className="btn btn-primary px-8"
                >
                  {language === 'vi' ? 'Đóng' : 'Close'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
