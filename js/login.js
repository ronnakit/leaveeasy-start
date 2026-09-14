// ─────────────────────────────────────────────────────────────
// js/login.js — จัดการการเข้าสู่ระบบ Firebase Authentication
// ─────────────────────────────────────────────────────────────

(function () {
  var ฟอร์ม = document.getElementById("ฟอร์มเข้าสู่ระบบ");
  var ช่องอีเมล = document.getElementById("email");
  var ช่องรหัสผ่าน = document.getElementById("password");
  var ปุ่ม = document.getElementById("ปุ่มล็อกอิน");
  var กล่องเตือน = document.getElementById("ข้อความเตือน");
  var กล่องสำเร็จ = document.getElementById("ข้อความสำเร็จ");

  // ตรวจสอบสถานะ ถ้าล็อกอินอยู่แล้วให้พาไปหน้ารายการใบลา
  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      location.href = "leave-requests.html";
    }
  });

  ฟอร์ม.addEventListener("submit", async function (e) {
    e.preventDefault();
    ซ่อนเตือน();

    var email = ช่องอีเมล.value.trim();
    var password = ช่องรหัสผ่าน.value;

    if (!email || !password) {
      เตือน("กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน");
      return;
    }

    ปุ่ม.disabled = true;
    ปุ่ม.textContent = "กำลังเข้าสู่ระบบ…";

    try {
      await firebase.auth().signInWithEmailAndPassword(email, password);
      กล่องสำเร็จ.textContent = "✅ เข้าสู่ระบบสำเร็จ กำลังพาไปหน้าแรก…";
      กล่องสำเร็จ.classList.remove("hidden");
      setTimeout(function () {
        location.href = "leave-requests.html";
      }, 500);
    } catch (err) {
      console.error("Login error:", err);
      var msg = "เข้าสู่ระบบไม่สำเร็จ: ";
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        msg += "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
      } else if (err.code === "auth/invalid-email") {
        msg += "รูปแบบอีเมลไม่ถูกต้อง";
      } else if (err.code === "auth/too-many-requests") {
        msg += "พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่";
      } else {
        msg += err.message;
      }
      เตือน(msg);
      ปุ่ม.disabled = false;
      ปุ่ม.textContent = "เข้าสู่ระบบ";
    }
  });

  function เตือน(ข้อความ) {
    กล่องเตือน.textContent = "⚠️ " + ข้อความ;
    กล่องเตือน.classList.remove("hidden");
  }

  function ซ่อนเตือน() {
    กล่องเตือน.classList.add("hidden");
    กล่องสำเร็จ.classList.add("hidden");
  }
})();
