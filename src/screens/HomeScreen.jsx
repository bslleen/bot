import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAppState } from "../context/AppStateContext";
import { getUserStats, getWorldRank, recordStreak } from "../lib/gamification";
import GlassCard from "../components/ui/GlassCard";
import StatCard from "../components/ui/StatCard";
import ProgressBar from "../components/ui/ProgressBar";
import AvatarRing from "../components/ui/AvatarRing";

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const CEFR_NAMES = {
  A1: "Beginner",
  A2: "Elementary",
  B1: "Intermediate",
  B2: "Upper Intermediate",
  C1: "Advanced",
  C2: "Proficient",
};

// No scenario system exists yet — this is a static teaser for the CTA card
// until real scenarios are built. Not a new data source: it's hardcoded UI
// content, not persisted or read from anywhere.
const FEATURED_SCENARIO = {
  emoji: "☕",
  name: "Ordering at a Café",
  subtitle: "Chapter 3 · Paris · A2",
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getNextCefrLevel(level) {
  const idx = CEFR_LEVELS.indexOf(level);
  if (idx === -1 || idx === CEFR_LEVELS.length - 1) return null;
  return CEFR_LEVELS[idx + 1];
}

export default function HomeScreen() {
  const { state } = useAppState();
  const name = state.user?.name;
  const [stats, setStats] = useState(() => getUserStats());

  // Home is the landing screen for a returning user (see IndexRedirect in
  // App.jsx) — someone who opens the app, checks Home, and never visits
  // Chat that day would otherwise never get today's streak recorded.
  // recordStreak() is idempotent per calendar day, so calling it here too
  // (alongside ChatScreen's mount effect) is safe.
  useEffect(() => {
    setStats(recordStreak());
  }, []);

  const worldRank = getWorldRank();
  const nextLevel = getNextCefrLevel(stats.cefrLevel);
  const initials = name ? name.trim().charAt(0).toUpperCase() : "?";

  // World Rank is omitted entirely (not shown as a placeholder) until a
  // backend leaderboard exists — see getWorldRank's doc comment.
  const statCards = [
    {
      key: "xp",
      node: <StatCard icon="⚡" value={stats.totalXp.toLocaleString()} label="Total XP" accent="primary" />,
    },
    worldRank !== null
      ? { key: "rank", node: <StatCard icon="🏆" value={`#${worldRank}`} label="World Rank" accent="streak" /> }
      : null,
    {
      key: "accuracy",
      node: <StatCard icon="🎯" value={`${stats.accuracy}%`} label="Accuracy" accent="success" />,
    },
  ].filter(Boolean);

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-4 py-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">
            {getGreeting()}
            {name ? `, ${name}` : ""}
          </h1>
          <div className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-streak-400/30 bg-streak-500/15 px-2.5 py-1 text-xs font-semibold text-streak-300">
            <span>🔥</span>
            <span>
              {stats.streak} day{stats.streak === 1 ? "" : "s"}
            </span>
          </div>
        </div>
        <AvatarRing initials={initials} size="sm" />
      </div>

      <GlassCard className="flex flex-col gap-4 p-5 shadow-[0_0_28px_rgba(139,92,246,0.15)]">
        <div className="flex items-center gap-4">
          <AvatarRing initials={stats.cefrLevel} size="lg" />
          <div className="min-w-0">
            <div className="text-lg font-bold text-white">
              {CEFR_NAMES[stats.cefrLevel] ?? stats.cefrLevel} — {stats.cefrLevel}
            </div>
            <div className="text-sm text-neutral-400">{stats.totalXp.toLocaleString()} Total XP</div>
          </div>
        </div>
        <ProgressBar
          label={nextLevel ? `Next: ${nextLevel}` : "Max level reached"}
          percent={stats.cefrProgress}
          accent="primary"
        />
      </GlassCard>

      <div className={statCards.length === 3 ? "grid grid-cols-3 gap-3" : "grid grid-cols-2 gap-3"}>
        {statCards.map((s) => (
          <div key={s.key}>{s.node}</div>
        ))}
      </div>

      <Link
        to="/chat"
        className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-primary-500 to-blue-600 p-4 shadow-[0_0_24px_rgba(139,92,246,0.35)] transition active:scale-[0.98]"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15 text-2xl">
          {FEATURED_SCENARIO.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold uppercase tracking-wide text-white/70">
            Continue scenario
          </div>
          <div className="truncate text-base font-bold text-white">{FEATURED_SCENARIO.name}</div>
          <div className="truncate text-xs text-white/70">{FEATURED_SCENARIO.subtitle}</div>
        </div>
        <span className="text-xl text-white/80">→</span>
      </Link>
    </div>
  );
}
