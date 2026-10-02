# 📝 BACKLOG — รายการสิ่งที่ต้องทำต่อในอนาคต (LeaveEasy)

> **โครงการ:** LeaveEasy — ระบบบริหารจัดการการยื่นและอนุมัติใบลาออนไลน์  
> **อัปเดตล่าสุด:** สัปดาห์ที่ 9 (Module 2 Completion)

---

## 📌 รายการสิ่งที่ต้องทำต่อ (Pending Tasks & Next Steps)

### 1. 🔒 ด้านความปลอดภัยและสถาปัตยกรรม (Security & Architecture)
- [ ] **ย้าย OpenRouter API Key ไปไว้ฝั่ง Backend / Cloud Functions:**
  - ปัจจุบัน API Key ใช้ฝั่ง Client-side (เบราว์เซอร์) ผ่าน `js/ai-config.js`
  - ในการทำงานจริงบน Production ต้องย้าย Logic การเรียก AI ไปที่ Firebase Cloud Functions หรือ Backend Server เพื่อป้องกันผู้ใช้ทั่วไปแอบนำ API Key ไปใช้งาน
- [ ] **กระชับกฎ Firestore Security Rules ขั้นสูงเพิ่มเติม:**
  - เพิ่มการตรวจสอบประเภทข้อมูล (Data Type Validation) และขนาดความยาวตัวอักษรของแต่ละฟิลด์ใน `firestore.rules`

### 2. 🚀 ด้านฟีเจอร์และ UX/UI (Features & Enhancements)
- [ ] **ระบบการแจ้งเตือนแบบ Real-time (Notifications):**
  - เพิ่มระบบแจ้งเตือนผ่าน Email หรือ Line Notify เมื่อมีใบลาใหม่ยื่นเข้ามา หรือเมื่อใบลาได้รับการอนุมัติ/ไม่อนุมัติ
- [ ] **ส่งออกรายงานประวัติการลา (Export Report):**
  - เพิ่มฟังก์ชันสำหรับ HR ในการส่งออกรายงานประวัติการลาของพนักงานในรูปแบบไฟล์ Excel / CSV ประจำเดือน
- [ ] **รองรับการแนบไฟล์เอกสารประกอบการลา:**
  - เพิ่มช่องแนบใบรับรองแพทย์ หรือเอกสารประกอบการลาผ่าน Firebase Storage

---

## 🏆 สถานะของระบบในปัจจุบัน (Current System Status)
- ✅ หน้าจอแสดงผลและ Navigation ครบถ้วนตาม `leaveeasy-spec.md`
- ✅ เชื่อมต่อกับ Firebase Authentication และ Cloud Firestore สมบูรณ์
- ✅ ผ่านการทดสอบอัตโนมัติ 5 ชุดทดสอบ (รวมชุดทดสอบความปลอดภัย) ใน `test-results.md`
