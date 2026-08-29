// ─────────────────────────────────────────────────────────────
// js/leave-requests.js — หน้าที่ 1 รายการใบลา
// สัปดาห์ที่ 6: อ่านใบลาจริงจาก Firestore (โฟลเดอร์ leaveRequests)
// ─────────────────────────────────────────────────────────────

(async function () {
  var กล่อง = document.getElementById("ผลลัพธ์");

  // ใบลาจริงจาก Firestore บวกกับใบที่เพิ่งยื่นในหน้าถัดไป
  // (การบันทึกใบใหม่ลง Firestore จริงเป็นงานสัปดาห์ที่ 7 ตอนนี้จึงยังอยู่ใน sessionStorage)
  var จากฐานข้อมูล = await โหลดจากฐานข้อมูล();
  var ใบลาที่ยื่นใหม่ = JSON.parse(sessionStorage.getItem("ใบลาที่ยื่นใหม่") || "[]");
  var ใบลาทั้งหมด = จากฐานข้อมูล.concat(ใบลาที่ยื่นใหม่);

  // ถ้ามีสถานะติดมาท้าย URL ให้กรองเฉพาะสถานะนั้น
  var สถานะที่กรอง = ค่าจากURL("status");
  if (สถานะที่กรอง) {
    ใบลาทั้งหมด = ใบลาทั้งหมด.filter(function (ใบ) { return ใบ.status === สถานะที่กรอง; });
    document.querySelector(".subtitle").textContent =
      "กำลังแสดงเฉพาะใบลาที่สถานะ " + สถานะที่กรอง + " · กดเมนู รายการใบลา เพื่อดูทั้งหมด";
  }

  แสดงตาราง(ใบลาทั้งหมด);

  function แสดงตาราง(รายการ) {
    if (รายการ.length === 0) {
      กล่อง.innerHTML = "<p>ยังไม่มีใบขอลาในระบบ</p>";
      return;
    }

    var html =
      "<table><thead><tr>" +
      "<th>หัวข้อ</th>" +
      "<th>ประเภทการลา</th>" +
      "<th>สถานะ</th>" +
      '<th class="hide-mobile">ผู้ขอลา</th>' +
      '<th class="hide-mobile">วันที่ลา</th>' +
      "</tr></thead><tbody>";

    รายการ.forEach(function (ใบ) {
      html +=
        '<tr class="clickable" data-id="' + esc(ใบ.id) + '">' +
        "<td>" + esc(ใบ.title) + "</td>" +
        "<td>" + esc(ใบ.leaveTypeName) + "</td>" +
        "<td>" + ป้ายสถานะ(ใบ.status) + "</td>" +
        '<td class="hide-mobile">' + esc(ใบ.requesterName) + "</td>" +
        '<td class="hide-mobile">' + esc(ใบ.startDate) + " ถึง " + esc(ใบ.endDate) + "</td>" +
        "</tr>";
    });

    html += "</tbody></table>";
    กล่อง.innerHTML = html;

    // กดที่แถวไหน ไปหน้ารายละเอียดของใบนั้น
    กล่อง.querySelectorAll("tr.clickable").forEach(function (แถว) {
      แถว.addEventListener("click", function () {
        location.href = "leave-request-detail.html?id=" + แถว.dataset.id;
      });
    });
  }

  async function โหลดจากฐานข้อมูล() {
    try {
      var snap = await window.getDocs(window.collection(window.db, "leaveRequests"));
      return snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
    } catch (err) {
      console.error(err);
      if (typeof showConfigWarning === "function") {
        showConfigWarning("อ่านข้อมูลจาก Firestore ไม่สำเร็จ — ตรวจสอบ js/firebase-config.js");
      }
      return [];
    }
  }
})();
