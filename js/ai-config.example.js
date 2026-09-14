// ─────────────────────────────────────────────────────────────
// js/ai-config.example.js — ตัวอย่างไฟล์ตั้งค่า OpenRouter AI
// คัดลอกไฟล์นี้เป็น js/ai-config.js แล้วใส่ API Key จริงของคุณ
// ⚠️ ห้ามส่งไฟล์ js/ai-config.js ขึ้น GitHub เด็ดขาด (.gitignore กันไว้แล้ว)
// ─────────────────────────────────────────────────────────────

window.LEAVEEASY_AI_CONFIG = {
  // ใส่ OpenRouter API Key ของหลักสูตร (sk-or-...)
  apiKey: "sk-or-YOUR-OPENROUTER-KEY-HERE",

  // โมเดลที่หลักสูตรกำหนดสำหรับสัปดาห์ที่ 8
  model: "google/gemini-2.5-flash-lite",

  // OpenRouter API Endpoint
  endpoint: "https://openrouter.ai/api/v1/chat/completions",

  // เวลารอสูงสุด 15 วินาที ตามเกณฑ์ของใบงาน
  timeoutMs: 15000
};
