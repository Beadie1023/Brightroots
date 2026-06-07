/* BrightRoots Adventure - Main App */
import "./index.css";
import type { Lesson } from "./lessons/types";
import { pick, shuffle } from "./lessons/types";
import { ALL_LESSONS } from "./lessons";

// ── Types ──────────────────────────────────────────────────────────────────
interface Profile {
  id: number;
  name: string;
  ageGroup: "2-3" | "4-5" | "6-7";
  avatar?: string;
  coins: number;
  streak: number;
  progress: Record<string, number>;
  accuracy: Record<string, number>;
  createdAt: string;
}

interface PendingSync {
  profileId: number;
  subject: string;
  correct: boolean;
  coins: number;
  ts: number;
}

interface TempProfile {
  tempId: number;
  name: string;
  ageGroup: string;
  avatar: string;
}

// ── State ──────────────────────────────────────────────────────────────────
let currentProfile: Profile | null = null;
let currentSubject = "";
let currentLesson: Lesson | null = null;
let lessonQueue: Lesson[] = [];
let lessonIndex = 0;
let sessionCorrect = 0;
let sessionTotal = 0;
const LESSONS_PER_SESSION = 5;
const BASE_PATH = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

// ── Parent Auth Token ─────────────────────────────────────────────────────
const TOKEN_KEY = "br_parent_token";
function getParentToken(): string | null { return localStorage.getItem(TOKEN_KEY); }
function setParentToken(t: string) { localStorage.setItem(TOKEN_KEY, t); }
function clearParentToken() { localStorage.removeItem(TOKEN_KEY); }
function parentAuthHeaders(): Record<string, string> {
  const t = getParentToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// ── Adaptive Learning ───────────────────────────────────────────────────────
function getDifficulty(profile: Profile, subject: string): "easy" | "medium" | "hard" {
  const acc = (profile.accuracy[subject] ?? 0.5);
  if (acc >= 0.75) return "hard";
  if (acc >= 0.4) return "medium";
  return "easy";
}

function getLevelRange(difficulty: "easy" | "medium" | "hard"): [number, number] {
  if (difficulty === "easy") return [1, 3];
  if (difficulty === "medium") return [3, 6];
  return [6, 10];
}

function pickLessons(profile: Profile, subject: string, count: number): Lesson[] {
  const age = profile.ageGroup;
  const diff = getDifficulty(profile, subject);
  const [minL, maxL] = getLevelRange(diff);
  const candidates = ALL_LESSONS.filter(
    l => l.subject === subject && l.age === age && l.level >= minL && l.level <= maxL
  );
  if (candidates.length === 0) {
    return ALL_LESSONS.filter(l => l.subject === subject).slice(0, count);
  }
  return shuffle(candidates).slice(0, count);
}

// ── Voice ───────────────────────────────────────────────────────────────────
function speak(text: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.85;
  utter.pitch = 1.1;
  window.speechSynthesis.speak(utter);
}

function autoSpeak(profile: Profile, text: string) {
  if (profile.ageGroup === "2-3" || profile.ageGroup === "4-5") {
    speak(text);
  }
}

// ── API ─────────────────────────────────────────────────────────────────────
const API = `${BASE_PATH}/api`;

async function apiGetProfiles(): Promise<Profile[]> {
  try {
    const res = await fetch(`${API}/profiles`, { headers: parentAuthHeaders() });
    if (res.status === 401) { clearParentToken(); return getLocalProfiles(); }
    const data = await res.json();
    const profiles = data.map(attachAvatar);
    reconcileTempProfiles(profiles);
    return profiles;
  } catch { return getLocalProfiles(); }
}

async function apiCreateProfile(name: string, ageGroup: string, avatar: string): Promise<Profile | null> {
  try {
    const res = await fetch(`${API}/profiles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, ageGroup }),
    });
    const data = await res.json();
    const profile: Profile = { ...attachAvatar(data), avatar };
    saveLocalProfile(profile);
    return profile;
  } catch {
    const tempId = Date.now();
    const profile: Profile = {
      id: tempId, name, ageGroup: ageGroup as Profile["ageGroup"], avatar,
      coins: 0, streak: 0, progress: {}, accuracy: {}, createdAt: new Date().toISOString(),
    };
    saveLocalProfile(profile);
    saveTempProfile({ tempId, name, ageGroup, avatar });
    return profile;
  }
}

async function apiUpdateProgress(profileId: number, subject: string, correct: boolean, coins: number) {
  const ls = getLocalProfiles();
  const idx = ls.findIndex(p => p.id === profileId);
  if (idx !== -1) {
    const p = ls[idx];
    p.coins += coins;
    const prevTotal = p.progress[subject] || 0;
    const prevAcc = p.accuracy[subject] || 0;
    p.progress[subject] = prevTotal + 1;
    p.accuracy[subject] = (prevAcc * prevTotal + (correct ? 1 : 0)) / (prevTotal + 1);
    ls[idx] = p;
    localStorage.setItem("br_profiles", JSON.stringify(ls));
    if (currentProfile?.id === profileId) currentProfile = p;
  }
  try {
    await fetch(`${API}/profiles/${profileId}/progress`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, correct, coins }),
    });
  } catch {
    queueSync({ profileId, subject, correct, coins, ts: Date.now() });
  }
}

async function apiDeleteProfile(id: number) {
  const ls = getLocalProfiles().filter(p => p.id !== id);
  localStorage.setItem("br_profiles", JSON.stringify(ls));
  try {
    await fetch(`${API}/profiles/${id}`, { method: "DELETE", headers: parentAuthHeaders() });
  } catch { /* offline */ }
}

// ── Local Storage ────────────────────────────────────────────────────────────
function getLocalProfiles(): Profile[] {
  try { return JSON.parse(localStorage.getItem("br_profiles") || "[]"); } catch { return []; }
}
function saveLocalProfile(profile: Profile) {
  const ls = getLocalProfiles();
  const idx = ls.findIndex(p => p.id === profile.id);
  if (idx === -1) ls.push(profile); else ls[idx] = profile;
  localStorage.setItem("br_profiles", JSON.stringify(ls));
}
function attachAvatar(p: Profile): Profile {
  const ls = getLocalProfiles();
  const local = ls.find(l => l.id === p.id);
  return { ...p, avatar: local?.avatar ?? p.avatar ?? "🐻" };
}

// ── Offline Sync Queue ────────────────────────────────────────────────────────
function getSyncQueue(): PendingSync[] {
  try { return JSON.parse(localStorage.getItem("br_sync_queue") || "[]"); } catch { return []; }
}
function queueSync(entry: PendingSync) {
  const q = getSyncQueue();
  q.push(entry);
  localStorage.setItem("br_sync_queue", JSON.stringify(q));
}
async function drainSyncQueue() {
  const q = getSyncQueue();
  if (q.length === 0) return;
  const failed: PendingSync[] = [];
  for (const entry of q) {
    try {
      const res = await fetch(`${API}/profiles/${entry.profileId}/progress`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: entry.subject, correct: entry.correct, coins: entry.coins }),
      });
      if (!res.ok) failed.push(entry);
    } catch {
      failed.push(entry);
      break;
    }
  }
  localStorage.setItem("br_sync_queue", JSON.stringify(failed));
}

// ── Temp Profile Registry (offline creation) ──────────────────────────────────
function getTempProfiles(): TempProfile[] {
  try { return JSON.parse(localStorage.getItem("br_temp_profiles") || "[]"); } catch { return []; }
}
function saveTempProfile(entry: TempProfile) {
  const existing = getTempProfiles();
  existing.push(entry);
  localStorage.setItem("br_temp_profiles", JSON.stringify(existing));
}
function reconcileTempProfiles(liveProfiles: Profile[]) {
  const temps = getTempProfiles();
  if (temps.length === 0) return;

  const localProfiles = getLocalProfiles();
  let anyReconciled = false;

  for (const temp of temps) {
    const match = liveProfiles.find(
      lp => lp.name.toLowerCase() === temp.name.toLowerCase() && lp.ageGroup === temp.ageGroup
    );
    if (!match) continue;

    const localTemp = localProfiles.find(lp => lp.id === temp.tempId);
    if (localTemp) {
      const merged: Profile = {
        ...match,
        avatar: temp.avatar,
        coins: Math.max(match.coins, localTemp.coins),
        streak: Math.max(match.streak, localTemp.streak),
        progress: mergeProgress(match.progress, localTemp.progress),
        accuracy: mergeAccuracy(match.accuracy, localTemp.accuracy, match.progress, localTemp.progress),
      };
      saveLocalProfile(merged);

      const syncQ = getSyncQueue();
      const remapped = syncQ.map(e => e.profileId === temp.tempId ? { ...e, profileId: match.id } : e);
      localStorage.setItem("br_sync_queue", JSON.stringify(remapped));

      const remaining = localProfiles.filter(lp => lp.id !== temp.tempId);
      localStorage.setItem("br_profiles", JSON.stringify(remaining));
    }

    anyReconciled = true;
  }

  if (anyReconciled) {
    const remainingTemps = temps.filter(t => !liveProfiles.find(
      lp => lp.name.toLowerCase() === t.name.toLowerCase() && lp.ageGroup === t.ageGroup
    ));
    localStorage.setItem("br_temp_profiles", JSON.stringify(remainingTemps));
  }
}

function mergeProgress(live: Record<string, number>, local: Record<string, number>): Record<string, number> {
  const result: Record<string, number> = { ...live };
  for (const [s, v] of Object.entries(local)) {
    result[s] = Math.max(result[s] ?? 0, v);
  }
  return result;
}

function mergeAccuracy(
  liveAcc: Record<string, number>, localAcc: Record<string, number>,
  liveProgress: Record<string, number>, localProgress: Record<string, number>
): Record<string, number> {
  const result: Record<string, number> = { ...liveAcc };
  for (const [s, localA] of Object.entries(localAcc)) {
    if (result[s] === undefined) {
      result[s] = localA;
    } else {
      const liveN = liveProgress[s] ?? 0;
      const localN = localProgress[s] ?? 0;
      const total = liveN + localN;
      result[s] = total > 0 ? (result[s] * liveN + localA * localN) / total : result[s];
    }
  }
  return result;
}

// ── Screen Management ─────────────────────────────────────────────────────────
function showScreen(id: string) {
  document.querySelectorAll<HTMLElement>(".screen").forEach(s => s.classList.remove("active"));
  const el = document.getElementById(id);
  if (el) { el.classList.add("active"); el.scrollTop = 0; }
}

// ── WELCOME ───────────────────────────────────────────────────────────────────
document.getElementById("btn-start")?.addEventListener("click", () => {
  showScreen("screen-profiles");
  loadProfiles();
});

// ── PROFILES ─────────────────────────────────────────────────────────────────
async function loadProfiles() {
  const list = document.getElementById("profile-list")!;
  list.innerHTML = `<div class="profile-empty">Loading...</div>`;
  await drainSyncQueue();
  const profiles = await apiGetProfiles();
  renderProfileList(profiles);
}

function renderProfileList(profiles: Profile[]) {
  const list = document.getElementById("profile-list")!;
  if (profiles.length === 0) {
    list.innerHTML = `<div class="profile-empty">No profiles yet!<br/>Tap <strong>New</strong> to add a learner.</div>`;
    return;
  }
  list.innerHTML = profiles.map(p => `
    <div class="profile-card" data-id="${p.id}">
      <button class="del-btn" data-id="${p.id}" title="Delete">✕</button>
      <span class="card-avatar">${p.avatar ?? "🐻"}</span>
      <div class="card-name">${escHtml(p.name)}</div>
      <div class="card-age">Ages ${p.ageGroup}</div>
      <div class="card-coins">🪙 ${p.coins}</div>
    </div>
  `).join("");

  list.querySelectorAll<HTMLElement>(".profile-card").forEach(card => {
    card.addEventListener("click", e => {
      if ((e.target as HTMLElement).classList.contains("del-btn")) return;
      const id = parseInt(card.dataset.id!);
      const profile = profiles.find(p => p.id === id);
      if (profile) selectProfile(profile);
    });
  });
  list.querySelectorAll<HTMLButtonElement>(".del-btn").forEach(btn => {
    btn.addEventListener("click", async e => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id!);
      if (confirm("Delete this profile?")) {
        await apiDeleteProfile(id);
        loadProfiles();
      }
    });
  });
}

document.getElementById("btn-add-profile")?.addEventListener("click", () => showScreen("screen-create-profile"));
document.getElementById("btn-parent-mode")?.addEventListener("click", () => { showParentDash(null); });

// ── CREATE PROFILE ────────────────────────────────────────────────────────────
let selectedAvatar = "🐻";
let selectedAge = "";

document.getElementById("avatar-picker")?.querySelectorAll<HTMLElement>(".avatar-opt").forEach(opt => {
  opt.addEventListener("click", () => {
    document.querySelectorAll(".avatar-opt").forEach(o => o.classList.remove("active"));
    opt.classList.add("active");
    selectedAvatar = opt.dataset.avatar!;
  });
});

document.getElementById("age-picker")?.querySelectorAll<HTMLElement>(".age-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".age-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedAge = btn.dataset.age!;
  });
});

document.getElementById("btn-back-to-profiles")?.addEventListener("click", () => {
  showScreen("screen-profiles");
  loadProfiles();
});

document.getElementById("btn-create-profile")?.addEventListener("click", async () => {
  const nameInput = document.getElementById("input-name") as HTMLInputElement;
  const errorDiv = document.getElementById("create-error")!;
  const name = nameInput.value.trim();
  if (!name) { errorDiv.textContent = "Please enter a name!"; return; }
  if (!selectedAge) { errorDiv.textContent = "Please pick an age group!"; return; }
  errorDiv.textContent = "";
  const profile = await apiCreateProfile(name, selectedAge, selectedAvatar);
  if (profile) {
    nameInput.value = "";
    selectedAge = "";
    document.querySelectorAll(".age-btn").forEach(b => b.classList.remove("active"));
    selectProfile(profile);
  }
});

// ── SELECT PROFILE ────────────────────────────────────────────────────────────
function selectProfile(profile: Profile) {
  currentProfile = profile;
  updateDashboard();
  showScreen("screen-dashboard");
  speak(`Hello ${profile.name}! Let's learn today!`);
}

function updateDashboard() {
  if (!currentProfile) return;
  const p = currentProfile;
  document.getElementById("dash-avatar")!.textContent = p.avatar ?? "🐻";
  document.getElementById("dash-name")!.textContent = p.name;
  document.getElementById("dash-coins")!.textContent = String(p.coins);
  document.getElementById("dash-streak")!.textContent = String(p.streak);
  const total = Object.values(p.progress).reduce((s, v) => s + v, 0);
  const pct = Math.min(100, (total % 20) * 5);
  const bar = document.getElementById("dash-progress-bar") as HTMLElement;
  bar.style.width = pct + "%";
}

document.getElementById("btn-switch-profile")?.addEventListener("click", () => {
  currentProfile = null;
  showScreen("screen-profiles");
  loadProfiles();
});

// ── DASHBOARD SUBJECTS ────────────────────────────────────────────────────────
document.querySelectorAll<HTMLElement>(".subject-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    if (!currentProfile) return;
    currentSubject = btn.dataset.subject!;
    startSubject(currentSubject);
  });
});

