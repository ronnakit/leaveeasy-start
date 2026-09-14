// ─────────────────────────────────────────────────────────────
// js/register.js — จัดการการสมัครสมาชิกใหม่
// ─────────────────────────────────────────────────────────────

(function () {
  var ฟอร์ม = document.getElementById("ฟอร์มสมัคร");
  var ช่องชื่อ = document.getElementById("name");
  var ช่องอีเมล = document.getElementById("email");
  var ช่องรหัสผ่าน = document.getElementById("password");
  var ช่องแผนก = document.getElementById("department");
  var ช่องบทบาท = document.getElementById("role");
  var ปุ่ม = document.getElementById("ปุ่มสมัคร");
  var กล่องเตือน = document.getElementById("ข้อความเตือน");
  var กล่องสำเร็จ = document.getElementById("ข้อความสำเร็จ");

  // ถ้าล็อกอินอยู่แล้ว ให้ไปหน้ารายการใบลา
  firebase.auth().onAuthStateChanged(function (user) {
    if (user && !sessionStorage.getItem("just_registered")) {
      location.href = "leave-requests.html";
    }
  });

  ฟอร์ม.addEventListener("submit", async function (e) {
    e.preventDefault();
    ซ่อนเตือน();

    var name = ช่องชื่อ.value.trim();
    var email = ช่องอีเมล.value.trim();
    var password = ช่องรหัสผ่าน.value;
    var department = ช่องแผนก.value.trim();
    var role = ช่องบทบาท.value || "employee";

    if (!name || !email || !password) {
      เตือน("กรุณากรอกชื่อ-นามสกุล อีเมล และรหัสผ่านให้ครบถ้วน");
      return;
    }

    if (password.length < 6) {
      เตือน("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    ปุ่ม.disabled = true;
    ปุ่ม.textContent = "กำลังสร้างบัญชี…";

    try {
      sessionStorage.setItem("just_registered", "1");

      // 1. สร้างบัญชีใน Firebase Auth
      var cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
      var user = cred.user;

      // 2. อัปเดต Display Name
      try {
        await user.updateProfile({ displayName: name });
      } catch (profileErr) {
        console.warn("ไม่สามารถตั้งค่า displayName:", profileErr);
      }

      // 3. บันทึกข้อมูลลงคอลเลกชัน users ด้วย ID เดียวกับ UID
      await window.db.collection("users").doc(user.uid).set({
        name: name,
        email: email,
        department: department,
        role: role,
        createdAt: typeof เวลาตอนนี้ === "function" ? เวลาตอนนี้() : new Date().toISOString()
      });

      sessionStorage.removeItem("just_registered");
      กล่องสำเร็จ.textContent = "✅ สมัครสมาชิกสำเร็จ กำลังพาเข้าสู่ระบบ…";
      กล่องสำเร็จ.classList.remove("hidden");

      setTimeout(function () {
        location.href = "leave-requests.html";
      }, 700);
    } catch (err) {
      sessionStorage.removeItem("just_registered");
      console.error("Register error:", err);
      var msg = "สมัครสมาชิกไม่สำเร็จ: ";
      if (err.code === "auth/email-already-in-use") {
        msg += "อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่นหรือเข้าสู่ระบบ";
      } else if (err.code === "auth/weak-password") {
        msg += "รหัสผ่านง่ายเกินไป ต้องมีความยาวอย่างน้อย 6 ตัวอักษร";
      } else if (err.code === "auth/invalid-email") {
        msg += "รูปแบบอีเมลไม่ถูกต้อง";
      } else {
        msg += err.message;
      }
      เตือน(msg);
      ปุ่ม.disabled = false;
      ปุ่ม.textContent = "ยืนยันการสมัครสมาชิก";
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
