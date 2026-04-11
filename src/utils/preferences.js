const STORAGE_KEY = "carenest_preferences";

const detectDefaultLocale = () => {
  if (typeof navigator !== "undefined" && navigator.language) {
    return navigator.language;
  }
  return "en-US";
};

const detectDefaultCurrency = (locale) => {
  if (!locale) return "USD";

  const normalized = String(locale).toLowerCase();
  if (normalized.startsWith("bn")) return "BDT";
  if (normalized.startsWith("en-gb")) return "GBP";
  if (normalized.startsWith("de") || normalized.startsWith("fr") || normalized.startsWith("it")) return "EUR";

  return "USD";
};

const detectDefaultTimeZone = () => {
  if (typeof Intl !== "undefined" && Intl.DateTimeFormat) {
    const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (resolved) {
      return resolved;
    }
  }
  return "UTC";
};

export const getUserPreferences = () => {
  const locale = detectDefaultLocale();
  const defaults = {
    locale,
    currency: detectDefaultCurrency(locale),
    timeZone: detectDefaultTimeZone(),
  };

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return defaults;
    }

    const parsed = JSON.parse(stored);
    return {
      ...defaults,
      ...(parsed || {}),
    };
  } catch (error) {
    return defaults;
  }
};

export const setUserPreferences = (nextValues) => {
  const merged = {
    ...getUserPreferences(),
    ...(nextValues || {}),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  return merged;
};

export const PREFERENCES_UPDATED_EVENT = "carenest-preferences-updated";
