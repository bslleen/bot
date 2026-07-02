import { createContext, useContext, useEffect, useReducer } from "react";

const STORAGE_KEY = "french-bot:app-state";

const initialState = {
  languagePair: null,
  country: null,
  user: { name: null, xp: 0, streak: 0, cefrLevel: "A1", cefrProgress: 0 },
};

function loadInitialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw);
    return {
      ...initialState,
      ...parsed,
      user: { ...initialState.user, ...parsed.user },
    };
  } catch {
    return initialState;
  }
}

function reducer(state, action) {
  switch (action.type) {
    case "SET_LANGUAGE_PAIR":
      return { ...state, languagePair: action.payload };
    case "SET_COUNTRY":
      return { ...state, country: action.payload };
    case "UPDATE_USER":
      return { ...state, user: { ...state.user, ...action.payload } };
    default:
      return state;
  }
}

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // localStorage unavailable (private browsing, quota exceeded, etc.) — fail silently
    }
  }, [state]);

  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return ctx;
}
