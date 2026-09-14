// ─────────────────────────────────────────────────────────────
// js/nav.js — แถบเมนูด้านบนที่ใช้ร่วมกันทุกหน้า
// สัปดาห์ที่ 7: แสดงสถานะ Auth, บทบาทผู้ใช้, ควบคุมสิทธิ์ (ACL), และปุ่มออกจากระบบ
// ─────────────────────────────────────────────────────────────

(function () {
  var เมนู = [
    { href: "index.html",             ชื่อ: "หน้าแรก" },
    { href: "leave-requests.html",    ชื่อ: "รายการใบลา" },
    { href: "new-leave-request.html", ชื่อ: "ยื่นใบลาใหม่" },
    { href: "leave-types.html",       ชื่อ: "ประเภทการลา", roleRequired: "hr" }
  ];

  var หน้าปัจจุบัน = location.pathname.split("/").pop() || "index.html";

  // หน้าที่ไม่ต้องบังคับล็อกอิน
  var หน้าสาธารณะ = ["index.html", "login.html", "register.html", "seed.html", ""];

  function วาดเมนู(role) {
    var html = '<div class="navbar"><a href="index.html" class="brand" style="text-decoration:none; color:#fff;">🔧 LeaveEasy</a>';
    เมนู.forEach(function (m) {
      // ซ่อนเมนูประเภทการลา ถ้าไม่ใช่บทบาท hr (ตาม ACL)
      if (m.roleRequired && role !== m.roleRequired) {
        return;
      }
      var active = m.href === หน้าปัจจุบัน ? ' class="active"' : "";
      html += '<a href="' + m.href + '"' + active + ">" + m.ชื่อ + "</a>";
    });

    html += '<span class="nav-user" id="navUser">กำลังตรวจสอบสถานะ…</span></div>';

    var ที่วาง = document.getElementById("nav");
    if (ที่วาง) ที่วาง.innerHTML = html;
  }

  // วาดเริ่มต้นก่อน
  วาดเมนู(null);

  // ตรวจสอบ Firebase Auth
  if (typeof firebase !== "undefined" && firebase.auth) {
    firebase.auth().onAuthStateChanged(async function (user) {
      var navUser = document.getElementById("navUser");

      if (user) {
        var role = "employee";
        var displayName = user.displayName || user.email;

        // ดึงบทบาทและชื่อจากคอลเลกชัน users
        try {
          if (window.db) {
            var docSnap = await window.db.collection("users").doc(user.uid).get();
            if (docSnap.exists) {
              var udata = docSnap.data();
              if (udata.role) role = udata.role;
              if (udata.name) displayName = udata.name;
            }
          }
        } catch (e) {
          console.warn("ไม่สามารถอ่านข้อมูลผู้ใช้จาก Firestore:", e);
        }

        window.currentUserRole = role;
        window.currentUserName = displayName;

        // วาดแถบเมนูใหม่ตามสิทธิ์บทบาท (เช่น แสดง/ซ่อน เมนูประเภทการลา)
        วาดเมนู(role);

        // ถ้าเข้าหน้า leave-types.html แต่ไม่ใช่ hr ให้เตือนและเด้งออก
        if (หน้าปัจจุบัน === "leave-types.html" && role !== "hr") {
          alert("เฉพาะฝ่ายบุคคล (HR) เท่านั้นที่มีสิทธิ์เข้าถึงหน้านี้");
          location.href = "leave-requests.html";
          return;
        }

        // แสดงชื่อผู้ใช้ บทบาท และปุ่มออกจากระบบ
        navUser = document.getElementById("navUser");
        if (navUser) {
          var roleBadgeClass = role === "hr" ? "badge-อนุมัติ" : (role === "manager" ? "badge-รอพิจารณา" : "");
          navUser.innerHTML =
            '<span>👤 <strong>' + esc(displayName) + '</strong> ' +
            '<span class="badge ' + roleBadgeClass + '" style="font-size:13px; padding:2px 8px;">' + esc(role) + '</span></span>' +
            '<button type="button" class="btn-ghost" id="ปุ่มออกจากระบบ" style="font-size:14px; padding:4px 10px; margin-left:6px; color:#fff; border-color:rgba(255,255,255,0.4); background:transparent;">ออกจากระบบ</button>';

          var btnLogout = document.getElementById("ปุ่มออกจากระบบ");
          if (btnLogout) {
            btnLogout.addEventListener("click", async function () {
              try {
                await firebase.auth().signOut();
                location.href = "login.html";
              } catch (err) {
                alert("ออกจากระบบไม่สำเร็จ: " + err.message);
              }
            });
          }
        }

        // แจ้ง event ให้หน้าที่รอ auth รับทราบ
        window.dispatchEvent(new CustomEvent("leaveeasy-auth-ready", {
          detail: { user: user, role: role, name: displayName }
        }));

      } else {
        // ยังไม่ได้ล็อกอิน
        window.currentUserRole = null;
        window.currentUserName = null;
        วาดเมนู(null);

        navUser = document.getElementById("navUser");
        if (navUser) {
          navUser.innerHTML =
            '<a href="login.html" class="btn btn-ghost" style="font-size:14px; padding:4px 12px; color:#fff; border-color:rgba(255,255,255,0.6); background:transparent;">เข้าสู่ระบบ</a>' +
            '<a href="register.html" class="btn" style="font-size:14px; padding:4px 12px; background:#ffd166; color:#14405f; border-color:#ffd166;">สมัครสมาชิก</a>';
        }

        // ถ้าหน้านี้ต้องการล็อกอิน ให้พาไปหน้า login.html
        var isPublic = หน้าสาธารณะ.some(function (p) {
          return p && หน้าปัจจุบัน === p;
        });

        if (!isPublic && หน้าปัจจุบัน !== "") {
          location.href = "login.html";
        }
      }
    });
  }
})();

// แถบเตือนสีเหลือง ใช้ตอนที่ยังไม่ได้ตั้งค่า Firebase
function showConfigWarning(ข้อความ) {
  var กล่อง = document.createElement("div");
  กล่อง.className = "alert alert-warn";
  กล่อง.innerHTML =
    "⚠️ <strong>แจ้งเตือนระบบ</strong> — " +
    (ข้อความ || "มีปัญหาในการเชื่อมต่อฐานข้อมูล") +
    "<br>ตรวจสอบการเชื่อมต่ออินเทอร์เน็ตหรือการตั้งค่า Firebase";
  var ที่วาง = document.querySelector(".container") || document.body;
  ที่วาง.insertBefore(กล่อง, ที่วาง.firstChild);
}
