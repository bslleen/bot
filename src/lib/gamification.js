// Local-only gamification data layer. Every function here reads/writes a
// single localStorage key and returns plain data — no component talks to
// localStorage directly. That's the seam: swapping this for real API calls
// later means rewriting the bodies of these functions (loadState/saveState
// become fetch calls), not touching any consumer.

const STORAGE_KEY = "pierre_gamification_v1";
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// XP needed to complete one CEFR level. A flat number for now — easy to
// replace with per-level thresholds later without changing the public shape.
const XP_PER_CEFR_LEVEL = 1000;
const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

// XP needed in a skill's source bucket to show 100% on its progress bar.
// An initial heuristic, not a tuned value — adjust once real usage data exists.
const SKILL_XP_TARGET = 500;

const SKILLS = [
  { id: "chat", name: "AI Chat", icon: "💬", color: "primary" },
  { id: "speaking", name: "Speaking", icon: "🎤", color: "danger" },
  { id: "grammar", name: "Grammar", icon: "📝", color: "success" },
  { id: "vocabulary", name: "Vocabulary", icon: "📚", color: "streak" },
];

// Only dailyXp entries within this window are kept — bounds localStorage
// growth for an app meant to run indefinitely without ever needing a cap on
// the weekly-chart lookback (7 days), which is far smaller than this.
const DAILY_XP_RETENTION_DAYS = 60;

function defaultState() {
  return {
    totalXp: 0,
    streak: 0,
    lastActiveDate: null, // "YYYY-MM-DD", user's local calendar day
    lessonsCompleted: 0,
    wordsLearned: 0,
    accuracy: 0,
    xpBySource: { chat: 0, speaking: 0, grammar: 0, vocabulary: 0 },
    dailyXp: {}, // "YYYY-MM-DD" -> xp earned that day
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const defaults = defaultState();
    // Shallow-merge onto defaults so a missing/older key (or corrupted
    // partial write) never surfaces as undefined to callers.
    return {
      ...defaults,
      ...parsed,
      xpBySource: { ...defaults.xpBySource, ...parsed.xpBySource },
      dailyXp: { ...parsed.dailyXp },
    };
  } catch {
    return defaultState();
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable (private browsing, quota exceeded, etc.) — fail silently
  }
}

function localDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Whole-day difference between two "YYYY-MM-DD" keys, computed from local
// midnights so it isn't thrown off by the user's UTC offset.
function daysBetween(fromKey, toKey) {
  const [fy, fm, fd] = fromKey.split("-").map(Number);
  const [ty, tm, td] = toKey.split("-").map(Number);
  const from = new Date(fy, fm - 1, fd);
  const to = new Date(ty, tm - 1, td);
  return Math.round((to - from) / MS_PER_DAY);
}

function startOfWeek(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const diffToMonday = (day + 6) % 7;
  d.setDate(d.getDate() - diffToMonday);
  return d;
}

function pruneDailyXp(state) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - DAILY_XP_RETENTION_DAYS);
  const cutoffKey = localDateKey(cutoff);
  for (const key of Object.keys(state.dailyXp)) {
    if (key < cutoffKey) delete state.dailyXp[key];
  }
}

// Derives the level/level-XP/progress trio from lifetime totalXp on every
// read, rather than storing them — keeps a single source of truth so they
// can never drift out of sync with totalXp.
function deriveCefr(totalXp) {
  const levelIndex = Math.min(Math.floor(totalXp / XP_PER_CEFR_LEVEL), CEFR_LEVELS.length - 1);
  const isMaxLevel = levelIndex === CEFR_LEVELS.length - 1;
  const xpInLevel = isMaxLevel ? XP_PER_CEFR_LEVEL : totalXp % XP_PER_CEFR_LEVEL;
  const progress = isMaxLevel ? 100 : Math.round((xpInLevel / XP_PER_CEFR_LEVEL) * 100);
  return { level: CEFR_LEVELS[levelIndex], xpInLevel, progress };
}

