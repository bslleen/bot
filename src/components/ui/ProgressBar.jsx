// Gradient classes are written out per-branch (not interpolated) for the
// same reason as StatCard's ACCENTS map — Tailwind v4's scanner needs the
// literal class string present in source to generate its CSS.
const GRADIENTS = {
  primary: "from-primary-400 to-blue-500",
  success: "from-success-400 to-success-600",
  streak: "from-streak-400 to-streak-600",
  danger: "from-danger-400 to-danger-600",
};

export default function ProgressBar({ label, percent, accent = "primary", className = "" }) {
  const clamped = Math.min(100, Math.max(0, percent));
  const gradient = GRADIENTS[accent] ?? GRADIENTS.primary;

  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-medium text-neutral-300">{label}</span>
        <span className="text-neutral-500">{clamped}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full border border-white/10 bg-white/5">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-500 ease-out`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
