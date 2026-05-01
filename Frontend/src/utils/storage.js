const REVIEWER_KEY = "rg_last_reviewer";

export function saveLastReviewer(reviewer) {
  window.localStorage.setItem(REVIEWER_KEY, JSON.stringify(reviewer));
}

export function getLastReviewer() {
  const raw = window.localStorage.getItem(REVIEWER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}
