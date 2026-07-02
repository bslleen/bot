const PREFIX = "french-bot:history:";

function keyFor(languagePair, countryName) {
  return `${PREFIX}${languagePair}:${countryName}`;
}

export function loadHistory(languagePair, countryName) {
  try {
    const raw = localStorage.getItem(keyFor(languagePair, countryName));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveHistory(languagePair, countryName, messages) {
  try {
    localStorage.setItem(keyFor(languagePair, countryName), JSON.stringify(messages));
  } catch {
    // localStorage unavailable (private browsing, quota exceeded, etc.) — fail silently
  }
}
