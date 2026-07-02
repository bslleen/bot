import GlassCard from "./GlassCard";

// Every accent's classes are written out in full below — Tailwind's v4
// scanner finds utility classes by grepping literal strings in source, so
// interpolating a color name into a class (e.g. `bg-${accent}-500`) would
// silently produce no CSS. A static lookup keeps every class discoverable.
const ACCENTS = {
  primary: {
    icon: "text-primary-300",
    badge: "border-primary-400/30 bg-primary-500/15",
    glow: "shadow-[0_0_16px_rgba(139,92,246,0.25)]",
  },
  success: {
    icon: "text-success-300",
    badge: "border-success-400/30 bg-success-500/15",
    glow: "shadow-[0_0_16px_rgba(34,197,94,0.25)]",
  },
  streak: {
    icon: "text-streak-300",
    badge: "border-streak-400/30 bg-streak-500/15",
    glow: "shadow-[0_0_16px_rgba(249,115,22,0.25)]",
  },
  danger: {
    icon: "text-danger-300",
    badge: "border-danger-400/30 bg-danger-500/15",
    glow: "shadow-[0_0_16px_rgba(239,68,68,0.25)]",
  },
};

export default function StatCard({ icon, value, label, accent = "primary", className = "" }) {
  const a = ACCENTS[accent] ?? ACCENTS.primary;

  return (
    <GlassCard className={`flex flex-col items-center gap-2 p-4 text-center ${a.glow} ${className}`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-full border ${a.badge}`}>
        <span className={`text-lg ${a.icon}`}>{icon}</span>
      </div>
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-[11px] text-neutral-400">{label}</div>
    </GlassCard>
  );
}
