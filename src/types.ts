export interface TimelineSegment {
  start: string;
  end: string;
  startTime: number;
  endTime: number;
  label: string;
  what_happens: string;
  intent: string;
  viewer_psychology: string;
  retention_risk: string;
  improvement: string;
  snapshotUrl?: string;
}

export interface ScriptItem {
  voiceover: string;
  visual_description: string;
}

export interface ReviewerScript {
  hook: ScriptItem[];
  intro: ScriptItem[];
  body: ScriptItem[];
  conclusion: ScriptItem[];
}

export interface VideoAnalysis {
  video_title: string;
  duration_estimate: string;
  overview: {
    main_topic: string;
    content_goal: string;
    theoretical_anchor: string;
    target_audience: string;
    bullet_summary: string[];
  };
  timeline: TimelineSegment[];
  strengths: string[];
  issues: string[];
  distribution_logic: string;
  recommendations: string[];
}

export interface HistoryItem {
  id: string;
  name: string;
  filename: string;
  analysis: VideoAnalysis;
  snapshots: string[];
  script?: ReviewerScript;
  created_at: string;
}

export type AnalysisStatus = 'idle' | 'processing' | 'completed' | 'error';

export interface QueuedVideo {
  id: string;
  name: string;
  status: AnalysisStatus;
  result?: VideoAnalysis;
  videoUrl?: string; // Can be blob or persistent /uploads/ path
  filename?: string;
  error?: string;
}
