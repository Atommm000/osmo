import express from "express";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import multer from "multer";
import Database from "better-sqlite3";
import ffmpeg from "fluent-ffmpeg";
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase Configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Ensure upload directories exist
const UPLOADS_DIR = path.join(__dirname, "uploads");
const SNAPSHOTS_DIR = path.join(UPLOADS_DIR, "snapshots");
if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR);
if (!existsSync(SNAPSHOTS_DIR)) mkdirSync(SNAPSHOTS_DIR);

// Initialize Database
const db = new Database("database.sqlite");
db.exec(`
  CREATE TABLE IF NOT EXISTS history (
    id TEXT PRIMARY KEY,
    name TEXT,
    filename TEXT,
    analysis TEXT,
    snapshots TEXT,
    script TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use("/uploads", express.static(UPLOADS_DIR));

// Health check
app.get("/api/health", (req, res) => {
  const apiKey = process.env.MY_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;
  const hasKey = !!(apiKey && apiKey.trim() !== "" && apiKey !== "MY_GEMINI_API_KEY");
  const keyValid = hasKey && apiKey.startsWith("AIza");
  
  res.json({ 
    status: "ok", 
    time: new Date().toISOString(),
    api_config: {
      has_key: hasKey,
      key_format_valid: keyValid,
      key_name_used: process.env.MY_API_KEY ? "MY_API_KEY" : (process.env.GEMINI_API_KEY ? "GEMINI_API_KEY" : "API_KEY")
    }
  });
});

// Multer configuration
const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    // Sanitize and truncate the name to avoid ENAMETOOLONG
    // Limit name to 100 chars to be safe
    const safeName = name.replace(/[^a-z0-9]/gi, '_').substring(0, 100);
    cb(null, `${timestamp}-${safeName}${ext}`);
  },
});
const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

// Gemini Configuration
function getGenAI() {
  // Kiểm tra các biến môi trường có thể có
  const apiKey = process.env.MY_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;
  
  if (!apiKey || apiKey.trim() === "" || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("Chưa cấu hình API Key. Vui lòng: 1. Mở mục 'Secrets' (hình chìa khóa 🔑). 2. Đổi tên biến của bạn thành MY_API_KEY. 3. Dán Key và bật 'AI Studio Preview'.");
  }
  
  // Kiểm tra định dạng cơ bản của Google API Key
  if (!apiKey.startsWith("AIza")) {
    throw new Error("GEMINI_API_KEY không hợp lệ (phải bắt đầu bằng 'AIza'). Vui lòng kiểm tra lại trong mục Secrets.");
  }

  return new GoogleGenAI({ apiKey });
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 5, initialDelay = 3000): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;
      const err = error as { message?: string; status?: number };
      const errorStr = JSON.stringify(err);
      const isRetryable = errorStr.includes("503") || 
                          errorStr.includes("429") || 
                          err.message?.includes("503") || 
                          err.message?.includes("429") ||
                          err.message?.toLowerCase().includes("high demand") ||
                          err.message?.toLowerCase().includes("unavailable") ||
                          err.message?.toLowerCase().includes("deadline exceeded");
      
      if (!isRetryable || i === maxRetries - 1) break;
      
      const delay = initialDelay * Math.pow(2, i);
      console.warn(`API call failed (attempt ${i + 1}/${maxRetries}). Retrying in ${delay}ms...`, err.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

const ANALYSIS_PROMPT = `Bạn là chuyên gia phân tích chiến lược nội dung tại Meta Ecom Uni.
Hãy phân tích video được cung cấp theo KHUNG PHÂN TÍCH CHIẾN LƯỢC thực chiến.

KHUNG PHÂN TÍCH (bắt buộc):
A. Tổng quan chiến lược & Neo lý thuyết
- Chủ đề chính (main_topic)
- Mục tiêu nội dung (content_goal)
- Neo lý thuyết (theoretical_anchor): PHẢI neo vào 1-2 lý thuyết tâm lý học nổi tiếng (ví dụ: Cognitive Dissonance của Leon Festinger, Loss Aversion của Kahneman & Tversky, Perceived Control Theory...). Viết 1-2 dòng giới thiệu ngắn gọn về thuyết này.
- Đối tượng khán giả & Nỗi sợ/Khao khát (target_audience): Bóc tách sâu cơ chế phòng vệ hoặc khao khát thầm kín dựa trên lý thuyết đã chọn.

B. Breakdown Timeline & Behavioral Milestones
- Chia video thành các đoạn theo timestamp.
- PHẢI phân tích hành vi cụ thể theo mốc:
  1) 0-3s: Kích hoạt mâu thuẫn/Tension.
  2) 3-10s: Người xem tìm bằng chứng/xác thực.
  3) 10-30s: Chuyển từ nghi ngờ sang kiểm tra/đối chiếu cá nhân.
  4) 30s-end: Tiếp nhận giải pháp & củng cố niềm tin.
