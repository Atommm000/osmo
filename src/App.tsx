import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AnalysisSetup } from './components/AnalysisSetup';
import { ReviewWorkspace } from './components/ReviewWorkspace';
import { ScriptTab } from './components/ScriptTab';
import { HistoryTab } from './components/HistoryTab';
import { HistoryItem, VideoAnalysis, QueuedVideo } from './types';
import { supabase } from './lib/supabase';
import { useAuth } from './contexts/AuthContext';
import { Loader2 } from 'lucide-react';

import { AppShell } from './components/AppShell';
import { Sidebar } from './components/Sidebar';
import { MainHeader } from './components/MainHeader';
import { LandingScreen } from './components/LandingScreen';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { Login } from './components/Login';

type Tab = 'analyze' | 'script' | 'history';
type AnalysisView = 'setup' | 'review';

export default function App() {
  const { session, user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('analyze');
  const [analysisView, setAnalysisView] = useState<AnalysisView>('setup');
  const [currentAnalysis, setCurrentAnalysis] = useState<{ result: VideoAnalysis; videoUrl: string; id?: string } | null>(null);
  
  // Persistent queue state to survive navigation
  const [videos, setVideos] = useState<QueuedVideo[]>([]);
  
  // Shared history state
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);
  const [hasEntered, setHasEntered] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem("cosmo_has_entered") === "true";
    }
    return false;
  });
  const [isEntering, setIsEntering] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!user) {
      setHistory([]);
      return;
    }

    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Failed to fetch history:", error);
        alert(`Supabase Error (Fetching History): ${error.message}. Please check if the 'analyses' table exists.`);
        throw error;
      };
      
      if (data) {
        const historyItems: HistoryItem[] = data.map((item: any) => ({
          id: item.id.toString(),
          name: item.video_title,
          filename: item.video_url.split('/').pop() || 'video.mp4',
          analysis: item.analysis_result,
          snapshots: [],
          script: item.script,
          created_at: item.created_at
        }));
        setHistory(historyItems);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user, fetchHistory]);

  const handleEnter = () => {
    setIsEntering(true);

    window.setTimeout(() => {
      setHasEntered(true);
      sessionStorage.setItem("cosmo_has_entered", "true");
    }, 280);
  };

  const handleAnalysisComplete = async (result: VideoAnalysis, videoUrl: string, filename?: string) => {
    // Use the persistent /uploads/ path if filename is provided, otherwise fallback to blob (for immediate preview)
    const persistentUrl = filename ? `/uploads/${filename}` : videoUrl;
    
    // Optimistically set current analysis
    setCurrentAnalysis({ result, videoUrl: persistentUrl });
    setAnalysisView('review');
    setActiveTab('analyze');

    try {
      const { data, error } = await supabase.from('analyses').insert({
        video_title: result.video_title,
        video_url: persistentUrl,
        analysis_result: result,
        created_at: new Date().toISOString(),
        user_id: user?.id,
      }).select().single();

      if (error) {
        console.error("Failed to save analysis to Supabase:", error);
        alert(`Supabase Error (Saving Analysis): ${error.message}. Please ensure the 'analyses' table is created with proper RLS policies.`);
      } else if (data) {
        // Update current analysis with real DB ID
        setCurrentAnalysis(prev => prev ? { ...prev, id: data.id.toString() } : null);
        // Refresh history immediately so it appears in other tabs
        await fetchHistory();
      }
    } catch (err) {
      console.error("Error saving analysis to Supabase:", err);
      alert("An unexpected error occurred while saving the analysis.");
    }
  };

  const handleBackToSetup = () => {
    setAnalysisView('setup');
  };

  const handleWriteScript = () => {
    if (!currentAnalysis) return;
    
    // Find the item in history if possible, or create a temporary one
    const historyItem = history.find(h => 
      h.name === currentAnalysis.result.video_title && 
      (currentAnalysis.id ? h.id === currentAnalysis.id : true)
    );

    if (historyItem) {
      setSelectedHistoryItem(historyItem);
    } else {
      // Fallback for immediate shortcut before history refresh completes
      setSelectedHistoryItem({
        id: currentAnalysis.id || 'temp-' + Date.now(),
        name: currentAnalysis.result.video_title,
        filename: currentAnalysis.videoUrl.split('/').pop() || '',
        analysis: currentAnalysis.result,
        snapshots: [],
        created_at: new Date().toISOString()
      });
    }
    
    setActiveTab('script');
  };

  const handleSelectForScript = (item: HistoryItem) => {
    setSelectedHistoryItem(item);
    setActiveTab('script');
  };

  const handleRestoreAnalysis = (item: HistoryItem) => {
    const videoUrl = item.filename.startsWith('blob:') || item.filename.startsWith('http') 
        ? item.filename 
        : `/uploads/${item.filename}`;
        
    setCurrentAnalysis({ 
      result: item.analysis, 
      videoUrl,
      id: item.id
    });
    setAnalysisView('review');
    setActiveTab('analyze');
  };

  const goHome = () => {
    setIsEntering(false);
    setHasEntered(false);
    sessionStorage.removeItem("cosmo_has_entered");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Login onLogin={() => {}} />;
  }

  if (!hasEntered) {
    return (
      <div className={isEntering ? "screen-fade-out" : "screen-fade-in"}>
        <LandingScreen onEnter={handleEnter} />
      </div>
    );
  }

  return (
    <div className="screen-fade-in">
      <AppShell
        sidebar={
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} goHome={goHome} />
        }
        topbarRight={
          <LanguageSwitcher />
        }
        header={
          <MainHeader />
        }
      >
        <div className="tab-panel-enter">
          <AnimatePresence mode="wait">
            {activeTab === 'analyze' && (
              <motion.div
                key="analyze"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {analysisView === 'setup' ? (
                  <AnalysisSetup 
                    onAnalysisComplete={handleAnalysisComplete} 
                    videos={videos}
                    setVideos={setVideos}
                  />
                ) : (
                  currentAnalysis && (
                    <ReviewWorkspace 
                      videoUrl={currentAnalysis.videoUrl} 
                      analysis={currentAnalysis.result} 
                      onBack={handleBackToSetup} 
                      onWriteScript={handleWriteScript}
                    />
                  )
                )}
              </motion.div>
            )}
            {activeTab === 'script' && (
              <motion.div
                key="script"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <ScriptTab 
                  initialItem={selectedHistoryItem} 
                  history={history}
                  onRefresh={fetchHistory}
                />
              </motion.div>
            )}
            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <HistoryTab 
                  history={history}
                  isLoading={isLoadingHistory}
                  onSelectForScript={handleSelectForScript} 
                  onRestoreAnalysis={handleRestoreAnalysis}
                  onRefresh={fetchHistory}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </AppShell>
    </div>
  );
}
