import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export function ConnectionStatus() {
  const [status, setStatus] = useState<{
    has_key: boolean;
    key_format_valid: boolean;
    key_name_used: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        setStatus(data.api_config);
      } catch (err) {
        console.error("Health check failed:", err);
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return null;

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">API Status:</span>
        {status?.key_format_valid ? (
          <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
            <CheckCircle2 size={14} />
            Sẵn sàng
          </div>
        ) : status?.has_key ? (
          <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
            <AlertCircle size={14} />
            Key sai định dạng
          </div>
        ) : (
          <div className="flex items-center gap-1 text-rose-500 text-xs font-bold">
            <XCircle size={14} />
            Chưa có Key
          </div>
        )}
      </div>
      {status?.key_name_used && (
        <div className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-mono">
          {status.key_name_used}
        </div>
      )}
    </div>
  );
}
