import { useState } from "react";
import LanguageSelectScreen from "./components/LanguageSelectScreen";
import CountrySelectScreen from "./components/CountrySelectScreen";
import ChatScreen from "./components/ChatScreen";

export default function App() {
  const [screen, setScreen] = useState("language");
  const [languagePair, setLanguagePair] = useState(null);
  const [country, setCountry] = useState(null);

  return (
    <div className="h-svh w-full bg-black overflow-hidden">
      <div className="mx-auto flex h-full max-w-md flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
        {screen === "language" && (
          <LanguageSelectScreen
            onSelect={(pair) => {
              setLanguagePair(pair);
              setScreen("country");
            }}
          />
        )}

        {screen === "country" && (
          <CountrySelectScreen
            languagePair={languagePair}
            onSelect={(c) => {
              setCountry(c);
              setScreen("chat");
            }}
            onBack={() => setScreen("language")}
          />
        )}

        {screen === "chat" && (
          <ChatScreen
            languagePair={languagePair}
            country={country}
            onBack={() => setScreen("country")}
          />
        )}
      </div>
    </div>
  );
}
