// Storage is no longer used — authentication and saved reviewers have been removed.
// initDb is kept as a no-op so existing entry points (index.js, api/index.js) don't break.
export async function initDb() {}
