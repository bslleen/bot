import { COUNTRIES_BY_PAIR } from "../data/countries";

export default function CountrySelectScreen({ languagePair, onSelect, onBack }) {
  const countries = COUNTRIES_BY_PAIR[languagePair];
  const title =
    languagePair === "french_to_english"
      ? "Where do you want to take your English?"
      : "Où veux-tu emmener ton français?";

  return (
    <div className="flex h-full flex-col px-6 pt-6 pb-4 animate-fade-in">
      <button
        onClick={onBack}
        className="mb-4 w-fit text-sm text-neutral-400 hover:text-white"
      >
        ← Back
      </button>

      <h1 className="mb-6 text-xl font-bold text-white text-center">{title}</h1>

      <div className="grid grid-cols-2 gap-3 overflow-y-auto pb-4">
        {countries.map((c) => (
          <button
            key={c.name}
            onClick={() => onSelect(c)}
            className="flex flex-col items-start gap-1 rounded-2xl border border-white/10 bg-neutral-900 p-4 text-left transition active:scale-95 hover:bg-neutral-800"
          >
            <span className="text-3xl">{c.flag}</span>
            <span className="text-sm font-bold text-white">{c.name}</span>
            <span className="text-xs leading-snug text-neutral-400">{c.teaser}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
