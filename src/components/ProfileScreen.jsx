import { useAppState } from "../context/AppStateContext";

export default function ProfileScreen() {
  const { state } = useAppState();
  const { user, languagePair, country } = state;

  const learning =
    languagePair === "english_to_french"
      ? "French"
      : languagePair === "french_to_english"
        ? "English"
        : "—";

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto px-6 py-8 animate-fade-in">
      <h1 className="text-lg font-bold text-white">Profile</h1>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-neutral-400">Name</dt>
            <dd className="text-white">{user.name ?? "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-400">Learning</dt>
            <dd className="text-white">{learning}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-400">Culture</dt>
            <dd className="text-white">{country ? `${country.flag} ${country.name}` : "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-400">CEFR level</dt>
            <dd className="text-white">
              {user.cefrLevel} ({user.cefrProgress}%)
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-400">Streak</dt>
            <dd className="text-white">{user.streak} days</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-400">XP</dt>
            <dd className="text-white">{user.xp}</dd>
          </div>
        </dl>
      </div>
      <p className="text-center text-xs text-neutral-500">Profile editing coming soon.</p>
    </div>
  );
}