- Mỗi đoạn bóc tách: what_happens, intent, viewer_psychology (giải thích tại sao họ không lướt qua ở giây thứ X), retention_risk, improvement.

C. Đánh giá Win - Loss & Viral Logic
- strengths: Điểm "ăn tiền" (3–7 ý)
- issues: Điểm yếu chiến lược (3–7 ý)
- distribution_logic & Save Motivation: Tại sao video tăng Save rate? Giải thích sâu về "Giá trị sử dụng lại" (Utility Value). Họ lưu để làm gì? (Ví dụ: lưu để bảo vệ gia đình, lưu để làm checklist kiểm tra...).
- recommendations: Framework có thể nhân bản (PHẢI đặt tên cho framework này theo quy tắc dễ nhớ như 2R, 3T - kết hợp số và chữ cái viết tắt, ví dụ: 3S - Sốc, Sướng, Sợ).

YÊU CẦU NGÔN NGỮ & ĐỊNH DẠNG:
1) CHỈ trả về JSON.
2) Dùng thuật ngữ chuyên gia nhưng PHẢI diễn giải sang tiếng Việt tự nhiên, không dịch máy móc (Ví dụ: thay vì "Social Proof" hãy dùng "Hiệu ứng đám đông/Bằng chứng xã hội", thay vì "Seeing is Believing" hãy dùng "Trăm nghe không bằng một thấy").
3) Các framework kết luận PHẢI đặt tên theo quy tắc viết tắt dễ nhớ (số + chữ cái, ví dụ: 2K, 3T, 4P...).
4) Neo lý thuyết vững chắc và thực chiến.`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    video_title: { type: Type.STRING },
    duration_estimate: { type: Type.STRING },
    overview: {
      type: Type.OBJECT,
      properties: {
        main_topic: { type: Type.STRING },
        content_goal: { type: Type.STRING },
        theoretical_anchor: { type: Type.STRING },
        target_audience: { type: Type.STRING },
        bullet_summary: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["main_topic", "content_goal", "theoretical_anchor", "target_audience"],
    },
    timeline: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          start: { type: Type.STRING, description: "Timestamp string e.g. 00:01" },
          end: { type: Type.STRING, description: "Timestamp string e.g. 00:05" },
          startTime: { type: Type.NUMBER, description: "Start time in seconds" },
          endTime: { type: Type.NUMBER, description: "End time in seconds" },
          label: { type: Type.STRING, description: "Strategic label: Hook, Conflict, Product Reveal, Social Proof, CTA, etc." },
          what_happens: { type: Type.STRING },
          intent: { type: Type.STRING },
          viewer_psychology: { type: Type.STRING },
          retention_risk: { type: Type.STRING },
          improvement: { type: Type.STRING },
        },
        required: ["start", "end", "startTime", "endTime", "label", "what_happens", "intent", "viewer_psychology", "retention_risk", "improvement"],
      },
    },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    issues: { type: Type.ARRAY, items: { type: Type.STRING } },
    distribution_logic: { type: Type.STRING },
    recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["video_title", "duration_estimate", "overview", "timeline", "strengths", "issues", "distribution_logic", "recommendations"],
};

// Helper: Extract snapshot and upload to Supabase
async function extractSnapshotAndUpload(videoPath: string, time: number, outputName: string): Promise<string> {
  const localSnapshotPath = path.join(SNAPSHOTS_DIR, outputName);
  
  await new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: [time],
        filename: outputName,
        folder: SNAPSHOTS_DIR,
        size: "640x?",
      })
      .on("end", resolve)
      .on("error", (err) => reject(err));
  });

  const fileBuffer = await fs.readFile(localSnapshotPath);
  const { data, error } = await supabase.storage
    .from('snapshots')
    .upload(outputName, fileBuffer, { contentType: 'image/jpeg', upsert: true });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage.from('snapshots').getPublicUrl(outputName);
  
  // Clean up local snapshot
  await fs.unlink(localSnapshotPath).catch(console.error);
  
  return publicUrl;
}

// API: Analyze Video
app.post("/api/analyze", (req, res) => {
  upload.single("video")(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: "Video quá lớn (tối đa 20MB). Vui lòng nén video hoặc sử dụng clip ngắn hơn." });
      }
      return res.status(400).json({ error: `Lỗi tải lên: ${err.message}` });
    } else if (err) {
      return res.status(500).json({ error: `Lỗi hệ thống: ${err.message}` });
    }

    let ai;
    try {
      ai = getGenAI();
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
    
    if (!req.file) return res.status(400).json({ error: "No video file uploaded" });

    const videoPath = req.file.path;
    const language = req.body.language || "Vietnamese";

    try {
      const stats = await fs.stat(videoPath);
      console.log(`Processing video: ${req.file.originalname} (${stats.size} bytes)`);

      // Limit size to prevent OOM crashes (20MB is a safe bet for most environments)
      if (stats.size > 20 * 1024 * 1024) {
        return res.status(400).json({ error: "Video quá lớn (tối đa 20MB). Vui lòng nén video hoặc sử dụng clip ngắn hơn." });
      }

      const videoBuffer = await fs.readFile(videoPath);
      const base64Video = videoBuffer.toString("base64");

      // Upload video to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(req.file.filename, videoBuffer, { contentType: req.file.mimetype, upsert: true });

      if (uploadError) {
        console.error("Supabase Video Upload Error:", uploadError);
        // Continue anyway as we have the buffer for AI analysis
      }

      const { data: { publicUrl: videoPublicUrl } } = supabase.storage.from('videos').getPublicUrl(req.file.filename);

      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: `${ANALYSIS_PROMPT}\n\nNgôn ngữ phân tích: ${language}` },
              {
                inlineData: {
                  mimeType: req.file.mimetype,
                  data: base64Video,
                },
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        },
      })) as GenerateContentResponse;

      const analysis = JSON.parse(response.text);
      const outputSnapshots: string[] = [];

      // Extract snapshots for each timeline segment
      for (let i = 0; i < analysis.timeline.length; i++) {
        const segment = analysis.timeline[i];
        const midTime = (segment.startTime + segment.endTime) / 2;
        
        const snapshotName = `${req.file.filename}-segment-${i}.jpg`;
        try {
          const snapshotUrl = await extractSnapshotAndUpload(videoPath, midTime, snapshotName);
          segment.snapshotUrl = snapshotUrl;
          outputSnapshots.push(snapshotUrl);
        } catch (err) {
          console.error(`Failed to extract snapshot for segment ${i}:`, err);
        }
      }

      // Save to history (Local DB for fallback, but primary is Supabase via Frontend)
      const id = Math.random().toString(36).substring(7);
      db.prepare("INSERT INTO history (id, name, filename, analysis, snapshots) VALUES (?, ?, ?, ?, ?)")
        .run(id, req.file.originalname, videoPublicUrl, JSON.stringify(analysis), JSON.stringify(outputSnapshots));

      res.json({ id, name: req.file.originalname, filename: videoPublicUrl, analysis, snapshots: outputSnapshots });
    } catch (error) {
      console.error("Analysis failed:", error);
      const err = error as { message?: string; status?: number };
      const errorStr = JSON.stringify(err);
      
      let userMessage = (error as Error).message;
      if (errorStr.includes("503") || userMessage.toLowerCase().includes("high demand")) {
        userMessage = "Hệ thống AI đang quá tải (High Demand). Vui lòng đợi vài phút và thử lại.";
      } else if (errorStr.includes("429")) {
        userMessage = "Bạn đã gửi quá nhiều yêu cầu. Vui lòng đợi một lát.";
      }
      
      res.status(500).json({ error: userMessage });
    } finally {
      // Optionally delete the video file to save space
      // await fs.unlink(videoPath).catch(console.error);
    }
  });
});

// API: Generate Script
app.post("/api/script", async (req, res) => {
  let ai;
  try {
    ai = getGenAI();
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
  
  const { id, analysis, tone, length } = req.body;

  if (!analysis) return res.status(400).json({ error: "Analysis data is required" });

  let toneInstruction = `Tone: ${tone || "review_douyin"}`;
  
  if (tone === 'review_douyin') {
    toneInstruction = `Bạn là CHIẾN LƯỢC GIA NỘI DUNG tại Meta Ecom Uni.
    
    🎯 MỤC TIÊU: Viết kịch bản Reviewer chuyên sâu, có tính hệ thống cao, mượt mà và thuyết phục.

    ⚠️ QUY TẮC CỐT LÕI (10/10 Standard):
    1. TRỤC LOGIC XUYÊN SUỐT: Lấy một Framework thuyết phục làm trục chính (ví dụ: Mâu thuẫn - Rủi ro - Kiểm soát - Giải tỏa). Dùng video làm ví dụ minh họa cho từng bước của Framework, KHÔNG phân tích rời rạc theo từng giây.
    2. NEO LÝ THUYẾT MƯỢT MÀ: Lồng ghép 1-2 lý thuyết tâm lý (Cognitive Dissonance, Loss Aversion...) vào đúng bước tương ứng của Framework. Cần có câu nối dẫn dắt (Ví dụ: "Để giải thích cho sự tò mò này, chúng ta cần nhìn vào lý thuyết...").
    3. GIẢM TẢI TIMELINE: Thay vì nói "0-3s làm gì", hãy nói về "Giai đoạn thiết lập xung đột", "Giai đoạn leo thang nguy cơ". Chỉ dùng mốc thời gian như một điểm tựa nhỏ để minh họa.
    4. LIÊN KẾT Ý: Mỗi đoạn phải có câu chuyển (transition) để người nghe hiểu tại sao chúng ta đi từ lý thuyết này sang ví dụ kia.
    5. TÍCH HỢP DỮ LIỆU PHÂN TÍCH: PHẢI đưa các thông tin từ phần phân tích (Viral Strategy, Utility Value, Ưu điểm, Vấn đề, Framework nhân bản) vào lời thoại một cách tự nhiên và sâu sắc.
    6. VIỆT HÓA THUẬT NGỮ: Tuyệt đối không dùng các cụm từ tiếng Anh thô cứng như "The Retro-Revival Haul", "Social Proof", "Seeing is Believing". Hãy diễn giải chúng sang tiếng Việt một cách uyển chuyển, thực chiến và dễ hiểu.
    7. FRAMEWORK DỄ NHỚ: Các framework kết luận ở cuối bài PHẢI được đặt tên theo quy tắc viết tắt (Ví dụ: Quy tắc 3T - Tin, Thông, Thuận; hoặc Framework 2R - Rẻ, Riêng).

    🎬 CẤU TRÚC KỊCH BẢN:
    1. INTRO (BẮT BUỘC): 
       - "Chào mừng mọi người đã quay trở lại với series '100 ngày khám kênh Douyin' cùng Meta Ecom Uni, truy tìm dạng content đỉnh từ anh bạn Trung Quốc cũng như đón đầu những xu hướng để áp dụng cho thị trường Việt Nam. Và hôm nay là Ngày [X]. NGÀNH HÀNG [Tên ngành hàng]".
       - KHÔNG tự xưng title như Content Strategist hay Brand Manager.
    2. HOOK: 
       - Đẩy tension lên mức "Nguy cơ sinh tồn/Cá nhân" (Ví dụ: "Thứ bạn đang dùng mỗi ngày có thể đang phản tác dụng").
    3. BODY (Phân tích hệ thống & Chiến lược):
       - Mở đầu bằng một nhận định chung về chiến lược thuyết phục tổng thể của video.
       - Triển khai theo các bước của Framework. Mỗi bước gồm: [Tên bước] -> [Lý thuyết hỗ trợ] -> [Ví dụ cụ thể trong video] -> [Phân tích hành vi người xem/Tại sao họ không lướt qua].
       - PHẢI có các đoạn thoại chuyên sâu bóc tách từ dữ liệu phân tích:
         a) Chiến lược Viral & Động lực Lưu (Utility Value): Giải thích tại sao video này "Archive-worthy" (Xứng đáng lưu trữ).
         b) Ưu điểm chiến lược: Phân tích các điểm "ăn tiền" (Insight, Pacing, Social Proof...).
         c) Vấn đề & Tối ưu: Chỉ ra các điểm yếu chiến lược và cách khắc phục.
         d) Framework nhân bản: Cách áp dụng framework này cho các ngành hàng hoặc chủ đề khác.
    4. OUTRO:
       - Chốt bằng tên Framework rõ ràng và 1 câu khóa sâu sắc: "Người ta không chia sẻ vì bạn đúng, họ chia sẻ vì họ cảm thấy được bảo vệ".

    🗣️ GIỌNG VĂN: Chuyên gia, thực chiến, ngôn từ sắc bén nhưng kết nối mượt mà.`;
  } else if (tone && tone.length > 20) {
    // This is likely a custom tone from the "Khác" option
    toneInstruction = `Hãy viết kịch bản theo yêu cầu tùy chỉnh sau đây của người dùng: ${tone}`;
  }

  const SCRIPT_PROMPT = `Dựa trên kết quả phân tích video sau:
