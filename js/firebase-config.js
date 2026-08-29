// ─────────────────────────────────────────────────────────────
// js/firebase-config.js — ตั้งค่าการเชื่อมต่อ Firebase/Firestore
// สัปดาห์ที่ 6 — ใช้เฉพาะอ่านข้อมูล (Firestore) ยังไม่มีล็อกอิน
//
// ไฟล์นี้เป็น ES module (import จาก CDN ตรงๆ) แต่ expose ทุกอย่าง
// เป็น window.* เพื่อให้ไฟล์อื่นยังเป็น classic script ธรรมดาได้
// ─────────────────────────────────────────────────────────────

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBiKKunsVyjDMo3rknQuIx9dWaSjjycDTI",
  authDomain: "leaveeasy-ronnakit.firebaseapp.com",
  projectId: "leaveeasy-ronnakit",
  storageBucket: "leaveeasy-ronnakit.firebasestorage.app",
  messagingSenderId: "808816524698",
  appId: "1:808816524698:web:573925d51a9195ada6ce23",
  measurementId: "G-HYXQ8X7VQ5",
};

const app = initializeApp(firebaseConfig);

window.db = getFirestore(app);
window.collection = collection;
window.getDocs = getDocs;
window.doc = doc;
window.setDoc = setDoc;