function subjectLabel(subject: string): string {
  const map: Record<string, string> = {
    math: "🌴 Math", reading: "📚 Reading", logic: "🧠 Logic",
    money: "🏦 Money", grammar: "✍️ Grammar", spelling: "🔤 Spelling",
  };
  return map[subject] ?? subject;
}

function startSubject(subject: string) {
  if (!currentProfile) return;
  lessonQueue = pickLessons(currentProfile, subject, LESSONS_PER_SESSION);
  if (lessonQueue.length === 0) {
    alert("No lessons available for this age group yet. Keep growing!");
    return;
  }
  lessonIndex = 0;
  sessionCorrect = 0;
  sessionTotal = 0;
  document.getElementById("lesson-subject-label")!.textContent = subjectLabel(subject);
  loadLesson();
  showScreen("screen-lesson");
}

document.getElementById("btn-back-to-dash")?.addEventListener("click", () => {
  window.speechSynthesis?.cancel();
  if (currentProfile) { updateDashboard(); showScreen("screen-dashboard"); }
});

// ── LESSON ─────────────────────────────────────────────────────────────────────
function loadLesson() {
  if (!currentProfile || lessonIndex >= lessonQueue.length) {
    finishSession();
    return;
  }
  currentLesson = lessonQueue[lessonIndex];
  const story = document.getElementById("lesson-story")!;
  const question = document.getElementById("lesson-question")!;
  const optGrid = document.getElementById("lesson-options")!;
  const reward = document.getElementById("lesson-reward")!;

  story.textContent = currentLesson.story;
  question.textContent = currentLesson.question;
  reward.textContent = String(currentLesson.reward);

  optGrid.innerHTML = currentLesson.options.map(opt =>
    `<button class="option-btn">${escHtml(opt)}</button>`
  ).join("");

  optGrid.querySelectorAll<HTMLButtonElement>(".option-btn").forEach(btn => {
    btn.addEventListener("click", () => handleAnswer(btn));
  });

  renderDots();
  autoSpeak(currentProfile, currentLesson.question);
}

