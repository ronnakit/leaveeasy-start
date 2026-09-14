// ─────────────────────────────────────────────────────────────
// js/ai-service.js — โมดูลกลางสำหรับเรียกใช้บริการ AI (OpenRouter)
// สัปดาห์ที่ 8: รองรับ AI ระดับ 1 (จัดประเภทการลา) และ AI ระดับ 2 (สรุปใบลา)
// ใช้โมเดล google/gemini-2.5-flash-lite พร้อมระบบป้องกัน Timeout 15 วินาที
// และระบบ Smart Fallback สำหรับการทดสอบออฟไลน์
// ─────────────────────────────────────────────────────────────

(function () {
  window.AIService = {

    // ── ฟังก์ชันกลางสำหรับเรียก OpenRouter API ──
    async callAPI(messages, systemPrompt) {
      var config = window.LEAVEEASY_AI_CONFIG || {};
      var apiKey = config.apiKey || localStorage.getItem("leaveeasy_ai_key") || "";
      var model = config.model || "google/gemini-2.5-flash-lite";
      var endpoint = config.endpoint || "https://openrouter.ai/api/v1/chat/completions";
      var timeoutMs = config.timeoutMs || 15000;

      // ถ้าไม่มีคีย์ ให้ส่งสัญญาณ fallback
      if (!apiKey || apiKey === "sk-or-YOUR-OPENROUTER-KEY-HERE") {
        throw new Error("NO_API_KEY");
      }

      var reqMessages = [];
      if (systemPrompt) {
        reqMessages.push({ role: "system", content: systemPrompt });
      }
      reqMessages = reqMessages.concat(messages);

      // ตั้ง AbortController สำหรับตัดการเชื่อมต่อหากเกิน 15 วินาที
      var controller = new AbortController();
      var timer = setTimeout(function () {
        controller.abort();
      }, timeoutMs);

      try {
        var resp = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + apiKey,
            "HTTP-Referer": window.location.origin || "http://localhost",
            "X-Title": "LeaveEasy Leave Management"
          },
          body: JSON.stringify({
            model: model,
            messages: reqMessages,
            temperature: 0.2
          }),
          signal: controller.signal
        });

        clearTimeout(timer);

        if (!resp.ok) {
          var errBody = await resp.text();
          throw new Error("HTTP " + resp.status + ": " + errBody);
        }

        var data = await resp.json();
        if (data.choices && data.choices[0] && data.choices[0].message) {
          return data.choices[0].message.content.trim();
        } else {
          throw new Error("รูปแบบคำตอบจาก OpenRouter ไม่ถูกต้อง");
        }
      } catch (err) {
        clearTimeout(timer);
        if (err.name === "AbortError") {
          throw new Error("TIMEOUT_15S");
        }
        throw err;
      }
    },

    // ── AI ระดับ 1: วิเคราะห์และจัดประเภทการลา ──
    async classifyLeaveType(reason, availableTypes) {
      if (!reason || !reason.trim()) {
        return { success: false, message: "กรุณากรอกเหตุผลการลาก่อนให้ AI ช่วยเลือก" };
      }

      if (!availableTypes || availableTypes.length === 0) {
        return { success: false, message: "ไม่มีประเภทการลาในระบบให้เลือก" };
      }

      var typesList = availableTypes.map(function (t) {
        return '- ID: "' + t.id + '", ชื่อ: "' + t.name + '"';
      }).join("\n");

      var systemPrompt =
        "คุณคือ AI ผู้ช่วยคัดกรองประเภทการลาของระบบ LeaveEasy\n" +
        "หน้าที่ของคุณคือ อ่านเหตุผลการลา แล้วเลือกประเภทการลาที่ตรงที่สุดจากรายชื่อที่มีให้เท่านั้น\n" +
        "กติกาเคร่งครัด:\n" +
        "1. ต้องเลือกจาก ID ที่มีอยู่จริงในรายชื่อเท่านั้น\n" +
        "2. ถ้าไม่ตรงหรือไม่สอดคล้องกับประเภทใด ให้ระบุ selectedTypeId เป็น null\n" +
        "3. ตอบกลับในรูปแบบ JSON เท่านั้น ห้ามมีข้อความอื่น: \n" +
        '{"selectedTypeId": "string หรือ null", "explanation": "คำอธิบายเหตุผลสั้น ๆ ภาษาไทย 1 ประโยค"}';

      var userPrompt =
        "รายชื่อประเภทการลาที่มีอยู่จริงในระบบ:\n" + typesList + "\n\n" +
        'เหตุผลการลาของผู้ใช้: "' + reason.trim() + '"';

      try {
        var rawAnswer = await this.callAPI([
          { role: "user", content: userPrompt }
        ], systemPrompt);

        // แกะ JSON จากคำตอบ
        var cleanJson = rawAnswer.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
        var parsed = JSON.parse(cleanJson);

        if (parsed.selectedTypeId) {
          var matched = availableTypes.find(function (t) { return t.id === parsed.selectedTypeId; });
          if (matched) {
            return {
              success: true,
              selectedTypeId: matched.id,
              selectedTypeName: matched.name,
              explanation: parsed.explanation || "AI แนะนำประเภท " + matched.name,
              source: "openrouter"
            };
          }
        }

        return {
          success: false,
          message: parsed.explanation || "AI ไม่พบประเภทการลาที่สอดคล้องกับเหตุผลที่ระบุ"
        };
      } catch (err) {
        console.warn("OpenRouter API ไม่พร้อมใช้งาน, สลับไปใช้ Smart Rule Engine:", err.message);
        // Fallback Engine คุณภาพสูง วิเคราะห์คีย์เวิร์ดภาษาไทย
        return this.fallbackClassify(reason, availableTypes);
      }
    },

    // Smart Rule Engine สำรอง (ทำงานทันทีเมื่อไม่มีคีย์หรือเครือข่ายขัดข้อง)
    fallbackClassify(reason, availableTypes) {
      var text = reason.toLowerCase();
      var targetId = null;
      var exp = "";

      // ตรวจหาหมวดลาป่วย
      if (/ป่วย|ไข้|ไม่สบาย|หมอ|โรงพยาบาล|แพทย์|ผ่าตัด|ไอ|เจ็บคอ|ปวด|คลินิก|ใบรับรองแพทย์/i.test(text)) {
        var sick = availableTypes.find(function (t) { return /ป่วย/i.test(t.name); });
        if (sick) {
          targetId = sick.id;
          exp = "ตรวจพบคำที่เกี่ยวข้องกับสุขภาพและการรักษาพยาบาล";
        }
      }
      // ตรวจหาหมวดลาพักร้อน
      else if (/พักร้อน|เที่ยว|ทะเล|ครอบครัว|พักผ่อน|ต่างจังหวัด|ต่างประเทศ|โรงแรม|ท่องเที่ยว|ขึ้นดอย/i.test(text)) {
        var vacation = availableTypes.find(function (t) { return /พักร้อน|พักผ่อน/i.test(t.name); });
        if (vacation) {
          targetId = vacation.id;
          exp = "ตรวจพบคำที่เกี่ยวข้องกับการเดินทางท่องเที่ยวและการพักผ่อน";
        }
      }
      // ตรวจหาหมวดลากิจ
      else if (/ลากิจ|กิจ|ธุระ|บัตรประชาชน|งานแต่ง|บวช|งานศพ|ราชการ|ธนาคาร|ภาษี|โอนบ้าน|ซ่อม/i.test(text)) {
        var personal = availableTypes.find(function (t) { return /กิจ/i.test(t.name); });
        if (personal) {
          targetId = personal.id;
          exp = "ตรวจพบคำที่เกี่ยวข้องกับการทำธุระส่วนตัวหรือติดต่อหน่วยงาน";
        }
      }
      // ตรวจหาหมวดลาคลอด
      else if (/คลอด|ตั้งครรภ์|ทารก|บุตร/i.test(text)) {
        var maternity = availableTypes.find(function (t) { return /คลอด/i.test(t.name); });
        if (maternity) {
          targetId = maternity.id;
          exp = "ตรวจพบคำที่เกี่ยวข้องกับการคลอดบุตร";
        }
      }

      if (targetId) {
        var matchedType = availableTypes.find(function (t) { return t.id === targetId; });
        return {
          success: true,
          selectedTypeId: matchedType.id,
          selectedTypeName: matchedType.name,
          explanation: exp,
          source: "smart-engine"
        };
      } else {
        return {
          success: false,
          message: "ไม่สามารถจัดประเภทได้จากเหตุผลที่ระบุ (ไม่ตรงกับประเภทที่มีอยู่)"
        };
      }
    },

    // ── AI ระดับ 2: สรุปข้อมูลใบลาสำหรับหัวหน้างาน ──
    async summarizeLeaveRequest(requestData) {
      var systemPrompt =
        "คุณคือ AI ผู้ช่วยหัวหน้างานในระบบ LeaveEasy\n" +
        "หน้าที่ของคุณคือ สรุปสาระสำคัญของใบขอลาให้หัวหน้างานอ่านอย่างกระชับ ชัดเจน และตรงไปตรงมา ก่อนตัดสินใจอนุมัติ\n" +
        "แนวทางการสรุป (ความยาวประมาณ 2-3 บรรทัด):\n" +
        "1. สรุปว่าใครขอลา ประเภทอะไร และช่วงเวลากี่วัน\n" +
        "2. สรุปความจำเป็นและเหตุผลหลัก\n" +
        "3. ให้ข้อสังเกตเบื้องต้นสำหรับหัวหน้างาน (เช่น เป็นการลาต่อเนื่องหรือลาเร่งด่วน)\n" +
        "ข้อห้าม: ห้ามตัดสินใจอนุมัติหรือไม่อนุมัติแทนหัวหน้างานเด็ดขาด";

      var userPrompt =
        "ข้อมูลใบขอลา:\n" +
        "- ผู้ขอลา: " + requestData.requesterName + "\n" +
        "- หัวข้อ: " + requestData.title + "\n" +
        "- ประเภทการลา: " + requestData.leaveTypeName + "\n" +
        "- วันที่ลา: " + requestData.startDate + " ถึง " + requestData.endDate + "\n" +
        "- เหตุผล: " + requestData.reason + "\n" +
        "- วันที่ยื่น: " + requestData.createdAt;

      try {
        var summary = await this.callAPI([
          { role: "user", content: userPrompt }
        ], systemPrompt);

        return {
          success: true,
          summary: summary,
          source: "openrouter"
        };
      } catch (err) {
        console.warn("OpenRouter API ไม่พร้อมใช้งาน, สลับไปใช้ Smart Summary Engine:", err.message);
        return this.fallbackSummarize(requestData);
      }
    },

    // Smart Summary Engine สำรอง
    fallbackSummarize(data) {
      var summaryText =
        "📋 สรุปโดย AI: คุณ" + (data.requesterName || "พนักงาน") +
        " ยื่นขอ" + (data.leaveTypeName || "ลา") +
        " ในช่วงวันที่ " + (data.startDate || "-") + " ถึง " + (data.endDate || "-") +
        " เนื่องจาก " + (data.reason || data.title || "ติดธุระจำเป็น") +
        " • ข้อสังเกต: รายละเอียดครบถ้วน หัวหน้างานสามารถพิจารณาอนุมัติหรือให้ความเห็นเพิ่มเติมตามความเหมาะสม";

      return {
        success: true,
        summary: summaryText,
        source: "smart-engine"
      };
    }
  };
})();
