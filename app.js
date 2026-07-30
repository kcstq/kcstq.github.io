/* =========================================================
   LockedIn – app.js
   Enthält die gesamte Logik der App.
   Alles ist bewusst ausführlich kommentiert, damit du jeden
   Schritt nachvollziehen kannst.
   ========================================================= */
import { db } from "./firebase-init.js";
import {
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { auth } from "./firebase-init.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ---------- 1. Hilfsfunktionen für Datum ----------
// Wir arbeiten immer mit dem Format "YYYY-MM-DD", weil man
// solche Strings einfach vergleichen und sortieren kann.
function todayKey() {
  const d = new Date();
  return d.toISOString().slice(0, 10); // z.B. "2026-07-29"
}

// Gibt den Tag VOR einem gegebenen Datum zurück (auch als "YYYY-MM-DD")
function previousDayKey(dateKey) {
  const d = new Date(dateKey);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

// ---------- 2. Daten laden & speichern ----------
// localStorage kann nur Text speichern, deshalb wandeln wir
// unsere Daten mit JSON.stringify / JSON.parse um.
let currentUserId = null;

async function loadHabits(uid) {
  const snap = await getDoc(doc(db, "habits", uid));
  return snap.exists() ? snap.data().list : [];
}

async function saveHabits(habitsToSave) {
  if (!currentUserId) return;
  await setDoc(doc(db, "habits", currentUserId), { list: habitsToSave });
}

// Jede Gewohnheit sieht so aus:
// {
//   id: "abc123",
//   name: "10 Min. lesen",
//   type: "good" | "bad",
//   history: ["2026-07-27", "2026-07-28"]   // Liste erledigter Tage
// }

let habits = [];
let currentFilter = "all";

// ---------- 3. Streak berechnen ----------
// Ein Streak zählt, wie viele Tage IN FOLGE bis heute erledigt wurden.
function calculateStreak(habit) {
  const historySet = new Set(habit.history);
  let streak = 0;
  let cursor = todayKey();

  // Falls heute schon erledigt ist, zählt heute mit.
  // Falls nicht, schauen wir trotzdem rückwärts, ob gestern
  // erledigt wurde (damit der Streak nicht sofort auf 0 springt,
  // nur weil man den heutigen Tag noch nicht abgehakt hat).
  if (!historySet.has(cursor)) {
    cursor = previousDayKey(cursor);
  }

  while (historySet.has(cursor)) {
    streak++;
    cursor = previousDayKey(cursor);
  }

  return streak;
}

// ---------- 4. Rendern (Anzeigen) der Liste ----------
const habitList = document.getElementById("habitList");
const emptyState = document.getElementById("emptyState");

function render() {
  // Alle bestehenden Karten entfernen (außer dem Empty-State-Element)
  habitList.querySelectorAll(".habit-card").forEach((el) => el.remove());

  const visibleHabits = habits.filter((h) => {
    if (currentFilter === "all") return true;
    return h.type === currentFilter;
  });

  emptyState.style.display = visibleHabits.length === 0 ? "block" : "none";

  visibleHabits.forEach((habit) => {
    const isDoneToday = habit.history.includes(todayKey());
    const streak = calculateStreak(habit);

    const card = document.createElement("div");
    card.className = "habit-card" + (isDoneToday ? " done" : "");
    card.dataset.type = habit.type;
    card.dataset.id = habit.id;

    card.innerHTML = `
      <button class="check-btn ${isDoneToday ? "checked" : ""}" aria-label="Heute abhaken">
        ${isDoneToday ? "✓" : ""}
      </button>
      <div class="habit-info">
        <p class="habit-name">${escapeHtml(habit.name)}</p>
        <p class="habit-meta">${habit.type === "good" ? "Aufbauen" : "Abgewöhnen"}</p>
      </div>
      <div class="streak">${streak}🔥</div>
      <button class="delete-btn" aria-label="Löschen">✕</button>
    `;

    // Klick auf den Check-Button: heutigen Tag umschalten
    card.querySelector(".check-btn").addEventListener("click", (e) => {
      toggleToday(habit.id);
      e.currentTarget.classList.add("pop");
    });

    // Klick auf Löschen
    card.querySelector(".delete-btn").addEventListener("click", () => {
      deleteHabit(habit.id);
    });

    habitList.appendChild(card);
  });
}

// Verhindert, dass eingegebener Text als HTML interpretiert wird
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- 5. Aktionen ----------
async function toggleToday(id) {
  const habit = habits.find((h) => h.id === id);
  const key = todayKey();
  const index = habit.history.indexOf(key);

  if (index === -1) {
    habit.history.push(key);
  } else {
    habit.history.splice(index, 1);
  }

  await saveHabits(habits);
  render();
}

async function deleteHabit(id) {
  habits = habits.filter((h) => h.id !== id);
  await saveHabits(habits);
  render();
}

async function addHabit(name, type) {
  habits.push({
    id: crypto.randomUUID(),
    name,
    type,
    history: [],
  });
  await saveHabits(habits);
  render();
}

// ---------- 6. Datum im Header anzeigen ----------
document.getElementById("todayLabel").textContent = new Date().toLocaleDateString("de-DE", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

// ---------- 7. Filter-Tabs ----------
document.getElementById("filterTabs").addEventListener("click", (e) => {
  const btn = e.target.closest(".tab");
  if (!btn) return;

  document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
  btn.classList.add("active");
  currentFilter = btn.dataset.filter;
  render();
});

// ---------- 8. Modal (Formular zum Hinzufügen) ----------
const modalBackdrop = document.getElementById("modalBackdrop");
const habitForm = document.getElementById("habitForm");
let selectedType = "good";

document.getElementById("addBtn").addEventListener("click", () => {
  modalBackdrop.classList.add("open");
  document.getElementById("habitName").focus();
});

document.getElementById("cancelBtn").addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", (e) => {
  if (e.target === modalBackdrop) closeModal();
});

function closeModal() {
  modalBackdrop.classList.remove("open");
  habitForm.reset();
  selectedType = "good";
  document.querySelectorAll(".type-btn").forEach((b) => b.classList.remove("active"));
  document.querySelector('.type-btn[data-type="good"]').classList.add("active");
}

document.querySelectorAll(".type-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".type-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedType = btn.dataset.type;
  });
});

habitForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("habitName").value.trim();
  if (!name) return;
  addHabit(name, selectedType);
  closeModal();
});

// ---------- 9. Service Worker registrieren (macht die App installierbar) ----------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((err) => {
      console.log("Service Worker Registrierung fehlgeschlagen:", err);
    });
  });
}

// ---------- 10. Erstes Rendern beim Laden der Seite ----------
render();

// ---------- 11. Login / Registrierung ----------
const authScreen = document.getElementById("authScreen");
const appContent = document.getElementById("appContent");
const authError = document.getElementById("authError");

function showError(message) {
  authError.textContent = message;
}

document.getElementById("loginBtn").addEventListener("click", async () => {
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    showError("Anmeldung fehlgeschlagen: " + err.message);
  }
});

document.getElementById("registerBtn").addEventListener("click", async () => {
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;

  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (err) {
    showError("Registrierung fehlgeschlagen: " + err.message);
  }
});

// Reagiert automatisch, sobald sich der Login-Status ändert
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUserId = user.uid;
    authScreen.style.display = "none";
    appContent.style.display = "block";

    habits = await loadHabits(currentUserId);
    render();
  } else {
    currentUserId = null;
    habits = [];
    authScreen.style.display = "flex";
    appContent.style.display = "none";
  }
});