function renderDots() {
  const dots = document.getElementById("lesson-dots")!;
  dots.innerHTML = lessonQueue.map((_, i) =>
    `<div class="dot ${i < lessonIndex ? "done" : i === lessonIndex ? "active" : ""}"></div>`
  ).join("");
}

function handleAnswer(btn: HTMLButtonElement) {
  if (!currentLesson || !currentProfile) return;
  const isCorrect = btn.textContent?.trim() === currentLesson.answer.trim();
  const opts = document.querySelectorAll<HTMLButtonElement>(".option-btn");
  opts.forEach(b => {
    b.disabled = true;
    if (b.textContent?.trim() === currentLesson!.answer.trim()) b.classList.add("correct");
  });
  if (!isCorrect) btn.classList.add("wrong");

  sessionTotal++;
  if (isCorrect) sessionCorrect++;

  const reward = isCorrect ? currentLesson.reward : 0;

  apiUpdateProgress(currentProfile.id, currentSubject, isCorrect, reward);

  setTimeout(() => {
    if (isCorrect) {
      showReward(reward, currentLesson!.question);
    } else {
      showWrong(currentLesson!.answer);
    }
  }, 600);
}

document.getElementById("btn-speak")?.addEventListener("click", () => {
  if (currentLesson) speak(`${currentLesson.story} ${currentLesson.question}`);
});

