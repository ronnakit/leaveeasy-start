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

  // ── AI ระดับ 1: ปุ่มให้ AI ช่วยจัดประเภทการลา ──
  var ปุ่มAI = document.getElementById("ปุ่มaiช่วยเลือก");
  var กล่องเตือนAI = document.getElementById("กล่องเตือนai");

  if (ปุ่มAI) {
    ปุ่มAI.addEventListener("click", async function () {
      var reasonText = document.getElementById("reason").value.trim();

      if (!reasonText) {
        เตือน("กรุณากรอกเหตุผลการลาก่อน จึงจะให้ AI ช่วยวิเคราะห์ได้");
        document.getElementById("reason").focus();
        return;
      }

      // 1. สัญญาณกำลังทำงาน และปิดไม่ให้กดซ้ำ
      ปุ่มAI.disabled = true;
      var ข้อความเดิม = ปุ่มAI.innerHTML;
      ปุ่มAI.innerHTML = "⏳ กำลังวิเคราะห์เหตุผล…";
      กล่องเตือนAI.classList.add("hidden");

      try {
        if (!window.AIService) {
          throw new Error("AIService ยังไม่พร้อมใช้งาน");
        }

        // เรียก AI Service พร้อมส่งรายการประเภทที่มีอยู่จริง
        var result = await window.AIService.classifyLeaveType(reasonText, รายการประเภท);

        // 5. ผลต้องเป็นประเภทที่มีอยู่จริงเท่านั้น
        if (result.success && result.selectedTypeId) {
          var matched = รายการประเภท.find(function (t) { return t.id === result.selectedTypeId; });
          if (matched) {
            // เลือกประเภทให้ในช่องเลือก
            ช่องประเภท.value = matched.id;

            // 2. ป้ายข้อเสนอจาก AI — โปรดตรวจสอบก่อนยืนยัน (3. แก้ประเภทได้เสมอ)
            กล่องเตือนAI.className = "alert alert-ai";
            กล่องเตือนAI.innerHTML =
              "💡 <strong>ข้อเสนอจาก AI — โปรดตรวจสอบก่อนยืนยัน:</strong> " +
              "แนะนำประเภท <strong>" + esc(matched.name) + "</strong> (" + esc(result.explanation || "สอดคล้องกับเหตุผล") + ") " +
              "<br><span style='font-size:14px; opacity:0.85;'>* คุณสามารถเปลี่ยนประเภทในช่องด้านล่างนี้ได้เสมอหากเห็นว่าไม่ตรง</span>";
            กล่องเตือนAI.classList.remove("hidden");
          } else {
            // ผลไม่ตรงกับที่มีจริง
            กล่องเตือนAI.className = "alert alert-warn";
            กล่องเตือนAI.innerHTML = "⚠️ AI ไม่พบประเภทการลาที่ตรงกับประเภทในระบบ จึงไม่ได้เปลี่ยนค่าเดิม";
            กล่องเตือนAI.classList.remove("hidden");
          }
        } else {
          // 4. กรณีจัดให้ไม่ได้
          กล่องเตือนAI.className = "alert alert-warn";
          กล่องเตือนAI.innerHTML = "⚠️ " + esc(result.message || "AI ไม่สามารถจัดประเภทได้จากเหตุผลนี้ — กรุณาเลือกประเภทการลาด้วยตนเอง");
          กล่องเตือนAI.classList.remove("hidden");
        }
      } catch (err) {
        // 4. เรียกไม่สำเร็จ หรือ Timeout เกิน 15 วินาที ต้องแจ้งเตือน และยังบันทึกได้ปกติ
        console.error("AI classify error:", err);
        var errMsg = err.message === "TIMEOUT_15S"
          ? "การเชื่อมต่อกับ AI ใช้เวลานานเกิน 15 วินาที"
          : "เรียกใช้ AI ไม่สำเร็จ (" + err.message + ")";
        กล่องเตือนAI.className = "alert alert-warn";
        กล่องเตือนAI.innerHTML = "⚠️ " + esc(errMsg) + " — คุณยังสามารถเลือกประเภทและบันทึกใบลาได้ตามปกติ";
        กล่องเตือนAI.classList.remove("hidden");
      } finally {
        ปุ่มAI.disabled = false;
        ปุ่มAI.innerHTML = ข้อความเดิม;
      }
    });
  }


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
