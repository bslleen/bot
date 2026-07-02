import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AppStateProvider, useAppState } from "./context/AppStateContext";
import BottomNav from "./components/BottomNav";
import LanguageSelectScreen from "./components/LanguageSelectScreen";
import CountrySelectScreen from "./components/CountrySelectScreen";
import ChatScreen from "./components/ChatScreen";
import HomeScreen from "./screens/HomeScreen";
import MapScreen from "./components/MapScreen";
import SkillsScreen from "./components/SkillsScreen";
import ProfileScreen from "./components/ProfileScreen";
import DesignPreview from "./components/DesignPreview";

// Persistent shell: safe-area padding + max-width column stay constant across
// every route. The routed screen gets a bounded flex-1 area so its own
// internal scrolling (e.g. ChatScreen's h-full layout) works correctly, and
// BottomNav is pinned below it — hidden during onboarding.
function AppShell() {
  const location = useLocation();
  const isOnboarding = location.pathname.startsWith("/onboarding");

  return (
    <div className="h-svh w-full bg-black overflow-hidden">
      <div className="mx-auto flex h-full max-w-md flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
        <div className="min-h-0 flex-1">
          <Outlet />
        </div>
        {!isOnboarding && <BottomNav />}
      </div>
    </div>
  );
}

// "/" resolves based on whether onboarding was already completed, so a
// returning user with saved languagePair/country lands on /home instead of
// being sent through the picker flow again.
function IndexRedirect() {
  const { state } = useAppState();
  const hasOnboarded = Boolean(state.languagePair && state.country);
  return <Navigate to={hasOnboarded ? "/home" : "/onboarding/language"} replace />;
}

// LanguageSelectScreen keeps its existing onSelect(pair) contract — this
// wrapper is the only thing that changed: it now dispatches to app state and
// navigates instead of calling local setScreen().
function OnboardingLanguageRoute() {
  const { dispatch } = useAppState();
  const navigate = useNavigate();

  return (
    <LanguageSelectScreen
      onSelect={(pair) => {
        dispatch({ type: "SET_LANGUAGE_PAIR", payload: pair });
        navigate("/onboarding/country");
      }}
    />
  );
}

// CountrySelectScreen keeps its existing languagePair/onSelect/onBack
// contract unchanged. Guards against being reached directly (e.g. a
// bookmarked URL) without a language pair chosen first.
function OnboardingCountryRoute() {
  const { state, dispatch } = useAppState();
  const navigate = useNavigate();

  if (!state.languagePair) {
    return <Navigate to="/onboarding/language" replace />;
  }

  return (
    <CountrySelectScreen
      languagePair={state.languagePair}
      onSelect={(country) => {
        dispatch({ type: "SET_COUNTRY", payload: country });
        navigate("/home");
      }}
      onBack={() => navigate("/onboarding/language")}
    />
  );
}

// ChatScreen keeps its existing languagePair/country/onBack contract
// unchanged — it still has no idea routing exists. This wrapper sources
// those props from app state instead of local App state, and guards against
// /chat being reached before onboarding has set a language pair and country.
function ChatRoute() {
  const { state } = useAppState();
  const navigate = useNavigate();

  if (!state.languagePair || !state.country) {
    return <Navigate to="/onboarding/language" replace />;
  }

  return (
    <ChatScreen
      languagePair={state.languagePair}
      country={state.country}
      onBack={() => navigate("/home")}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppStateProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<IndexRedirect />} />
            <Route path="/onboarding/language" element={<OnboardingLanguageRoute />} />
            <Route path="/onboarding/country" element={<OnboardingCountryRoute />} />
            <Route path="/home" element={<HomeScreen />} />
            <Route path="/map" element={<MapScreen />} />
            <Route path="/chat" element={<ChatRoute />} />
            <Route path="/skills" element={<SkillsScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
          {/* Temporary — design system review page, not part of the real app flow.
              Delete this route once real screens are built against the ui/ primitives. */}
          <Route path="/design-preview" element={<DesignPreview />} />
        </Routes>
      </AppStateProvider>
    </BrowserRouter>
  );
}