// ── REWARD ─────────────────────────────────────────────────────────────────────
const rewardEmojis = ["⭐", "🏆", "🎉", "🌟", "✨", "🎊", "🥇", "💫"];
const rewardTitles = ["Amazing!", "Fantastic!", "You Rock!", "Brilliant!", "Super!", "Excellent!", "Awesome!"];

function showReward(coins: number, question: string) {
  const emoji = pick(rewardEmojis);
  const title = pick(rewardTitles);
  document.getElementById("reward-emoji")!.textContent = emoji;
  document.getElementById("reward-title")!.textContent = title;
  document.getElementById("reward-msg")!.textContent = "You got it right!";
  document.getElementById("reward-coins")!.textContent = String(coins);
  showScreen("screen-reward");
  speak(title);
  launchConfetti();
}

document.getElementById("btn-next-lesson")?.addEventListener("click", () => {
  lessonIndex++;
  loadLesson();
  showScreen("screen-lesson");
});

document.getElementById("btn-reward-home")?.addEventListener("click", () => {
  if (currentProfile) { updateDashboard(); showScreen("screen-dashboard"); }
});

// ── WRONG ──────────────────────────────────────────────────────────────────────
function showWrong(correctAnswer: string) {
  document.getElementById("correct-answer-box")!.textContent = correctAnswer;
  showScreen("screen-wrong");
  speak("Not quite! The correct answer is " + correctAnswer);
}