/**
 * Current snapshot of the user's gamification stats.
 * @returns {{xp: number, totalXp: number, streak: number, cefrLevel: string,
 *   cefrProgress: number, accuracy: number, lessonsCompleted: number,
 *   wordsLearned: number}}
 */
export function getUserStats() {
  const state = loadState();
  const { level, xpInLevel, progress } = deriveCefr(state.totalXp);
  return {
    xp: xpInLevel,
    totalXp: state.totalXp,
    streak: state.streak,
    cefrLevel: level,
    cefrProgress: progress,
    accuracy: state.accuracy,
    lessonsCompleted: state.lessonsCompleted,
    wordsLearned: state.wordsLearned,
  };
}

/**
 * Awards XP, tags it to a source (feeds getSkillProgress), and updates
 * today's entry in the weekly chart data. Persists and returns the new stats.
 * @param {number} amount
 * @param {string} [source] - one of the SKILLS ids ("chat", "speaking",
 *   "grammar", "vocabulary"); an unrecognized source still counts toward
 *   totalXp but won't show up on any skill's progress bar.
 */
export function addXp(amount, source = "chat") {
  if (!Number.isFinite(amount) || amount <= 0) {
    return getUserStats();
  }

  const state = loadState();
  state.totalXp += amount;

  if (Object.prototype.hasOwnProperty.call(state.xpBySource, source)) {
    state.xpBySource[source] += amount;
  }

  const todayKey = localDateKey(new Date());
  state.dailyXp[todayKey] = (state.dailyXp[todayKey] || 0) + amount;
  pruneDailyXp(state);

  saveState(state);
  return getUserStats();
}

/**
 * Call once per day the user opens the app. Increments the streak if the
 * last recorded activity was exactly yesterday, resets to 1 if a day (or
 * more) was missed or this is the first-ever visit, and is a no-op if
 * already called today — safe to call unconditionally on mount.
 */
export function recordStreak() {
  const state = loadState();
  const todayKey = localDateKey(new Date());

  if (state.lastActiveDate === todayKey) {
    return getUserStats();
  }

  if (state.lastActiveDate) {
    const diff = daysBetween(state.lastActiveDate, todayKey);
    if (diff < 0) {
      // System clock appears to have moved backwards — don't guess, leave
      // the streak untouched rather than risk corrupting it.
      return getUserStats();
    }
    state.streak = diff === 1 ? state.streak + 1 : 1;
  } else {
    state.streak = 1;
  }

  state.lastActiveDate = todayKey;
  saveState(state);
  return getUserStats();
}

/**
 * @returns {Array<{id: string, name: string, icon: string, percent: number,
 *   color: string}>} one entry per skill, percent derived from XP earned
 *   under that skill's source key (see addXp). color is a design-system
 *   accent name (primary/success/streak/danger), ready to pass straight
 *   into ProgressBar's accent prop.
 */
export function getSkillProgress() {
  const state = loadState();
  return SKILLS.map((skill) => ({
    ...skill,
    percent: Math.min(100, Math.round(((state.xpBySource[skill.id] || 0) / SKILL_XP_TARGET) * 100)),
  }));
}

/**
 * @returns {number[]} 7 entries, Monday through Sunday of the current
 *   (local) week, XP earned each day. Days with no activity are 0.
 */
export function getWeeklyXp() {
  const state = loadState();
  const monday = startOfWeek(new Date());
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(state.dailyXp[localDateKey(d)] || 0);
  }
  return days;
}

/**
 * World rank requires comparing the user against every other user, which
 * means a backend leaderboard — there is no server-side ranking system yet
 * (planned for Phase 8). Returns null rather than a fabricated number;
 * consuming components must hide this stat when it's null instead of
 * rendering a fake rank.
 * @returns {null}
 */
export function getWorldRank() {
  return null;
}
