import { Link } from "react-router-dom";
import { useAppState } from "../context/AppStateContext";

export default function HomeScreen() {
  const { state } = useAppState();
  const { user, country } = state;

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-6 py-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">
          {user.name ? `Salut, ${user.name}` : "Salut"}
        </h1>
        {country && (
          <p className="mt-1 text-sm text-neutral-400">
            Practicing with {country.flag} {country.name}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-xl">
          <div className="text-xl font-bold text-white">{user.streak}</div>
          <div className="text-[11px] text-neutral-400">streak</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-xl">
          <div className="text-xl font-bold text-white">{user.xp}</div>
          <div className="text-[11px] text-neutral-400">XP</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-xl">
          <div className="text-xl font-bold text-white">{user.cefrLevel}</div>
          <div className="text-[11px] text-neutral-400">level</div>
        </div>
      </div>

      <Link
        to="/chat"
        className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 py-3.5 text-center text-sm font-semibold text-white shadow-[0_0_18px_rgba(139,92,246,0.35)] transition active:scale-[0.98]"
      >
        Continue chatting with Pierre
      </Link>

      <p className="text-center text-xs text-neutral-500">
        Home is a placeholder — more coming soon.
      </p>
    </div>
  );
}