document.getElementById("btn-try-next")?.addEventListener("click", () => {
  lessonIndex++;
  if (lessonIndex >= lessonQueue.length) {
    finishSession();
  } else {
    loadLesson();
    showScreen("screen-lesson");
  }
});

// ── FINISH SESSION ──────────────────────────────────────────────────────────────
function finishSession() {
  if (currentProfile) {
    const accuracy = sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : 0;
    const totalCoins = lessonQueue.reduce((s, l) => s + l.reward, 0);
    document.getElementById("reward-emoji")!.textContent = accuracy >= 60 ? "🏆" : "💪";
    document.getElementById("reward-title")!.textContent = `Session Complete!`;
    document.getElementById("reward-msg")!.textContent = `You got ${sessionCorrect}/${sessionTotal} correct! (${accuracy}%)`;
    document.getElementById("reward-coins")!.textContent = String(lessonQueue.reduce((s, _) => s + sessionCorrect > 0 ? 5 : 0, 0));
    showScreen("screen-reward");
    if (accuracy >= 60) { speak("Great job! Session complete!"); launchConfetti(); }
    else speak("Session complete! Keep practicing!");
  }
}

// ── PIN ENTRY ──────────────────────────────────────────────────────────────────
function showPinEntry(onSuccess: () => void) {
  document.getElementById("pin-modal")?.remove();
  const modal = document.createElement("div");
  modal.id = "pin-modal";
  modal.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px";
  modal.innerHTML = `
    <div style="background:#fff;border-radius:20px;padding:32px;max-width:320px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.3)">
      <div style="font-size:44px;margin-bottom:8px">🔐</div>
      <h2 style="margin:0 0 6px;color:#1e293b;font-size:20px">Parent Access</h2>
      <p style="color:#64748b;margin:0 0 18px;font-size:13px">Enter your 4-digit PIN to view the parent dashboard.</p>
      <input id="pin-input" type="password" inputmode="numeric" maxlength="4" placeholder="• • • •"
        style="width:100%;font-size:28px;text-align:center;padding:12px;border:2px solid #e2e8f0;border-radius:12px;box-sizing:border-box;letter-spacing:10px;outline:none;transition:border-color .2s"/>
      <p id="pin-error" style="color:#ef4444;font-size:13px;margin:8px 0 0;min-height:18px"></p>
      <button id="pin-submit" style="margin-top:10px;width:100%;padding:14px;background:#6366f1;color:#fff;border:none;border-radius:12px;font-size:16px;font-weight:600;cursor:pointer">
        Unlock Dashboard
      </button>
      <button id="pin-cancel" style="margin-top:8px;width:100%;padding:10px;background:transparent;color:#64748b;border:none;font-size:14px;cursor:pointer">
        Cancel
      </button>
    </div>`;
  document.body.appendChild(modal);
  const input = modal.querySelector<HTMLInputElement>("#pin-input")!;
  const errorEl = modal.querySelector<HTMLElement>("#pin-error")!;
  const submitBtn = modal.querySelector<HTMLButtonElement>("#pin-submit")!;
  const cancelBtn = modal.querySelector<HTMLButtonElement>("#pin-cancel")!;
  input.focus();
  input.addEventListener("input", () => { if (input.value.length === 4) submitPin(); });
  submitBtn.addEventListener("click", submitPin);
  cancelBtn.addEventListener("click", () => modal.remove());
  async function submitPin() {
    const pin = input.value.trim();
    if (pin.length < 4) { errorEl.textContent = "Please enter your 4-digit PIN."; return; }
    submitBtn.disabled = true;
    submitBtn.textContent = "Checking…";
    try {
      const res = await fetch(`${API}/auth/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        const { token } = await res.json() as { token: string };
        setParentToken(token);
        modal.remove();
        onSuccess();
      } else {
        errorEl.textContent = "Incorrect PIN. Try again.";
        input.value = "";
        input.focus();
        submitBtn.disabled = false;
        submitBtn.textContent = "Unlock Dashboard";
      }
    } catch {
      errorEl.textContent = "Cannot reach server. Check connection.";
      submitBtn.disabled = false;
      submitBtn.textContent = "Unlock Dashboard";
    }
  }
}

// ── PARENT DASHBOARD ───────────────────────────────────────────────────────────
async function showParentDash(profile: Profile | null) {
  if (!getParentToken()) {
    showPinEntry(() => showParentDash(profile));
    return;
  }
  showScreen("screen-parent");
  const content = document.getElementById("parent-content")!;
  content.innerHTML = `<div class="parent-card"><p>Loading…</p></div>`;
  let profiles: Profile[];
  if (profile) {
    profiles = [profile];
  } else {
    profiles = await apiGetProfiles();
    if (!getParentToken()) {
      showPinEntry(() => showParentDash(null));
      return;
    }
  }

  if (profiles.length === 0) {
    content.innerHTML = `<div class="parent-card"><p>No profiles yet.</p></div>`;
    return;
  }

  content.innerHTML = profiles.map(p => {
    const subjects = ["math", "reading", "logic", "money", "grammar", "spelling"];
    const bars = subjects.map(s => {
      const acc = p.accuracy[s] ?? 0;
      const total = p.progress[s] ?? 0;
      return `<div class="subject-bar-row">
        <div class="sbr-label">
          <span>${subjectLabel(s)}</span>
          <span>${total} lessons · ${Math.round(acc * 100)}%</span>
        </div>
        <div class="sbr-bar"><div class="sbr-fill" style="width:${Math.round(acc * 100)}%"></div></div>
      </div>`;
    }).join("");

    const totalLessons = Object.values(p.progress).reduce((s, v) => s + v, 0);
    const accs = Object.entries(p.accuracy);
    const strongest = accs.sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    const weakest = accs.sort((a, b) => a[1] - b[1])[0]?.[0] ?? "—";

    return `<div class="parent-card">
      <h3>${p.avatar ?? "🐻"} ${escHtml(p.name)} — Age ${p.ageGroup}</h3>
      <div class="stat-row"><span class="label">Total Lessons</span><span class="val">${totalLessons}</span></div>
      <div class="stat-row"><span class="label">Total Coins</span><span class="val">🪙 ${p.coins}</span></div>
      <div class="stat-row"><span class="label">Streak</span><span class="val">🔥 ${p.streak}</span></div>
      <div class="stat-row"><span class="label">Strongest Subject</span><span class="val">${subjectLabel(strongest)}</span></div>
      <div class="stat-row"><span class="label">Weakest Subject</span><span class="val">${subjectLabel(weakest)}</span></div>
      <hr style="margin:12px 0;border-color:#f3f4f6"/>
      ${bars}
      <button class="btn btn-ghost btn-sm reset-btn" style="margin-top:12px;width:100%" data-reset="${p.id}">🔄 Reset Progress</button>
    </div>`;
  }).join("");

  content.querySelectorAll<HTMLButtonElement>(".reset-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = parseInt(btn.dataset.reset!);
      if (!confirm("Reset all progress for this learner? This cannot be undone.")) return;

      btn.disabled = true;
      btn.textContent = "Resetting…";

      try {
        const res = await fetch(`${API}/profiles/${id}/reset`, { method: "PUT", headers: parentAuthHeaders() });
        if (!res.ok) throw new Error("server error");
        const updated: Profile = await res.json();

        const ls = getLocalProfiles();
        const idx = ls.findIndex(p => p.id === id);
        if (idx !== -1) {
          ls[idx] = { ...ls[idx], coins: 0, streak: 0, progress: {}, accuracy: {} };
          localStorage.setItem("br_profiles", JSON.stringify(ls));
        }
        localStorage.removeItem(`br_progress_${id}`);

        const q = getSyncQueue().filter(e => e.profileId !== id);
        localStorage.setItem("br_sync_queue", JSON.stringify(q));

        if (currentProfile?.id === id) {
          currentProfile = { ...currentProfile, coins: 0, streak: 0, progress: {}, accuracy: {} };
          updateDashboard();
        }

        const attachedUpdated = attachAvatar({ ...updated });
        saveLocalProfile({ ...attachedUpdated });
      } catch {
        const ls = getLocalProfiles();
        const idx = ls.findIndex(p => p.id === id);
        if (idx !== -1) {
          ls[idx] = { ...ls[idx], coins: 0, streak: 0, progress: {}, accuracy: {} };
          localStorage.setItem("br_profiles", JSON.stringify(ls));
          localStorage.removeItem(`br_progress_${id}`);
          const q = getSyncQueue().filter(e => e.profileId !== id);
          localStorage.setItem("br_sync_queue", JSON.stringify(q));
          if (currentProfile?.id === id) {
            currentProfile = { ...currentProfile, coins: 0, streak: 0, progress: {}, accuracy: {} };
            updateDashboard();
          }
        }
      }

      showParentDash(null);
    });
  });
}

document.getElementById("btn-back-from-parent")?.addEventListener("click", () => {
  if (currentProfile) { updateDashboard(); showScreen("screen-dashboard"); }
  else showScreen("screen-profiles");
});

// ── CONFETTI ───────────────────────────────────────────────────────────────────
function launchConfetti() {
  const canvas = document.getElementById("confetti-canvas") as HTMLCanvasElement;
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext("2d")!;
  const colors = ["#f59e0b", "#ef4444", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"];
  const particles = Array.from({ length: 80 }, () => ({
    x: Math.random() * canvas.width,
    y: -10,
    r: Math.random() * 8 + 4,
    color: pick(colors),
    vx: (Math.random() - .5) * 4,
    vy: Math.random() * 3 + 2,
    alpha: 1,
  }));
  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.008;
    }
    ctx.globalAlpha = 1;
    frame++;
    if (frame < 120) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  draw();
}

// ── UTILS ──────────────────────────────────────────────────────────────────────
function escHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Init
showScreen("screen-welcome");
