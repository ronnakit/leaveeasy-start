// ─────────────────────────────────────────────────────────────
// js/firebase-config.js — ตั้งค่าการเชื่อมต่อ Firebase/Firestore
// สัปดาห์ที่ 6 — ใช้เฉพาะอ่านข้อมูล (Firestore) ยังไม่มีล็อกอิน
//
// ใช้ Firebase SDK แบบ "compat" (แบบเก่า ผ่าน <script> ธรรมดา)
// แทนแบบ ES module เพราะแบบ module โหลดไม่ได้เมื่อเปิดไฟล์ตรงๆ
// ด้วยการดับเบิลคลิก (file://) — ต้องใช้เซิร์ฟเวอร์เท่านั้น
// ส่วนแบบ compat นี้เปิดได้ทั้งสองแบบ
// ─────────────────────────────────────────────────────────────

var firebaseConfig = {
  apiKey: "AIzaSyBiKKunsVyjDMo3rknQuIx9dWaSjjycDTI",
  authDomain: "leaveeasy-ronnakit.firebaseapp.com",
  projectId: "leaveeasy-ronnakit",
  storageBucket: "leaveeasy-ronnakit.firebasestorage.app",
  messagingSenderId: "808816524698",
  appId: "1:808816524698:web:573925d51a9195ada6ce23",
  measurementId: "G-HYXQ8X7VQ5",
};

firebase.initializeApp(firebaseConfig);
window.db = firebase.firestore();
