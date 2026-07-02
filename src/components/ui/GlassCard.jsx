// Reusable frosted-glass surface — rounded, translucent, blurred, subtle
// border. No default padding: consumers control spacing via className so
// this stays a pure shell rather than fighting a baked-in padding value.
export default function GlassCard({ children, className = "", ...props }) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-glass shadow-[0_0_20px_rgba(99,102,241,0.08)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
