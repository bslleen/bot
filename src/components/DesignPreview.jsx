import GlassCard from "./ui/GlassCard";
import StatCard from "./ui/StatCard";
import ProgressBar from "./ui/ProgressBar";
import AvatarRing from "./ui/AvatarRing";

// Temporary review page for the shared design system components — not part
// of the real app flow, and safe to delete once real screens are built
// against these primitives. Reachable directly at /design-preview.
export default function DesignPreview() {
  return (
    <div className="min-h-svh w-full bg-navy-900 px-4 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-8">
        <div>
          <h1 className="text-lg font-bold text-white">Design System Preview</h1>
          <p className="text-xs text-neutral-500">Temporary route — not a real screen.</p>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            AvatarRing
          </h2>
          <div className="flex items-center gap-4">
            <AvatarRing initials="P" size="lg" pulsing />
            <AvatarRing initials="L" size="md" />
            <AvatarRing initials="P" size="sm" />
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            StatCard
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon="⚡" value="2,855" label="Total XP" accent="primary" />
            <StatCard icon="📚" value="247" label="Words Learned" accent="success" />
            <StatCard icon="🔥" value="12" label="Day Streak" accent="streak" />
            <StatCard icon="🎤" value="6" label="To Review" accent="danger" />
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            ProgressBar
          </h2>
          <GlassCard className="flex flex-col gap-4 p-4">
            <ProgressBar label="CEFR: A2 → B1" percent={64} accent="primary" />
            <ProgressBar label="Past Tense" percent={82} accent="success" />
            <ProgressBar label="Speaking Practice" percent={30} accent="danger" />
          </GlassCard>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            GlassCard
          </h2>
          <GlassCard className="p-4">
            <p className="text-sm text-white">Plain glass panel with arbitrary content.</p>
            <p className="mt-1 text-xs text-neutral-400">
              rounded-2xl, translucent, blurred, subtle border.
            </p>
          </GlassCard>
        </section>
      </div>
    </div>
  );
}
