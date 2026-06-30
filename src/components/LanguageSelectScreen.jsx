export default function LanguageSelectScreen({ onSelect }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-10 px-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-white text-center">What are you learning?</h1>

      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        <button
          onClick={() => onSelect("english_to_french")}
          className="flex flex-col items-center gap-2 rounded-3xl border border-white/10 bg-neutral-900 px-4 py-8 text-center transition active:scale-95 hover:bg-neutral-800"
        >
          <span className="text-4xl">🇫🇷</span>
          <span className="text-lg font-bold text-white">Learning French</span>
          <span className="text-xs text-neutral-400">I speak English</span>
        </button>

        <button
          onClick={() => onSelect("french_to_english")}
          className="flex flex-col items-center gap-2 rounded-3xl border border-white/10 bg-neutral-900 px-4 py-8 text-center transition active:scale-95 hover:bg-neutral-800"
        >
          <span className="text-4xl">🇬🇧</span>
          <span className="text-lg font-bold text-white">Learning English</span>
          <span className="text-xs text-neutral-400">Je parle Français</span>
        </button>
      </div>
    </div>
  );
}
