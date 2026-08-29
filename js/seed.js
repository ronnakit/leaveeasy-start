// ─────────────────────────────────────────────────────────────
// js/seed.js — ใส่ข้อมูลตัวอย่าง (จาก js/data.js) ลง Firestore จริง
// สัปดาห์ที่ 6 — ใช้ครั้งเดียวตอนเริ่มต้น กดซ้ำได้ ไม่เกิดข้อมูลซ้ำ
// (ใช้ setDoc กับ id คงที่ ไม่ใช่ addDoc)
// ─────────────────────────────────────────────────────────────

(function () {
  var ปุ่ม = document.getElementById("ปุ่มใส่ข้อมูล");
  var สถานะ = document.getElementById("สถานะ");

  ปุ่ม.addEventListener("click", async function () {
    ปุ่ม.disabled = true;
    สถานะ.textContent = "กำลังใส่ข้อมูล…";

    try {
      for (var u of window.LEAVE_DATA.users) {
        await window.setDoc(window.doc(window.db, "users", u.id), {
          name: u.name, email: u.email, role: u.role
        });
      }

      for (var lt of window.LEAVE_DATA.leaveTypes) {
        await window.setDoc(window.doc(window.db, "leaveTypes", lt.id), {
          name: lt.name
        });
      }

      for (var lr of window.LEAVE_DATA.leaveRequests) {
        await window.setDoc(window.doc(window.db, "leaveRequests", lr.id), {
          title: lr.title,
          reason: lr.reason,
          status: lr.status,
          requesterId: lr.requesterId, requesterName: lr.requesterName,
          approverId: lr.approverId, approverName: lr.approverName,
          leaveTypeId: lr.leaveTypeId, leaveTypeName: lr.leaveTypeName,
          startDate: lr.startDate, endDate: lr.endDate,
          createdAt: lr.createdAt
        });
      }

      for (var ap of window.LEAVE_DATA.approvals) {
        await window.setDoc(
          window.doc(window.db, "leaveRequests", ap.requestId, "approvals", ap.id),
          {
            authorId: ap.authorId, authorName: ap.authorName,
            message: ap.message, createdAt: ap.createdAt
          }
        );
      }

      สถานะ.textContent = "ใส่ข้อมูลตัวอย่างเรียบร้อยแล้ว ✅ เปิด Firebase Console เพื่อตรวจสอบได้เลย";
    } catch (err) {
      สถานะ.textContent = "เกิดข้อผิดพลาด: " + err.message;
      console.error(err);
    } finally {
      ปุ่ม.disabled = false;
    }
  });
})();
