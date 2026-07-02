import { NavLink } from "react-router-dom";

const TABS = [
  { to: "/home", label: "Home", icon: "🏠" },
  { to: "/map", label: "Map", icon: "🗺️" },
  { to: "/chat", label: "Chat", icon: "💬" },
  { to: "/skills", label: "Skills", icon: "🎯" },
  { to: "/profile", label: "Profile", icon: "👤" },
];

export default function BottomNav() {
  return (
    <nav className="flex items-center justify-around border-t border-white/10 bg-white/[0.03] px-1 py-2 backdrop-blur-xl">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-medium transition ${
              isActive ? "text-white" : "text-neutral-500 hover:text-neutral-300"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-base transition ${
                  isActive
                    ? "bg-gradient-to-br from-blue-500 to-purple-600 shadow-[0_0_12px_rgba(139,92,246,0.5)]"
                    : ""
                }`}
              >
                {tab.icon}
              </span>
              {tab.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
