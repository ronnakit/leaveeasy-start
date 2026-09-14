// ─────────────────────────────────────────────────────────────
// js/leave-requests.js — หน้าที่ 1 รายการใบลา
// สัปดาห์ที่ 7: อ่านใบลาจริงจาก Firestore (คอลเลกชัน leaveRequests)
// ─────────────────────────────────────────────────────────────

(async function () {
  var กล่อง = document.getElementById("ผลลัพธ์");

  // รอให้ Auth โหลดเสร็จก่อน ถ้ามี Firebase Auth
  if (firebase.auth) {
    firebase.auth().onAuthStateChanged(function (user) {
      โหลดและแสดงรายการ(user);
    });
  } else {
    โหลดและแสดงรายการ(null);
  }

  async function โหลดและแสดงรายการ(currentUser) {
    กล่อง.innerHTML = "<p>กำลังโหลดข้อมูลจากฐานข้อมูล…</p>";

    var ใบลาทั้งหมด = await โหลดจากฐานข้อมูล();

    // ถ้าไม่มีข้อมูลใน Firestore เลย ให้ลองใช้ข้อมูลจาก LEAVE_DATA เป็นตัวอย่าง
    if (ใบลาทั้งหมด.length === 0 && window.LEAVE_DATA && window.LEAVE_DATA.leaveRequests) {
      ใบลาทั้งหมด = window.LEAVE_DATA.leaveRequests.slice();
    }

    // เรียงลำดับจากวันที่ยื่น ล่าสุดไปเก่าสุด
    ใบลาทั้งหมด.sort(function (a, b) {
      return (b.createdAt || "") > (a.createdAt || "") ? 1 : -1;
    });

    // กรองตามบทบาทผู้ใช้ (ตาม ACL ใน Part C):
    // ถ้าเป็น employee ให้เห็นเฉพาะใบลาของตัวเอง
    var userRole = window.currentUserRole;
    if (currentUser && !userRole) {
      try {
        var userDoc = await window.db.collection("users").doc(currentUser.uid).get();
        if (userDoc.exists && userDoc.data().role) {
          userRole = userDoc.data().role;
          window.currentUserRole = userRole;
        }
      } catch (e) {
        console.warn("ไม่สามารถอ่าน role ได้:", e);
      }
    }

    if (currentUser && userRole === "employee") {
      ใบลาทั้งหมด = ใบลาทั้งหมด.filter(function (ใบ) {
        return ใบ.requesterId === currentUser.uid;
      });
    }

    // ถ้ามีสถานะติดมาท้าย URL ให้กรองเฉพาะสถานะนั้น
    var สถานะที่กรอง = ค่าจากURL("status");
    if (สถานะที่กรอง) {
      ใบลาทั้งหมด = ใบลาทั้งหมด.filter(function (ใบ) { return ใบ.status === สถานะที่กรอง; });
      var subtitle = document.querySelector(".subtitle");
      if (subtitle) {
        subtitle.textContent =
          "กำลังแสดงเฉพาะใบลาที่สถานะ " + สถานะที่กรอง + " · กดเมนู รายการใบลา เพื่อดูทั้งหมด";
      }
    }

    แสดงตาราง(ใบลาทั้งหมด);
  }

  function แสดงตาราง(รายการ) {
    if (รายการ.length === 0) {
      กล่อง.innerHTML = "<p>ยังไม่มีใบขอลาในระบบ (หรือไม่มีรายการที่ตรงกับเงื่อนไข)</p>";
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
        location.href = "leave-request-detail.html?id=" + encodeURIComponent(แถว.dataset.id);
      });
    });
  }

  async function โหลดจากฐานข้อมูล() {
    try {
      var snap = await window.db.collection("leaveRequests").get();
      return snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
    } catch (err) {
      console.error(err);
      if (typeof showConfigWarning === "function") {
        showConfigWarning("อ่านข้อมูลจาก Firestore ไม่สำเร็จ: " + err.message);
      }
      return [];
    }
  }
})();
