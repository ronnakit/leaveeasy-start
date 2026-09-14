// ─────────────────────────────────────────────────────────────
// js/leave-types.js — หน้าที่ 4 จัดการประเภทการลา
// สัปดาห์ที่ 7: เพิ่ม แก้ ลบ ใน Firestore จริง (คอลเลกชัน leaveTypes)
// ─────────────────────────────────────────────────────────────

(async function () {
  var รายการ = [];
  var ที่วางตาราง = document.getElementById("ตารางประเภท");
  var ช่องชื่อใหม่ = document.getElementById("ชื่อประเภทใหม่");
  var กล่องเตือน = document.getElementById("เตือนประเภท");
  var ปุ่มเพิ่ม = document.getElementById("ปุ่มเพิ่ม");

  await โหลดข้อมูล();

  if (ปุ่มเพิ่ม) {
    ปุ่มเพิ่ม.addEventListener("click", เพิ่มประเภท);
  }

  async function โหลดข้อมูล() {
    ที่วางตาราง.innerHTML = "<p>กำลังโหลดข้อมูลประเภทการลา…</p>";
    รายการ = [];
    try {
      var snap = await window.db.collection("leaveTypes").get();
      if (!snap.empty) {
        snap.forEach(function (doc) {
          รายการ.push(Object.assign({ id: doc.id }, doc.data()));
        });
      } else if (window.LEAVE_DATA && window.LEAVE_DATA.leaveTypes) {
        รายการ = window.LEAVE_DATA.leaveTypes.slice();
      }
    } catch (err) {
      console.warn("โหลดประเภทการลาจาก Firestore ไม่สำเร็จ:", err);
      if (window.LEAVE_DATA && window.LEAVE_DATA.leaveTypes) {
        รายการ = window.LEAVE_DATA.leaveTypes.slice();
      }
    }
    วาดตาราง();
  }

  function วาดตาราง() {
    if (รายการ.length === 0) {
      ที่วางตาราง.innerHTML = "<p>ยังไม่มีประเภทการลาในระบบ</p>";
      return;
    }

    var html = "<table><thead><tr><th>ชื่อประเภทการลา</th><th>จัดการ</th></tr></thead><tbody>";
    รายการ.forEach(function (ประเภท) {
      html +=
        "<tr><td>" + esc(ประเภท.name) + "</td><td>" +
        '<button type="button" class="btn-ghost" data-edit="' + esc(ประเภท.id) + '">แก้ไข</button> ' +
        '<button type="button" class="btn-danger" data-del="' + esc(ประเภท.id) + '">ลบ</button>' +
        "</td></tr>";
    });
    html += "</tbody></table>";
    ที่วางตาราง.innerHTML = html;

    ที่วางตาราง.querySelectorAll("[data-edit]").forEach(function (ปุ่ม) {
      ปุ่ม.addEventListener("click", function () { แก้ประเภท(ปุ่ม.dataset.edit); });
    });
    ที่วางตาราง.querySelectorAll("[data-del]").forEach(function (ปุ่ม) {
      ปุ่ม.addEventListener("click", function () { ลบประเภท(ปุ่ม.dataset.del); });
    });
  }

  async function เพิ่มประเภท() {
    var ชื่อ = ช่องชื่อใหม่.value.trim();
    if (!ชื่อ) {
      กล่องเตือน.textContent = "⚠️ พิมพ์ชื่อประเภทการลาก่อน จึงจะเพิ่มได้";
      กล่องเตือน.classList.remove("hidden");
      return;
    }
    กล่องเตือน.classList.add("hidden");

    ปุ่มเพิ่ม.disabled = true;
    try {
      var ref = await window.db.collection("leaveTypes").add({ name: ชื่อ });
      รายการ.push({ id: ref.id, name: ชื่อ });
      ช่องชื่อใหม่.value = "";
      วาดตาราง();
    } catch (err) {
      console.error("เพิ่มประเภทการลาไม่สำเร็จ:", err);
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      ปุ่มเพิ่ม.disabled = false;
    }
  }

  async function แก้ประเภท(id) {
    var ประเภท = รายการ.find(function (t) { return t.id === id; });
    if (!ประเภท) return;
    var ชื่อใหม่ = prompt("แก้ชื่อประเภทการลา", ประเภท.name);
    if (ชื่อใหม่ === null) return; // กดยกเลิก
    if (!ชื่อใหม่.trim()) { alert("ชื่อประเภทการลาว่างเปล่าไม่ได้"); return; }

    try {
      await window.db.collection("leaveTypes").doc(id).update({ name: ชื่อใหม่.trim() });
      ประเภท.name = ชื่อใหม่.trim();
      วาดตาราง();
    } catch (err) {
      console.error("แก้ไขประเภทการลาไม่สำเร็จ:", err);
      alert("เกิดข้อผิดพลาดในการแก้ไข: " + err.message);
    }
  }

  async function ลบประเภท(id) {
    var ประเภท = รายการ.find(function (t) { return t.id === id; });
    if (!ประเภท) return;
    if (!confirm('ยืนยันการลบประเภท "' + ประเภท.name + '" หรือไม่')) return;

    try {
      await window.db.collection("leaveTypes").doc(id).delete();
      รายการ = รายการ.filter(function (t) { return t.id !== id; });
      วาดตาราง();
    } catch (err) {
      console.error("ลบประเภทการลาไม่สำเร็จ:", err);
      alert("เกิดข้อผิดพลาดในการลบ: " + err.message);
    }
  }
})();