${JSON.stringify(analysis)}

Hãy viết một kịch bản video (kịch bản phân tích chiến lược/strategic reviewer script) với các yêu cầu sau:
- ${toneInstruction}
- Độ dài: ${length === 'long' ? 'Dài (Ít nhất 15-20 đoạn thoại)' : (length || "medium")}
- Format: Hook / Intro / Body / Outro
- Số lượng câu: ${length === 'long' ? '15-25 câu' : '8-15 câu'}, bóc tách sâu vào chiến lược.
- Mỗi item phải thể hiện được:
  - voiceover: nội dung nói mang tính phân tích tâm lý, retention, và logic phân phối.
  - visual_description: mô tả hình ảnh/cảnh minh hoạ (VJ ở đâu, video gốc highlight chỗ nào, mốc thời gian nào).

Yêu cầu đặc biệt: PHẢI kết hợp toàn bộ kiến thức từ phần phân tích (Ưu điểm, Vấn đề, Viral Logic, Framework) vào trong kịch bản. Đối với chế độ 'Dài', hãy thêm ít nhất 4 đoạn thoại phân tích sâu về các yếu tố chiến lược này.`;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: SCRIPT_PROMPT,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hook: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { voiceover: { type: Type.STRING }, visual_description: { type: Type.STRING } } } },
            intro: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { voiceover: { type: Type.STRING }, visual_description: { type: Type.STRING } } } },
            body: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { voiceover: { type: Type.STRING }, visual_description: { type: Type.STRING } } } },
            conclusion: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { voiceover: { type: Type.STRING }, visual_description: { type: Type.STRING } } } },
          },
          required: ["hook", "intro", "body", "conclusion"],
        },
      },
    })) as GenerateContentResponse;

    const script = JSON.parse(response.text);

    res.json(script);
  } catch (error) {
    console.error("Script generation failed:", error);
    const err = error as { message?: string; status?: number };
    const errorStr = JSON.stringify(err);
    
    let userMessage = (error as Error).message;
    if (errorStr.includes("503") || userMessage.toLowerCase().includes("high demand")) {
      userMessage = "Hệ thống AI đang quá tải (High Demand). Vui lòng đợi vài phút và thử lại.";
    } else if (errorStr.includes("429")) {
      userMessage = "Bạn đã gửi quá nhiều yêu cầu. Vui lòng đợi một lát.";
    }
    
    res.status(500).json({ error: userMessage });
  }
});

// API: History
app.get("/api/history", (req, res) => {
  const rows = db.prepare("SELECT * FROM history ORDER BY created_at DESC").all() as { id: string, name: string, filename: string, analysis: string, snapshots: string, script: string | null, created_at: string }[];
  const history = rows.map((row) => ({
    id: row.id,
    name: row.name,
    filename: row.filename,
    analysis: JSON.parse(row.analysis),
    snapshots: JSON.parse(row.snapshots),
    script: row.script ? JSON.parse(row.script) : null,
    created_at: row.created_at,
  }));
  res.json(history);
});

app.delete("/api/history/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM history WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete failed:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

app.patch("/api/history/:id", (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  db.prepare("UPDATE history SET name = ? WHERE id = ?").run(name, req.params.id);
  res.json({ success: true });
});

app.get("/api/history/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM history WHERE id = ?").get(req.params.id) as { id: string, name: string, filename: string, analysis: string, snapshots: string, script: string | null, created_at: string } | undefined;
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json({
    id: row.id,
    name: row.name,
    filename: row.filename,
    analysis: JSON.parse(row.analysis),
    snapshots: JSON.parse(row.snapshots),
    script: row.script ? JSON.parse(row.script) : null,
    created_at: row.created_at,
  });
});

async function startServer() {
  // Vite middleware for development
  let vite: any;
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
  }

  // SPA Fallback
  app.get("*", async (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    
    const url = req.originalUrl;
    try {
      if (process.env.NODE_ENV !== "production" && vite) {
        let template = await fs.readFile(path.resolve(process.cwd(), "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } else {
        res.sendFile(path.join(process.cwd(), "dist", "index.html"));
      }
    } catch (e) {
      if (vite) vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });

  // Global Error Handler (must be last)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Global error:", err);
    res.status(500).json({ 
      error: "Internal Server Error", 
      message: err.message || "An unexpected error occurred" 
    });
  });
}

startServer();
