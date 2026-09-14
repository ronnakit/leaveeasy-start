# CLAUDE.md — ข้อมูลและแนวทางการพัฒนา LeaveEasy

## 📌 โปรเจกต์นี้คืออะไร
**LeaveEasy** เป็นระบบบริหารจัดการการยื่นและอนุมัติใบลาออนไลน์สำหรับองค์กร ช่วยให้พนักงานสามารถยื่นใบลา ตรวจสอบสถานะการลา และให้หัวหน้างาน/ฝ่ายบุคคลพิจารณาอนุมัติได้อย่างสะดวก ถูกต้อง และโปร่งใส

## 🛠️ เทคโนโลยีที่ใช้
- **Frontend:** HTML5, CSS3, Vanilla JavaScript (DOM manipulation)
- **Backend / Database:** Firebase SDK (compat mode)
  - **Firebase Authentication:** ระบบสมัครสมาชิก ล็อกอิน และจัดการสิทธิ์ผู้ใช้ (Email/Password)
  - **Cloud Firestore:** ฐานข้อมูล NoSQL แบบเรียลไทม์
  - **Firebase Hosting:** โฮสติ้งสำหรับเผยแพร่เว็บแอปพลิเคชันออนไลน์
  - **Firestore Security Rules:** กฎควบคุมความปลอดภัยและการเข้าถึงข้อมูล

## 📂 โฟลเดอร์ (Collections) ทั้งหมดใน Firestore
1. `users` — เก็บข้อมูลผู้ใช้งาน (uid, email, name, role: employee / manager / hr)
2. `leaveTypes` — เก็บประเภทการลา (เช่น ลาป่วย, ลากิจ, ลาพักผ่อน พร้อมจำนวนวันสูงสุด)
3. `leaveRequests` — เก็บรายการคำขอลา (title, reason, status, leaveTypeId, leaveTypeName, startDate, endDate, requesterId, requesterName, approverId, approverName, createdAt)
4. `approvals` — เก็บประวัติการอนุมัติ/ไม่อนุมัติ และความคิดเห็นของผู้มีอำนาจ

## 🚦 สถานะใบลา 3 แบบ (Leave Request Status)
1. **รอพิจารณา** — สถานะเริ่มต้นเมื่อพนักงานยื่นใบลาใหม่
2. **อนุมัติ** — เมื่อหัวหน้างาน (Manager) กดอนุมัติคำขอลา
3. **ไม่อนุมัติ** — เมื่อหัวหน้างาน (Manager) ปฏิเสธคำขอลา (ต้องระบุเหตุผล/ความเห็น)

## 🚫 ข้อห้ามของโปรเจกต์ (Strict Rules)
1. **ห้ามใส่คีย์ลงไฟล์ที่ push ขึ้น GitHub เด็ดขาด:** ห้ามนำ API Key, Service Account JSON, Private Token หรือข้อมูลความลับส่วนตัว (Secrets) ใส่ลงในโค้ดหรือไฟล์ที่จะทำการ push ขึ้น GitHub
2. **ต้องมี .gitignore กันไฟล์คอนฟิกและไฟล์คีย์ลับ:** ตรวจสอบรายการไฟล์ก่อน push ทุกครั้ง
3. **ห้ามแก้ไขข้อมูลอื่นเมื่อเปลี่ยนสถานะ:** การอนุมัติหรือไม่อนุมัติต้องอัปเดตเฉพาะฟิลด์ `status` เท่านั้น
4. **เมื่อใบลาพิจารณาแล้ว (อนุมัติ/ไม่อนุมัติ) ห้ามแก้ไขสถานะซ้ำอีก:** ต้องล็อกปุ่มทันที
