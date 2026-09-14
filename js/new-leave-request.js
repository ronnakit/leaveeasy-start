// ─────────────────────────────────────────────────────────────
// js/new-leave-request.js — หน้าที่ 2 ยื่นใบลาใหม่
// สัปดาห์ที่ 7: บันทึกลง Firestore จริง (คอลเลกชัน leaveRequests)
// ─────────────────────────────────────────────────────────────

(async function () {
  var ฟอร์ม = document.getElementById("ฟอร์มใบลา");
  var ช่องประเภท = document.getElementById("leaveTypeId");
  var กล่องเตือน = document.getElementById("ข้อความเตือน");
  var ปุ่มบันทึก = document.getElementById("ปุ่มบันทึก");

  var รายการประเภท = [];

  // โหลดประเภทการลาจาก Firestore (ถ้าไม่มี ให้ใช้จาก LEAVE_DATA)
  try {
    var snap = await window.db.collection("leaveTypes").get();
    if (!snap.empty) {
      snap.forEach(function (doc) {
        var data = doc.data();
        รายการประเภท.push({ id: doc.id, name: data.name });
      });
    } else if (window.LEAVE_DATA && window.LEAVE_DATA.leaveTypes) {
      รายการประเภท = window.LEAVE_DATA.leaveTypes;
    }
  } catch (err) {
    console.warn("ไม่สามารถโหลด leaveTypes จาก Firestore:", err);
    if (window.LEAVE_DATA && window.LEAVE_DATA.leaveTypes) {
      รายการประเภท = window.LEAVE_DATA.leaveTypes;
    }
  }

  // เติมตัวเลือกใน select
  รายการประเภท.forEach(function (ประเภท) {
    var ตัวเลือก = document.createElement("option");
    ตัวเลือก.value = ประเภท.id;
    ตัวเลือก.textContent = ประเภท.name;
    ช่องประเภท.appendChild(ตัวเลือก);
  });

  ฟอร์ม.addEventListener("submit", async function (e) {
    e.preventDefault();

    var ค่า = {
      title: document.getElementById("title").value.trim(),
      reason: document.getElementById("reason").value.trim(),
      leaveTypeId: ช่องประเภท.value,
      startDate: document.getElementById("startDate").value,
      endDate: document.getElementById("endDate").value
    };

    // ตรวจว่ากรอกครบก่อนบันทึก
    if (!ค่า.title || !ค่า.reason || !ค่า.leaveTypeId || !ค่า.startDate || !ค่า.endDate) {
      เตือน("กรอกไม่ครบ — ต้องกรอกทุกช่องก่อนกดบันทึก");
      return;
    }
    if (ค่า.endDate < ค่า.startDate) {
      เตือน("วันที่สิ้นสุดต้องไม่มาก่อนวันที่เริ่มลา");
      return;
    }

    var ประเภท = รายการประเภท.find(function (t) { return t.id === ค่า.leaveTypeId; }) || {
      id: ค่า.leaveTypeId,
      name: ช่องประเภท.options[ช่องประเภท.selectedIndex] ? ช่องประเภท.options[ช่องประเภท.selectedIndex].text : ""
    };

    // ระบุผู้ขอลาจาก Firebase Auth หรือ fallback
    var currentUser = firebase.auth().currentUser;
    var requesterId = "u001";
    var requesterName = "สมชาย ใจดี";

    if (currentUser) {
      requesterId = currentUser.uid;
      requesterName = currentUser.displayName || currentUser.email;

      // ถ้ามีข้อมูลในคอลเลกชัน users ให้ดึงชื่อจริงมาแสดง
      try {
        var userDoc = await window.db.collection("users").doc(currentUser.uid).get();
        if (userDoc.exists && userDoc.data().name) {
          requesterName = userDoc.data().name;
        }
      } catch (e) {
        console.warn("อ่านชื่อผู้ใช้ไม่สำเร็จ:", e);
      }
    }

    var ใบใหม่ = {
      title: ค่า.title,
      reason: ค่า.reason,
      status: "รอพิจารณา", // ใบใหม่เริ่มที่ รอพิจารณา เสมอ
      requesterId: requesterId,
      requesterName: requesterName,
      approverId: "",
      approverName: "",
      leaveTypeId: ประเภท.id,
      leaveTypeName: ประเภท.name,
      startDate: ค่า.startDate,
      endDate: ค่า.endDate,
      createdAt: เวลาตอนนี้()
    };

    ปุ่มบันทึก.disabled = true;
    ปุ่มบันทึก.textContent = "กำลังบันทึก…";

    try {
      await window.db.collection("leaveRequests").add(ใบใหม่);
      location.href = "leave-requests.html";
    } catch (err) {
      console.error("บันทึกใบลาลง Firestore ไม่สำเร็จ:", err);
      เตือน("เกิดข้อผิดพลาดในการบันทึกลงฐานข้อมูล: " + err.message);
      ปุ่มบันทึก.disabled = false;
      ปุ่มบันทึก.textContent = "บันทึก";
    }
  });

  function เตือน(ข้อความ) {
    กล่องเตือน.textContent = "⚠️ " + ข้อความ;
    กล่องเตือน.classList.remove("hidden");
  }
})();
