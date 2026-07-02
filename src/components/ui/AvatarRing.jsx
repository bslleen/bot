// Generalizes the avatar pattern already used inline for Pierre in
// ChatScreen.jsx — same glowing gradient ring, but reusable for any
// initials/image (Pierre's avatar, the user's profile initial, etc.).
// Reuses the existing .animate-pulse-glow keyframes from index.css rather
// than defining a duplicate.
const SIZES = {
  sm: { ring: "h-8 w-8", text: "text-xs" },
  md: { ring: "h-12 w-12", text: "text-base" },
  lg: { ring: "h-20 w-20", text: "text-2xl" },
};

export default function AvatarRing({ initials, src, size = "md", pulsing = false, className = "" }) {
  const s = SIZES[size] ?? SIZES.md;

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-blue-500 p-[2px] shadow-[0_0_14px_rgba(139,92,246,0.45)] ${s.ring} ${
        pulsing ? "animate-pulse-glow" : ""
      } ${className}`}
    >
      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-navy-800">
        {src ? (
          <img src={src} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className={`font-bold text-white/90 ${s.text}`}>{initials}</span>
        )}
      </div>
    </div>
  );
}
