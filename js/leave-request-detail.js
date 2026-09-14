// ─────────────────────────────────────────────────────────────
// js/leave-request-detail.js — หน้าที่ 3 รายละเอียดใบลา
// สัปดาห์ที่ 7: อ่าน แก้ไข (อนุมัติ/ไม่อนุมัติ) และลบ จาก Firestore จริง
// ─────────────────────────────────────────────────────────────

(async function () {
  var รหัสใบลา = ค่าจากURL("id");
  var กล่องใบลา = document.getElementById("กล่องใบลา");
  var กล่องความเห็น = document.getElementById("กล่องความเห็น");

  if (!รหัสใบลา) {
    กล่องใบลา.innerHTML = "<p>ไม่พบรหัสใบลาในลิงก์</p>";
    return;
  }

  var ใบ = null;
  var ความเห็น = [];

  await โหลดข้อมูล();

  async function โหลดข้อมูล() {
    try {
      var docSnap = await window.db.collection("leaveRequests").doc(รหัสใบลา).get();
      if (!docSnap.exists) {
        // Fallback หาจาก LEAVE_DATA ถ้า Firestore ยังไม่ได้ใส่ seed
        if (window.LEAVE_DATA && window.LEAVE_DATA.leaveRequests) {
          ใบ = window.LEAVE_DATA.leaveRequests.find(function (x) { return x.id === รหัสใบลา; });
        }
        if (!ใบ) {
          กล่องใบลา.innerHTML = "<p>ไม่พบใบขอลาที่ต้องการ — อาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง</p>";
          return;
        }
      } else {
        ใบ = Object.assign({ id: docSnap.id }, docSnap.data());
      }

      // โหลดความเห็นจาก subcollection approvals
      ความเห็น = [];
      try {
        var snapApp = await window.db
          .collection("leaveRequests").doc(รหัสใบลา)
          .collection("approvals")
          .get();

        snapApp.forEach(function (d) {
          ความเห็น.push(Object.assign({ id: d.id }, d.data()));
        });

        // เรียงจากเก่าไปใหม่
        ความเห็น.sort(function (a, b) {
          return (a.createdAt || "") < (b.createdAt || "") ? -1 : 1;
        });
      } catch (err) {
        console.warn("โหลดความเห็นจาก Firestore ไม่สำเร็จ:", err);
      }

      // ถ้าใน Firestore ไม่มี ให้ดู fallback จาก LEAVE_DATA
      if (ความเห็น.length === 0 && window.LEAVE_DATA && window.LEAVE_DATA.approvals) {
        ความเห็น = window.LEAVE_DATA.approvals.filter(function (c) { return c.requestId === รหัสใบลา; });
      }

      วาดใบลา();
      วาดความเห็น();
      กล่องความเห็น.classList.remove("hidden");
    } catch (err) {
      console.error(err);
      กล่องใบลา.innerHTML = "<p>เกิดข้อผิดพลาดในการโหลดข้อมูล: " + esc(err.message) + "</p>";
    }
  }

  // ── วาดข้อมูลใบลาลงหน้าจอ ──
  function วาดใบลา() {
    var แถว = [
      ["หัวข้อ", esc(ใบ.title)],
      ["เหตุผลการลา", esc(ใบ.reason)],
      ["ประเภทการลา", esc(ใบ.leaveTypeName)],
      ["วันที่ลา", esc(ใบ.startDate) + " ถึง " + esc(ใบ.endDate)],
      ["ผู้ขอลา", esc(ใบ.requesterName)],
      ["ผู้อนุมัติ", ใบ.approverName ? esc(ใบ.approverName) : "ยังไม่ได้กำหนดผู้อนุมัติ"],
      ["สถานะ", ป้ายสถานะ(ใบ.status)],
      ["วันที่ยื่น", esc(ใบ.createdAt)]
    ];

    var html = แถว.map(function (r) {
      return '<div class="field-row"><span class="k">' + r[0] + "</span><span>" + r[1] + "</span></div>";
    }).join("");

    // สิทธิ์การแสดงปุ่ม (ควบคุมตามบทบาท ACL)
    var currentUser = firebase.auth().currentUser;
    var userRole = window.currentUserRole || "employee";

    var btnRow = '<div class="btn-row" id="แถวปุ่มจัดการ">';

    // ปุ่มอนุมัติ / ไม่อนุมัติ: แสดงเฉพาะเมื่อ status เป็น รอพิจารณา และ role ไม่ใช่ employee (ต้องเป็น manager หรือ hr)
    var canApprove = (userRole === "manager" || userRole === "hr");
    if (ใบ.status === "รอพิจารณา") {
      if (canApprove) {
        btnRow +=
          '<button type="button" class="btn-ok" id="ปุ่มอนุมัติ">อนุมัติ</button>' +
          '<button type="button" class="btn-danger" id="ปุ่มไม่อนุมัติ">ไม่อนุมัติ</button>';
      } else {
        html += '<p class="hint">คุณอยู่ในบทบาทพนักงาน (employee) ไม่มีสิทธิ์อนุมัติใบลา</p>';
      }
    } else {
      html += '<p class="hint">ใบนี้พิจารณาแล้ว จึงเปลี่ยนสถานะต่อไม่ได้</p>';
    }

    // ปุ่มลบใบลา ตามสิทธิ์ใน ACL:
    // - employee: ลบได้เฉพาะใบของตัวเองที่ยังรอพิจารณา
    // - manager: ไม่มีสิทธิ์ลบ
    // - hr: ลบได้ทุกใบ
    var canDelete = false;
    if (userRole === "hr") {
      canDelete = true;
    } else if (userRole === "employee" && ใบ.status === "รอพิจารณา") {
      if (!currentUser || ใบ.requesterId === currentUser.uid || ใบ.requesterId === "u001") {
        canDelete = true;
      }
    }

    if (canDelete) {
      btnRow += '<button type="button" class="btn-ghost" id="ปุ่มลบใบลา" style="color:var(--สีจาง); border-color:#d8dee4;">🗑️ ลบใบขอลานี้</button>';
    }
    btnRow += '</div>';

    html += btnRow;
    กล่องใบลา.innerHTML = html;

    if (ใบ.status === "รอพิจารณา" && canApprove) {
      var btnOk = document.getElementById("ปุ่มอนุมัติ");
      var btnNo = document.getElementById("ปุ่มไม่อนุมัติ");
      if (btnOk) btnOk.addEventListener("click", function () { เปลี่ยนสถานะ("อนุมัติ"); });
      if (btnNo) btnNo.addEventListener("click", function () { เปลี่ยนสถานะ("ไม่อนุมัติ"); });
    }

    var btnDel = document.getElementById("ปุ่มลบใบลา");
    if (btnDel) {
      btnDel.addEventListener("click", ลบใบลา);
    }
  }

  // อัปเดตการแสดงผลเมื่อ Auth พร้อม
  window.addEventListener("leaveeasy-auth-ready", function () {
    if (ใบ) วาดใบลา();
  });

  // ── เปลี่ยนสถานะใน Firestore (Update เฉพาะฟิลด์ status) ──
  async function เปลี่ยนสถานะ(สถานะใหม่) {
    // กฎ: จะไม่อนุมัติได้ ต้องมีความเห็นอย่างน้อย 1 รายการก่อน
    if (สถานะใหม่ === "ไม่อนุมัติ" && ความเห็น.length === 0) {
      alert("ต้องเขียนความเห็นอย่างน้อย 1 รายการก่อน จึงจะกดไม่อนุมัติได้");
      return;
    }

    var btnOk = document.getElementById("ปุ่มอนุมัติ");
    var btnNo = document.getElementById("ปุ่มไม่อนุมัติ");
    if (btnOk) btnOk.disabled = true;
    if (btnNo) btnNo.disabled = true;

    try {
      // แก้เฉพาะฟิลด์ status อย่าเขียนทับทั้งเอกสาร
      await window.db.collection("leaveRequests").doc(รหัสใบลา).update({
        status: สถานะใหม่
      });

      ใบ.status = สถานะใหม่;
      วาดใบลา();
      alert('เปลี่ยนสถานะเป็น "' + สถานะใหม่ + '" เรียบร้อยแล้ว');
    } catch (err) {
      console.error("อัปเดตสถานะไม่สำเร็จ:", err);
      alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ: " + err.message);
      if (btnOk) btnOk.disabled = false;
      if (btnNo) btnNo.disabled = false;
    }
  }

  // ── ลบใบลาจาก Firestore (Delete) ──
  async function ลบใบลา() {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบใบขอลานี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้")) {
      return;
    }

    var btnDel = document.getElementById("ปุ่มลบใบลา");
    if (btnDel) {
      btnDel.disabled = true;
      btnDel.textContent = "กำลังลบ…";
    }

    try {
      await window.db.collection("leaveRequests").doc(รหัสใบลา).delete();
      alert("ลบใบลาเรียบร้อยแล้ว");
      location.href = "leave-requests.html";
    } catch (err) {
      console.error("ลบใบลาไม่สำเร็จ:", err);
      alert("เกิดข้อผิดพลาดในการลบ: " + err.message);
      if (btnDel) {
        btnDel.disabled = false;
        btnDel.textContent = "🗑️ ลบใบขอลานี้";
      }
    }
  }

  // ── รายการความเห็น เรียงจากเก่าไปใหม่ ──
  function วาดความเห็น() {
    var ที่วาง = document.getElementById("รายการความเห็น");
    if (!ที่วาง) return;
    if (ความเห็น.length === 0) {
      ที่วาง.innerHTML = "<p>ยังไม่มีความเห็นในใบนี้</p>";
      return;
    }
    ที่วาง.innerHTML = ความเห็น
      .slice()
      .map(function (c) {
        return '<div class="comment"><div class="meta">' + esc(c.authorName) + " · " + esc(c.createdAt) +
               "</div><div>" + esc(c.message) + "</div></div>";
      }).join("");
  }

  // ── ส่งความเห็นใหม่ลง Firestore ──
  var btnComment = document.getElementById("ปุ่มส่งความเห็น");
  if (btnComment) {
    btnComment.addEventListener("click", ส่งความเห็น);
  }

  async function ส่งความเห็น() {
    var ช่อง = document.getElementById("ข้อความความเห็น");
    var เตือน = document.getElementById("เตือนความเห็น");
    var ข้อความ = ช่อง.value.trim();

    if (!ข้อความ) {
      เตือน.textContent = "⚠️ พิมพ์ข้อความก่อน จึงจะส่งความเห็นได้";
      เตือน.classList.remove("hidden");
      return;
    }
    เตือน.classList.add("hidden");

    var currentUser = firebase.auth().currentUser;
    var authorId = currentUser ? currentUser.uid : "u002";
    var authorName = currentUser ? (currentUser.displayName || currentUser.email) : "สมหญิง รักงาน";

    if (currentUser && window.currentUserName) {
      authorName = window.currentUserName;
    }

    var ความเห็นใหม่ = {
      requestId: รหัสใบลา,
      authorId: authorId,
      authorName: authorName,
      message: ข้อความ,
      createdAt: เวลาตอนนี้()
    };

    btnComment.disabled = true;

    try {
      var ref = await window.db
        .collection("leaveRequests").doc(รหัสใบลา)
        .collection("approvals")
        .add(ความเห็นใหม่);

      ความเห็น.push(Object.assign({ id: ref.id }, ความเห็นใหม่));
      ช่อง.value = "";
      วาดความเห็น();
    } catch (err) {
      console.error("ส่งความเห็นไม่สำเร็จ:", err);
      เตือน.textContent = "⚠️ ส่งความเห็นไม่สำเร็จ: " + err.message;
      เตือน.classList.remove("hidden");
    } finally {
      btnComment.disabled = false;
    }
  }
})();
